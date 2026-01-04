import { useState, useCallback, useEffect } from 'react';
import { VoiceSessionManager } from "@/lib/voice/VoiceSessionManager";
import { useAssistantSpeakingStore } from './useAssistantSpeaking';

interface UseTextToSpeechOptions {
  voice?: string;
  speed?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const {
    voice = 'nova',
    speed = 1.0,
    onStart,
    onEnd,
    onError,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manager = VoiceSessionManager.getInstance();
  const { startSpeaking, stopSpeaking } = useAssistantSpeakingStore();

  const speak = useCallback(async (text: string) => {
    setIsLoading(true);
    setIsSpeaking(true);
    setError(null);
    startSpeaking();
    onStart?.();

    try {
      await manager.speak(text, voice, speed);
      onEnd?.();
    } catch (e) {
      setError((e as Error).message);
      onError?.(e as Error);
    } finally {
      setIsLoading(false);
      setIsSpeaking(false);
      stopSpeaking();
    }
  }, [manager, voice, speed, startSpeaking, stopSpeaking, onStart, onEnd, onError]);

  const stop = useCallback(() => {
    manager.cancelSpeech();
    setIsSpeaking(false);
    stopSpeaking();
  }, [manager, stopSpeaking]);

  useEffect(() => {
    return () => {
      // If unmounting, should we stop speaking? Usually yes for UI components.
      // But maybe not if navigating? "Cleanup on unmount ALWAYS" says yes.
      stop();
    };
  }, [stop]);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
    error,
  };
}
