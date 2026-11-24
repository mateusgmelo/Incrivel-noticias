/**
 * Assinatura/verificação do JWT de sessão.
 * Sem dependência de banco: este módulo também roda no middleware (Edge Runtime).
 */
import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@/server/db/schema";

export const SESSION_COOKIE = "in_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

export type SessionClaims = { sub: string; role: Role; name: string };

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET ausente ou curto demais");
  return new TextEncoder().encode(s);
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role, name: claims.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setIssuer("incrivel-noticias")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "incrivel-noticias",
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return { sub: payload.sub, role: payload.role as Role, name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
