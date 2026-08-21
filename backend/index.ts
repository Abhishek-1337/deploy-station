import { Elysia } from "elysia"
import { authRoutes } from "./routes/auth.ts"
import { getUserFromRequest } from "./middleware/auth.ts"

new Elysia()
  .get("/health", () => ({
    status: "healthy",
  }))
  // public auth routes
  .use(authRoutes)
  // example protected route
  .get("/api/protected", async ({ headers, request, set }: any) => {
    const user = await getUserFromRequest(headers, request)
    if (!user) {
      set.status = 401
      return { error: "Unauthorized" }
    }
    return { message: `Hello ${user.email}`, user }
  })
  .listen(3000)

console.log("API server running on http://localhost:3000");