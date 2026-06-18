import { NextRequest, NextResponse } from "next/server";
import { ensureMigrated } from "@/lib/db/migrate";

/**
 * Shared helpers for API route handlers so every route parses input, validates
 * ids, and shapes errors the same way.
 *
 * - `route()` wraps a handler: runs migrations, then maps thrown `ApiError`s to
 *   their status and any other throw to a 500. Handlers just throw on bad input
 *   instead of hand-rolling `NextResponse.json({ error }, { status })`.
 * - All error responses are `{ error: string }` with the right status.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type RouteContext = { params: Promise<{ id: string }> };

type Handler<C> = (req: NextRequest, ctx: C) => Promise<NextResponse>;

export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    ensureMigrated();
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

/** Resolves the `[id]` route param to an integer, or throws a 400. */
export async function requireId(ctx: RouteContext): Promise<number> {
  const { id } = await ctx.params;
  return parseIntParam(id) ?? bad("bad id");
}

/** Parses a string to an integer, returning null when absent or invalid. */
export function parseIntParam(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

/** Reads a JSON body, tolerating malformed/empty input by returning `{}`. */
export async function readBody<T>(req: NextRequest): Promise<T> {
  return (await req.json().catch(() => ({}))) as T;
}

/** Throws an `ApiError`; typed `never` so it can be used in `?? bad(...)`. */
export function bad(message: string, status = 400): never {
  throw new ApiError(status, message);
}
