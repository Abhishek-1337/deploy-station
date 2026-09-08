import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "../lib/api";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const err = searchParams.get("error");

    if (err) {
      setError(decodeURIComponent(err));
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    if (token) {
      setToken(token);
      navigate("/deploy", { replace: true });
    } else {
      setError("No token received from Google");
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
        <p className="mt-4 text-sm text-zinc-500">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white" />
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Completing Google sign-in...</p>
    </div>
  );
}
