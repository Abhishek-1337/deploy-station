Bun.serve({
  port: 3000,
  routes: {
    "/health": {
      GET: () => Response.json({ status: "ok", uptime: process.uptime() }),
    },
  },
});

console.log("API server running on http://localhost:3000");