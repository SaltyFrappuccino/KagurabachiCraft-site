import type { ApiErrorResponse } from "../../src/shared/releases";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
};

export const json = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders,
  });

export const errorJson = (
  status: number,
  error: string,
  fallbackUrl: string,
  details?: string,
): Response => {
  const payload: ApiErrorResponse = {
    error,
    fallbackUrl,
  };

  if (details) {
    payload.details = details;
  }

  return json(payload, status);
};

export const redirect = (location: string): Response =>
  new Response(null, {
    status: 302,
    headers: {
      location,
      "cache-control": "no-store",
    },
  });
