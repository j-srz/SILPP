import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { 
  LogIn, ArrowUpRight, AlertTriangle, Trash2, ArrowLeftRight, Undo2,
  BellRing, Lock, Unlock, Settings, CalendarCheck,
  ClipboardList, History, FileText, Users,
  Layers
} from 'lucide-react';

export default function Operations() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const roles = user?.roles ? user.roles.split(', ') : [];

  const sections = [];

  // A. Gestión de Almacén (Operativo)
  if (roles.includes('Operativo')) {
    sections.push({
      title: 'Gestión de Almacén',
      description: 'Operaciones físicas y movimiento de inventario',
      roleColorText: 'text-success',
      roleColorBorderHover: 'hover:border-success/50',
      roleColorBgHover: 'group-hover:bg-success/10',
      roleColorIconHover: 'group-hover:text-success',
      buttons: [
        { label: 'Ingreso de Lote', icon: LogIn, to: '/ingresar' },
        { label: 'Salida a Exhibición', icon: ArrowUpRight, to: '/salida' },
        { label: 'Reporte de Merma', icon: AlertTriangle, to: '/merma' },
        { label: 'Baja por Caducidad', icon: Trash2, to: '/baja-caducidad' },
        { label: 'Reubicación Interna', icon: ArrowLeftRight, to: '/reubicar' },
        { label: 'Rechazo en Recepción', icon: Undo2, to: '/rechazo' },
      ]
    });
  }

  // B. Supervisión y Control (Táctico)
  if (roles.includes('Táctico')) {
    sections.push({
      title: 'Supervisión y Control',
      description: 'Gestión de estados, alertas y configuraciones',
      roleColorText: 'text-primary',
      roleColorBorderHover: 'hover:border-primary/50',
      roleColorBgHover: 'group-hover:bg-primary/10',
      roleColorIconHover: 'group-hover:text-primary',
      buttons: [
        { label: 'Panel de Alertas', icon: BellRing, to: '/alertas' },
        { label: 'Bloqueo de Lote', icon: Lock, to: '/bloqueo' },
        { label: 'Desbloqueo de Lote', icon: Unlock, to: '/desbloqueo' },
        { label: 'Ajustar Algoritmo', icon: Settings, to: '/algoritmo' },
        { label: 'Cierre Mensual', icon: CalendarCheck, to: '/cierre' },
      ]
    });
  }

  // C. Auditoría y Trazabilidad (Auditor)
  if (roles.includes('Auditor')) {
    sections.push({
      title: 'Auditoría y Trazabilidad',
      description: 'Revisión histórica, reportes y control de acceso',
      roleColorText: 'text-warning',
      roleColorBorderHover: 'hover:border-warning/50',
      roleColorBgHover: 'group-hover:bg-warning/10',
      roleColorIconHover: 'group-hover:text-warning',
      buttons: [
        { label: 'Auditoría Cíclica', icon: ClipboardList, to: '/auditoria' },
        { label: 'Trazabilidad Total', icon: History, to: '/trazabilidad-global' },
        { label: 'Reporte Diario', icon: FileText, to: '/reporte-diario' },
        { label: 'Gestión de Usuarios', icon: Users, to: '/usuarios' },
      ]
    });
  }

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

      {sections.length === 0 ? (
        <div className="p-8 text-center bg-card border border-border rounded-xl">
          <p className="text-muted">No tienes roles asignados para ver operaciones.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((sec, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="mb-2">
                <h2 className={`text-sm font-bold uppercase tracking-wider ${sec.roleColorText}`}>
                  {sec.title}
                </h2>
                <p className="text-xs text-muted mt-0.5">{sec.description}</p>
              </div>

              {sec.buttons.map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.label}
                    onClick={() => navigate(btn.to)}
                    className={`group w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border transition-all ${sec.roleColorBorderHover}`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-surface border border-border transition-colors ${sec.roleColorBgHover}`}>
                      <Icon size={24} className={`text-muted transition-colors ${sec.roleColorIconHover}`} />
                    </div>
                    <span className="text-sm font-semibold text-text text-left leading-tight group-hover:text-text">
                      {btn.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
