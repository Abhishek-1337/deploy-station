import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, setToken } from "../lib/api";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.register({ email, password, name: name || undefined });
      setToken(res.token);
      navigate("/deploy");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-500/[0.04] via-transparent to-transparent dark:from-emerald-500/[0.06]" />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Create account</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Start deploying in seconds.</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        onSubmit={onSubmit}
        className="group relative rounded-xl border border-zinc-200 bg-white p-6 space-y-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40"
      >
        <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-violet-500/0 via-fuchsia-500/0 to-emerald-500/0 opacity-0 blur transition duration-500 group-hover:from-violet-500/10 group-hover:via-fuchsia-500/10 group-hover:to-emerald-500/10 group-hover:opacity-100" />
        <div className="relative space-y-4">
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
            />
            <p className="mt-1 text-xs text-zinc-500">Min 6 characters.</p>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="relative w-full overflow-hidden rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <span className="relative">{loading ? "Creating..." : "Create account"}</span>
          </motion.button>

          <p className="text-center text-sm text-zinc-500">
            Already have an account? <Link to="/login" className="text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900 dark:text-white dark:decoration-zinc-600 dark:hover:decoration-white">Log in</Link>
          </p>
        </div>
      </motion.form>
    </div>
  );
}
