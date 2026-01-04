
import { create } from 'zustand';
import { createLogger } from "@/lib/logger";

const logger = createLogger("LifecycleController");

export type DirectorPhase = 'idle' | 'prewarm' | 'play' | 'settle' | 'complete';

interface LifecycleState {
  phase: DirectorPhase;
  isVisible: boolean;
  isPrewarmed: boolean;

  // Actions
  prewarm: () => void;
  play: () => void;
  settle: () => void;
  complete: () => void;
  reset: () => void;
}

/**
 * Global store for the Cinematic Director Lifecycle.
 * Controls when the heavy Spiral is visible/rendering.
 */
export const useLifecycleStore = create<LifecycleState>((set, get) => ({
  phase: 'idle',
  isVisible: false,
  isPrewarmed: false,

  prewarm: () => {
    const { phase } = get();
    if (phase !== 'idle' && phase !== 'complete') return;

    logger.info("Lifecycle: Prewarm");
    set({ phase: 'prewarm', isPrewarmed: true, isVisible: false });
  },

  play: () => {
    logger.info("Lifecycle: Play");
    // Ensure we are prewarmed or at least ready
    set({ phase: 'play', isVisible: true });
  },

  settle: () => {
    logger.info("Lifecycle: Settle");
    set({ phase: 'settle' });
    // Keep visible during settle until complete
  },

  complete: () => {
    logger.info("Lifecycle: Complete");
    set({ phase: 'complete', isVisible: false });
    // Cleanup resources if needed
  },

  reset: () => {
    logger.info("Lifecycle: Reset");
    set({ phase: 'idle', isVisible: false, isPrewarmed: false });
  }
}));

// Kill switch hook for spiral
export const useSpiralEnabled = () => {
  // Can be controlled by env var or debug flag
  const isEnabled = import.meta.env.VITE_CINEMATICS_ENABLED !== 'false';
  const { isVisible } = useLifecycleStore();

  // If VITE_CRESCENDO_SPIRAL_ONLY is true (default),
  // we only show spiral when isVisible is true (during Play/Settle).
  // Otherwise, if false, we might show it always (old behavior).
  const crescendoOnly = import.meta.env.VITE_CRESCENDO_SPIRAL_ONLY !== 'false';

  if (!isEnabled) return false;

  if (crescendoOnly) {
    return isVisible;
  }

  return true; // Always on if crescendo-only is disabled
};
