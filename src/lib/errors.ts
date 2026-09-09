// Narrowing helpers for values caught in a `catch`.
//
// A caught value is `unknown` — it can be an Error, a Firebase error carrying a `code`, a string,
// or anything else a library chose to throw. Typing the binding as `any` to reach `.message` or
// `.code` compiles, but it also means a thrown string silently renders "undefined" to the user
// instead of a message. These do the narrowing once so call sites don't each re-invent it.

function asRecord(error: unknown): Record<string, unknown> | null {
  return typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : null;
}

/** A human-readable message, falling back when the thrown value carries none. */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  const message = asRecord(error)?.message;
  return typeof message === 'string' && message ? message : fallback;
}

/** Firebase and Google API errors carry a machine-readable `code`, e.g. 'auth/email-already-exists'. */
export function errorCode(error: unknown): string | undefined {
  const code = asRecord(error)?.code;
  return typeof code === 'string' ? code : undefined;
}

/** Stack trace when there is one — for the error log, never for a user-facing response. */
export function errorStack(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  const stack = asRecord(error)?.stack;
  return typeof stack === 'string' ? stack : undefined;
}
