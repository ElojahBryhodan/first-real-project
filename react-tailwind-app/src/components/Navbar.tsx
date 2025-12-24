import { Link, useNavigate } from 'react-router-dom';
import type { UserRole } from '../App';

interface NavbarProps {
  isAuthenticated: boolean;
  user: { role: UserRole } | null;
  onLogout: () => void;
}

export function Navbar({ isAuthenticated, user, onLogout }: NavbarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          <span className="text-sm font-semibold tracking-tight text-slate-50">
            MyApp
          </span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {!isAuthenticated && (
            <>
              <Link
                to="/login"
                className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-400"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-sky-500/70 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200 transition hover:bg-sky-500/20"
              >
                Sign up
              </Link>
            </>
          )}
          {isAuthenticated && (
            <>
              <Link
                to="/matches"
                className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-400"
              >
                Матчі
              </Link>
              <Link
                to="/dashboard"
                className="rounded-full border border-emerald-500/70 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20"
              >
                Dashboard
              </Link>
              <Link
                to="/stats"
                className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-400"
              >
                Статистика
              </Link>
              {user?.role === 'ADMIN' && (
                <>
                  <Link
                    to="/admin/matches"
                    className="rounded-full border border-purple-500/70 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-200 transition hover:bg-purple-500/20"
                  >
                    Адмін: Матчі
                  </Link>
                  <Link
                    to="/admin/users"
                    className="rounded-full border border-purple-500/70 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-200 transition hover:bg-purple-500/20"
                  >
                    Адмін: Користувачі
                  </Link>
                  <Link
                    to="/admin/config"
                    className="rounded-full border border-purple-500/70 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-200 transition hover:bg-purple-500/20"
                  >
                    Адмін: Налаштування
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="rounded-full border border-rose-500/70 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
