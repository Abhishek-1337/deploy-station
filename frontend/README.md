# Deploy Station — Frontend

Vite + React + Tailwind.

- Pages: `/` (landing), `/login`, `/register`, `/deploy` (paste Git URL → POST /api/deploy)
- Auth: stores JWT in `localStorage`, sends `Authorization: Bearer <token>`
- Dev: `bun install && bun run dev` (proxies `/api` to `http://localhost:3000`)
- Env: `VITE_API_URL` (defaults to `http://localhost:3000`)
