import { useEffect, useRef, useState } from "react";
import { TTSService, type TTSConfig, type TTSProvider } from "@/lib/tts/TTSService";
import { useToast } from "@/hooks/use-toast";

interface UseTTSOptions {
  provider?: TTSProvider;
  voice?: string;
  speed?: number;
  enabled?: boolean;
  autoPlay?: boolean;
  userTier?: "free" | "creator" | "pro";
}

export function useTTS(options: UseTTSOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(options.enabled ?? true);
  const serviceRef = useRef<TTSService | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const config: TTSConfig = {
      provider: options.provider || (options.userTier === "free" ? "openai" : "elevenlabs"),
      voice: options.voice || (options.userTier === "free" ? "nova" : "21m00Tcm4TlvDq8ikWAM"),
      speed: options.speed || 1.0,
      enabled: isEnabled,
      autoPlay: options.autoPlay ?? true,
    };

    serviceRef.current = new TTSService(config, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: (error) => {
        setIsSpeaking(false);
        toast({
          title: "Voice Error",
          description: "Could not play audio response. Check your internet connection.",
          variant: "destructive",
        });
        console.error("TTS error:", error);
      },
      userTier: options.userTier,
    });

    return () => {
      serviceRef.current?.dispose();
    };
  }, [options.provider, options.voice, options.speed, isEnabled, options.autoPlay, options.userTier, toast]);

  const speak = async (text: string) => {
    if (!serviceRef.current || !isEnabled) return;
    await serviceRef.current.speak(text);
  };

  const stop = () => {
    serviceRef.current?.stop();
  };

  const pause = () => {
    serviceRef.current?.pause();
  };

  const resume = () => {
    serviceRef.current?.resume();
  };

  const toggle = () => {
    setIsEnabled(!isEnabled);
  };

  const updateConfig = (updates: Partial<TTSConfig>) => {
    serviceRef.current?.updateConfig(updates);
  };

  return {
    speak,
    stop,
    pause,
    resume,
    toggle,
    updateConfig,
    isSpeaking,
    isEnabled,
    setIsEnabled,
  };
}
