import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CurrentUser } from '../App';

interface DashboardPageProps {
  token: string | null;
  user: CurrentUser | null;
  onUserUpdate: () => void;
}

export function DashboardPage({ token, user, onUserUpdate }: DashboardPageProps) {
  const navigate = useNavigate();
  const [game, setGame] = useState('');
  const [entryFeeCents, setEntryFeeCents] = useState<number | ''>('');
  const [isFreeMatch, setIsFreeMatch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateMatch = async (event: FormEvent) => {
    event.preventDefault();
    if (isLoading || !token) return;

    if (!game.trim()) {
      setError('Введіть назву гри');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
      const body: { game: string; entryFeeCents?: number } = { game: game.trim() };
      
      // If free match checkbox is checked, explicitly set entryFeeCents to 0
      if (isFreeMatch) {
        body.entryFeeCents = 0;
      } else if (entryFeeCents !== '' && entryFeeCents > 0) {
        body.entryFeeCents = entryFeeCents;
      }

      const response = await fetch(`${baseUrl}/api/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        let errorMsg = text || 'Помилка створення матчу';
        
        // Better error message for insufficient balance
        if (text.includes('Insufficient balance') && user) {
          const requiredFee = entryFeeCents !== '' && entryFeeCents > 0 
            ? entryFeeCents 
            : 500; // default from backend
          errorMsg = `Недостатньо балансу. Потрібно: ${(requiredFee / 100).toFixed(2)} $, у тебе: ${(user.balanceCents / 100).toFixed(2)} $`;
        }
        
        setError(errorMsg);
        return;
      }

      const data = (await response.json()) as { match?: { id: string } };
      if (data.match?.id) {
        onUserUpdate(); // Refresh user data to update balance
        navigate(`/matches/${data.match.id}`);
      }
    } catch (err) {
      console.error(err);
      setError('Проблеми з мережею. Спробуй ще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4 py-8">
      <div className="w-full max-w-xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Вітаю, ти успішно увійшов у систему.
          </p>

          {user && (
            <div className="mt-4 grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Баланс
                </span>
                <span className="text-lg font-semibold text-emerald-400">
                  {(user.balanceCents / 100).toFixed(2)} $
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Перемоги</span>
                <span className="font-semibold text-emerald-300">
                  {user.wins}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Поразки</span>
                <span className="font-semibold text-rose-300">
                  {user.losses}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-50">
            Створити матч
          </h2>
          <form onSubmit={handleCreateMatch} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-200">
                Назва гри
              </label>
              <input
                type="text"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder="Наприклад: Chess, Checkers"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFreeMatch}
                  onChange={(e) => {
                    setIsFreeMatch(e.target.checked);
                    if (e.target.checked) {
                      setEntryFeeCents('');
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                <span className="text-xs font-medium text-slate-200">
                  Безкоштовний матч (без вхідного внеску)
                </span>
              </label>
              
              {!isFreeMatch && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-200">
                    Вхідний внесок (копійки, опціонально)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={entryFeeCents}
                    onChange={(e) =>
                      setEntryFeeCents(
                        e.target.value === '' ? '' : parseInt(e.target.value, 10)
                      )
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    placeholder="Залиш порожнім для значення за замовчуванням (500 копійок)"
                  />
                  <p className="text-xs text-slate-400">
                    Залиш порожнім для значення за замовчуванням (5$).
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? 'Створюємо...' : 'Створити матч'}
            </button>
          </form>
        </div>

        {token && (
          <p className="break-all rounded-lg bg-slate-950/60 p-3 text-[10px] text-slate-500">
            <span className="font-semibold text-slate-300">JWT:</span> {token}
          </p>
        )}
      </div>
    </main>
  );
}
