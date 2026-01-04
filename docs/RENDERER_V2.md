# Renderer V2: Cinematic Pipeline Documentation

This document describes the enhanced renderer pipeline ("Renderer V2") added to the 3D spiral visualization. It covers architecture, components, feature flags, accessibility considerations, performance tuning, and rollback steps.

## Goals

- **Cinematic visual fidelity** with premium lighting, refraction, and post-processing.
- **Demand-driven rendering** to minimize unnecessary frames and reduce battery use.
- **Performance adaptability** across GPU tiers and device types.
- **Modular architecture** to enable future cinematic modes without refactoring core logic.
- **Safe rollback** through a feature flag toggle.

## High-level Architecture

Renderer V2 is layered so core content, cinematic overlays, and effects are cleanly separated:

```
Canvas (EnhancedSpiralScene)
├── SceneLighting       (lighting rig + transmission orb)
├── PremiumSpiral       (instanced flow spiral)
├── SpiralEntities      (existing entities + connections)
├── FrictionEffects     (grease, gears, breakthrough effects)
├── CameraRig           (inertial camera controls)
└── EffectsHandler      (post-processing stack)
```

### Offscreen Worker Mode
When supported and enabled, a dedicated worker (`renderer.worker.tsx`) renders a simplified cinematic scene to an `OffscreenCanvas`. This keeps the main thread responsive on lower-end hardware. The worker path is intentionally limited to the cinematic spiral visuals (no DOM events, no UI overlays) and is disabled whenever entity data is present.

## Key Files

- `src/components/3d/EnhancedSpiralScene.tsx`
  - Main entry point for Renderer V2 composition.
  - Decides whether to use main-thread Canvas or Offscreen worker.
- `src/components/3d/SceneLighting.tsx`
  - Lighting rig and **MeshTransmissionMaterial** orb.
- `src/components/3d/PremiumSpiral.tsx`
  - Instanced flow spiral using `InstancedFlow` from `three/examples/jsm/modifiers/CurveModifier`.
- `src/components/3d/EffectsHandler.tsx`
  - Post-processing stack (Bloom, SMAA, Noise, Vignette, TiltShift) with adaptive toggles.
- `src/components/3d/CameraRig.tsx`
  - Inertial camera control using Drei’s `CameraControls` with auto-rotate.
- `src/components/3d/SpiralEntities.tsx`
  - Existing entity system refactored for modularity.
- `src/components/3d/FrictionEffects.tsx`
  - Existing friction/grease/breakthrough effects refactored for modularity.
- `src/components/3d/OffscreenSpiralCanvas.tsx`
  - Initializes the worker renderer with an OffscreenCanvas.
- `src/workers/renderer.worker.tsx`
  - Worker-side R3F root rendering the simplified cinematic scene.
- `src/lib/rendererFlags.ts`
  - Feature flag utilities.

## Feature Flags

Renderer V2 is guarded by a feature flag for safe rollback.

### V2 Enable Flag

- **Environment variable:** `VITE_RENDERER_V2`
- **Local override:** `localStorage.RENDERER_V2_ENABLED`

**Behavior:**
- If set to `false`/`0` the app uses the original `SpiralScene`.
- Defaults to **enabled** (true), including production.

### Offscreen Worker Flag

- **Environment variable:** `VITE_RENDERER_V2_WORKER`
- **Local override:** `localStorage.RENDERER_V2_WORKER`

**Behavior:**
- Defaults to **enabled in development** only.
- Worker mode is **disabled** if the current session contains entities, because entity rendering requires main-thread interactivity and overlays.

## Demand-Driven Rendering

Renderer V2 uses `frameloop="demand"` and explicit `invalidate()` calls to render only on state changes or animations.

Key invalidation sources:
- Instanced spiral animation (`PremiumSpiral`)
- Camera inertia and auto-rotate (`CameraRig`)
- Physics updates and visual effects (`SpiralEntities`, `FrictionEffects`)

## Tone Mapping & Color Management

The renderer uses:
- **ACESFilmic tone mapping** (`THREE.ACESFilmicToneMapping`)
- **sRGB output color space** (`THREE.SRGBColorSpace`)

These settings are applied in `EnhancedSpiralScene` (main-thread) and in `renderer.worker.tsx` (worker mode) to ensure consistent filmic output.

## Accessibility & Reduced Motion

Renderer V2 respects `prefers-reduced-motion`:

- Auto-rotate is disabled when reduced motion is preferred.
- Motion-dependent post effects (TiltShift, Noise) are disabled or reduced.
- The spiral flow animation pauses when reduced motion is requested.

## Performance Adaptation

Device capability detection (`detectDeviceCapabilities`) gates heavy effects:

- Low-tier devices reduce post-processing and lighting intensity.
- Instanced spiral count scales down on mobile/low-tier GPUs.
- Performance `dpr` and `performance.min` settings adjust rendering load.

## OffscreenCanvas Worker Limitations

The Offscreen worker path is **intentionally limited**:

- No DOM-based UI or pointer events (events are disabled in the worker).
- No entity overlays (entities are rendered only in the main thread).
- No UI-driven controls (camera auto-orbits only).

This is by design and ensures worker mode stays stable and performant. The full interactive experience is available in main-thread mode.

## How to Toggle Renderer V2

### Temporarily in DevTools

```js
localStorage.setItem('RENDERER_V2_ENABLED', 'false')
localStorage.setItem('RENDERER_V2_WORKER', 'false')
location.reload()
```

### Using Environment Variables

Add to `.env` or deployment config:

```
VITE_RENDERER_V2=false
VITE_RENDERER_V2_WORKER=false
```

## Rollback Strategy

To immediately revert to the original renderer:

1. Set `VITE_RENDERER_V2=false` or `localStorage.RENDERER_V2_ENABLED=false`.
2. Reload the app.

No code rollback is required for a safe runtime fallback.

## Extending Renderer V2

Renderer V2 is designed to allow new cinematic modes and effect presets without monolithic changes:

- Add new visual components to `EnhancedSpiralScene`.
- Create alternate effect stacks in `EffectsHandler`.
- Introduce new spiral or particle behaviors by adding new instanced components.
- Use feature flags to control experimental visuals safely.

## Known Follow-ups

- Consider adding a **scene preset registry** for switching visual styles at runtime.
- Evaluate integration of an HDRI asset if a suitable open-source map is available.
- Add runtime metrics to track performance impacts and enable auto-fallbacks.
