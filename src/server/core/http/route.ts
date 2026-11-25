/**
 * withRoute — o "pipeline" de toda rota da API.
 *
 *   autenticação -> autorização por papel -> validação (params/query/body) -> handler -> erro padronizado
 *
 * As rotas em src/app/api ficam com poucas linhas: declaram o contrato e delegam ao service.
 */
import { type NextRequest } from "next/server";
import { z, ZodError, type ZodTypeAny } from "zod";
import { getCurrentUser } from "@/server/core/auth/session";
import { type Actor, hasRole } from "@/server/core/auth/rbac";
import type { Role } from "@/server/db/schema";
import { AppError, BadRequestError, ForbiddenError, TooManyRequestsError, UnauthorizedError, ValidationError } from "./errors";
import { errorResponse } from "./responses";

type Infer<S> = S extends ZodTypeAny ? z.infer<S> : undefined;

type RouteOptions<A extends Role | undefined, B, Q, P> = {
  /** Papel mínimo exigido. Omitido = rota pública. */
  auth?: A;
  body?: B;
  query?: Q;
  params?: P;
};

type RouteContext<A, B, Q, P> = {
  req: NextRequest;
  actor: A extends Role ? Actor : Actor | null;
  body: Infer<B>;
  query: Infer<Q>;
  params: P extends ZodTypeAny ? z.infer<P> : Record<string, string>;
};

type NextCtx = { params: Promise<Record<string, string>> };

export function withRoute<
  A extends Role | undefined = undefined,
  B extends ZodTypeAny | undefined = undefined,
  Q extends ZodTypeAny | undefined = undefined,
  P extends ZodTypeAny | undefined = undefined,
>(
  options: RouteOptions<A, B, Q, P>,
  handler: (ctx: RouteContext<A, B, Q, P>) => Promise<Response>,
) {
  return async (req: NextRequest, nextCtx: NextCtx): Promise<Response> => {
    try {
      // 1. Autenticação / autorização
      const actor = await getCurrentUser();
      if (options.auth) {
        if (!actor) throw new UnauthorizedError();
        if (!hasRole(actor, options.auth)) throw new ForbiddenError();
      }

      // 2. Validação de entrada
      const rawParams = (await nextCtx?.params) ?? {};
      const params = options.params ? options.params.parse(rawParams) : rawParams;
      const query = options.query
        ? options.query.parse(Object.fromEntries(req.nextUrl.searchParams))
        : undefined;
      const body = options.body ? options.body.parse(await readJson(req)) : undefined;

      // 3. Handler
      return await handler({ req, actor, body, query, params } as RouteContext<A, B, Q, P>);
    } catch (err) {
      return toErrorResponse(err, req);
    }
  };
}

async function readJson(req: NextRequest): Promise<unknown> {
  const type = req.headers.get("content-type") ?? "";
  // Exigir JSON também ajuda contra CSRF via <form> (que não envia application/json).
  if (!type.includes("application/json")) {
    throw new BadRequestError("Content-Type deve ser application/json");
  }
  try {
    return await req.json();
  } catch {
    throw new BadRequestError("JSON malformado");
  }
}

/** Mapeamento único de erro -> HTTP. */
export function toErrorResponse(err: unknown, req?: NextRequest): Response {
  if (err instanceof ZodError) {
    const e = new ValidationError(err.flatten());
    return errorResponse(e.status, e.code, e.message, e.details);
  }
  if (err instanceof TooManyRequestsError) {
    const res = errorResponse(err.status, err.code, err.message, err.details);
    if (err.retryAfterSeconds) res.headers.set("Retry-After", String(err.retryAfterSeconds));
    return res;
  }
  if (err instanceof AppError) {
    return errorResponse(err.status, err.code, err.message, err.details);
  }
  const pgCode = (err as { code?: string; cause?: { code?: string } })?.code ??
    (err as { cause?: { code?: string } })?.cause?.code;
  if (pgCode === "23505") return errorResponse(409, "CONFLICT", "Registro duplicado");
  if (pgCode === "23503") return errorResponse(409, "CONFLICT", "Registro relacionado não existe ou está em uso");

  console.error(`[api] erro não tratado em ${req?.method} ${req?.nextUrl.pathname}`, err);
  return errorResponse(500, "INTERNAL_ERROR", "Erro interno do servidor");
}
