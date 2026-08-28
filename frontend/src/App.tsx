import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/Upload";

function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Vercel-like deploys for your frontend
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">Deploy Station</h1>
        <p className="mt-4 text-base leading-6 text-zinc-600 dark:text-zinc-400">
          Paste a GitHub URL, we clone → build in isolated Docker → stream from S3 on your subdomain.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <a href="/deploy" className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">Start deploying</a>
          <a href="/login" className="rounded-full border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-white dark:hover:bg-zinc-900">Log in</a>
        </div>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/20">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Git push to deploy</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-500">Just paste https://github.com/you/app and we handle the rest.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/20">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Isolated builds</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-500">Each build runs in a disposable Docker container (1.5GB, concurrency 2).</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/20">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Instant proxy</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-500">Subdomain routing streams directly from S3 with SPA fallback.</p>
        </div>
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
