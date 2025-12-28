/**
 * OMNiLiNK Integration Module
 * 
 * Public API for the APEX integration bus
 */

export { OmniLinkAdapter } from "./adapter";
export { isOmniLinkEnabled, getOmniLinkConfig } from "./config";
export type {
  OmniLinkEvent,
  OmniLinkEventType,
  OmniLinkHealthStatus,
  OmniLinkConfig,
  SessionStartedPayload,
  SessionEndedPayload,
  PatternDetectedPayload,
  BreakthroughPayload,
} from "./types";
