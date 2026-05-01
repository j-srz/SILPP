import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, Loader2, Package } from 'lucide-react';
import client from '../api/client';
import LoteCard from '../components/LoteCard';

const STATUS_OPTIONS = ['Disponible', 'Cuarentena', 'Vencido'];

export default function Lotes() {
  const [lotes, setLotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ── Filter state ──
  const [q, setQ] = useState('');
  const [statusFilters, setStatusFilters] = useState([]);
  const [tiempoFilter, setTiempoFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  // ── Fetch function ──
  const fetchLotes = useCallback(async (pageNum = 1, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);

    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (statusFilters.length === 1) params.set('status', statusFilters[0]);
      if (areaFilter) params.set('area', areaFilter);
      params.set('page', String(pageNum));
      params.set('limit', '20');

      // Time-based filters
      if (tiempoFilter === '3dias') {
        const d = new Date(); d.setDate(d.getDate() + 3);
        params.set('fecha_fin', d.toISOString().split('T')[0]);
      } else if (tiempoFilter === '7dias') {
        const d = new Date(); d.setDate(d.getDate() + 7);
        params.set('fecha_fin', d.toISOString().split('T')[0]);
      }

      if (statusFilters.length === 1 && statusFilters[0] === 'Vencido') {
        params.set('status', 'Vencido');
      }

      const { data: res } = await client.get(`/lotes/search?${params.toString()}`);

      if (res.success) {
        // Client-side stock filter
        let filtered = res.data;
        if (stockFilter === 'con') filtered = filtered.filter((l) => l.stock_actual > 0);
        if (stockFilter === 'sin') filtered = filtered.filter((l) => l.stock_actual === 0);

        setLotes(append ? (prev) => [...prev, ...filtered] : filtered);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Error fetching lotes:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [q, statusFilters, tiempoFilter, areaFilter, stockFilter]);

  // ── Initial load & filter changes ──
  useEffect(() => {
    fetchLotes(1, false);
  }, [fetchLotes]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLotes(1, false);
  };

  const toggleStatus = (st) => {
    setStatusFilters((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  const clearFilters = () => {
    setQ('');
    setStatusFilters([]);
    setTiempoFilter('');
    setAreaFilter('');
    setStockFilter('');
  };

  const hasActiveFilters = q || statusFilters.length > 0 || tiempoFilter || areaFilter || stockFilter;

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <Package size={22} className="text-primary" />
            Lotes
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Se encontraron <span className="text-text font-semibold">{total}</span> lotes activos
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-primary/15 text-primary'
              : 'text-muted hover:text-text hover:bg-card'
          }`}
        >
          <Filter size={14} />
          Filtros {hasActiveFilters && '●'}
        </button>
      </div>

      {/* ─── Search Bar ─── */}
      <form onSubmit={handleSearch} className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por SKU, ID Lote, Nombre, Marca o Código EAN..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-text text-sm placeholder:text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition"
        />
      </form>

      {/* ─── Power Filters Panel ─── */}
      {showFilters && (
        <div className="glass rounded-xl p-4 space-y-4 animate-in">
          {/* Status checkboxes */}
          <div>
            <p className="text-xs font-medium text-muted mb-2">Estado</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((st) => {
                const active = statusFilters.includes(st);
                const color = st === 'Disponible' ? 'success' : st === 'Cuarentena' ? 'warning' : 'danger';
                return (
                  <button
                    key={st}
                    onClick={() => toggleStatus(st)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? `bg-${color}/15 text-${color} border-${color}/30`
                        : 'bg-card text-muted border-border hover:border-primary/30'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time filters */}
          <div>
            <p className="text-xs font-medium text-muted mb-2">Tiempo</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: '3dias', label: 'Vence en < 3 días' },
                { key: '7dias', label: 'Vence en < 7 días' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTiempoFilter(tiempoFilter === key ? '' : key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    tiempoFilter === key
                      ? 'bg-warning/15 text-warning border-warning/30'
                      : 'bg-card text-muted border-border hover:border-primary/30'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Area & Stock row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px]">
              <p className="text-xs font-medium text-muted mb-2">Área</p>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-text text-xs outline-none focus:border-primary"
              >
                <option value="">Todas</option>
                <option value="1">Almacén</option>
                <option value="2">Exhibición</option>
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <p className="text-xs font-medium text-muted mb-2">Stock</p>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-surface border border-border text-text text-xs outline-none focus:border-primary"
              >
                <option value="">Todos</option>
                <option value="con">Solo con existencias</option>
                <option value="sin">Sin stock</option>
              </select>
            </div>
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted hover:text-danger transition-colors"
            >
              <X size={12} />
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* ─── Results Grid ─── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : lotes.length === 0 ? (
        <div className="text-center py-16">
          <Package size={40} className="mx-auto text-muted/30 mb-3" />
          <p className="text-muted text-sm">No se encontraron lotes con los filtros aplicados.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lotes.map((lote) => (
              <LoteCard key={lote.id_lote} lote={lote} />
            ))}
          </div>

          {/* Load More */}
          {page < totalPages && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchLotes(page + 1, true)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-card border border-border text-sm font-medium text-text hover:border-primary/30 transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {loadingMore ? 'Cargando...' : `Cargar más (${total - lotes.length} restantes)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
