import useAuthStore from '../store/useAuthStore';
import EmptyState from '../components/EmptyState';
import QuickAccessGrid from '../components/QuickAccessGrid';
import { CalendarDays, Activity } from 'lucide-react';

export default function Home() {
  const { user } = useAuthStore();

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const roleColors = {
    'Operativo': 'bg-success/15 text-success border-success/20',
    'Táctico': 'bg-primary/15 text-primary border-primary/20',
    'Auditor': 'bg-warning/15 text-warning border-warning/20'
  };

  const userRoles = user?.roles ? user.roles.split(', ') : [];

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text">
            Hola, {user?.nombre?.split(' ')[0]} 👋
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <CalendarDays size={14} className="text-muted" />
            <span className="text-xs text-muted capitalize">{today}</span>
          </div>
        </div>
        <div className="self-start flex flex-wrap gap-2">
          {userRoles.map(role => (
            <span
              key={role}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                roleColors[role] || 'bg-surface text-muted border-border'
              }`}
            >
              <Activity size={12} />
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Tareas en curso ─── */}
      <section>
        <h2 className="text-base font-semibold text-text mb-4">Tareas en curso</h2>
        <div className="bg-card/50 border border-border rounded-xl">
          <EmptyState />
        </div>
      </section>

      {/* ─── Accesos Rápidos ─── */}
      <section>
        <QuickAccessGrid />
      </section>
    </div>
  );
}
