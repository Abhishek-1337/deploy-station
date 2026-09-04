import { useState, useRef, useEffect } from "react";
import { api, getToken } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function isValidGitUrl(v: string) {
  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(v.trim()) || /^https:\/\/.+\.git\/?$/.test(v.trim()) || v.startsWith("https://");
}

export default function Upload() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ deploymentId: string; status: string } | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  function startPolling(deploymentId: string) {
    if (pollRef.current) window.clearInterval(pollRef.current);
    setLiveStatus("QUEUED");
    pollRef.current = window.setInterval(async () => {
      try {
        const s = await api.getDeploymentStatus(deploymentId);
        setLiveStatus(s.status);
        setResult((prev) => (prev ? { ...prev, status: s.status } : prev));
        if (s.status === "DEPLOYED" || s.status === "FAILED") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {
        // keep polling; transient network error
      }
    }, 2000);
  }

  async function onDeploy(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLiveStatus(null);
    if (pollRef.current) window.clearInterval(pollRef.current);

    if (!getToken()) {
      navigate("/login");
      return;
    }
    if (!isValidGitUrl(repoUrl)) {
      setError("Enter a valid Git repository URL (e.g. https://github.com/user/repo).");
      return;
    }

    setLoading(true);
    try {
      const res = await api.deploy({ repoUrl: repoUrl.trim() });
      setResult(res);
      startPolling(res.deploymentId);
    } catch (err: any) {
      // Senior UX: 409 means deduped — deployment already QUEUED/RUNNING, poll existing
      if (err?.status === 409 && err?.data?.deploymentId) {
        const existing = err.data as { deploymentId: string; status: string; projectId: string; message?: string };
        setResult({ deploymentId: existing.deploymentId, status: existing.status, projectId: existing.projectId } as any);
        setLiveStatus(existing.status);
        startPolling(existing.deploymentId);
        setError("");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Deploy your frontend</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Paste a public Git repository URL. We will clone, build, and deploy it.</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        onSubmit={onDeploy}
        className="group relative rounded-xl border border-zinc-200 bg-white p-6 space-y-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/30"
      >
        <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-violet-500/0 via-transparent to-emerald-500/0 opacity-0 blur transition duration-500 group-hover:from-violet-500/10 group-hover:to-emerald-500/10 group-hover:opacity-100" />
        <div className="relative space-y-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Git repository URL</label>
          <div className="flex gap-3">
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/my-react-app"
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              disabled={loading}
              className="relative whitespace-nowrap overflow-hidden rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-violet-500 to-emerald-500 opacity-0 transition group-hover:opacity-10" />
              <span className="relative">{loading ? "Deploying..." : "Deploy"}</span>
            </motion.button>
          </div>
          <p className="text-xs text-zinc-500">Supports public GitHub repos with a Vite / React build (npm run build → dist).</p>

          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </motion.p>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={
                liveStatus === "FAILED"
                  ? "rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-500/10"
                  : liveStatus === "DEPLOYED"
                    ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-500/10"
                    : "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-500/10"
              }
            >
              <p className={
                liveStatus === "FAILED" ? "text-sm font-medium text-red-700 dark:text-red-300"
                : liveStatus === "DEPLOYED" ? "text-sm font-medium text-emerald-700 dark:text-emerald-300"
                : "text-sm font-medium text-amber-700 dark:text-amber-300"
              }>
                {liveStatus === "FAILED" ? "Deployment failed" : liveStatus === "DEPLOYED" ? "Deployment live" : liveStatus === "RUNNING" ? "Building..." : "Deployment queued"}
              </p>
              <p className="mt-1 font-mono text-xs opacity-80">ID: {result.deploymentId} — status: {liveStatus ?? result.status}</p>
              {liveStatus === "FAILED" ? (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">Build or upload failed. Check logs and retry.</p>
              ) : liveStatus === "DEPLOYED" ? (
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  Your site is live at <span className="font-mono text-zinc-900 dark:text-white">{result.deploymentId}.yourdomain.com</span>
                </p>
              ) : (
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  Your site will be available at <span className="font-mono text-zinc-900 dark:text-white">{result.deploymentId}.yourdomain.com</span> once the build finishes.
                </p>
              )}
            </motion.div>
          )}
        </div>
      </motion.form>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { step: "01", title: "Paste URL", desc: "Public GitHub repo" },
          { step: "02", title: "We build", desc: "Isolated Docker, 1.5GB cap" },
          { step: "03", title: "Go live", desc: "Subdomain + S3 streaming" },
        ].map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 + i * 0.07 }}
            whileHover={{ y: -2 }}
            className="group rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/40"
          >
            <p className="font-mono text-xs text-zinc-500">{s.step}</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">{s.title}</p>
            <p className="text-xs text-zinc-500">{s.desc}</p>
          </motion.div>
        ))}
      </div>

      {!getToken() && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-300">
          You are not logged in. You will be redirected to login on deploy.
        </motion.p>
      )}
    </div>
  );
}
