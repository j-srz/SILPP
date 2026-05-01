import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-bg">
      <div className="text-center">
        <p className="text-7xl font-extrabold text-primary/20">404</p>
        <h1 className="text-xl font-bold text-text mt-4">Página no encontrada</h1>
        <p className="text-sm text-muted mt-2">La ruta que buscas no existe en SILPP.</p>
        <button
          onClick={() => navigate('/home')}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-colors"
        >
          <Home size={16} />
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
