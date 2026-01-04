
import React from 'react';

export function VersionStamp() {
  const buildTime = import.meta.env.VITE_BUILD_TIME || 'Dev';
  const commit = import.meta.env.VITE_COMMIT_HASH || 'Local';

  // Only show in debug mode or if explicitly requested
  const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';

  if (!isDebug) return null;

  return (
    <div className="fixed bottom-1 left-1 z-[9999] text-[10px] text-white/30 font-mono pointer-events-none select-none">
      v{commit.slice(0,7)} ({buildTime})
    </div>
  );
}
