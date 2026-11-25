/**
 * Erros de domínio. Services lançam estes erros; a camada HTTP (withRoute)
 * converte cada um em status + corpo padronizado. Nenhum service conhece HTTP.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Requisição inválida", details?: unknown) {
    super(400, "BAD_REQUEST", message, details);
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown, message = "Dados inválidos") {
    super(422, "VALIDATION_ERROR", message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Autenticação necessária") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Você não tem permissão para esta ação") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Recurso", gender: "m" | "f" = "m") {
    super(404, "NOT_FOUND", `${resource} não encontrad${gender === "f" ? "a" : "o"}`);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito com o estado atual do recurso", details?: unknown) {
    super(409, "CONFLICT", message, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(
    public readonly retryAfterSeconds?: number,
    message = "Muitas tentativas. Tente novamente em instantes.",
  ) {
    super(429, "TOO_MANY_REQUESTS", message, retryAfterSeconds ? { retryAfterSeconds } : undefined);
  }
}
