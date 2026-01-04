
import { useEffect, useState } from "react";
import { CONFIG } from "@/lib/config";
import { useSessionStore } from "@/stores/sessionStore";
import { useVoiceInput, getVoiceDebugBuffer } from "@/hooks/useVoiceInput";
import { useLifecycleStore } from "@/lib/cinematics/LifecycleController";

export function DebugOverlay() {
  const [isVisible, setIsVisible] = useState(CONFIG.DEBUG_MODE);
  const [metrics, setMetrics] = useState<any>({});

  // Connect to stores
  const session = useSessionStore(s => s.currentSession);
  const voiceState = useVoiceInput(); // Just to trigger re-renders on voice state
  const lifecycle = useLifecycleStore();

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setMetrics({
        fps: 'N/A', // TODO: Add FPS counter if critical
        memory: (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 'N/A',
        voiceBuffer: getVoiceDebugBuffer().length,
        domNodes: document.getElementsByTagName('*').length,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 z-[9999] bg-black/80 text-green-400 p-2 font-mono text-[10px] pointer-events-none select-none max-w-[300px] overflow-hidden">
      <div className="font-bold border-b border-green-800 mb-1">ASPIRAL DEBUG</div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span>Build:</span> <span className="text-white">{CONFIG.COMMIT_HASH.slice(0,7)}</span>
        <span>Session:</span> <span className="text-white">{session?.id?.slice(0,8) || 'None'}</span>
        <span>Phase:</span> <span className="text-yellow-400">{lifecycle.phase}</span>
        <span>Voice:</span> <span className={voiceState.isRecording ? "text-red-500 animate-pulse" : "text-gray-500"}>
          {voiceState.isRecording ? "REC" : "IDLE"}
        </span>
        <span>Memory:</span> <span>{metrics.memory}</span>
        <span>Nodes:</span> <span>{metrics.domNodes}</span>
      </div>

      <div className="mt-2 border-t border-green-800 pt-1">
        <div className="text-xs text-gray-400">Last 3 Voice Events:</div>
        {getVoiceDebugBuffer().slice(-3).map((e, i) => (
           <div key={i} className="truncate text-gray-500">
             {e.type}
           </div>
        ))}
      </div>
    </div>
  );
}
