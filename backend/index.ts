import { Elysia } from "elysia"
import { authRoutes } from "./routes/auth.ts"
import { deployRoutes } from "./routes/project.route.ts"
import { getUserFromRequest } from "./middleware/auth.ts"

new Elysia()
  .get("/health", () => ({
    status: "healthy",
  }))
  .use(authRoutes)
  .use(deployRoutes)
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