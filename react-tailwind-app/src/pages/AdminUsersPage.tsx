import { useEffect, useState } from 'react';
import type { UserRole } from '../App';

interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

interface AdminUsersPageProps {
  token: string | null;
  user: { role: UserRole } | null;
}

export function AdminUsersPage({ token, user }: AdminUsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!token) return;

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
        const response = await fetch(`${baseUrl}/api/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          setError(text || 'Помилка завантаження користувачів');
          return;
        }

        const data = (await response.json()) as { users: User[] };
        setUsers(data.users || []);
      } catch (err) {
        console.error(err);
        setError('Проблеми з мережею. Спробуй ще раз.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUsers();
  }, [token]);

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    if (!token) return;

    setUpdatingUserId(userId);
    setError(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/super-admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Помилка зміни ролі' }));
        setError(data.error || 'Помилка зміни ролі');
        return;
      }

      // Refresh users list
      const usersResponse = await fetch(`${baseUrl}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (usersResponse.ok) {
        const usersData = (await usersResponse.json()) as { users: User[] };
        setUsers(usersData.users || []);
      }
    } catch (err) {
      console.error(err);
      setError('Проблеми з мережею. Спробуй ще раз.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'text-amber-400';
      case 'ADMIN':
        return 'text-purple-400';
      case 'USER':
        return 'text-slate-400';
      default:
        return 'text-slate-400';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Супер Адмін';
      case 'ADMIN':
        return 'Адмін';
      case 'USER':
        return 'Користувач';
      default:
        return role;
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className={`mb-6 rounded-3xl border p-6 shadow-2xl shadow-slate-950/60 backdrop-blur ${
          isSuperAdmin 
            ? 'border-amber-800 bg-amber-900/20' 
            : 'border-purple-800 bg-purple-900/20'
        }`}>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            {isSuperAdmin ? 'Супер Адмін: Управління користувачами' : 'Адмін: Список користувачів'}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {isSuperAdmin 
              ? 'Управління ролями користувачів (підвищення до адміна, пониження до користувача)'
              : 'Всі користувачі платформи'}
          </p>
        </div>

        {isLoading && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-purple-400"></div>
            <p className="mt-4 text-sm text-slate-300">Завантаження користувачів...</p>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-rose-800 bg-rose-900/20 p-6">
            <div className="flex items-start gap-3">
              <span className="text-rose-400 text-xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-rose-300 mb-1">Помилка завантаження</h3>
                <p className="text-sm text-rose-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && users.length === 0 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Немає користувачів</h3>
            <p className="text-sm text-slate-400">Поки що на платформі немає користувачів</p>
          </div>
        )}

        {!isLoading && !error && users.length > 0 && (
          <div className="space-y-4">
            {users.map((userItem) => {
              const isUpdating = updatingUserId === userItem.id;
              const canPromote = isSuperAdmin && userItem.role === 'USER';
              const canDemote = isSuperAdmin && userItem.role === 'ADMIN';
              const isSuperAdminUser = userItem.role === 'SUPER_ADMIN';

              return (
              <div
                  key={userItem.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-50">
                          {userItem.username}
                      </h3>
                      <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColor(userItem.role)}`}
                      >
                          {getRoleLabel(userItem.role)}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-300">
                      <p>
                        Email:{' '}
                        <span className="font-medium text-slate-200">
                            {userItem.email}
                        </span>
                      </p>
                      <p>
                        ID:{' '}
                        <span className="font-mono text-xs text-slate-400">
                            {userItem.id}
                        </span>
                      </p>
                    </div>
                  </div>
                    <div className="flex flex-col items-end gap-2">
                  <div className="text-xs text-slate-400">
                        {new Date(userItem.createdAt).toLocaleDateString('uk-UA', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                      </div>
                      {isSuperAdmin && !isSuperAdminUser && (
                        <div className="flex gap-2">
                          {canPromote && (
                            <button
                              onClick={() => handleRoleChange(userItem.id, 'ADMIN')}
                              disabled={isUpdating}
                              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isUpdating ? '...' : 'Підвищити до Адміна'}
                            </button>
                          )}
                          {canDemote && (
                            <button
                              onClick={() => handleRoleChange(userItem.id, 'USER')}
                              disabled={isUpdating}
                              className="rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isUpdating ? '...' : 'Понизити до Користувача'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

