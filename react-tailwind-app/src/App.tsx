import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MatchDetailsPage } from './pages/MatchDetailsPage';
import { MatchesListPage } from './pages/MatchesListPage';
import { AdminMatchesPage } from './pages/AdminMatchesPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminConfigPage } from './pages/AdminConfigPage';
import { StatsPage } from './pages/StatsPage';

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export type CurrentUser = {
  id: string;
  email: string;
  username: string;
  balanceCents: number;
  wins: number;
  losses: number;
  role: UserRole;
  createdAt: string;
};

function App() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const handleAuthSuccess = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleUserUpdate = () => {
    // Trigger re-fetch of user data by updating token (which triggers useEffect)
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      setToken(currentToken);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const baseUrl =
      import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

    if (!token) {
      setUser(null);
      setIsCheckingAuth(false);
      return;
    }

    const controller = new AbortController();

    const fetchMe = async () => {
      try {
        setIsCheckingAuth(true);
        const response = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          // токен недійсний або користувача немає — вважаємо, що не авторизований
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          return;
        }

        const data = (await response.json()) as { user: CurrentUser };
        setUser(data.user);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Failed to fetch /api/auth/me', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingAuth(false);
        }
      }
    };

    void fetchMe();

    return () => {
      controller.abort();
    };
  }, [token]);

  function RequireAuth({ children }: { children: JSX.Element }) {
    if (isCheckingAuth) {
      return (
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-950 px-4">
          <p className="text-sm text-slate-300">Завантаження...</p>
        </main>
      );
    }

    if (!token) {
      return <Navigate to="/login" replace />;
    }

    return children;
  }

  function RequireAdmin({ children }: { children: JSX.Element }) {
    if (isCheckingAuth) {
      return (
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-950 px-4">
          <p className="text-sm text-slate-300">Завантаження...</p>
        </main>
      );
    }

    if (!token) {
      return <Navigate to="/login" replace />;
    }

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  }

  function RequireSuperAdmin({ children }: { children: JSX.Element }) {
    if (isCheckingAuth) {
      return (
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-950 px-4">
          <p className="text-sm text-slate-300">Завантаження...</p>
        </main>
      );
    }

    if (!token) {
      return <Navigate to="/login" replace />;
    }

    if (!user || user.role !== 'SUPER_ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <Navbar isAuthenticated={!!token} user={user} onLogout={handleLogout} />
        <Routes>
          <Route
            path="/"
            element={
              <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
                <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-900/60 backdrop-blur">
                  <p className="text-sm text-slate-300">
                    Це стартова сторінка. Перейдіть до розділу{' '}
                    <span className="font-semibold text-sky-300">
                      Sign up
                    </span>{' '}
                    вгорі, щоб створити акаунт.
                  </p>
                </div>
              </main>
            }
          />
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={handleAuthSuccess} />}
          />
          <Route
            path="/register"
            element={<RegisterPage onRegisterSuccess={handleAuthSuccess} />}
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage token={token} user={user} onUserUpdate={handleUserUpdate} />
              </RequireAuth>
            }
          />
          <Route
            path="/matches"
            element={
              <RequireAuth>
                <MatchesListPage token={token} />
              </RequireAuth>
            }
          />
          <Route
            path="/stats"
            element={
              <RequireAuth>
                <StatsPage token={token} />
              </RequireAuth>
            }
          />
          <Route
            path="/matches/:id"
            element={
              <RequireAuth>
                <MatchDetailsPage token={token} user={user} onUserUpdate={handleUserUpdate} />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/matches"
            element={
              <RequireAdmin>
                <AdminMatchesPage token={token} user={user} />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireAdmin>
                <AdminUsersPage token={token} user={user} />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/config"
            element={
              <RequireAdmin>
                <AdminConfigPage token={token} user={user} />
              </RequireAdmin>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

