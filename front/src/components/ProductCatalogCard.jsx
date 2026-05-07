import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const statusColors = {
  Disponible: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/20' },
  Cuarentena: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/20' },
  Vencido:    { bg: 'bg-danger/15',  text: 'text-danger',  border: 'border-danger/20' },
};

export default function ProductCatalogCard({ producto }) {
  const navigate = useNavigate();
  // Asumimos que los datos del catálogo vienen pre-calculados del backend
  const { 
    sku_id, nombre, marca, stock_global, total_lotes, 
    dias_critico, url_img, codigos_barras 
  } = producto;

  const handleNavigate = () => {
    navigate(`/productos/${sku_id}`);
  };

  const isLowStock = stock_global > 0 && stock_global <= 5;
  const hasExpired = dias_critico !== null && dias_critico < 0;
  const isExpiringSoon = dias_critico !== null && dias_critico >= 0 && dias_critico <= 7;

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all">
      {/* Header: Producto Info */}
      <div 
        className="flex items-start gap-4 cursor-pointer group"
        onClick={handleNavigate}
      >
        <div className="w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden">
          {url_img ? (
            <img src={url_img} alt={nombre} className="w-full h-full object-cover" />
          ) : (
            <Package size={24} className="text-muted/50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="font-semibold text-sm text-text leading-tight truncate group-hover:text-primary transition-colors">
              {nombre}
            </h3>
            {hasExpired && <AlertTriangle size={14} className="text-danger shrink-0" />}
            {!hasExpired && isExpiringSoon && <Clock size={14} className="text-warning shrink-0" />}
          </div>
          <p className="text-xs text-muted mb-2 truncate">
            {marca} · SKU: <span className="font-mono text-text/80">{sku_id}</span>
          </p>
          
          {/* Main metrics */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Stock Global</span>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-bold ${isLowStock ? 'text-warning' : 'text-text'}`}>
                  {stock_global}
                </span>
                <span className="text-[10px] text-muted">uds</span>
              </div>
            </div>
            <div className="w-px h-6 bg-border/50"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Lotes Activos</span>
              <span className="text-sm font-bold text-text">{total_lotes}</span>
            </div>
            {codigos_barras?.length > 0 && (
              <>
                <div className="w-px h-6 bg-border/50"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Códigos</span>
                  <span className="text-sm font-bold text-text">{codigos_barras.length}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
