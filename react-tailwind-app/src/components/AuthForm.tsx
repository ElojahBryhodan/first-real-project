import { FormEvent, useState } from 'react';

export type AuthMode = 'register' | 'login';

interface AuthFormProps {
  mode: AuthMode;
  onSuccess: (token: string) => void;
}

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submitLabel = mode === 'register' ? 'Зареєструватися' : 'Увійти';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isLoading) return;

    if (!email || !password) {
      setError('Будь ласка, заповни email і пароль.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const baseUrl =
        import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
      const path =
        mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        if (response.status === 409 && mode === 'register') {
          setError('Користувач з таким email вже існує.');
          return;
        }

        const text = await response.text().catch(() => '');
        setError(text || 'Сталася помилка. Спробуй ще раз.');
        return;
      }

      const data = (await response.json()) as { token?: string };

      if (!data.token) {
        setError('Сервер не повернув токен.');
        return;
      }

      localStorage.setItem('token', data.token);
      onSuccess(data.token);
    } catch (err) {
      console.error(err);
      setError('Проблеми з мережею. Перевір з’єднання і спробуй ще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-200">
          Email
        </label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-200">
          Пароль
        </label>
        <input
          type="password"
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          placeholder="Мінімум 6 символів"
          required
        />
      </div>

      {error && (
        <p className="text-xs font-medium text-rose-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? 'Зачекай...' : submitLabel}
      </button>
    </form>
  );
}
