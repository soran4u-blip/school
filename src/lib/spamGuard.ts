const COOLDOWN_MS = 30 * 1000;

export function isCooldownActive(key: string): boolean {
  try {
    const last = localStorage.getItem(`spamguard:${key}`);
    if (!last) return false;
    return Date.now() - Number(last) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function markSubmitted(key: string): void {
  try {
    localStorage.setItem(`spamguard:${key}`, String(Date.now()));
  } catch {
    // localStorage unavailable — degrade silently, no cooldown enforced
  }
}
