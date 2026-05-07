import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useConfigStore from '../store/useConfigStore';
import { Layers, Pin, PinOff } from 'lucide-react';
import { getGroupedByRole, ROLE_SECTIONS } from '../config/operationsConfig';

export default function Operations() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { pinnedIds, togglePin, isPinned } = useConfigStore();
  
  const roles = user?.roles ? user.roles.split(', ') : [];
  const groupedOps = getGroupedByRole(roles);
  const roleKeys = Object.keys(groupedOps);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center">
          <Layers size={20} className="text-text" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Directorio de Operaciones</h1>
          <p className="text-sm text-muted">Acceso centralizado a las funciones de tu rol</p>
        </div>
      </div>

      {roleKeys.length === 0 ? (
        <div className="p-8 text-center bg-card border border-border rounded-xl">
          <p className="text-muted">No tienes roles asignados para ver operaciones.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roleKeys.map((role) => {
            const section = ROLE_SECTIONS[role] || { title: role, description: '', color: 'primary' };
            const ops = groupedOps[role];

            return (
              <div key={role} className="flex flex-col gap-3">
                <div className="mb-2">
                  <h2 className={`text-sm font-bold uppercase tracking-wider text-${section.color}`}>
                    {section.title}
                  </h2>
                  <p className="text-xs text-muted mt-0.5">{section.description}</p>
                </div>

                {ops.map((op) => {
                  const Icon = op.icon;
                  const pinned = isPinned(op.id);
                  
                  return (
                    <div 
                      key={op.id}
                      className={`group w-full flex items-center gap-3 p-3 rounded-xl bg-card border transition-all ${
                        pinned ? `border-${section.color}/50 shadow-sm` : 'border-border hover:border-text/30'
                      }`}
                    >
                      <button
                        onClick={() => navigate(op.to)}
                        className="flex-1 flex items-center gap-4 text-left"
                      >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-surface border border-border transition-colors group-hover:bg-${section.color}/10`}>
                          <Icon size={24} className={`text-muted transition-colors group-hover:text-${section.color}`} />
                        </div>
                        <span className="text-sm font-semibold text-text leading-tight group-hover:text-text">
                          {op.label}
                        </span>
                      </button>
                      
                      {/* Botón Pin */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(op.id);
                        }}
                        className={`p-2.5 rounded-lg transition-colors ${
                          pinned 
                            ? `text-${section.color} bg-${section.color}/15 hover:bg-${section.color}/25` 
                            : 'text-muted hover:text-text hover:bg-surface'
                        }`}
                        title={pinned ? "Desanclar del inicio" : "Anclar al inicio"}
                      >
                        {pinned ? <Pin size={18} className="fill-current" /> : <PinOff size={18} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
