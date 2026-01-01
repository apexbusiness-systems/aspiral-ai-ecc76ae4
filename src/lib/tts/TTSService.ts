import { createLogger } from "@/lib/logger";

const logger = createLogger("TTSService");

export type TTSProvider = "openai" | "elevenlabs" | "none";

export interface TTSConfig {
  provider: TTSProvider;
  voice: string;
  speed: number;
  enabled: boolean;
  autoPlay: boolean;
}

export interface TTSServiceOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  userTier?: "free" | "creator" | "pro";
}

export class TTSService {
  private audio: HTMLAudioElement | null = null;
  private currentProvider: TTSProvider;
  private config: TTSConfig;
  private options: TTSServiceOptions;
  private isSpeaking: boolean = false;
  private queue: string[] = [];
  private isProcessingQueue: boolean = false;

  constructor(config: TTSConfig, options: TTSServiceOptions = {}) {
    this.config = config;
    this.options = options;

    // Default provider based on tier
    if (options.userTier === "free") {
      this.currentProvider = "openai";
    } else {
      this.currentProvider = config.provider;
    }

    logger.info("TTS Service initialized", {
      provider: this.currentProvider,
      voice: config.voice,
      tier: options.userTier
    });
  }

  async speak(text: string): Promise<void> {
    if (!this.config.enabled || !text.trim()) {
      logger.debug("TTS disabled or empty text");
      return;
    }

    const cleanText = this.cleanText(text);

    if (this.config.autoPlay) {
      await this.speakNow(cleanText);
    } else {
      this.queue.push(cleanText);
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    }
  }

  private async speakNow(text: string): Promise<void> {
    try {
      logger.info("Speaking text", {
        provider: this.currentProvider,
        length: text.length,
        preview: text.substring(0, 50)
      });

      this.options.onStart?.();
      this.isSpeaking = true;

      const audioBlob = await this.generateSpeech(text);
      await this.playAudio(audioBlob);

      this.isSpeaking = false;
      this.options.onEnd?.();
    } catch (error) {
      logger.error("TTS error", error);
      this.isSpeaking = false;
      this.options.onError?.(error as Error);
    }
  }

  private async generateSpeech(text: string): Promise<Blob> {
    switch (this.currentProvider) {
      case "openai":
        return this.generateOpenAI(text);
      case "elevenlabs":
        return this.generateElevenLabs(text);
      default:
        throw new Error(`Unknown TTS provider: ${this.currentProvider}`);
    }
  }

  private async generateOpenAI(text: string): Promise<Blob> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: this.config.voice || "nova",
        speed: this.config.speed || 1.0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI TTS failed: ${error}`);
    }

    return await response.blob();
  }

  private async generateElevenLabs(text: string): Promise<Blob> {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ElevenLabs API key not configured");
    }

    const voiceId = this.config.voice || "21m00Tcm4TlvDq8ikWAM";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs TTS failed: ${error}`);
    }

    return await response.blob();
  }

  private async playAudio(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(blob);
      this.audio = new Audio(audioUrl);

      this.audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };

      this.audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };

      this.audio.play().catch(reject);
    });
  }

  private cleanText(text: string): string {
    let cleaned = text
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/~~(.+?)~~/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .replace(/!\[.+?\]\(.+?\)/g, "")
      .replace(/^[-*+]\s/gm, "")
      .replace(/^\d+\.\s/gm, "");

    cleaned = cleaned
      .replace(/✨/g, "")
      .replace(/🎤/g, "")
      .replace(/🌀/g, "")
      .replace(/💬/g, "")
      .replace(/⏱️/g, "")
      .replace(/💡/g, "")
      .replace(/🔥/g, "")
      .replace(/⚡/g, "")
      .replace(/💧/g, "")
      .trim();

    return cleaned;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.queue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      const text = this.queue.shift();
      if (text) {
        await this.speakNow(text);
      }
    }

    this.isProcessingQueue = false;
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.queue = [];
    this.isSpeaking = false;
    this.isProcessingQueue = false;
    logger.debug("TTS stopped");
  }

  pause(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
      logger.debug("TTS paused");
    }
  }

  resume(): void {
    if (this.audio && this.audio.paused) {
      this.audio.play();
      logger.debug("TTS resumed");
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  updateConfig(updates: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...updates };
    if (updates.provider) {
      this.currentProvider = updates.provider;
    }
    logger.info("TTS config updated", this.config);
  }

  dispose(): void {
    this.stop();
    logger.info("TTS service disposed");
  }
}
