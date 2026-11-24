import { NextResponse } from "next/server";
import { withRoute } from "@/server/core/http/route";
import { TooManyRequestsError } from "@/server/core/http/errors";
import { rateLimit, resetRateLimit } from "@/server/core/auth/rate-limit";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/server/core/auth/token";
import { LoginInput } from "@/server/modules/users/user.schema";
import { usersService } from "@/server/modules/users/user.service";

export const POST = withRoute({ body: LoginInput }, async ({ req, body }) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `login:${ip}:${body.email}`;
  if (!rateLimit(key, 5, 60_000)) throw new TooManyRequestsError();

  const user = await usersService.authenticate(body.email, body.password);
  resetRateLimit(key);

  const token = await signSession({ sub: user.id, role: user.role, name: user.name });
  const res = NextResponse.json({ data: user });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
});
