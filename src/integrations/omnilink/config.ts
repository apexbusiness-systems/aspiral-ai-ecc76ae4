/**
 * OMNiLiNK Configuration
 * 
 * Reads configuration from environment variables
 * Safe defaults ensure app works without OMNiLiNK
 */

import type { OmniLinkConfig } from "./types";

export function getOmniLinkConfig(): OmniLinkConfig {
  const enabled = import.meta.env.VITE_OMNILINK_ENABLED === "true";
  
  return {
    enabled,
    baseUrl: import.meta.env.VITE_OMNILINK_BASE_URL || "https://hub.apexbiz.io",
    tenantId: import.meta.env.VITE_OMNILINK_TENANT_ID || "",
    apiKey: import.meta.env.VITE_OMNILINK_API_KEY || "",
    timeout: 5000,
    retryAttempts: 3,
  };
}

export function isOmniLinkEnabled(): boolean {
  const config = getOmniLinkConfig();
  return config.enabled && !!config.tenantId && !!config.apiKey;
}
