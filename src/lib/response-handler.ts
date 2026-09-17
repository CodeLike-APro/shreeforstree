import {
  badRequest,
  conflict,
  created,
  forbidden,
  internalServerError,
  notFound,
  ok,
  unauthorized,
  validationError,
} from "./api-response";

import type { NextResponse } from "next/server";

export type ResponseKind =
  | "created"
  | "ok"
  | "badRequest"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "validationError"
  | "internalServerError";

export type ServiceResponse<T = unknown> =
  | { kind: "created"; message: string; data: T | null }
  | { kind: "ok"; message: string; data?: T | null }
  | { kind: "badRequest"; message: string; errors?: unknown }
  | { kind: "unauthorized"; message?: string }
  | { kind: "forbidden"; message?: string }
  | { kind: "notFound"; message?: string; errors?: unknown }
  | { kind: "conflict"; message: string }
  | { kind: "validationError"; message: string; errors?: unknown }
  | { kind: "internalServerError"; message?: string; error?: unknown };

export function handleResponse<T>(
  result: ServiceResponse<T>,
  headers?: HeadersInit,
): NextResponse {
  switch (result.kind) {
    case "created":
      // Note: Your 'created' helper doesn't currently accept headers, but you can pass them here if updated
      return created(result.message, result.data);

    case "ok":
      return ok(result.message, result.data, headers);

    case "badRequest":
      // Note: Your helper accepts errors as the second parameter. Headers are omitted by the helper.
      return badRequest(result.message, result.errors);

    case "unauthorized":
      return unauthorized(result.message);

    case "forbidden":
      return forbidden(result.message);

    case "notFound":
      return notFound(result.message, result.errors);

    case "conflict":
      return conflict(result.message);

    case "validationError":
      return validationError(result.message, result.errors);

    case "internalServerError":
      return internalServerError(result.message, result.error);

    default: {
      // Compilation check ensuring all union members are handled
      const _exhaustive: never = result;
      const unhandledKind = (_exhaustive as Record<string, unknown>).kind;
      throw new Error(`Unhandled kind: ${unhandledKind}`);
    }
  }
}
