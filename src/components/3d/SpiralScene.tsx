import { useRef, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { Center } from "@react-three/drei";
import * as THREE from "three";
import { SpiralEntities } from "./SpiralEntities";
import { useSpiralEnabled } from "@/lib/cinematics/LifecycleController";

export function SpiralScene() {
  const isEnabled = useSpiralEnabled();
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current || !isEnabled) return;

    // Slow rotation for idle/ambient effect if enabled
    // If hidden by lifecycle, we won't even render this component usually,
    // but if we do, keep it low cost.
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
  });

  if (!isEnabled) return null;

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <Center>
        <Suspense fallback={null}>
          <SpiralEntities />
        </Suspense>
      </Center>
      
      {/* Spiral center indicator - simplified geometry */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
