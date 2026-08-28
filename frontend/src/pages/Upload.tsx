import { useState } from "react";
import { api, getToken } from "../lib/api";
import { useNavigate } from "react-router-dom";

function isValidGitUrl(v: string) {
  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(v.trim()) || /^https:\/\/.+\.git\/?$/.test(v.trim()) || v.startsWith("https://");
}

export default function Upload() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ deploymentId: string; status: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onDeploy(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Deploy your frontend</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Paste a public Git repository URL. We will clone, build, and deploy it.</p>
      </div>

      <form onSubmit={onDeploy} className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/30">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Git repository URL</label>
        <div className="flex gap-3">
          <input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/my-react-app"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
          />
          <button
            disabled={loading}
            className="whitespace-nowrap rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Deploying..." : "Deploy"}
          </button>
        </div>
        <p className="text-xs text-zinc-500">Supports public GitHub repos with a Vite / React build (npm run build → dist).</p>

        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-400">{error}</p>}

        {result && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-500/10">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Deployment queued</p>
            <p className="mt-1 font-mono text-xs text-emerald-600 dark:text-emerald-200/80">ID: {result.deploymentId} — status: {result.status}</p>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">Your site will be available at <span className="font-mono text-zinc-900 dark:text-white">{result.deploymentId}.yourdomain.com</span> once the build finishes.</p>
          </div>
        )}
      </form>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { step: "01", title: "Paste URL", desc: "Public GitHub repo" },
          { step: "02", title: "We build", desc: "Isolated Docker, 1.5GB cap" },
          { step: "03", title: "Go live", desc: "Subdomain + S3 streaming" },
        ].map((s) => (
          <div key={s.step} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/20">
            <p className="font-mono text-xs text-zinc-500">{s.step}</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">{s.title}</p>
            <p className="text-xs text-zinc-500">{s.desc}</p>
          </div>
        ))}
      </div>

      {!getToken() && (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-300">
          You are not logged in. You will be redirected to login on deploy.
        </p>
      )}
    </div>
  );
}
