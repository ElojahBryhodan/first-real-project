import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { UserRole } from '../App';

interface Match {
  id: string;
  game: string;
  entryFeeCents: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'DISPUTE';
  createdAt: string;
  prizeCents: number | null;
  commissionCents: number | null;
  createdBy: {
    id: string;
    username: string;
    email: string;
  };
  joinedBy: {
    id: string;
    username: string;
    email: string;
  } | null;
  winner: {
    id: string;
    username: string;
  } | null;
}

interface AdminMatchesPageProps {
  token: string | null;
  user: { role: UserRole } | null;
}

export function AdminMatchesPage({ token, user }: AdminMatchesPageProps) {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
        const response = await fetch(`${baseUrl}/api/admin/matches`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          setError(text || 'Помилка завантаження матчів');
          return;
        }

        const data = (await response.json()) as { matches: Match[] };
        setMatches(data.matches || []);
      } catch (err) {
        console.error(err);
        setError('Проблеми з мережею. Спробуй ще раз.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMatches();
  }, [token, user, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING':
        return 'text-yellow-400';
      case 'IN_PROGRESS':
        return 'text-blue-400';
      case 'FINISHED':
        return 'text-emerald-400';
      case 'DISPUTE':
        return 'text-rose-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'WAITING':
        return 'Очікування';
      case 'IN_PROGRESS':
        return 'В процесі';
      case 'FINISHED':
        return 'Завершено';
      case 'DISPUTE':
        return 'Спірний';
      default:
        return status;
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="mb-6 rounded-3xl border border-purple-800 bg-purple-900/20 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Адмін: Список матчів
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Всі матчі платформи
          </p>
        </div>

        {isLoading && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-purple-400"></div>
            <p className="mt-4 text-sm text-slate-300">Завантаження матчів...</p>
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

        {!isLoading && !error && matches.length === 0 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Немає матчів</h3>
            <p className="text-sm text-slate-400">Поки що на платформі немає матчів</p>
          </div>
        )}

        {!isLoading && !error && matches.length > 0 && (
          <div className="space-y-4">
            {matches.map((match) => (
              <Link
                key={match.id}
                to={`/matches/${match.id}`}
                className="block rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-purple-500/60 hover:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-50">
                        {match.game}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(match.status)}`}
                      >
                        {getStatusLabel(match.status)}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-300">
                      <p>
                        Створено:{' '}
                        <span className="font-medium text-slate-200">
                          {match.createdBy.username}
                        </span>
                        {' '}({match.createdBy.email})
                      </p>
                      {match.joinedBy && (
                        <p>
                          Приєднався:{' '}
                          <span className="font-medium text-slate-200">
                            {match.joinedBy.username}
                          </span>
                          {' '}({match.joinedBy.email})
                        </p>
                      )}
                      {match.winner && (
                        <p>
                          Переможець:{' '}
                          <span className="font-medium text-emerald-300">
                            {match.winner.username}
                          </span>
                        </p>
                      )}
                      <p>
                        Вхідний внесок:{' '}
                        <span className="font-medium text-sky-300">
                          {(match.entryFeeCents / 100).toFixed(2)} $
                        </span>
                      </p>
                      {match.status === 'FINISHED' && match.prizeCents !== null && (
                        <>
                          <p>
                            Приз:{' '}
                            <span className="font-medium text-emerald-300">
                              {(match.prizeCents / 100).toFixed(2)} $
                            </span>
                          </p>
                          {match.commissionCents !== null && match.commissionCents > 0 && (
                            <p>
                              Комісія:{' '}
                              <span className="font-medium text-slate-400">
                                {(match.commissionCents / 100).toFixed(2)} $
                              </span>
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(match.createdAt).toLocaleDateString('uk-UA', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

