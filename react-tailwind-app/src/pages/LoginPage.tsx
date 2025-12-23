import { useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const navigate = useNavigate();

  const handleSuccess = (token: string) => {
    onLoginSuccess(token);
    navigate('/dashboard');
  };

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-50">
          Вхід
        </h1>
        <p className="mb-6 text-sm text-slate-300">
          Увійди за допомогою email та пароля.
        </p>
        <AuthForm mode="login" onSuccess={handleSuccess} />
      </div>
    </main>
  );
}


