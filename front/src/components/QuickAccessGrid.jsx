import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight, Package, PackagePlus, AlertTriangle,
  Settings, FileBarChart, ClipboardCheck, Pencil, RotateCcw, GripVertical,
} from 'lucide-react';
import useConfigStore from '../store/useConfigStore';
import useAuthStore from '../store/useAuthStore';

const iconMap = {
  ArrowLeftRight, Package, PackagePlus, AlertTriangle,
  Settings, FileBarChart, ClipboardCheck,
};

export default function QuickAccessGrid() {
  const { user } = useAuthStore();
  const { getShortcuts, updateShortcuts, resetShortcuts } = useConfigStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const idRol = user?.id_rol || 1;
  const shortcuts = getShortcuts(idRol);

  const toggleVisibility = (id) => {
    const updated = shortcuts.map((s) =>
      s.id === id ? { ...s, hidden: !s.hidden } : s
    );
    updateShortcuts(updated, idRol);
  };

  const handleReset = () => {
    resetShortcuts(idRol);
    setEditing(false);
  };

  const visibleShortcuts = editing ? shortcuts : shortcuts.filter((s) => !s.hidden);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text">Accesos rápidos</h2>
        <button
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            editing
              ? 'bg-primary/15 text-primary'
              : 'text-muted hover:text-text hover:bg-card'
          }`}
        >
          <Pencil size={13} />
          {editing ? 'Listo' : 'Editar'}
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {visibleShortcuts.map((shortcut) => {
          const Icon = iconMap[shortcut.icon] || Package;
          const isHidden = shortcut.hidden;
          return (
            <button
              key={shortcut.id}
              onClick={() => {
                if (editing) {
                  toggleVisibility(shortcut.id);
                } else {
                  navigate(shortcut.path);
                }
              }}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                editing && isHidden
                  ? 'border-danger/30 bg-danger/5 opacity-50'
                  : 'border-border bg-card hover:border-primary/30 hover:bg-card/80'
              }`}
            >
              {editing && (
                <GripVertical size={14} className="absolute top-2 right-2 text-muted/40" />
              )}
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isHidden ? 'bg-danger/10' : 'bg-primary/10'
                }`}
              >
                <Icon size={20} className={isHidden ? 'text-danger/60' : 'text-primary'} />
              </div>
              <span className="text-xs font-medium text-text text-center leading-tight">
                {shortcut.label}
              </span>
            </button>
          );
        })}
      </div>

      {editing && (
        <button
          onClick={handleReset}
          className="mt-3 flex items-center gap-1.5 text-xs text-muted hover:text-warning mx-auto"
        >
          <RotateCcw size={12} />
          Restaurar valores por defecto
        </button>
      )}
    </div>
  );
}
