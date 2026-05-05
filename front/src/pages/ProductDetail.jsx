import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, BoxesIcon, Clock, ChevronRight,
  AlertTriangle, Loader2, Tag, Layers, Barcode
} from 'lucide-react';
import client from '../api/client';
import EmptyState from '../components/EmptyState';

const statusColors = {
  Disponible: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/20' },
  Cuarentena: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/20' },
  Vencido:    { bg: 'bg-danger/15',  text: 'text-danger',  border: 'border-danger/20' },
};

export default function ProductDetail() {
  const { sku } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await client.get(`/productos/${sku}`);
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al cargar el producto.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sku]);

  const formatDate = (d) =>
    !d ? 'N/A' : new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={48} className="mx-auto text-danger mb-4" />
        <h2 className="text-xl font-bold text-text mb-2">Error</h2>
        <p className="text-muted">{error || 'Producto no encontrado'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 px-4 py-2 bg-primary text-white rounded-lg font-medium"
        >
          Volver
        </button>
      </div>
    );
  }

  const { producto, lotes, total_lotes, stock_global } = data;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* ─── Back Button ─── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium text-muted hover:text-text transition-colors"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      {/* ─── Product Header ─── */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 shrink-0 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden">
            {producto.url_img ? (
              <img src={producto.url_img} alt={producto.nombre} className="w-full h-full object-cover" />
            ) : (
              <Package size={32} className="text-muted/40" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-text tracking-tight">{producto.nombre}</h1>
            {producto.descripcion && (
              <p className="text-sm text-muted mt-1 line-clamp-2">{producto.descripcion}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="flex items-center gap-1 px-2 py-0.5 bg-surface border border-border rounded-lg text-xs text-muted">
                <Tag size={11} /> {producto.marca}
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-surface border border-border rounded-lg text-xs text-muted">
                <Layers size={11} /> {producto.categoria}
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-surface border border-border rounded-lg text-xs font-mono text-muted">
                SKU: {producto.sku_id}
              </span>
              {producto.codigo_ean && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-surface border border-border rounded-lg text-xs font-mono text-muted">
                  <Barcode size={11} /> {producto.codigo_ean}
                </span>
              )}
              {producto.es_perecedero && (
                <span className="px-2 py-0.5 bg-warning/15 border border-warning/20 rounded-lg text-xs font-semibold text-warning">
                  Perecedero
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <BoxesIcon size={22} className="text-primary mx-auto mb-2" />
          <p className="text-3xl font-bold text-text">{total_lotes}</p>
          <p className="text-xs text-muted mt-1">Lotes activos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <Package size={22} className="text-success mx-auto mb-2" />
          <p className="text-3xl font-bold text-text">{stock_global}</p>
          <p className="text-xs text-muted mt-1">Unidades en inventario</p>
        </div>
      </div>

      {/* ─── Lotes List (FEFO) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">
            Lotes activos <span className="text-primary text-sm font-normal">(FEFO)</span>
          </h2>
          <p className="text-xs text-muted">{total_lotes} resultado{total_lotes !== 1 ? 's' : ''}</p>
        </div>

        {lotes.length > 0 ? (
          <div className="space-y-2">
            {lotes.map((lote) => {
              const colors = statusColors[lote.status] || statusColors.Disponible;
              const diasColor =
                lote.dias_para_caducar <= 3 ? 'text-danger' :
                lote.dias_para_caducar <= 7 ? 'text-warning' :
                'text-muted';

              return (
                <button
                  key={lote.id_lote}
                  onClick={() => navigate(`/lotes/${lote.id_lote}`)}
                  className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                      {lote.status}
                    </span>
                    <span className="text-[11px] text-muted font-mono">{lote.id_lote}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs">
                        <Package size={13} className="text-primary" />
                        <span className="text-text font-medium">{lote.stock_actual}</span>
                        <span className="text-muted">uds</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${diasColor}`}>
                        <Clock size={13} />
                        <span>{lote.dias_para_caducar > 0 ? `${lote.dias_para_caducar}d` : 'Vencido'}</span>
                      </div>
                      <span className="text-[11px] text-muted">Cad: {formatDate(lote.fecha_caducidad)}</span>
                    </div>
                    <ChevronRight size={16} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6">
            <EmptyState message="Este producto no tiene lotes activos en el sistema." />
          </div>
        )}
      </div>
    </div>
  );
}
