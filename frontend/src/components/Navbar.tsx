import { Link, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../lib/api";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const navigate = useNavigate();
  const isAuthed = !!getToken();
  const { theme, toggle } = useTheme();

  function logout() {
    clearToken();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900 dark:text-white">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-zinc-900 text-sm font-black text-white dark:bg-white dark:text-black">▲</span>
          Deploy Station
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          {isAuthed ? (
            <>
              <Link to="/deploy" className="rounded-full bg-zinc-900 px-4 py-1.5 font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                Deploy
              </Link>
              <button onClick={logout} className="rounded-full border border-zinc-200 px-4 py-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">Log in</Link>
              <Link to="/register" className="rounded-full bg-zinc-900 px-4 py-1.5 font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
