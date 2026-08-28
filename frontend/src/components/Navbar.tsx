import { Link, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../lib/api";

export default function Navbar() {
  const navigate = useNavigate();
  const isAuthed = !!getToken();

  function logout() {
    clearToken();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-black/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-white text-sm font-black text-black">▲</span>
          Deploy Station
        </Link>
        <div className="flex items-center gap-2 text-sm">
          {isAuthed ? (
            <>
              <Link to="/deploy" className="rounded-full bg-white px-4 py-1.5 font-medium text-black hover:bg-zinc-200">
                Deploy
              </Link>
              <button onClick={logout} className="rounded-full border border-zinc-800 px-4 py-1.5 text-zinc-300 hover:bg-zinc-900">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1.5 text-zinc-400 hover:text-white">Log in</Link>
              <Link to="/register" className="rounded-full bg-white px-4 py-1.5 font-medium text-black hover:bg-zinc-200">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
