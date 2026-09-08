import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';

// Parses and validates a request body against a zod schema, in one call every API route can use
// the same way. Returns { data } on success, or { error: NextResponse } on failure — the caller
// returns that response as-is, so a bad request never reaches business logic.
export async function parseJsonBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; error?: undefined } | { data?: undefined; error: NextResponse }> {
  const body = await request.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: NextResponse.json({ success: false, error: firstIssueMessage(result.error) }, { status: 400 }) };
  }
  return { data: result.data };
}

function firstIssueMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Invalid request body';
  const path = issue.path.join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}
