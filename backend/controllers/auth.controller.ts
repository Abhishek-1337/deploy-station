import { prisma } from "../lib/prisma.ts";
import { hashPassword, verifyPassword, signToken } from "../utils/auth.ts";
import { getUserFromRequest } from "../middleware/auth.ts";

// POST /api/auth/register
export const register = async ({ body, set }: any) => {
  const { email, password, name } = body as { email: string; password: string; name?: string };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    set.status = 409;
    return { error: "User already exists" };
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, email: user.email });

  set.status = 201;
  return { user, token };
};

// POST /api/auth/login
export const login = async ({ body, set }: any) => {
  const { email, password } = body as { email: string; password: string };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    set.status = 401;
    return { error: "Invalid credentials" };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    set.status = 401;
    return { error: "Invalid credentials" };
  }

  const token = signToken({ userId: user.id, email: user.email });

  return {
    user: { id: user.id, email: user.email, name: user.name },
    token,
  };
};

// GET /api/auth/me - protected
export const getMe = async ({ headers, request, set }: any) => {
  const user = await getUserFromRequest(headers, request);
  if (!user) {
    set.status = 401;
    return { error: "Unauthorized" };
  }
  return { user };
};
