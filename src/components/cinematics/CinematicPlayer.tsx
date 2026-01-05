/**
 * Cinematic Player - Lightweight CSS fallback for production stability.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CinematicPlayerProps } from "@/lib/cinematics/types";

interface CinematicPlayerPropsV2 extends CinematicPlayerProps {
  sessionEntities?: Array<{ type: string; label: string; metadata?: { valence?: number } }>;
  breakthroughType?: string;
}

export function CinematicPlayer({
  onComplete,
  onSkip,
  onStart,
  allowSkip = true,
  autoPlay = true,
  reducedMotion = false,
  className = "",
}: CinematicPlayerPropsV2) {
  const [isPlaying, setIsPlaying] = useState(false);
  const hasCompletedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const durationMs = reducedMotion ? 800 : 1600;

  const complete = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setIsPlaying(false);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onComplete?.();
  }, [onComplete]);

  const start = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);
    onStart?.();
    timeoutRef.current = window.setTimeout(() => {
      complete();
    }, durationMs);
  }, [complete, durationMs, isPlaying, onStart]);

  useEffect(() => {
    if (!autoPlay) return;
    start();
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [autoPlay, start]);

  const handleSkip = () => {
    onSkip?.();
    complete();
  };

  return (
    <div className={cn("fixed inset-0 z-[200] flex items-center justify-center", className)}>
      {allowSkip && isPlaying && (
        <button
          className="absolute top-4 right-4 z-10 rounded-lg bg-black/40 px-4 py-2 text-sm text-white backdrop-blur transition-colors hover:bg-black/60"
          onClick={handleSkip}
          aria-label="Skip cinematic"
        >
          Skip
        </button>
      )}

      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="h-64 w-64 rounded-full bg-primary/20 blur-3xl breakthrough-pulse" />
        <div className="absolute h-40 w-40 rounded-full border border-white/30 breakthrough-pulse" />
        <div className="absolute h-16 w-16 rounded-full bg-white/70" />
      </div>
    </div>
  );
}
