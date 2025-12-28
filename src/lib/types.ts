/**
 * aSpiral Core Type Definitions
 */

// Entity Types
export type EntityType =
  | "problem"
  | "emotion"
  | "value"
  | "action"
  | "friction"
  | "grease";

export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  label: string;
  position?: Position;
  createdAt: Date;
  updatedAt: Date;
}

export interface Connection {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: "causes" | "blocks" | "enables" | "resolves";
  strength: number; // 0-1
}

export interface FrictionPoint {
  id: string;
  entityIds: string[];
  description: string;
  intensity: number; // 0-1
  discovered: boolean;
}

// Session Types
export type SessionStatus =
  | "active"
  | "exploring"
  | "friction"
  | "breakthrough"
  | "completed";

export interface Session {
  id: string;
  userId: string;
  status: SessionStatus;
  entities: Entity[];
  connections: Connection[];
  frictionPoints: FrictionPoint[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
}

// Conversation Types
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  entities?: Entity[];
  isStreaming?: boolean;
}

export interface ConversationInput {
  message: string;
  sessionId?: string;
  context?: {
    entities?: Entity[];
    connections?: Connection[];
    previousMessages?: Message[];
  };
}

export interface ConversationOutput {
  message: string;
  entities: Entity[];
  connections: Connection[];
  question: string | null;
  patternDetected: boolean;
  frictionPoint: FrictionPoint | null;
  sessionStatus?: SessionStatus;
}

// Export Types
export type ExportFormat = "3d-link" | "video" | "infographic" | "action-plan";

export interface ExportRequest {
  sessionId: string;
  format: ExportFormat;
}

// UI State Types
export interface AppState {
  isConnected: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  currentSession: Session | null;
  messages: Message[];
  error: string | null;
}
