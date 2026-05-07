import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, AlertTriangle, Package, Loader2 } from 'lucide-react';
import client from '../api/client';
import Timeline from '../components/Timeline';

export default function LoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lote, setLote] = useState(null);
  const [trazabilidad, setTrazabilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [loteRes, trazRes] = await Promise.all([
          client.get(`/lotes/${id}`),
          client.get(`/lotes/${id}/trazabilidad`),
        ]);

        if (loteRes.data.success) setLote(loteRes.data.data);
        if (trazRes.data.success) setTrazabilidad(trazRes.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al cargar los datos del lote.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !lote) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={48} className="mx-auto text-danger mb-4" />
        <h2 className="text-xl font-bold text-text mb-2">Error</h2>
        <p className="text-muted">{error || 'Lote no encontrado'}</p>
        <button
          onClick={() => navigate('/lotes')}
          className="mt-6 px-4 py-2 bg-primary text-white rounded-lg font-medium"
        >
          Volver a Lotes
        </button>
      </div>
    );
  }

  // Formatting dates
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const statusColors = {
    Disponible: 'bg-success/15 text-success border-success/20',
    Cuarentena: 'bg-warning/15 text-warning border-warning/20',
    Vencido: 'bg-danger/15 text-danger border-danger/20',
  };

  const diasColor =
    lote.dias_para_caducar <= 3 ? 'text-danger' :
    lote.dias_para_caducar <= 7 ? 'text-warning' :
    'text-success';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* ─── Back Button & Actions ─── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      {/* ─── 1. Cabecera de Estatus ─── */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-text tracking-tight">Lote {lote.id_lote}</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[lote.status] || statusColors.Disponible}`}>
                Estatus: {lote.status}
              </span>
              <span className={`text-sm font-medium ${diasColor}`}>
                {lote.dias_para_caducar > 0 ? `${lote.dias_para_caducar} días para caducar` : 'Vencido'}
              </span>
            </div>
          </div>

          <div className="text-sm text-muted text-left md:text-right space-y-1 bg-surface p-4 rounded-xl border border-border">
            <p><span className="font-medium text-text">Fabricado el:</span> {formatDate(lote.fecha_fabricacion)}</p>
            <p><span className="font-medium text-text">Fecha de caducidad:</span> {formatDate(lote.fecha_caducidad)}</p>
            <p><span className="font-medium text-text">Ingreso:</span> {formatDate(lote.fecha_ingreso)}</p>
            <p className="mt-2 text-primary font-bold text-lg pt-2 border-t border-border">
              {lote.stock_total} Unidades disponibles
            </p>
          </div>
        </div>
      </div>

      {/* ─── 2. Ficha de Producto ─── */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <div className="w-24 h-24 shrink-0 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden">
          {lote.producto?.url_img ? (
            <img src={lote.producto.url_img} alt={lote.producto?.nombre} className="w-full h-full object-cover" />
          ) : (
            <Package size={32} className="text-muted/50" />
          )}
        </div>
        <div className="flex-1 text-center sm:text-left space-y-2">
          <h2 className="text-xl font-bold text-text">{lote.producto?.nombre || 'Producto Desconocido'}</h2>
          <p className="text-sm font-mono text-primary">SKU: {lote.producto?.sku_id}</p>
          <p className="text-sm text-muted leading-relaxed">
            {lote.producto?.descripcion || 'Sin descripción disponible.'}
          </p>
        </div>
      </div>

      {/* ─── 3. Ubicaciones ─── */}
      <div>
        <h3 className="text-lg font-bold text-text mb-4">Ubicaciones:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Almacén */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h4 className="font-semibold text-text mb-1">Almacén</h4>
            <p className="text-xs text-muted mb-4">
              {lote.ubicaciones?.Almacen?.total_unidades || 0} unidades en {(lote.ubicaciones?.Almacen?.posiciones || []).length} ubicación(es)
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {(lote.ubicaciones?.Almacen?.posiciones || []).map((pos, i) => (
                <div key={i} className="bg-surface border border-border rounded-lg p-3">
                  <p className="text-xs font-medium text-text mb-1">Ubicación {i + 1}:</p>
                  <p className="text-xs text-muted">Pasillo: <span className="text-text">{pos.pasillo}</span></p>
                  <p className="text-xs text-muted">Rack: <span className="text-text">{pos.rack}</span></p>
                  <p className="text-xs text-muted">Nivel: <span className="text-text">{pos.nivel}</span></p>
                  <p className="text-xs font-semibold text-primary mt-1">{pos.stock} uds</p>
                </div>
              ))}
              {(!lote.ubicaciones?.Almacen?.posiciones || lote.ubicaciones.Almacen.posiciones.length === 0) && (
                 <p className="text-xs text-muted italic col-span-2">Sin stock en Almacén</p>
              )}
            </div>
          </div>

          {/* Exhibición */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h4 className="font-semibold text-text mb-1">Exhibición</h4>
            <p className="text-xs text-muted mb-4">
              {lote.ubicaciones?.Exhibicion?.total_unidades || 0} unidades en {(lote.ubicaciones?.Exhibicion?.posiciones || []).length} ubicación(es)
            </p>

            <div className="grid grid-cols-2 gap-4">
              {(lote.ubicaciones?.Exhibicion?.posiciones || []).map((pos, i) => (
                <div key={i} className="bg-surface border border-border rounded-lg p-3">
                  <p className="text-xs font-medium text-text mb-1">Ubicación {i + 1}:</p>
                  <p className="text-xs text-muted">Pasillo: <span className="text-text">{pos.pasillo}</span></p>
                  <p className="text-xs text-muted">Rack: <span className="text-text">{pos.rack}</span></p>
                  <p className="text-xs text-muted">Nivel: <span className="text-text">{pos.nivel}</span></p>
                  <p className="text-xs font-semibold text-primary mt-1">{pos.stock} uds</p>
                </div>
              ))}
              {(!lote.ubicaciones?.Exhibicion?.posiciones || lote.ubicaciones.Exhibicion.posiciones.length === 0) && (
                 <p className="text-xs text-muted italic col-span-2">Sin stock en Exhibición</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ─── 4. Trazabilidad ─── */}
      <div>
        <h3 className="text-lg font-bold text-text mb-4">Trazabilidad</h3>
        <div className="bg-card border border-border rounded-2xl p-6">
          <Timeline events={trazabilidad} />
        </div>
      </div>

      {/* ─── 5. Etiqueta ─── */}
      <div>
        <h3 className="text-lg font-bold text-text mb-4">Etiqueta:</h3>
        <div className="printable-card bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="bg-white px-4 py-2 rounded-xl flex items-center justify-center w-full md:w-auto overflow-hidden shadow-sm border border-border/50">
            <img 
              src={`http://localhost:3000/api/scan/barcode/${lote.id_lote}?type=code128`} 
              alt={`Código de barras Code-128 ${lote.id_lote}`} 
              className="h-16 object-contain filter contrast-125"
            />
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-2.5 bg-surface border border-border rounded-xl text-text font-medium hover:border-primary/50 transition-colors w-full md:w-auto justify-center"
          >
            <Printer size={18} />
            Imprimir
          </button>
        </div>
      </div>

    </div>
  );
}
