import { useNavigate } from 'react-router-dom';
import { Pin, Layers } from 'lucide-react';
import { ALL_OPERATIONS, getOperationsForRoles } from '../config/operationsConfig';
import useConfigStore from '../store/useConfigStore';
import useAuthStore from '../store/useAuthStore';

/**
 * QuickAccessGrid — Renderiza las operaciones ancladas (pinned) en el Home.
 *
 * Lee pinnedIds del store → filtra ALL_OPERATIONS por pin + roles del usuario.
 * La personalización se hace desde Operaciones (botón Pin), no aquí.
 */
export default function QuickAccessGrid() {
  const { user } = useAuthStore();
  const { pinnedIds } = useConfigStore();
  const navigate = useNavigate();

  const userRoles = user?.roles ? user.roles.split(', ') : [];
  const available = getOperationsForRoles(userRoles);

  // Solo mostrar operaciones que estén ancladas Y disponibles para el rol
  const pinned = available.filter(op => pinnedIds.includes(op.id));

  if (pinned.length === 0) {
    return (
      <div>
        <h2 className="text-base font-semibold text-text mb-4">Accesos rápidos</h2>
        <button
          onClick={() => navigate('/operaciones')}
          className="w-full flex items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-border bg-card/50 text-muted hover:border-primary/30 hover:text-text transition-all"
        >
          <Layers size={18} />
          <span className="text-sm font-medium">Ancla operaciones desde el directorio</span>
        </button>
      </div>
    );
  }

  const roleColor = {
    Operativo: 'success',
    Táctico: 'primary',
    Auditor: 'warning',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text">Accesos rápidos</h2>
        <button
          onClick={() => navigate('/operaciones')}
          className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-text hover:bg-card px-3 py-1.5 rounded-lg transition-colors"
        >
          <Pin size={13} />
          Personalizar
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {pinned.map((op) => {
          const Icon = op.icon;
          const color = roleColor[op.role] || 'primary';
          return (
            <button
              key={op.id}
              onClick={() => navigate(op.to)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${color}/10`}>
                <Icon size={20} className={`text-${color}`} />
              </div>
              <span className="text-xs font-medium text-text text-center leading-tight">
                {op.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
