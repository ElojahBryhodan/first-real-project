import { useEffect, useState } from 'react';

interface Stats {
  totalMatches: number;
  totalVolumeCents: number;
  finishedMatches: number;
}

interface StatsPageProps {
  token: string | null;
}

export function StatsPage({ token }: StatsPageProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
        const response = await fetch(`${baseUrl}/api/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          let errorMsg = 'Помилка завантаження статистики';
          try {
            const text = await response.text();
            if (text) {
              try {
                const errorData = JSON.parse(text);
                errorMsg = errorData.error || errorMsg;
              } catch {
                errorMsg = text;
              }
            }
          } catch {
            // Use default error message
          }
          setError(errorMsg);
          return;
        }

        const data = (await response.json()) as { totalMatches: number; totalVolumeCents: number; finishedMatches: number };
        setStats(data);
      } catch (err) {
        console.error(err);
        setError('Проблеми з мережею. Перевірте з\'єднання та спробуйте ще раз.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStats();
  }, [token]);

  if (isLoading) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-sky-400"></div>
          <p className="mt-4 text-sm text-slate-300">Завантаження статистики...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
        <div className="w-full max-w-xl rounded-3xl border border-rose-800 bg-rose-900/20 p-6">
          <div className="flex items-start gap-3">
            <span className="text-rose-400 text-xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-rose-300 mb-1">Помилка завантаження</h3>
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Статистика платформи
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Загальна інформація про матчі та обсяги
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-2 text-sm text-slate-400">Всього матчів</div>
            <div className="text-3xl font-bold text-slate-50">{stats.totalMatches}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-2 text-sm text-slate-400">Завершено матчів</div>
            <div className="text-3xl font-bold text-emerald-400">{stats.finishedMatches}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-2 text-sm text-slate-400">Загальний обсяг</div>
            <div className="text-3xl font-bold text-sky-400">
              {(stats.totalVolumeCents / 100).toFixed(2)} $
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

