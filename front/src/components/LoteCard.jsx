import { useNavigate } from 'react-router-dom';
import { Package, Clock, ChevronRight } from 'lucide-react';

const statusColors = {
  Disponible: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/20' },
  Cuarentena: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/20' },
  Vencido:    { bg: 'bg-danger/15',  text: 'text-danger',  border: 'border-danger/20' },
};

export default function LoteCard({ lote }) {
  const navigate = useNavigate();
  const colors = statusColors[lote.status] || statusColors.Disponible;

  const fechaCad = new Date(lote.fecha_caducidad);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diasRestantes = Math.ceil((fechaCad - hoy) / (1000 * 60 * 60 * 24));

  const diasColor =
    diasRestantes <= 3 ? 'text-danger' :
    diasRestantes <= 7 ? 'text-warning' :
    'text-muted';

  return (
    <button
      onClick={() => navigate(`/lotes/${lote.id_lote}`)}
      className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
          {lote.status}
        </span>
        <span className="text-[11px] text-muted font-mono">{lote.id_lote}</span>
      </div>

      {/* Product */}
      <h3 className="font-semibold text-sm text-text leading-tight mb-0.5">
        {lote.producto?.nombre || 'Producto'}
      </h3>
      <p className="text-xs text-muted mb-3">
        {lote.producto?.marca} · {lote.sku_id}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <Package size={13} className="text-primary" />
            <span className="text-text font-medium">{lote.stock_actual ?? 0}</span>
            <span className="text-muted">uds</span>
          </div>
          <div className={`flex items-center gap-1 text-xs ${diasColor}`}>
            <Clock size={13} />
            <span>{diasRestantes > 0 ? `${diasRestantes}d` : 'Vencido'}</span>
          </div>
        </div>
        <ChevronRight size={16} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}
