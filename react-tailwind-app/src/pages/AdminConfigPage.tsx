import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../App';

interface PlatformConfig {
  id: number;
  defaultEntryFeeCents: number;
  commissionBps: number;
}

interface AdminConfigPageProps {
  token: string | null;
  user: { role: UserRole } | null;
}

export function AdminConfigPage({ token, user }: AdminConfigPageProps) {
  const navigate = useNavigate();
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [commissionBps, setCommissionBps] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
        const response = await fetch(`${baseUrl}/api/admin/config`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // If config doesn't exist, that's okay - we'll use defaults
          setIsLoading(false);
          return;
        }

        const data = (await response.json()) as { config: PlatformConfig };
        setConfig(data.config);
        setCommissionBps(data.config.commissionBps.toString());
      } catch (err) {
        console.error(err);
        // Don't show error, just use defaults
      } finally {
        setIsLoading(false);
      }
    };

    void fetchConfig();
  }, [token, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || isSaving) return;

    const commissionBpsNum = parseInt(commissionBps, 10);
    if (isNaN(commissionBpsNum) || commissionBpsNum < 0 || commissionBpsNum > 10000) {
      setError('Комісія повинна бути від 0 до 10000 базисних пунктів (0-100%)');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/api/admin/config/commission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ commissionBps: commissionBpsNum }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        setError(text || 'Не вдалося оновити комісію');
        return;
      }

      const data = (await response.json()) as { config: PlatformConfig };
      setConfig(data.config);
      setSuccess(`Комісію успішно оновлено до ${(data.config.commissionBps / 100).toFixed(2)}%`);
    } catch (err) {
      console.error(err);
      setError('Проблеми з мережею. Спробуй ще раз.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
        <p className="text-sm text-slate-300">Завантаження...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="mb-6 rounded-3xl border border-purple-800 bg-purple-900/20 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Адмін: Налаштування платформи
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Налаштування комісії платформи
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="commissionBps" className="block text-sm font-medium text-slate-200 mb-2">
                Комісія платформи (базисні пункти)
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  id="commissionBps"
                  min="0"
                  max="10000"
                  step="1"
                  value={commissionBps}
                  onChange={(e) => setCommissionBps(e.target.value)}
                  placeholder="500 (5%)"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  required
                />
                <p className="text-xs text-slate-400">
                  Введіть комісію в базисних пунктах (1 базисний пункт = 0.01%). 
                  Наприклад: 500 = 5%, 1000 = 10%, 2500 = 25%
                </p>
                {commissionBps && !isNaN(parseInt(commissionBps, 10)) && (
                  <p className="text-xs text-purple-300 font-medium">
                    Поточна комісія: {(parseInt(commissionBps, 10) / 100).toFixed(2)}%
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-800 bg-rose-900/20 p-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-emerald-800 bg-emerald-900/20 p-3 text-sm text-emerald-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving || !commissionBps}
              className="w-full rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Зберігаємо...' : 'Оновити комісію'}
            </button>
          </form>

          {config && (
            <div className="mt-6 rounded-lg border border-slate-700 bg-slate-950/60 p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">
                Поточні налаштування
              </h3>
              <div className="space-y-1 text-xs text-slate-300">
                <p>
                  Комісія:{' '}
                  <span className="font-medium text-purple-300">
                    {config.commissionBps} базисних пунктів ({(config.commissionBps / 100).toFixed(2)}%)
                  </span>
                </p>
                <p>
                  Вхідний внесок за замовчуванням:{' '}
                  <span className="font-medium text-sky-300">
                    {(config.defaultEntryFeeCents / 100).toFixed(2)} $
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

