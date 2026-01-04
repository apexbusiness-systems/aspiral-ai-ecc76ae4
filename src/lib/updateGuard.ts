export interface UpdateGuardOptions {
  name: string;
  maxUpdates?: number;
  windowMs?: number;
}

export function createUpdateGuard({ name, maxUpdates = 25, windowMs = 1000 }: UpdateGuardOptions) {
  let windowStart = 0;
  let count = 0;

  return function guardUpdate() {
    if (!import.meta.env.DEV) return;

    const now = Date.now();
    if (now - windowStart > windowMs) {
      windowStart = now;
      count = 0;
    }

    count += 1;
    if (count > maxUpdates) {
      console.warn(
        `[UpdateGuard] ${name} fired ${count} times in ${windowMs}ms. ` +
          "Check for render loops or unstable dependencies."
      );
    }
  };
}
