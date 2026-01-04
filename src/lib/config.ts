
// Environment-based kill switches and configuration
// Memoized to avoid process.env access cost in loops

const getEnvBool = (key: string, defaultValue = true) => {
  const val = import.meta.env[key];
  if (val === 'true') return true;
  if (val === 'false') return false;
  return defaultValue;
};

export const CONFIG = {
  // Features
  VOICE_ENABLED: getEnvBool('VITE_VOICE_ENABLED', true),
  CINEMATICS_ENABLED: getEnvBool('VITE_CINEMATICS_ENABLED', true),
  CRESCENDO_ONLY: getEnvBool('VITE_CRESCENDO_SPIRAL_ONLY', true),
  PWA_UPDATE_PROMPT: getEnvBool('VITE_PWA_UPDATE_PROMPT', true),

  // Debug
  DEBUG_MODE: import.meta.env.MODE !== 'production' || new URLSearchParams(window.location.search).get('debug') === '1',

  // Versions
  BUILD_TIME: import.meta.env.VITE_BUILD_TIME || 'Unknown',
  COMMIT_HASH: import.meta.env.VITE_COMMIT_HASH || 'Dev',
} as const;
