import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

type SceneCameraControlsProps = {
  enabled?: boolean;
};

export function SceneCameraControls({ enabled = true }: SceneCameraControlsProps) {
  const { gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    if (!el) return;

    // Mobile gestures (pinch/drag) should affect canvas, not page scroll.
    if (el.style.touchAction !== "none") el.style.touchAction = "none";

    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    el.addEventListener("contextmenu", onContextMenu);

    // Prevent page scroll while zooming the 3D view.
    const onWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("contextmenu", onContextMenu);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl]);

  return (
    <OrbitControls
      makeDefault
      enabled={enabled}
      enableDamping
      dampingFactor={0.08}
      enablePan
      enableRotate
      enableZoom
    />
  );
}