import { Elysia } from "elysia";
import { verifyToken } from "../utils/auth.ts";
import { prisma } from "../lib/prisma.ts";

export async function getUserFromRequest(headers: any, request?: Request) {
  const raw =
    headers?.authorization ??
    headers?.Authorization ??
    request?.headers?.get?.("authorization") ??
    request?.headers?.get?.("Authorization");

  if (!raw || typeof raw !== "string" || !raw.startsWith("Bearer ")) {
    return null;
  }
  const token = raw.slice(7).trim();
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, avatar: true, googleId: true },
    });
    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(headers: any, request?: Request) {
  const user = await getUserFromRequest(headers, request);
  if (!user) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return user;
}

// NOTE: Elysia plugin via `use()` does not propagate derive/onBeforeHandle correctly
// when the plugin is mounted onto a prefixed group and then mounted onto the main app
// (see reproduction with Elysia 1.4.29). Use inline derive guard instead.
// Kept for backwards-compat on simple routes, but deploy routes use inline guard.
export const authPlugin = new Elysia({ name: "auth" })
  .derive(async ({ headers, request }: any) => {
    const user = await getUserFromRequest(headers, request);
    return { user };
  })
  .onBeforeHandle(({ user, set }: any) => {
    if (!user) {
      set.status = 401 as any;
      return { error: "Unauthorized" };
    }
  });
