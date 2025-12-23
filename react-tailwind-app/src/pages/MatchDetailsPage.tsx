import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { CurrentUser } from '../App';

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

interface MatchDetailsPageProps {
  token: string | null;
  user: CurrentUser | null;
  onUserUpdate: () => void;
}

export function MatchDetailsPage({ token, user, onUserUpdate }: MatchDetailsPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  const [selectedResolveWinnerId, setSelectedResolveWinnerId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !token) return;

    const fetchMatch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
        const response = await fetch(`${baseUrl}/api/matches/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          setError(text || 'Помилка завантаження матчу');
          return;
        }

        const data = (await response.json()) as { match: Match };
        setMatch(data.match);
      } catch (err) {
        console.error(err);
        setError('Проблеми з мережею. Спробуй ще раз.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMatch();
  }, [id, token]);

  const handleJoin = async () => {
    if (!id || !token || isJoining) return;

    setIsJoining(true);
    setError(null);
    setSuccess(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/matches/${id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        let errorMsg = text || 'Не вдалося приєднатися до матчу.';
        
        if (text.includes('Insufficient balance') && user && match) {
          errorMsg = `Недостатньо балансу. Потрібно: ${(match.entryFeeCents / 100).toFixed(2)} $, у тебе: ${(user.balanceCents / 100).toFixed(2)} $`;
        }
        
        setError(errorMsg);
        return;
      }

      const data = (await response.json()) as { match: Match };
      setMatch(data.match);
      setSuccess('Ти успішно приєднався до матчу!');
      onUserUpdate(); // Refresh user data to update balance
    } catch (err) {
      console.error(err);
      setError('Проблеми з мережею. Спробуй ще раз.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleFinish = async () => {
    if (!id || !token || isFinishing || !selectedWinnerId) return;

    setIsFinishing(true);
    setError(null);
    setSuccess(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/matches/${id}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ winnerId: selectedWinnerId }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        setError(text || 'Не вдалося завершити матч.');
        return;
      }

      const data = (await response.json()) as { match: Match };
      setMatch(data.match);
      setSuccess('Матч успішно завершено! Приз виплачено переможцю.');
      onUserUpdate(); // Refresh user data to update wins/losses and balance
    } catch (err) {
      console.error(err);
      setError('Проблеми з мережею. Спробуй ще раз.');
    } finally {
      setIsFinishing(false);
    }
  };

  const handleDispute = async () => {
    if (!id || !token || isDisputing || isJoining || isFinishing) return;
    setIsDisputing(true);
    setError(null);
    setSuccess(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/matches/${id}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        setError(text || 'Не вдалося позначити матч як спірний.');
        return;
      }

      const data = (await response.json()) as { match: Match };
      setMatch(data.match);
      setSuccess('Матч позначено як спірний (dispute).');
    } catch (err) {
      console.error(err);
      setError('Проблеми з мережею. Спробуй ще раз.');
    } finally {
      setIsDisputing(false);
    }
  };

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

  const canJoin = match && 
    match.status === 'WAITING' && 
    user && 
    match.createdById !== user.id && 
    !match.joinedById;

  const canFinish = match && 
    user && 
    match.status === 'IN_PROGRESS' &&
    (match.createdById === user.id || match.joinedById === user.id) &&
    match.joinedById !== null; // Both players must be present

  const canDispute = match && 
    user && 
    (match.createdById === user.id || match.joinedById === user.id) &&
    match.status !== 'WAITING' &&
    match.status !== 'FINISHED';

  const canResolve = match && 
    user && 
    user.role === 'ADMIN' &&
    match.status === 'DISPUTE';

  const handleResolve = async () => {
    if (!id || !token || isResolving || !selectedResolveWinnerId) return;

    setIsResolving(true);
    setError(null);
    setSuccess(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/admin/matches/${id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ winnerId: selectedResolveWinnerId }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        setError(text || 'Не вдалося вирішити спір.');
        return;
      }

      const data = (await response.json()) as { match: Match };
      setMatch(data.match);
      setSuccess('Спір успішно вирішено! Приз виплачено переможцю.');
      onUserUpdate(); // Refresh user data
    } catch (err) {
      console.error(err);
      setError('Проблеми з мережею. Спробуй ще раз.');
    } finally {
      setIsResolving(false);
    }
  };

  // Set default winner selection when match loads
  useEffect(() => {
    if (match && canFinish && !selectedWinnerId) {
      // Default to current user if they're a participant
      if (match.createdById === user?.id) {
        setSelectedWinnerId(match.joinedById || match.createdById);
      } else if (match.joinedById === user?.id) {
        setSelectedWinnerId(match.createdById);
      }
    }
  }, [match, canFinish, user, selectedWinnerId]);

  // Set default winner selection for resolve
  useEffect(() => {
    if (match && canResolve && !selectedResolveWinnerId) {
      // Default to first participant
      if (match.createdById) {
        setSelectedResolveWinnerId(match.createdById);
      }
    }
  }, [match, canResolve, selectedResolveWinnerId]);

  if (!id) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
        <p className="text-sm text-rose-400">Match id is missing in URL.</p>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
        <p className="text-sm text-rose-400">
          Для доступу до деталей матчу потрібно увійти.
        </p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-sky-400"></div>
          <p className="mt-4 text-sm text-slate-300">Завантаження матчу...</p>
        </div>
      </main>
    );
  }

  if (error && !match) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
        <div className="w-full max-w-xl rounded-3xl border border-rose-800 bg-rose-900/20 p-6 text-center text-rose-400">
          {error}
        </div>
      </main>
    );
  }

  if (!match) {
    return null;
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4 py-8">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            {match.game}
          </h1>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(match.status)}`}>
            {getStatusLabel(match.status)}
          </span>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          <div>
            <span className="text-slate-400">Створено:</span>{' '}
            <span className="font-medium text-slate-200">{match.createdBy.username}</span>
          </div>
          {match.joinedBy && (
            <div>
              <span className="text-slate-400">Приєднався:</span>{' '}
              <span className="font-medium text-slate-200">{match.joinedBy.username}</span>
            </div>
          )}
          {match.winner && (
            <div>
              <span className="text-slate-400">Переможець:</span>{' '}
              <span className="font-medium text-emerald-300">{match.winner.username}</span>
            </div>
          )}
          <div>
            <span className="text-slate-400">Вхідний внесок:</span>{' '}
            <span className="font-medium text-sky-300">
              {match.entryFeeCents === 0 ? 'Безкоштовно' : `${(match.entryFeeCents / 100).toFixed(2)} $`}
            </span>
          </div>
          {match.status === 'FINISHED' && match.prizeCents !== null && (
            <>
              <div>
                <span className="text-slate-400">Приз:</span>{' '}
                <span className="font-medium text-emerald-300">
                  {(match.prizeCents / 100).toFixed(2)} $
                </span>
              </div>
              {match.commissionCents !== null && match.commissionCents > 0 && (
                <div>
                  <span className="text-slate-400">Комісія платформи:</span>{' '}
                  <span className="font-medium text-slate-400">
                    {(match.commissionCents / 100).toFixed(2)} $
                  </span>
                </div>
              )}
            </>
          )}
          <div>
            <span className="text-slate-400">Створено:</span>{' '}
            <span className="font-medium text-slate-200">
              {new Date(match.createdAt).toLocaleDateString('uk-UA', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-xs font-medium text-rose-400">{error}</p>
        )}

        {success && (
          <p className="mt-4 text-xs font-medium text-emerald-400">{success}</p>
        )}

        {canFinish && (
          <div className="mt-6 space-y-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Завершити матч
            </h3>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Оберіть переможця
              </label>
              <select
                value={selectedWinnerId}
                onChange={(e) => setSelectedWinnerId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                {match.createdBy && (
                  <option value={match.createdBy.id}>
                    {match.createdBy.username} (Створив матч)
                  </option>
                )}
                {match.joinedBy && (
                  <option value={match.joinedBy.id}>
                    {match.joinedBy.username} (Приєднався)
                  </option>
                )}
              </select>
            </div>
            <button
              type="button"
              onClick={handleFinish}
              disabled={isFinishing || !selectedWinnerId}
              className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isFinishing ? 'Завершуємо...' : 'Завершити матч та виплатити приз'}
            </button>
          </div>
        )}

        {canResolve && (
          <div className="mt-6 space-y-3 rounded-lg border border-purple-800 bg-purple-950/60 p-4">
            <h3 className="text-sm font-semibold text-purple-200">
              Вирішити спір (Адмін)
            </h3>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Оберіть переможця
              </label>
              <select
                value={selectedResolveWinnerId}
                onChange={(e) => setSelectedResolveWinnerId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                {match.createdBy && (
                  <option value={match.createdBy.id}>
                    {match.createdBy.username} (Створив матч)
                  </option>
                )}
                {match.joinedBy && (
                  <option value={match.joinedBy.id}>
                    {match.joinedBy.username} (Приєднався)
                  </option>
                )}
              </select>
            </div>
            <button
              type="button"
              onClick={handleResolve}
              disabled={isResolving || !selectedResolveWinnerId}
              className="w-full rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isResolving ? 'Вирішуємо...' : 'Вирішити спір та виплатити приз'}
            </button>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {canJoin && (
            <button
              type="button"
              onClick={handleJoin}
              disabled={isJoining || isFinishing}
              className="flex-1 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isJoining ? 'Приєднуюсь...' : 'Приєднатися до матчу'}
            </button>
          )}
          {canDispute && (
            <button
              type="button"
              onClick={handleDispute}
              disabled={isDisputing || isJoining || isFinishing}
              className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isDisputing ? 'Відправляємо...' : 'Позначити як спірний'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
