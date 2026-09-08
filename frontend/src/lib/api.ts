export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function getGoogleAuthUrl() {
  // Always use relative URL in browser - Vite proxy handles dev,
  // and same-origin prod serves frontend and backend together.
  // This hides http://localhost:3000/api/auth/google from address bar
  // (user reported seeing backend URL on signup click).
  // If VITE_API_URL is a different prod domain, override via absolute:
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  // force relative for dev to avoid backend-port flash
  if (!envUrl || envUrl.includes("localhost")) return "/api/auth/google";
  return `${API_URL}/api/auth/google`;
}

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error((data as any).error || (data as any).message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export const api = {
  register: (body: { email: string; password: string; name?: string }) =>
    request<{ user: any; token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ user: any; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => request<{ user: any }>("/api/auth/me"),
  deploy: (body: { github_url: string } | { repoUrl: string }) => {
    const payload =
      "github_url" in body ? body : { github_url: (body as any).repoUrl };
    return request<{ deploymentId: string; status: string; projectId: string }>(
      "/api/project/deploy",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },
  getDeploymentStatus: (deploymentId: string) =>
    request<{ deploymentId: string; projectId: string; status: string; project: { name: string; repo: string } }>(
      `/api/project/deployment/${deploymentId}`
    ),
  listDeployments: () =>
    request<{ deployments: Array<{ id: string; status: string; projectId: string; project: { name: string; repo: string } }> }>(
      "/api/project/deployments"
    ),
};
