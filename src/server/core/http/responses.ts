import { NextResponse } from "next/server";

/** Contrato de resposta da API:
 *   sucesso -> { data, meta? }
 *   erro    -> { error: { code, message, details? } }
 */
export type PageMeta = { page: number; pageSize: number; total: number; totalPages: number };

export function ok<T>(data: T, meta?: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json(meta ? { data, meta } : { data }, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status },
  );
}
