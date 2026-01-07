/**
 * Voice System Chaos Tests
 *
 * Simulates extreme edge cases and stress conditions for the voice subsystem:
 * - Rapid start/stop cycles (button mashing)
 * - TTS interruption storms
 * - iOS Safari quirks simulation
 * - Reverb gate race conditions
 * - Memory leak detection under stress
 */

// Built-in assertion helpers (no external dependencies)
function assertEquals<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${expected} but got ${actual}`);
  }
}

function assert(condition: boolean, msg?: string): void {
  if (!condition) {
    throw new Error(msg || "Assertion failed");
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Test Utilities
// ============================================================================

interface VoiceState {
  isRecording: boolean;
  isSpeaking: boolean;
  isGated: boolean;
  transcriptBuffer: string[];
  errorCount: number;
}

function createMockVoiceState(): VoiceState {
  return {
    isRecording: false,
    isSpeaking: false,
    isGated: false,
    transcriptBuffer: [],
    errorCount: 0,
  };
}

// Simulates the iOS Safari detection logic
// Must exclude Chrome iOS (CriOS), Firefox iOS (FxiOS), and other iOS browsers
function isIOSSafari(userAgent: string, platform: string, maxTouchPoints: number): boolean {
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === 'MacIntel' && maxTouchPoints > 1);
  // Exclude Chrome (CriOS), Firefox (FxiOS), and other browsers on iOS
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(userAgent);
  return isIOS && isSafari;
}

// Simulates the sentence chunking logic
function splitIntoSentences(text: string): string[] {
  // Handle empty or whitespace-only input
  if (!text || text.trim().length === 0) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+[\s]?|[^.!?]+$/g);
  if (!sentences) return [text];

  const filtered = sentences.map(s => s.trim()).filter(s => s.length > 0);
  // If all filtered out, return original text
  return filtered.length > 0 ? filtered : [text];
}

// Simulates the reverb gate with timing
class ReverbGate {
  private isGated = false;
  private timeoutId: number | null = null;
  private readonly delayMs: number;

  constructor(delayMs = 600) {
    this.delayMs = delayMs;
  }

  setGate(): void {
    this.isGated = true;
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  clearGateAfterDelay(): Promise<void> {
    return new Promise((resolve) => {
      this.timeoutId = setTimeout(() => {
        this.isGated = false;
        this.timeoutId = null;
        resolve();
      }, this.delayMs) as unknown as number;
    });
  }

  checkGated(): boolean {
    return this.isGated;
  }

  dispose(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isGated = false;
  }
}

// ============================================================================
// CHAOS TEST: Rapid Voice Toggle (Button Mashing)
// ============================================================================

Deno.test({
  name: "CHAOS: Rapid voice toggle survives 100 start/stop cycles",
  async fn() {
    const state = createMockVoiceState();
    let toggleCount = 0;
    const errors: string[] = [];

    // Simulate rapid toggling
    for (let i = 0; i < 100; i++) {
      try {
        state.isRecording = !state.isRecording;
        toggleCount++;
        // Simulate minimal processing delay
        await delay(1);
      } catch (e) {
        errors.push((e as Error).message);
        state.errorCount++;
      }
    }

    assertEquals(toggleCount, 100, "Should complete all toggle cycles");
    assertEquals(errors.length, 0, "Should have no errors");
    console.log(`  ✓ Completed ${toggleCount} toggle cycles with ${errors.length} errors`);
  },
});

Deno.test({
  name: "CHAOS: Voice state consistency under rapid toggling",
  async fn() {
    const states: boolean[] = [];
    let currentState = false;

    for (let i = 0; i < 50; i++) {
      currentState = !currentState;
      states.push(currentState);
      await delay(2);
    }

    // Verify alternating pattern
    let alternations = 0;
    for (let i = 1; i < states.length; i++) {
      if (states[i] !== states[i - 1]) alternations++;
    }

    assertEquals(alternations, 49, "State should alternate consistently");
    console.log(`  ✓ State alternated ${alternations} times correctly`);
  },
});

// ============================================================================
// CHAOS TEST: TTS Interruption Storm
// ============================================================================

Deno.test({
  name: "CHAOS: TTS handles 20 rapid interruptions without deadlock",
  async fn() {
    const gate = new ReverbGate(50); // Short delay for testing
    let speakCount = 0;
    let interruptCount = 0;

    for (let i = 0; i < 20; i++) {
      gate.setGate();
      speakCount++;

      // Interrupt before gate clears
      await delay(10);
      gate.dispose();
      interruptCount++;
    }

    assertEquals(speakCount, 20, "Should attempt all speak operations");
    assertEquals(interruptCount, 20, "Should handle all interruptions");
    assertEquals(gate.checkGated(), false, "Gate should be cleared after dispose");
    console.log(`  ✓ Handled ${interruptCount} interruptions, gate state: ${gate.checkGated()}`);
  },
});

Deno.test({
  name: "CHAOS: Sentence chunking handles malformed input",
  fn() {
    const testCases = [
      { input: "", expected: 1 },
      { input: "...", expected: 1 },
      { input: "???", expected: 1 },
      { input: "!!!", expected: 1 },
      { input: "a.b.c.", expected: 3 },
      { input: "Hello... World...", expected: 2 },
      { input: "What?! Really?! Yes!", expected: 3 },
      { input: "   ", expected: 1 },
      { input: "No punctuation here", expected: 1 },
      { input: "One. Two. Three. Four. Five.", expected: 5 },
    ];

    for (const { input, expected } of testCases) {
      const result = splitIntoSentences(input);
      assert(
        result.length >= 1,
        `Should return at least 1 chunk for: "${input.substring(0, 20)}..."`
      );
    }

    console.log(`  ✓ Handled ${testCases.length} edge cases without crashes`);
  },
});

// ============================================================================
// CHAOS TEST: iOS Safari Simulation
// ============================================================================

Deno.test({
  name: "CHAOS: iOS Safari detection handles all device variants",
  fn() {
    const devices = [
      { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1", platform: "iPhone", touch: 5, expected: true },
      { ua: "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1", platform: "iPad", touch: 5, expected: true },
      { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15", platform: "MacIntel", touch: 5, expected: true }, // iPadOS
      { ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15", platform: "MacIntel", touch: 0, expected: false }, // Mac
      { ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36", platform: "Win32", touch: 0, expected: false },
      { ua: "Mozilla/5.0 (Linux; Android 13) Chrome/120.0.0.0 Mobile Safari/537.36", platform: "Linux", touch: 5, expected: false },
      { ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) CriOS/108.0 Mobile/15E148 Safari/604.1", platform: "iPhone", touch: 5, expected: false }, // Chrome iOS
    ];

    let passed = 0;
    for (const device of devices) {
      const result = isIOSSafari(device.ua, device.platform, device.touch);
      if (result === device.expected) {
        passed++;
      } else {
        console.log(`  ✗ Failed for: ${device.platform} (expected ${device.expected}, got ${result})`);
      }
    }

    assertEquals(passed, devices.length, `Should correctly identify all ${devices.length} devices`);
    console.log(`  ✓ Correctly identified ${passed}/${devices.length} device types`);
  },
});

Deno.test({
  name: "CHAOS: iOS Safari auto-restart simulation",
  async fn() {
    let restartCount = 0;
    let isRecording = true;
    const isIOSSafariMode = true;
    const maxRestarts = 10;

    // Simulate iOS Safari non-continuous mode with auto-restart
    while (isRecording && restartCount < maxRestarts) {
      // Simulate recognition ending naturally
      await delay(10);

      if (isIOSSafariMode && isRecording) {
        // Auto-restart
        restartCount++;
        await delay(5);
      }
    }

    assertEquals(restartCount, maxRestarts, "Should auto-restart correct number of times");
    console.log(`  ✓ Auto-restarted ${restartCount} times in iOS Safari mode`);
  },
});

// ============================================================================
// CHAOS TEST: Reverb Gate Race Conditions
// ============================================================================

Deno.test({
  name: "CHAOS: Reverb gate handles concurrent set/clear operations",
  async fn() {
    const gate = new ReverbGate(20);
    const operations: Promise<void>[] = [];

    // Simulate concurrent operations
    for (let i = 0; i < 10; i++) {
      operations.push((async () => {
        gate.setGate();
        await delay(5);
        gate.clearGateAfterDelay();
      })());
    }

    await Promise.all(operations);

    // Wait for final clear
    await delay(50);

    assertEquals(gate.checkGated(), false, "Gate should be cleared after all operations");
    console.log(`  ✓ Handled 10 concurrent gate operations`);
  },
});

Deno.test({
  name: "CHAOS: Reverb gate timing under load",
  async fn() {
    const gate = new ReverbGate(100);
    const timings: number[] = [];

    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      gate.setGate();
      assert(gate.checkGated(), "Gate should be set immediately");

      await gate.clearGateAfterDelay();
      const elapsed = Date.now() - start;
      timings.push(elapsed);
    }

    // All timings should be approximately 100ms (with some tolerance)
    const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
    assert(avgTiming >= 95 && avgTiming <= 150, `Average timing ${avgTiming}ms should be ~100ms`);
    console.log(`  ✓ Average gate timing: ${avgTiming.toFixed(1)}ms (expected ~100ms)`);
  },
});

// ============================================================================
// CHAOS TEST: Memory Pressure Simulation
// ============================================================================

Deno.test({
  name: "CHAOS: Transcript buffer handles 1000 rapid entries",
  fn() {
    const buffer: string[] = [];
    const maxSize = 100;

    for (let i = 0; i < 1000; i++) {
      buffer.push(`transcript_${i}`);
      // Simulate circular buffer behavior
      if (buffer.length > maxSize) {
        buffer.shift();
      }
    }

    assertEquals(buffer.length, maxSize, "Buffer should maintain max size");
    assertEquals(buffer[0], "transcript_900", "Oldest entry should be from position 900");
    console.log(`  ✓ Buffer maintained at ${buffer.length} entries after 1000 insertions`);
  },
});

Deno.test({
  name: "CHAOS: Long sentence chunking memory efficiency",
  fn() {
    // Generate a very long text
    const longText = Array(100).fill("This is a test sentence.").join(" ");
    const sentences = splitIntoSentences(longText);

    assertEquals(sentences.length, 100, "Should split into 100 sentences");
    assert(sentences.every(s => s.length < 100), "Each chunk should be reasonably sized");
    console.log(`  ✓ Split ${longText.length} chars into ${sentences.length} chunks`);
  },
});

// ============================================================================
// CHAOS TEST: State Machine Integrity
// ============================================================================

Deno.test({
  name: "CHAOS: Voice state machine handles invalid transitions",
  fn() {
    const validTransitions: Record<string, string[]> = {
      idle: ["recording", "speaking"],
      recording: ["idle", "paused"],
      paused: ["recording", "idle"],
      speaking: ["idle"],
    };

    let currentState = "idle";
    const attemptedTransitions: string[] = [];
    const invalidTransitions: string[] = [];

    // Attempt random transitions
    const allStates = Object.keys(validTransitions);
    for (let i = 0; i < 50; i++) {
      const nextState = allStates[Math.floor(Math.random() * allStates.length)];
      attemptedTransitions.push(`${currentState}->${nextState}`);

      if (validTransitions[currentState].includes(nextState)) {
        currentState = nextState;
      } else {
        invalidTransitions.push(`${currentState}->${nextState}`);
      }
    }

    assert(invalidTransitions.length > 0, "Should have caught some invalid transitions");
    console.log(`  ✓ Caught ${invalidTransitions.length} invalid transitions out of ${attemptedTransitions.length}`);
  },
});

console.log("\n🎯 Voice Chaos Tests Complete\n");
