import { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useLifecycleStore } from "@/lib/cinematics/LifecycleController";
import { SpiralAscend } from "./SpiralAscend";
import { createLogger } from "@/lib/logger";

const logger = createLogger("CinematicPlayer");

interface CinematicPlayerProps {
  variant?: any;
  onComplete?: () => void;
  onSkip?: () => void;
  allowSkip?: boolean;
  autoPlay?: boolean;
  enableAnalytics?: boolean;
  className?: string;
}

export function CinematicPlayer({
  onComplete,
  className = "",
}: CinematicPlayerProps) {
  const { phase, play, settle, complete, isPrewarmed, prewarm } = useLifecycleStore();
  const [hasStarted, setHasStarted] = useState(false);

  // Auto-start logic
  useEffect(() => {
    if (!hasStarted) {
      if (!isPrewarmed) {
        prewarm();
      }
      play();
      setHasStarted(true);
    }
  }, [hasStarted, isPrewarmed, prewarm, play]);

  // Handle completion from the visual component
  const handleVisualComplete = () => {
    logger.info("Visuals complete");
    settle();
    // Short delay for settle phase before full completion
    setTimeout(() => {
      complete();
      onComplete?.();
    }, 1000);
  };

  // If not in active phase, render nothing (or fade out)
  if (phase === 'idle' || phase === 'complete') {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]} // Cap DPR for performance
      >
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.5} />
        <SpiralAscend
            onComplete={handleVisualComplete}
            particleCount={1500} // Tuned for mid-tier
        />
      </Canvas>
    </div>
  );
}
