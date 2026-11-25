import { NextResponse } from "next/server";
import { withRoute } from "@/server/core/http/route";
import { TooManyRequestsError } from "@/server/core/http/errors";
import { rateLimit, resetRateLimit } from "@/server/core/auth/rate-limit";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/server/core/auth/token";
import { LoginInput } from "@/server/modules/users/user.schema";
import { usersService } from "@/server/modules/users/user.service";

export const POST = withRoute({ body: LoginInput }, async ({ req, body }) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const email = body.email.trim().toLowerCase();

  // Dois limites: força bruta numa conta (5/min) e um IP testando muitas contas (20 em 15 min).
  const accountKey = `login:${ip}:${email}`;
  const [account, perIp] = await Promise.all([
    rateLimit(accountKey, 5, 60_000),
    rateLimit(`login-ip:${ip}`, 20, 15 * 60_000),
  ]);
  const blocked = [account, perIp].filter((r) => !r.allowed);
  if (blocked.length) throw new TooManyRequestsError(Math.max(...blocked.map((r) => r.retryAfterSeconds)));

  const user = await usersService.authenticate(body.email, body.password);
  await resetRateLimit(accountKey);

  const token = await signSession({ sub: user.id, role: user.role, name: user.name });
  const res = NextResponse.json({ data: user });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
});
