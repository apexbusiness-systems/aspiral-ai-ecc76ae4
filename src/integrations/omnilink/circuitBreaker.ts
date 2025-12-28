/**
 * Circuit Breaker for OMNiLiNK
 * 
 * Prevents cascade failures when OMNiLiNK hub is down
 */

import { createLogger } from "@/lib/logger";

const logger = createLogger("OmniLinkCircuitBreaker");

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // ms
}

class OmniLinkCircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = {
      failureThreshold: config?.failureThreshold ?? 5,
      successThreshold: config?.successThreshold ?? 2,
      timeout: config?.timeout ?? 60000, // 1 minute
    };
  }

  getState(): CircuitState {
    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.config.timeout) {
        logger.info("Circuit transitioning to HALF_OPEN");
        this.state = "HALF_OPEN";
        this.successCount = 0;
      }
    }
    return this.state;
  }

  canExecute(): boolean {
    const currentState = this.getState();
    return currentState !== "OPEN";
  }

  recordSuccess(): void {
    this.failureCount = 0;

    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        logger.info("Circuit transitioning to CLOSED after successful recovery");
        this.state = "CLOSED";
        this.successCount = 0;
      }
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failureCount >= this.config.failureThreshold) {
      logger.warn(`Circuit OPENED after ${this.failureCount} failures`);
      this.state = "OPEN";
    }
  }

  reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

// Singleton instance
export const omniLinkCircuitBreaker = new OmniLinkCircuitBreaker();
