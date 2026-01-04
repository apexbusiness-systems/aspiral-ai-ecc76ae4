import { useState, useCallback, useEffect, useRef } from "react";
import { VoiceSessionManager } from "@/lib/voice/VoiceSessionManager";
import { useSessionStore } from "@/stores/sessionStore";

interface UseVoiceInputOptions {
  onTranscript?: (transcript: string) => void;
  onError?: (error: Error) => void;
}

// Global debug buffer for the overlay
const debugBuffer: any[] = [];

export function getVoiceDebugBuffer() {
  return debugBuffer;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  
  // Two-buffer transcript model: final (append-only) + interim (replace on each update)
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  
  // Combined display transcript
  const transcript = (finalTranscript + " " + interimTranscript).trim();

  const { isRecording, setRecording, setError } = useSessionStore();
  const manager = VoiceSessionManager.getInstance();

  // Refs for callbacks to avoid re-subscription
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    // Subscribe to STT updates
    const unsubSTT = manager.subscribeSTT((text, isFinal) => {
      if (isFinal) {
        setFinalTranscript(prev => (prev + " " + text).trim());
        setInterimTranscript("");
        optionsRef.current.onTranscript?.(text);
        debugBuffer.push({ type: 'stt.final', text });
      } else {
        setInterimTranscript(text);
      }
    });

    // Subscribe to Errors
    const unsubError = manager.subscribeError((err) => {
      setError(err.message);
      setRecording(false);
      optionsRef.current.onError?.(err);
      debugBuffer.push({ type: 'stt.error', error: err.message });
    });

    return () => {
      unsubSTT();
      unsubError();
    };
  }, [manager, setRecording, setError]);

  const startRecording = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
    manager.startListening();
    setRecording(true);
    debugBuffer.push({ type: 'stt.start' });
  }, [manager, setRecording]);

  const stopRecording = useCallback(() => {
    manager.stopListening();
    setRecording(false);
    debugBuffer.push({ type: 'stt.stop' });
  }, [manager, setRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        manager.stopListening();
        setRecording(false);
      }
    };
  }, [manager, isRecording, setRecording]);

  return {
    isRecording,
    isSupported,
    isPaused: false, // Shim
    transcript,
    finalTranscript,
    interimTranscript,
    startRecording,
    stopRecording,
    toggleRecording,
    pauseRecording: () => {},
    resumeRecording: () => {},
    togglePause: () => {},
  };
}

// Global Types
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}
