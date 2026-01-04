
import { Session, SessionStatus } from "@/lib/types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("StateMigration");

// Current schema version - increment when breaking changes occur
export const CURRENT_SCHEMA_VERSION = 1;

interface PersistedState {
  version?: number;
  currentSession?: Session | null;
  [key: string]: unknown;
}

/**
 * Validates and repairs session objects
 */
function sanitizeSession(session: unknown): Session | null {
  if (!session || typeof session !== "object") return null;

  const s = session as Partial<Session>;

  // Required fields with defaults
  if (!s.id || typeof s.id !== "string") return null;

  // Ensure arrays exist
  const entities = Array.isArray(s.entities) ? s.entities : [];
  const connections = Array.isArray(s.connections) ? s.connections : [];
  const frictionPoints = Array.isArray(s.frictionPoints) ? s.frictionPoints : [];

  // Validate status
  const validStatuses: SessionStatus[] = ["active", "exploring", "friction", "processing", "breakthrough", "completed"];
  const status = validStatuses.includes(s.status as SessionStatus) ? (s.status as SessionStatus) : "active";

  // Ensure dates are dates (hydration often makes them strings)
  const createdAt = s.createdAt ? new Date(s.createdAt) : new Date();
  const updatedAt = s.updatedAt ? new Date(s.updatedAt) : new Date();

  return {
    id: s.id,
    userId: typeof s.userId === "string" ? s.userId : "",
    status,
    entities: entities.filter(e => e && typeof e.id === "string"),
    connections: connections.filter(c => c && typeof c.id === "string"),
    frictionPoints: frictionPoints.filter(f => f && typeof f.id === "string"),
    metadata: s.metadata || {},
    createdAt,
    updatedAt,
    endedAt: s.endedAt ? new Date(s.endedAt) : undefined,
  };
}

/**
 * Main migration function
 */
export function migrateState(persistedState: unknown): PersistedState {
  logger.info("Checking state for migration...");

  if (!persistedState || typeof persistedState !== "object") {
    return { version: CURRENT_SCHEMA_VERSION, currentSession: null };
  }

  const state = persistedState as PersistedState;
  const oldVersion = state.version || 0;

  if (oldVersion === CURRENT_SCHEMA_VERSION) {
    logger.debug("State is up to date");
    return state;
  }

  logger.info(`Migrating state from v${oldVersion} to v${CURRENT_SCHEMA_VERSION}`);

  // Migration logic chain
  const migrated = { ...state };

  // V0 -> V1: Ensure session structure is valid and date objects are restored
  if (oldVersion < 1) {
    if (migrated.currentSession) {
      migrated.currentSession = sanitizeSession(migrated.currentSession);
    }
    migrated.version = 1;
  }

  return migrated;
}
