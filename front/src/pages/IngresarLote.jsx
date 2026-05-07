import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Calendar, Barcode as BarcodeIcon, Loader2, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import client from '../api/client';
import useAuthStore from '../store/useAuthStore';
import EmptyState from '../components/EmptyState';

export default function IngresarLote() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Wizard state
  const [step, setStep] = useState(1);
  
  // Step 1: Product Search
  const [query, setQuery] = useState('');
  const [productos, setProductos] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Step 2: Form Data
  const [formData, setFormData] = useState({
    fecha_fabricacion: '',
    fecha_caducidad: '',
    cantidad: '',
    status: 'Disponible'
  });
  const [generatedLoteId, setGeneratedLoteId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  
  // Search Products Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setProductos([]);
        return;
      }
      setLoadingSearch(true);
      try {
        const { data } = await client.get(`/productos/search?q=${encodeURIComponent(query)}`);
        setProductos(data.success ? data.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSearch(false);
      }
    }, 400); // debounce
    return () => clearTimeout(timer);
  }, [query]);

  const handleProductSelect = (prod) => {
    setSelectedProduct(prod);
    setStep(2);
  };

  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorForm('');
    
    // Validations
    if (!formData.fecha_fabricacion || !formData.fecha_caducidad || !formData.cantidad) {
      setErrorForm('Todos los campos son obligatorios.');
      return;
    }
    if (new Date(formData.fecha_caducidad) <= new Date(formData.fecha_fabricacion)) {
      setErrorForm('La fecha de caducidad debe ser posterior a la de fabricación.');
      return;
    }
    if (Number(formData.cantidad) <= 0) {
      setErrorForm('La cantidad debe ser mayor a 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        sku_id: selectedProduct.sku_id,
        fecha_fabricacion: formData.fecha_fabricacion,
        fecha_caducidad: formData.fecha_caducidad,
        cantidad: Number(formData.cantidad),
        status: formData.status,
        id_usuario: user?.id_usuario || 1
      };
      
      const { data } = await client.post('/lotes', payload);
      if (data.success) {
        setGeneratedLoteId(data.data.id_lote);
        setStep(3);
      }
    } catch (err) {
      setErrorForm(err.response?.data?.error || 'Error al registrar el lote.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setFormData({
      fecha_fabricacion: '',
      fecha_caducidad: '',
      cantidad: '',
      status: 'Disponible'
    });
    setGeneratedLoteId('');
    setStep(2);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* ─── Header & Wizard Steps ─── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Package size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Ingresar Lote</h1>
            <p className="text-sm text-muted">Área de Recepción</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                step >= s 
                  ? 'bg-primary border-primary text-white' 
                  : 'bg-surface border-border text-muted'
              }`}>
                {s}
              </div>
              <span className={`text-xs font-medium ${step >= s ? 'text-primary' : 'text-muted'}`}>
                {s === 1 ? 'Producto' : s === 2 ? 'Datos' : 'Etiqueta'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Paso 1: Búsqueda de Producto ─── */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Buscar por Nombre, Marca, SKU o Código EAN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-text placeholder:text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none"
              autoFocus
            />
          </div>

          <div className="bg-card border border-border rounded-xl min-h-[300px]">
            {loadingSearch ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
            ) : query.trim() !== '' && productos.length === 0 ? (
              <div className="pt-12">
                <EmptyState message="No pudimos encontrar ninguna coincidencia" />
              </div>
            ) : productos.length > 0 ? (
              <div className="divide-y divide-border/50">
                {productos.map((prod) => (
                  <button
                    key={prod.sku_id}
                    onClick={() => handleProductSelect(prod)}
                    className="w-full text-left p-4 hover:bg-surface/50 transition-colors flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {prod.url_img ? (
                         <img src={prod.url_img} alt={prod.nombre} className="w-full h-full object-cover" />
                      ) : (
                         <Package size={20} className="text-muted" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-text font-semibold text-sm">{prod.nombre}</h3>
                      <p className="text-xs text-muted mt-0.5">{prod.marca} · SKU: {prod.sku_id}</p>
                    </div>
                    <ArrowRight size={18} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted">
                Ingresa un término para buscar productos en el catálogo.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Paso 2: Formulario de Registro ─── */}
      {step === 2 && selectedProduct && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-xs text-muted hover:text-text"
            >
              <ArrowLeft size={14} /> Cambiar producto
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
             <div className="w-14 h-14 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
                {selectedProduct.url_img ? (
                  <img src={selectedProduct.url_img} alt={selectedProduct.nombre} className="w-full h-full object-cover" />
                ) : (
                  <Package size={24} className="text-muted" />
                )}
             </div>
             <div>
               <h3 className="text-text font-bold">{selectedProduct.nombre}</h3>
               <p className="text-xs text-muted">SKU: {selectedProduct.sku_id} · {selectedProduct.marca}</p>
             </div>
          </div>

          <form onSubmit={handleFormSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Fecha Fabricación</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="date"
                    name="fecha_fabricacion"
                    value={formData.fecha_fabricacion}
                    onChange={handleFormChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-border text-text text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Fecha Caducidad</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="date"
                    name="fecha_caducidad"
                    value={formData.fecha_caducidad}
                    onChange={handleFormChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-border text-text text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Cantidad de Piezas</label>
                <div className="relative">
                  <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="number"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleFormChange}
                    min="1"
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-border text-text text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Estatus Inicial</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text text-sm outline-none focus:border-primary"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Cuarentena">Cuarentena</option>
                </select>
              </div>
            </div>

            {errorForm && (
              <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                <AlertTriangle size={16} /> {errorForm}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Ingreso'}
            </button>
          </form>
        </div>
      )}

      {/* ─── Paso 3: Confirmación y Etiqueta ─── */}
      {step === 3 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-success/20 border border-success/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-success" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">Lote Ingresado con Éxito</h2>
          <p className="text-muted text-sm mb-6">
            Las unidades han sido asignadas al <span className="text-primary font-semibold">Área de Recepción</span>.
          </p>

          <div className="bg-white p-6 rounded-xl flex items-center justify-center mb-8 inline-block">
            <img 
              src={`/api/scan/barcode/${generatedLoteId}?type=code128`} 
              alt={`Código de barras Code-128 ${generatedLoteId}`} 
              className="h-20 object-contain filter contrast-125"
            />
          </div>

          <div className="space-y-3 max-w-sm mx-auto">
            <button
              onClick={() => navigate(`/lotes/${generatedLoteId}`)}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-colors"
            >
              Ir al expediente del lote
            </button>
            <button
              onClick={resetWizard}
              className="w-full py-2.5 rounded-lg bg-surface border border-border hover:border-primary/50 text-text font-medium text-sm transition-colors"
            >
              Registrar otro lote de {selectedProduct?.nombre}
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full py-2.5 rounded-lg text-muted hover:text-text font-medium text-sm transition-colors"
            >
              Volver al buscador
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
