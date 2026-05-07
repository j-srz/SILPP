import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Package, LayoutGrid, X } from 'lucide-react';
import client from '../api/client';
import LoteCard from '../components/LoteCard';
import ProductCatalogCard from '../components/ProductCatalogCard';

export default function Lotes() {
  // Tabs: 'lotes' | 'productos'
  const [activeTab, setActiveTab] = useState('lotes');

  // Data states
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Filters ──
  const [q, setQ] = useState('');
  
  // Chip states (Multi-select)
  const [filterVencidos, setFilterVencidos] = useState(false);
  const [filterProximos, setFilterProximos] = useState(false);
  const [filterStockBajo, setFilterStockBajo] = useState(false);
  const [filterCuarentena, setFilterCuarentena] = useState(false);
  const [filterAlmacen, setFilterAlmacen] = useState(false);
  const [filterExhibicion, setFilterExhibicion] = useState(false);

  // ── Fetch function ──
  const fetchItems = useCallback(async (pageNum = 1, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);

    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      params.set('page', String(pageNum));
      params.set('limit', '20');

      if (activeTab === 'lotes') {
        // --- LOTES ENDPOINT ---
        // Build status array
        const statusFilters = [];
        if (filterVencidos) statusFilters.push('Vencido');
        if (filterCuarentena) statusFilters.push('Cuarentena');
        if (statusFilters.length === 1) {
          params.set('status', statusFilters[0]);
        }
        
        // Area
        if (filterAlmacen && !filterExhibicion) params.set('area', '1');
        else if (filterExhibicion && !filterAlmacen) params.set('area', '2');
        
        // Proximos
        if (filterProximos) {
          const d = new Date(); d.setDate(d.getDate() + 7);
          params.set('fecha_fin', d.toISOString().split('T')[0]);
        }

        const { data: res } = await client.get(`/lotes/search?${params.toString()}`);
        if (res.success) {
          let filtered = res.data;
          // Client-side stock bajo filter for lotes
          if (filterStockBajo) {
            filtered = filtered.filter(l => l.stock_actual > 0 && l.stock_actual <= 5);
          }
          setItems(append ? (prev) => [...prev, ...filtered] : filtered);
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
        }
      } else {
        // --- PRODUCTOS CATALOG ENDPOINT ---
        const { data: res } = await client.get(`/productos/catalog?${params.toString()}`);
        if (res.success) {
          let filtered = res.data;
          
          // Client-side complex filters for catalog since backend catalog is aggregated
          if (filterVencidos) filtered = filtered.filter(p => p.dias_critico !== null && p.dias_critico < 0);
          if (filterProximos) filtered = filtered.filter(p => p.dias_critico !== null && p.dias_critico >= 0 && p.dias_critico <= 7);
          if (filterStockBajo) filtered = filtered.filter(p => p.stock_global > 0 && p.stock_global <= 5);
          // Cuarentena and Area are harder to filter perfectly on catalog without joining lotes in backend,
          // so we'll do best effort or just let user search.
          
          setItems(append ? (prev) => [...prev, ...filtered] : filtered);
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
        }
      }
      setPage(pageNum);
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [
    activeTab, q, 
    filterVencidos, filterProximos, filterStockBajo, 
    filterCuarentena, filterAlmacen, filterExhibicion
  ]);

  // ── Handlers ──
  useEffect(() => {
    fetchItems(1, false);
  }, [fetchItems]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchItems(1, false);
  };

  const clearFilters = () => {
    setQ('');
    setFilterVencidos(false);
    setFilterProximos(false);
    setFilterStockBajo(false);
    setFilterCuarentena(false);
    setFilterAlmacen(false);
    setFilterExhibicion(false);
  };

  const hasActiveFilters = filterVencidos || filterProximos || filterStockBajo || filterCuarentena || filterAlmacen || filterExhibicion;

  return (
    <div className="space-y-6">
      {/* ─── Header & Tabs ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <Package size={22} className="text-primary" />
            Inventario
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Se encontraron <span className="text-text font-semibold">{total}</span> resultados
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex p-1 bg-surface border border-border rounded-xl w-full sm:w-auto self-start">
          <button
            onClick={() => setActiveTab('lotes')}
            className={`flex-1 sm:px-6 py-1.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'lotes' 
                ? 'bg-card text-primary shadow-sm border border-primary/20' 
                : 'text-muted hover:text-text'
            }`}
          >
            <LayoutGrid size={16} />
            Lotes
          </button>
          <button
            onClick={() => setActiveTab('productos')}
            className={`flex-1 sm:px-6 py-1.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'productos' 
                ? 'bg-card text-primary shadow-sm border border-primary/20' 
                : 'text-muted hover:text-text'
            }`}
          >
            <Package size={16} />
            Catálogo
          </button>
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      <form onSubmit={handleSearch} className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={activeTab === 'lotes' ? "Buscar por SKU, ID Lote, Nombre o EAN..." : "Buscar en catálogo de productos..."}
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-card border border-border text-text text-sm placeholder:text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition shadow-sm"
        />
        {q && (
          <button 
            type="button" 
            onClick={() => { setQ(''); setTimeout(() => fetchItems(1, false), 0); }} 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text"
          >
            <X size={16} />
          </button>
        )}
      </form>

      {/* ─── Fast Chips Filters ─── */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider mr-1">Filtros:</span>
        
        <button
          onClick={() => setFilterVencidos(!filterVencidos)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filterVencidos ? 'bg-danger/15 text-danger border-danger/30' : 'bg-surface text-muted border-border hover:border-text/30'
          }`}
        >
          🔴 Vencidos
        </button>
        
        <button
          onClick={() => setFilterProximos(!filterProximos)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filterProximos ? 'bg-warning/15 text-warning border-warning/30' : 'bg-surface text-muted border-border hover:border-text/30'
          }`}
        >
          🟡 {'< 7 días'}
        </button>

        <button
          onClick={() => setFilterStockBajo(!filterStockBajo)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filterStockBajo ? 'bg-orange-500/15 text-orange-500 border-orange-500/30' : 'bg-surface text-muted border-border hover:border-text/30'
          }`}
        >
          📉 Stock bajo (≤5)
        </button>

        {activeTab === 'lotes' && (
          <>
            <button
              onClick={() => setFilterCuarentena(!filterCuarentena)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterCuarentena ? 'bg-warning/15 text-warning border-warning/30' : 'bg-surface text-muted border-border hover:border-text/30'
              }`}
            >
              🟠 Cuarentena
            </button>
            <button
              onClick={() => setFilterAlmacen(!filterAlmacen)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterAlmacen ? 'bg-primary/15 text-primary border-primary/30' : 'bg-surface text-muted border-border hover:border-text/30'
              }`}
            >
              📦 Almacén
            </button>
            <button
              onClick={() => setFilterExhibicion(!filterExhibicion)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterExhibicion ? 'bg-success/15 text-success border-success/30' : 'bg-surface text-muted border-border hover:border-text/30'
              }`}
            >
              🏪 Exhibición
            </button>
          </>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="p-1.5 rounded-full text-muted hover:text-danger hover:bg-danger/10 transition-colors ml-1"
            title="Limpiar filtros"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ─── Results Grid ─── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Package size={48} className="mx-auto text-muted/30 mb-4" />
          <h3 className="text-lg font-semibold text-text mb-1">Sin resultados</h3>
          <p className="text-muted text-sm max-w-sm mx-auto">
            No se encontraron {activeTab} que coincidan con tu búsqueda o los filtros aplicados.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-surface border border-border text-text text-sm font-medium rounded-lg hover:border-primary/30 transition-colors"
            >
              Quitar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {activeTab === 'lotes' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((lote) => (
                <LoteCard key={lote.id_lote} lote={lote} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((prod) => (
                <ProductCatalogCard key={prod.sku_id} producto={prod} />
              ))}
            </div>
          )}

          {/* Load More */}
          {page < totalPages && (
            <div className="flex justify-center pt-6">
              <button
                onClick={() => fetchItems(page + 1, true)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-card border border-border text-sm font-medium text-text hover:border-primary/30 transition-all hover:shadow-sm disabled:opacity-50"
              >
                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
                {loadingMore ? 'Cargando más...' : `Mostrar más (${total - items.length} restantes)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
