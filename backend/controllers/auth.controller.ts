import { prisma } from "../lib/prisma.ts";
import { hashPassword, verifyPassword, signToken } from "../utils/auth.ts";
import { getUserFromRequest } from "../middleware/auth.ts";
import {
  generateState,
  verifyState,
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  getGoogleUserInfo,
} from "../utils/google.ts";

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

  if (!user.password) {
    set.status = 401;
    return { error: "Please sign in with Google" };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    set.status = 401;
    return { error: "Invalid credentials" };
  }

  const token = signToken({ userId: user.id, email: user.email });

  return {
    user: { id: user.id, email: user.email, name: user.name, avatar: (user as any).avatar },
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

// GET /api/auth/google - redirect to Google OAuth
export const googleAuth = async ({ set }: any) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  try {
    const state = generateState();
    const url = getGoogleAuthUrl(state);
    set.redirect = url;
    return;
  } catch (err: any) {
    // Don't show raw backend JSON — send user back to frontend with error
    const msg = err.message || "Google OAuth not configured";
    console.error("[oauth] googleAuth error:", msg);
    // If headers already sent as redirect, Elysia will handle set.redirect
    // Otherwise redirect to login with error
    set.redirect = `${frontendUrl}/login?error=${encodeURIComponent(msg)}`;
    return;
  }
};

// GET /api/auth/google/callback - handle Google redirect
export const googleCallback = async ({ query, set }: any) => {
  const { code, state, error } = query as { code?: string; state?: string; error?: string };

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (error) {
    set.redirect = `${frontendUrl}/login?error=${encodeURIComponent(error)}`;
    return;
  }

  if (!code) {
    set.redirect = `${frontendUrl}/login?error=${encodeURIComponent("Missing authorization code")}`;
    return;
  }

  // Verify state (CSRF protection) - warn but don't hard fail if store empty (e.g., server restart)
  if (state && !verifyState(state)) {
    console.warn("[oauth] Invalid or expired state:", state);
    // For strict security, uncomment:
    // set.redirect = `${frontendUrl}/login?error=${encodeURIComponent("Invalid state")}`;
    // return;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    if (!googleUser.email) {
      throw new Error("Google account has no email");
    }

    // Upsert user: link by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.id }, { email: googleUser.email }],
      },
    });

    if (user) {
      // Link / update existing user
      const data: any = {};
      if (!user.googleId) data.googleId = googleUser.id;
      if (!user.avatar && googleUser.picture) data.avatar = googleUser.picture;
      if (!user.name && googleUser.name) data.name = googleUser.name;
      if (!user.provider || user.provider === "local") data.provider = "google";
      if (Object.keys(data).length > 0) {
        user = await prisma.user.update({ where: { id: user.id }, data });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.id,
          avatar: googleUser.picture,
          provider: "google",
          password: null,
        },
      });
    }

    const token = signToken({ userId: user.id, email: user.email });

    // Redirect to frontend with token (frontend will store it)
    set.redirect = `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`;
    return;
  } catch (err: any) {
    console.error("[oauth] Google callback error:", err);
    set.redirect = `${frontendUrl}/login?error=${encodeURIComponent(err.message || "OAuth failed")}`;
    return;
  }
};
