import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, getToken } from "../lib/api";
import { useNavigate } from "react-router-dom";

type Project = {
  id: string;
  name: string;
  repo: string;
  domain: string | null;
  url: string;
  latestDeployment: { id: string; status: string; projectId: string } | null;
  totalDeployments: number;
  statusCounts: Record<string, number>;
};

type Deployment = {
  id: string;
  status: string;
  projectId: string;
  project: { name: string; repo: string };
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    QUEUED: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-900/50",
    RUNNING: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-900/50",
    DEPLOYED: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-900/50",
    FAILED: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-900/50",
  };
  const dot: Record<string, string> = {
    QUEUED: "bg-amber-500",
    RUNNING: "bg-blue-500",
    DEPLOYED: "bg-emerald-500",
    FAILED: "bg-red-500",
  };
  const cls = map[status] ?? "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
  const dc = dot[status] ?? "bg-zinc-400";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dc} ${status === "QUEUED" || status === "RUNNING" ? "animate-pulse" : ""}`} />
      {status}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-3 h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
      <div className="mt-2 h-3 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800/60" />
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-6 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [deployments, setDeployments] = useState<Deployment[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [view, setView] = useState<"projects" | "deployments">("projects");
  const [copied, setCopied] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  async function fetchAll() {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    try {
      setError("");
      const [pRes, dRes] = await Promise.all([
        api.listProjects().catch(() => ({ projects: [] as Project[] })),
        api.listDeployments().catch(() => ({ deployments: [] as Deployment[] })),
      ]);
      setProjects(pRes.projects);
      setDeployments(dRes.deployments);
    } catch (e: any) {
      setError(e.message || "Failed to load projects");
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  // poll if any project has QUEUED/RUNNING latest deployment
  useEffect(() => {
    const hasActive = projects?.some((p) => p.latestDeployment && ["QUEUED", "RUNNING"].includes(p.latestDeployment.status));
    if (hasActive) {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = window.setInterval(fetchAll, 3000);
    } else {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p) => {
      const matchesQ =
        !q ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.repo.toLowerCase().includes(q.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || p.latestDeployment?.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [projects, q, statusFilter]);

  const filteredDeployments = useMemo(() => {
    if (!deployments) return [];
    return deployments.filter((d) => {
      const matchesQ =
        !q ||
        d.project.name.toLowerCase().includes(q.toLowerCase()) ||
        d.id.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [deployments, q, statusFilter]);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  if (projects === null) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-7 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="mt-2 h-4 w-64 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Every deployed app. Click a card to visit its live subdomain.
          </p>
        </div>
        <Link
          to="/deploy"
          className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          <span className="text-base leading-none">+</span> New project
        </Link>
      </motion.div>

      {/* tabs + search + filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/40">
          {(["projects", "deployments"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setView(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                view === t
                  ? "bg-zinc-900 text-white shadow dark:bg-white dark:text-black"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {t}
              <span className="ml-1.5 text-xs opacity-60">
                {t === "projects" ? (projects?.length ?? 0) : (deployments?.length ?? 0)}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={view === "projects" ? "Search projects…" : "Search deployments…"}
              className="w-56 rounded-full border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
          >
            <option value="ALL">All status</option>
            <option value="QUEUED">Queued</option>
            <option value="RUNNING">Running</option>
            <option value="DEPLOYED">Deployed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-300">
          {error} — <button onClick={fetchAll} className="underline">retry</button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === "projects" ? (
          <motion.div
            key="projects"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="mt-6"
          >
            {filteredProjects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/20">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">⬢</div>
                <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-white">
                  {projects.length === 0 ? "No projects yet" : "No matching projects"}
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
                  {projects.length === 0
                    ? "Deploy your first repo from GitHub — clone, build in Docker, and get a live subdomain in seconds."
                    : "Try a different search or status filter."}
                </p>
                {projects.length === 0 && (
                  <Link to="/deploy" className="mt-4 inline-flex rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black">
                    Deploy now →
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((p, i) => {
                  const s = p.latestDeployment?.status;
                  const live = s === "DEPLOYED";
                  const url = `http://${p.name}.localhost:3000`;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      whileHover={{ y: -2 }}
                      className="group relative flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40"
                    >
                      {/* top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-black">
                              {p.name.slice(0, 2).toUpperCase()}
                            </span>
                            <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-white" title={p.name}>
                              {p.name}
                            </h3>
                          </div>
                          <a
                            href={p.repo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 line-clamp-1 block truncate text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                            title={p.repo}
                          >
                            {p.repo.replace(/^https:\/\/github\.com\//, "")}
                          </a>
                        </div>
                        {s ? <StatusBadge status={s} /> : <span className="text-xs text-zinc-400">no deploys</span>}
                      </div>

                      {/* meta */}
                      <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 dark:border-zinc-800 dark:bg-zinc-800">
                          {p.totalDeployments} deploy{p.totalDeployments !== 1 ? "s" : ""}
                        </span>
                        {p.latestDeployment && (
                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] dark:border-zinc-800 dark:bg-zinc-800">
                            {p.latestDeployment.id.slice(0, 8)}
                          </span>
                        )}
                      </div>

                      {/* url row */}
                      <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
                        <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
                        <span className="flex-1 truncate font-mono text-xs text-zinc-600 dark:text-zinc-300" title={url}>
                          {p.name}.localhost:3000
                        </span>
                        <button
                          onClick={() => copy(url, p.id)}
                          className="rounded px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-white hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                          title="Copy URL"
                        >
                          {copied === p.id ? "copied" : "copy"}
                        </button>
                      </div>

                      {/* actions */}
                      <div className="mt-4 flex gap-2">
                        {live ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 rounded-full bg-zinc-900 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
                          >
                            Visit ↗
                          </a>
                        ) : (
                          <span className="flex-1 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-center text-xs font-medium text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-500">
                            Not live
                          </span>
                        )}
                        <a
                          href={p.repo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          GitHub
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="deployments"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/30"
          >
            {filteredDeployments.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No deployments found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Deployment</th>
                      <th className="px-4 py-2.5 font-medium">Project</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeployments.map((d) => (
                      <tr key={d.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                        <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-300">{d.id.slice(0, 12)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900 dark:text-white">{d.project.name}</div>
                          <div className="text-xs text-zinc-500">{d.project.repo.replace(/^https:\/\/github\.com\//, "")}</div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="px-4 py-3">
                          {d.status === "DEPLOYED" ? (
                            <a
                              href={`http://${d.project.name}.localhost:3000`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {d.project.name}.localhost:3000 ↗
                            </a>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
        Showing {view === "projects" ? filteredProjects.length : filteredDeployments.length} of{" "}
        {view === "projects" ? projects.length : (deployments?.length ?? 0)} • Auto-refreshes while building
      </p>
    </div>
  );
}
