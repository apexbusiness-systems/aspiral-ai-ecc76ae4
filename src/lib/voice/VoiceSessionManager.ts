
import { createLogger } from "@/lib/logger";

const logger = createLogger("VoiceSessionManager");

// Singleton instance
let instance: VoiceSessionManager | null = null;

// Types
export type STTCallback = (text: string, isFinal: boolean) => void;
export type ErrorCallback = (error: Error) => void;

interface VoiceSessionConfig {
  onSTTResult?: STTCallback;
  onError?: ErrorCallback;
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
}

/**
 * VoiceSessionManager
 *
 * Enforces single-concurrency for Voice & TTS.
 * - Single STT instance
 * - Single TTS flight
 * - Pauses STT while TTS speaks (echo prevention)
 */
export class VoiceSessionManager {
  private recognition: SpeechRecognition | null = null;
  private ttsAudio: HTMLAudioElement | null = null;
  private abortController: AbortController | null = null;

  private isListening = false;
  private isSpeaking = false;
  private isPaused = false;

  private listeners: Set<STTCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();

  // Track consecutive errors to prevent spam
  private errorCount = 0;
  private lastErrorTime = 0;

  constructor() {
    if (instance) return instance;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this;

    // Auto-cleanup on unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.cleanup());
    }
  }

  static getInstance(): VoiceSessionManager {
    if (!instance) {
      instance = new VoiceSessionManager();
    }
    return instance;
  }

  // --- Public API ---

  public subscribeSTT(callback: STTCallback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public subscribeError(callback: ErrorCallback) {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  /**
   * Start STT. Idempotent.
   */
  public startListening() {
    if (this.isListening) return;
    if (this.isSpeaking) {
      logger.info("Cannot start listening while speaking (echo prevention)");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.emitError(new Error("Speech recognition not supported"));
      return;
    }

    try {
      this.stopListening(false); // Clean up any zombie instance

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.isPaused = false;
        logger.debug("STT Started");
      };

      this.recognition.onresult = (event) => {
        // Echo cancellation: Ignore results if we just started speaking or are speaking
        if (this.isSpeaking) return;

        let final = "";
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        if (final) this.emitSTT(final, true);
        if (interim) this.emitSTT(interim, false);
      };

      this.recognition.onerror = (event) => {
        if (event.error === "aborted" || event.error === "no-speech") return;

        // Anti-spam logic
        const now = Date.now();
        if (now - this.lastErrorTime < 1000) {
          this.errorCount++;
        } else {
          this.errorCount = 1;
        }
        this.lastErrorTime = now;

        if (this.errorCount > 3) {
          logger.warn("Too many STT errors, stopping.");
          this.stopListening();
        }

        logger.error("STT Error", event.error);
        this.emitError(new Error(event.error));
      };

      this.recognition.onend = () => {
        if (this.isListening && !this.isPaused && !this.isSpeaking) {
          // Restart if we didn't intend to stop
          // But add a small delay to prevent rapid loops
          setTimeout(() => {
            if (this.isListening && !this.isSpeaking) {
              try {
                this.recognition?.start();
              } catch (e) {
                // ignore
              }
            }
          }, 100);
        } else {
           this.isListening = false;
        }
      };

      this.recognition.start();

    } catch (e) {
      this.emitError(e as Error);
    }
  }

  /**
   * Stop STT.
   */
  public stopListening(fully = true) {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
    if (fully) {
      this.isListening = false;
      this.isPaused = false;
    }
  }

  /**
   * Play TTS. Cancels any current playback.
   * Pauses STT during playback.
   */
  public async speak(text: string, voice = "nova", speed = 1.0): Promise<void> {
    // 1. Cancel existing speech
    this.cancelSpeech();

    if (!text.trim()) return;

    // 2. Pause STT to prevent echo
    const wasListening = this.isListening;
    if (wasListening) {
      this.pauseListening();
    }

    this.isSpeaking = true;

    try {
      // 3. Fetch Audio
      const audio = await this.fetchTTS(text, voice, speed);

      this.ttsAudio = audio;

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          this.isSpeaking = false;
          this.ttsAudio = null;
          if (wasListening) this.resumeListening();
          resolve();
        };

        audio.onerror = (e) => {
          this.isSpeaking = false;
          this.ttsAudio = null;
          if (wasListening) this.resumeListening();
          reject(new Error("Audio playback failed"));
        };

        audio.play().catch(reject);
      });
    } catch (e) {
      this.isSpeaking = false;
      if (wasListening) this.resumeListening();
      throw e;
    }
  }

  public cancelSpeech() {
    if (this.ttsAudio) {
      this.ttsAudio.pause();
      this.ttsAudio = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    // Web Speech fallback cancel
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    this.isSpeaking = false;
    // Note: We don't auto-resume STT here because this might be called *before* starting new speech.
    // The caller of speak() handles resumption if needed, or we handle it explicitly.
  }

  public cleanup() {
    this.stopListening();
    this.cancelSpeech();
    this.listeners.clear();
    this.errorListeners.clear();
  }

  // --- Private Helpers ---

  private pauseListening() {
    this.isPaused = true;
    if (this.recognition) {
      try {
         this.recognition.stop();
      } catch(e) { /* ignore */ } // ignore
    }
    logger.debug("STT Paused for TTS");
  }

  private resumeListening() {
    if (this.isPaused) {
        this.isPaused = false;
        // Small delay to ensure audio bleed is gone
        setTimeout(() => {
            if (!this.isSpeaking) {
                 this.startListening();
            }
        }, 200);
    }
  }

  private emitSTT(text: string, isFinal: boolean) {
    this.listeners.forEach(l => l(text, isFinal));
  }

  private emitError(err: Error) {
    this.errorListeners.forEach(l => l(err));
  }

  private async fetchTTS(text: string, voice: string, speed: number): Promise<HTMLAudioElement> {
    this.abortController = new AbortController();

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    // Use Edge Function if configured
    if (supabaseUrl && supabaseKey) {
        try {
            const response = await fetch(`${supabaseUrl}/functions/v1/text-to-speech`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({ text, voice, speed }),
                signal: this.abortController.signal,
            });

            if (!response.ok) throw new Error("TTS Edge Function failed");

            const blob = await response.blob();
            return new Audio(URL.createObjectURL(blob));
        } catch (e) {
             logger.warn("Edge TTS failed, falling back to Web Speech", e);
        }
    }

    // Fallback to Web Speech API
    // We wrap it in an "Audio-like" interface or just use it directly?
    // Since our signature returns HTMLAudioElement, this is tricky.
    // However, we can return a dummy Audio element and drive the timing via WebSpeech.
    // BETTER: Handle Web Speech logic inside speak() directly if needed, but for now lets mock the Audio interface for WebSpeech

    return this.createWebSpeechAudioShim(text, speed);
  }

  private createWebSpeechAudioShim(text: string, speed: number): HTMLAudioElement {
      // This is a hack to make WebSpeech look like an HTMLAudioElement for the promise logic
      const shim = new Audio();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;

      // Override play
      shim.play = () => {
          return new Promise((resolve) => {
              utterance.onend = () => {
                  shim.dispatchEvent(new Event('ended'));
              };
              utterance.onerror = () => {
                   shim.dispatchEvent(new Event('error'));
              };
              window.speechSynthesis.speak(utterance);
              resolve();
          });
      };

      shim.pause = () => {
          window.speechSynthesis.cancel();
      };

      return shim;
  }
}
