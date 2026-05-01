import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { User, LogIn, Loader2 } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Login() {
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/home" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!userId.trim()) {
      setError('Ingresa tu ID de usuario.');
      return;
    }

    setLoading(true);
    try {
      await login(Number(userId));
      navigate('/home', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al iniciar sesión.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-bg">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-sm">
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-extrabold text-xl">SP</span>
            </div>
            <h1 className="text-2xl font-bold text-text">Login</h1>
            <p className="text-sm text-muted mt-1">Sistema de Inventario SILPP</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label htmlFor="login-user" className="block text-xs font-medium text-muted mb-1.5">
                Username
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="login-user"
                  type="number"
                  placeholder="Ej: 5"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-border text-text text-sm placeholder:text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition"
                  autoFocus
                  min="1"
                />
              </div>
            </div>

            {/* Password Field (visual only — no JWT yet) */}
            <div>
              <label htmlFor="login-pass" className="block text-xs font-medium text-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input
                  id="login-pass"
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-border text-text text-sm placeholder:text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition"
                  disabled
                  title="Autenticación por contraseña disponible en fase futura"
                />
              </div>
              <p className="text-[10px] text-muted/50 mt-1">Fase futura — solo se usa el ID de usuario</p>
            </div>

            {/* Error */}
            {error && (
              <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted/60 mt-6">
            ¿No tienes una cuenta?{' '}
            <span className="text-primary/80 hover:text-primary cursor-pointer">
              Click aquí
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
