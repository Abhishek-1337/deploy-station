import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/Upload";
import OAuthCallback from "./pages/OAuthCallback";
import { Spotlight } from "./components/ui/spotlight";
import { GridBackground } from "./components/ui/grid-background";
import { TextGenerateEffect } from "./components/ui/text-generate";
import { HoverCard } from "./components/ui/card-hover";

function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* hero with Spotlight + Grid */}
      <div className="relative">
        <GridBackground className="py-10">
          <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />
          {/* dark mode spotlight colored */}
          <div className="absolute inset-0 hidden dark:block">
            <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#8b5cf6" />
          </div>

          <div className="mx-auto max-w-5xl px-6 py-14">
            <div className="mx-auto max-w-2xl text-center">
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Vercel-like deploys for your frontend
              </motion.p>

              <div className="mt-6">
                <TextGenerateEffect words="Deploy Station" className="text-4xl sm:text-5xl tracking-tight" />
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="mt-4 text-base leading-6 text-zinc-600 dark:text-zinc-400"
              >
                Paste a GitHub URL, we clone → build in isolated Docker → stream from S3 on your subdomain.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-8 flex justify-center gap-3"
              >
                <a
                  href="/deploy"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-500 opacity-0 blur-xl transition duration-500 group-hover:opacity-20" />
                  <span className="relative flex items-center gap-1.5">Start deploying <span className="transition group-hover:translate-x-0.5">↗</span></span>
                </a>
                <a href="/login" className="rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-black dark:text-white dark:hover:bg-zinc-900">
                  Log in
                </a>
              </motion.div>

              {/* mini terminal preview */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.5 }}
                className="mx-auto mt-10 max-w-xl rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-lg dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div className="flex items-center gap-1.5 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 font-mono text-xs text-zinc-400">deploy --repo github.com/you/app</span>
                </div>
                <div className="space-y-1 pt-3 font-mono text-xs">
                  <p className="text-zinc-500">▸ git clone <span className="text-violet-600 dark:text-violet-400">https://github.com/you/app</span></p>
                  <p className="text-zinc-500">▸ docker run --rm --memory=1.5g <span className="text-emerald-600 dark:text-emerald-400">builder</span></p>
                  <p className="text-zinc-500">▸ upload dist → <span className="text-zinc-900 dark:text-white">s3://deployments/proj-a8f9/</span></p>
                  <p className="text-emerald-600 dark:text-emerald-400">✔ live at proj-a8f9.yourdomain.com</p>
                </div>
              </motion.div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                { title: "Paste URL", desc: "Just paste https://github.com/you/app and we handle the rest.", icon: "⎋" },
                { title: "Isolated builds", desc: "Disposable Docker, 1.5GB cap, concurrency 2.", icon: "⬢" },
                { title: "Instant proxy", desc: "Subdomain → S3 streaming with SPA fallback.", icon: "◈" },
              ].map((c, i) => (
                <motion.div key={c.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.08 }}>
                  <HoverCard>
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs text-white dark:bg-white dark:text-black">{c.icon}</div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{c.title}</h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-500">{c.desc}</p>
                  </HoverCard>
                </motion.div>
              ))}
            </div>
          </div>
        </GridBackground>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-zinc-900 dark:bg-black dark:text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/deploy" element={<Upload />} />
          <Route path="/upload" element={<Navigate to="/deploy" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <footer className="mx-auto max-w-5xl border-t border-zinc-200 px-6 py-6 text-center text-xs text-zinc-500 dark:border-zinc-900 dark:text-zinc-600">
          Deploy Station — frontend v0.1 • API: {import.meta.env.VITE_API_URL || "http://localhost:3000"}
        </footer>
      </div>
    </BrowserRouter>
  );
}
