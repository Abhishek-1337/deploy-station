const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
  if (!res.ok) throw new Error((data as any).error || `Request failed: ${res.status}`);
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
};
