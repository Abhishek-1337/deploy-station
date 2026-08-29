import { Elysia } from "elysia";
import { verifyToken } from "../utils/auth.ts";
import { prisma } from "../lib/prisma.ts";

/** Extract and verify Bearer token from headers/request */
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
      select: { id: true, email: true, name: true },
    });
    return user;
  } catch {
    return null;
  }
}

/** Elysia-compatible helper – call inside route handler */
export async function requireAuth(headers: any, request?: Request) {
  const user = await getUserFromRequest(headers, request);
  if (!user) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return user;
}

/** Reusable Elysia plugin that protects all routes it is applied to.
 *  Derives `user` into context and rejects with 401 if not authenticated. */
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
