import { ArrowDownUp, LogIn, AlertTriangle, ShoppingCart, ClipboardCheck } from 'lucide-react';

const iconByType = {
  'Entrada':      LogIn,
  'Salida':       ArrowDownUp,
  'Carga':        LogIn,
  'Merma':        AlertTriangle,
  'Venta':        ShoppingCart,
  'Ajuste':       ClipboardCheck,
};

function getIcon(tipo) {
  const key = Object.keys(iconByType).find((k) => tipo.toLowerCase().includes(k.toLowerCase()));
  return iconByType[key] || ClipboardCheck;
}

export default function Timeline({ events = [] }) {
  if (events.length === 0) {
    return <p className="text-muted text-sm text-center py-6">Sin movimientos registrados.</p>;
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

      {events.map((ev, i) => {
        const Icon = getIcon(ev.tipo);
        const isPositive = ev.factor > 0;

        return (
          <div key={ev.id_movimiento} className="relative pb-6 last:pb-0">
            {/* Node dot */}
            <div className={`absolute -left-6 top-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 ${
              isPositive
                ? 'bg-success/15 border-success/40'
                : 'bg-danger/15 border-danger/40'
            }`}>
              <Icon size={11} className={isPositive ? 'text-success' : 'text-danger'} />
            </div>

            {/* Content */}
            <div className="bg-card/50 border border-border/50 rounded-lg p-3 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-text">{ev.tipo}</span>
                <span className={`text-xs font-mono ${isPositive ? 'text-success' : 'text-danger'}`}>
                  {isPositive ? '+' : ''}{ev.qty_afectada}
                </span>
              </div>

              <p className="text-xs text-muted">
                {new Date(ev.fecha_hora).toLocaleString('es-MX', {
                  day: '2-digit', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>

              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-muted">
                  Realizado por: <span className="text-text">{ev.usuario || 'Sistema'}</span>
                </span>
                {ev.ubicacion?.nombre_area && (
                  <span className="text-primary/80">
                    {ev.ubicacion.nombre_area} · {ev.ubicacion.pasillo}/{ev.ubicacion.rack}/{ev.ubicacion.nivel}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
