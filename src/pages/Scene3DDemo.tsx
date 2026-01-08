import { Canvas } from "@react-three/fiber";
import { SceneCameraControls } from "@/components/ui/SceneCameraControls";

export default function Scene3DDemo() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">3D Scene Demo</h1>
          <p className="text-muted-foreground">
            Interactive 3D scene with orbit, zoom, and pan controls
          </p>
        </div>

        <div className="w-full h-[600px] border rounded-lg overflow-hidden">
          <Canvas>
            <SceneCameraControls />

            {/* Basic lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />

            {/* Basic 3D objects */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="orange" />
            </mesh>

            <mesh position={[2, 0, 0]}>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshStandardMaterial color="blue" />
            </mesh>

            <mesh position={[-2, 0, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
              <meshStandardMaterial color="green" />
            </mesh>
          </Canvas>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Controls: Left click + drag to orbit • Right click + drag to pan • Scroll to zoom</p>
        </div>
      </div>
    </div>
  );
}