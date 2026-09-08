import { Elysia, t } from "elysia";
import * as authController from "../controllers/auth.controller.ts";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .post("/register", authController.register, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 6 }),
      name: t.Optional(t.String()),
    }),
  })
  .post("/login", authController.login, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 1 }),
    }),
  })
  .get("/me", authController.getMe)
  .get("/google", authController.googleAuth)
  .get("/google/callback", authController.googleCallback);
