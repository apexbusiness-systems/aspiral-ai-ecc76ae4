/**
 * OMNiLiNK Integration Types
 * 
 * Defines all types for the APEX integration bus
 */

export type OmniLinkEventType =
  | "aspiral:session.started"
  | "aspiral:session.ended"
  | "aspiral:session.exported"
  | "aspiral:pattern.detected"
  | "aspiral:breakthrough.achieved"
  | "aspiral:entity.created"
  | "aspiral:friction.discovered";

export interface OmniLinkEvent<T = unknown> {
  id: string;
  type: OmniLinkEventType;
  timestamp: string;
  tenantId: string;
  source: "aspiral";
  correlationId?: string;
  payload: T;
  metadata: {
    version: string;
    idempotencyKey: string;
  };
}

export interface SessionStartedPayload {
  sessionId: string;
  userId: string;
}

export interface SessionEndedPayload {
  sessionId: string;
  userId: string;
  duration: number; // seconds
  entityCount: number;
  frictionCount: number;
}

export interface PatternDetectedPayload {
  sessionId: string;
  pattern: string;
  entities: string[];
  confidence: number;
}

export interface BreakthroughPayload {
  sessionId: string;
  friction: string;
  grease: string;
  duration: number;
  patterns: string[];
  entities: Array<{
    type: string;
    label: string;
  }>;
}

export interface OmniLinkConfig {
  enabled: boolean;
  baseUrl: string;
  tenantId: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface OmniLinkHealthStatus {
  status: "ok" | "error" | "disabled";
  message: string;
  circuitBreakerState?: "CLOSED" | "OPEN" | "HALF_OPEN";
  queuedEvents?: number;
  lastPublishedAt?: string;
}

export interface PublishedEvent {
  eventId: string;
  idempotencyKey: string;
  eventType: OmniLinkEventType;
  publishedAt: Date;
  status: "pending" | "published" | "failed";
  retryCount: number;
}
