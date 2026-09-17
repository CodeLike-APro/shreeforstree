import { NextResponse } from "next/server";

import type { ApiError, ApiPaginated, ApiSuccess } from "@/types/api";

// 200 OK
export function ok<T>(
  message: string,
  data: T | null = null,
  headers?: HeadersInit,
) {
  const body: ApiSuccess<T | null> = {
    success: true,
    message,
    data,
  };
  return NextResponse.json(body, { status: 200, headers });
}

// 201 Created
export function created<T>(message: string, data: T | null = null) {
  const body: ApiSuccess<T | null> = {
    success: true,
    message,
    data,
  };
  return NextResponse.json(body, { status: 201 });
}

// 400 Bad Request
export function badRequest(message: string, errors?: unknown) {
  const body: ApiError = {
    success: false,
    message,
    data: null,
    errors,
  };
  return NextResponse.json(body, {
    status: 400,
  });
}

// 401 Unauthorized
export function unauthorized(message: string = "Unauthorized") {
  const body: ApiError = {
    success: false,
    message,
    data: null,
  };
  return NextResponse.json(body, {
    status: 401,
  });
}

// 403 Forbidden
export function forbidden(message: string = "Forbidden") {
  const body: ApiError = {
    success: false,
    message,
    data: null,
  };
  return NextResponse.json(body, {
    status: 403,
  });
}

// 404 Not Found
export function notFound(message: string = "Not Found", errors?: unknown) {
  const body: ApiError = {
    success: false,
    message,
    data: null,
    errors,
  };
  return NextResponse.json(body, {
    status: 404,
  });
}

// 409 Conflict
export function conflict(message: string) {
  const body: ApiError = {
    success: false,
    message,
    data: null,
  };
  return NextResponse.json(body, {
    status: 409,
  });
}

// 422 Unprocessable Entity
export function validationError(message: string, errors?: unknown) {
  const body: ApiError = {
    success: false,
    data: null,
    message,
    errors,
  };
  return NextResponse.json(body, {
    status: 422,
  });
}

// 500 Internal Server Error
export function internalServerError(
  message: string = "Internal Server Error",
  error?: unknown,
) {
  const trace = new Error().stack;
  const callSite = trace ? trace.split("\n")[2]?.trim() : "Unknown call site";
  console.error(message, error, { status: 500, at: callSite });
  const body: ApiError = {
    success: false,
    message,
    data: null,
  };
  return NextResponse.json(body, {
    status: 500,
  });
}

// Paginated Response
export function paginated<T>(
  message: string,
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  const body: ApiPaginated<T> = {
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
  return NextResponse.json(body, { status: 200 });
}
