import { Elysia } from "elysia"

new Elysia()
.get(('/health'), () => ({
  status: "healthy"
}))
.listen(3000)

console.log("API server running on http://localhost:3000");