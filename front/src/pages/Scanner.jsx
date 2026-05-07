import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine, Camera, CameraOff, Keyboard, Search, Loader2,
  Package, Clock, ChevronRight, AlertTriangle, RotateCcw,
  BoxesIcon, MapPin, ShieldAlert, CheckCircle2, Flashlight
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import client from '../api/client';
import EmptyState from '../components/EmptyState';

// ── Haptic + audio feedback ──
function triggerSuccessFeedback() {
  // Vibration (mobile)
  try { navigator.vibrate?.(100); } catch { /* unsupported */ }
  // Short beep via AudioContext
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1200;
    osc.type = 'sine';
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch { /* unsupported */ }
}

const statusColors = {
  Disponible: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/20' },
  Cuarentena: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/20' },
  Vencido:    { bg: 'bg-danger/15',  text: 'text-danger',  border: 'border-danger/20' },
};

// Detect insecure context (IP without HTTPS blocks camera)
function isSecureContext() {
  if (window.isSecureContext !== undefined) return window.isSecureContext;
  const h = window.location.hostname;
  return window.location.protocol === 'https:' || h === 'localhost' || h === '127.0.0.1';
}

export default function Scanner() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [insecureCtx, setInsecureCtx] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [lastScanned, setLastScanned] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false); // flash state

  // Torch (flashlight) state
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const html5QrcodeRef = useRef(null);
  const isProcessingRef = useRef(false);
  const viewportReady = useRef(false);
  const suggestAbort = useRef(null);
  const trackRef = useRef(null);

  // ── HTTPS check on mount ──
  useEffect(() => {
    if (!isSecureContext()) {
      setInsecureCtx(true);
      setMode('manual');
    }
  }, []);

  // ── Scan handler (camera + manual + suggestion click) ──
  const handleScan = useCallback(async (code, opts = {}) => {
    if (!code || code.trim() === '' || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setLoading(true);
    setResult(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setLastScanned(code.trim());

    // ── Stop-on-success: freeze camera immediately ──
    if (html5QrcodeRef.current) {
      try {
        const state = html5QrcodeRef.current.getState();
        if (state === 2) await html5QrcodeRef.current.stop();
      } catch { /* ignore */ }
      setCameraActive(false);
    }

    try {
      const { data: res } = await client.get(`/scan?code=${encodeURIComponent(code.trim())}`);
      if (res.success) {
        setResult({ tipo: res.tipo, data: res.data, message: res.message });
        // ── Haptic + beep on valid result ──
        if (res.tipo === 'lote' || res.tipo === 'producto') {
          triggerSuccessFeedback();
          setScanSuccess(true);
          setTimeout(() => setScanSuccess(false), 1500);
        }
      }
    } catch (err) {
      setResult({
        tipo: 'error',
        message: err.response?.data?.error || 'Error de conexión con el servidor.',
        data: null,
      });
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }, []);

  // ── Camera lifecycle ──
const startCamera = useCallback(async () => {
    if (insecureCtx) return;

    const el = document.getElementById('scanner-viewport');
    if (!el) {
      setCameraError('No se pudo inicializar el visor de cámara.');
      return;
    }

    setCameraError(null);

    try {
      if (html5QrcodeRef.current) {
        try {
          await html5QrcodeRef.current.stop();
          html5QrcodeRef.current.clear();
        } catch { /* ignore */ }
        html5QrcodeRef.current = null;
      }

      const scanner = new Html5Qrcode('scanner-viewport');
      html5QrcodeRef.current = scanner;

      // PASO 1: Configuración optimizada con ROI (qrbox) para reducir área de proceso ~60%
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,                             // Balance: responsivo sin drenar batería
          qrbox: { width: 280, height: 160 },  // ROI: solo analiza la zona central
          aspectRatio: 1.7778,                  // 16:9 para aprovechar ancho en móviles
          disableFlip: true,                    // Cámara trasera no necesita espejo
        },
        (decodedText) => handleScan(decodedText),
        () => { /* frame sin detección */ }
      );

      // PASO 2: Ajustes agresivos de hardware para enfoque y exposición
      try {
        const track = scanner.getRunningTrack();
        const caps = track.getCapabilities();
        const advancedConstraints = [];

        // Enfoque continuo: evita que el foco "se pierda" con empaques brillantes
        if (caps.focusMode?.includes('continuous')) {
          advancedConstraints.push({ focusMode: 'continuous' });
        }

        // Exposición continua: se adapta al brillo variable de empaques
        if (caps.exposureMode?.includes('continuous')) {
          advancedConstraints.push({ exposureMode: 'continuous' });
        }

        // Compensación de exposición negativa: reduce el "lavado" por reflejos
        if (caps.exposureCompensation) {
          const minEV = caps.exposureCompensation.min;
          const targetEV = Math.max(minEV, -1.0);
          advancedConstraints.push({ exposureCompensation: targetEV });
        }

        // Balance de blancos continuo
        if (caps.whiteBalanceMode?.includes('continuous')) {
          advancedConstraints.push({ whiteBalanceMode: 'continuous' });
        }

        // Zoom ligero (1.5x): acerca el código sin mover el celular
        if (caps.zoom) {
          const maxZoom = caps.zoom.max || 1;
          const targetZoom = Math.min(1.5, maxZoom);
          advancedConstraints.push({ zoom: targetZoom });
        }

        if (advancedConstraints.length > 0) {
          await track.applyConstraints({ advanced: advancedConstraints });
        }

        // Guardar referencia al track para control de torch
        trackRef.current = track;
        setTorchAvailable(!!caps.torch);
      } catch (e) {
        console.warn('Ajustes de hardware no disponibles en este dispositivo:', e);
      }

      setCameraActive(true);
      viewportReady.current = true;
    } catch (err) {
      console.error('Camera error:', err);
      // ... (mantén tu lógica de manejo de errores aquí abajo)
      let msg = 'No se pudo acceder a la cámara. Verifica los permisos del navegador.';
      if (typeof err === 'string') {
        if (err.includes('NotAllowedError') || err.includes('Permission')) {
          msg = 'Permiso de cámara denegado. Habilítalo en la configuración del navegador.';
        } else if (err.includes('NotFoundError') || err.includes('device')) {
          msg = 'No se detectó ninguna cámara en este dispositivo.';
        } else {
          msg = err;
        }
      }
      setCameraError(msg);
      setCameraActive(false);
    }
  }, [handleScan, insecureCtx]);

  const stopCamera = useCallback(async () => {
    if (html5QrcodeRef.current) {
      try {
        const state = html5QrcodeRef.current.getState();
        if (state === 2) await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch { /* ignore */ }
      html5QrcodeRef.current = null;
    }
    trackRef.current = null;
    setTorchOn(false);
    setTorchAvailable(false);
    setCameraActive(false);
    viewportReady.current = false;
  }, []);

  // ── Torch (flashlight) toggle ──
  const toggleTorch = useCallback(async () => {
    if (!trackRef.current) return;
    try {
      const next = !torchOn;
      await trackRef.current.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch { /* dispositivo no soporta torch */ }
  }, [torchOn]);

  // Start/stop camera when mode changes
  useEffect(() => {
    if (mode === 'camera' && !insecureCtx) {
      const timer = setTimeout(() => startCamera(), 400);
      return () => { clearTimeout(timer); stopCamera(); };
    } else {
      stopCamera();
    }
  }, [mode, startCamera, stopCamera, insecureCtx]);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // ── Autocomplete: debounced search-as-you-type ──
  useEffect(() => {
    if (!manualInput.trim() || manualInput.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (suggestAbort.current) suggestAbort.current.abort();
      const controller = new AbortController();
      suggestAbort.current = controller;

      setLoadingSuggest(true);
      try {
        const { data: res } = await client.get(
          `/scan/suggest?q=${encodeURIComponent(manualInput.trim())}`,
          { signal: controller.signal }
        );
        if (res.success && res.data.length > 0) {
          setSuggestions(res.data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          setSuggestions([]);
        }
      } finally {
        setLoadingSuggest(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [manualInput]);

  // ── Handlers ──
  const handleManualSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (manualInput.trim()) handleScan(manualInput);
  };

  const handleSuggestionClick = (sug) => {
    setManualInput(sug.valor);
    setShowSuggestions(false);
    handleScan(sug.valor);
  };

  const resetScan = () => {
    setResult(null);
    setLastScanned('');
    setManualInput('');
    setSuggestions([]);
    setShowSuggestions(false);
    setScanSuccess(false);
  };

  // ── Restart camera ("Escanear otro") ──
  const restartScanner = () => {
    resetScan();
    if (mode === 'camera' && !insecureCtx) {
      setTimeout(() => startCamera(), 400);
    }
  };

  const formatDate = (d) => !d ? 'N/A' : new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

  // ── Shared input with autocomplete dropdown ──
  const renderInputWithSuggestions = (opts = {}) => {
    const { compact } = opts;
    return (
      <div className="relative">
        <div className="relative">
          <Search size={compact ? 16 : 18} className={`absolute left-${compact ? '3' : '4'} top-1/2 -translate-y-1/2 text-muted`} />
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="ID de Lote (LOT-...) o Código EAN / SKU"
            className={`w-full ${compact ? 'pl-10 py-2.5 text-sm' : 'pl-12 py-3.5 text-sm'} pr-4 rounded-xl bg-card border border-border text-text placeholder:text-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition`}
            autoComplete="off"
          />
          {loadingSuggest && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" />
          )}
        </div>

        {/* Dropdown de sugerencias */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((sug, i) => (
              <button
                key={`${sug.valor}-${i}`}
                type="button"
                onClick={() => handleSuggestionClick(sug)}
                className="w-full text-left px-4 py-3 hover:bg-surface/70 transition-colors flex items-center gap-3 border-b border-border/30 last:border-b-0"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  sug.tipo === 'lote' ? 'bg-primary/15' : 'bg-success/15'
                }`}>
                  {sug.tipo === 'lote' ? (
                    <Package size={14} className="text-primary" />
                  ) : (
                    <BoxesIcon size={14} className="text-success" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{sug.label}</p>
                  <p className="text-[11px] text-muted truncate">{sug.sublabel}</p>
                </div>
                {sug.status && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${(statusColors[sug.status] || statusColors.Disponible).bg} ${(statusColors[sug.status] || statusColors.Disponible).text} ${(statusColors[sug.status] || statusColors.Disponible).border}`}>
                    {sug.status}
                  </span>
                )}
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                  sug.tipo === 'lote' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                }`}>
                  {sug.tipo === 'lote' ? 'Lote' : 'Producto'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-10">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <ScanLine size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">Escáner</h1>
            <p className="text-xs text-muted">Escanea o ingresa un código</p>
          </div>
        </div>

        <div className="flex items-center bg-surface border border-border rounded-lg p-0.5">
          <button
            onClick={() => !insecureCtx && setMode('camera')}
            disabled={insecureCtx}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'camera' ? 'bg-primary/15 text-primary' : 'text-muted hover:text-text'
            } ${insecureCtx ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Camera size={14} />
            Cámara
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'manual' ? 'bg-primary/15 text-primary' : 'text-muted hover:text-text'
            }`}
          >
            <Keyboard size={14} />
            Manual
          </button>
        </div>
      </div>

      {/* ─── Insecure context warning ─── */}
      {insecureCtx && (
        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl">
          <ShieldAlert size={20} className="text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">Cámara no disponible</p>
            <p className="text-xs text-muted mt-1">
              La cámara requiere una conexión segura (HTTPS o localhost). Estás accediendo desde
              <span className="font-mono text-text ml-1">{window.location.origin}</span>.
              Usa el modo Manual o accede vía HTTPS.
            </p>
          </div>
        </div>
      )}

      {/* ─── Camera Viewport ─── */}
      {mode === 'camera' && !insecureCtx && (
        <div className="scanner-viewport-wrapper rounded-2xl overflow-hidden border border-border bg-surface relative">
          <div id="scanner-viewport" className="w-full" style={{ minHeight: '280px' }} />

          {/* Torch (flashlight) floating button */}
          {cameraActive && torchAvailable && (
            <button
              onClick={toggleTorch}
              className={`absolute top-3 right-3 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                torchOn
                  ? 'bg-warning text-bg shadow-lg shadow-warning/30'
                  : 'bg-surface/80 text-muted border border-border hover:text-text'
              }`}
              title={torchOn ? 'Apagar linterna' : 'Encender linterna'}
            >
              <Flashlight size={18} />
            </button>
          )}

          {/* Overlay mask: dark edges + transparent center */}
          {cameraActive && <div className="scanner-overlay" />}

          {/* Animated laser confined to scan zone */}
          {cameraActive && <div className="scanner-laser" />}

          {/* Corner brackets for scan zone */}
          {cameraActive && (
            <div className="scanner-corners">
              <span className="corner tl" />
              <span className="corner tr" />
              <span className="corner bl" />
              <span className="corner br" />
            </div>
          )}

          {/* Success flash overlay */}
          {scanSuccess && (
            <div className="absolute inset-0 flex items-center justify-center bg-success/20 backdrop-blur-sm z-30 animate-in">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-success/25 border-2 border-success flex items-center justify-center scanner-success-pulse">
                  <CheckCircle2 size={32} className="text-success" />
                </div>
                <p className="text-sm font-semibold text-success">¡Código detectado!</p>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/95 p-6 z-20">
              <CameraOff size={40} className="text-muted/50 mb-3" />
              <p className="text-sm text-muted text-center mb-4">{cameraError}</p>
              <button
                onClick={() => { setCameraError(null); startCamera(); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                <RotateCcw size={14} /> Reintentar
              </button>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-sm z-20">
              <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-xl border border-border">
                <Loader2 size={20} className="animate-spin text-primary" />
                <span className="text-sm text-text font-medium">Buscando...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Manual Input (full mode) ─── */}
      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-3">
          {renderInputWithSuggestions()}
          <button
            type="submit"
            disabled={loading || !manualInput.trim()}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <ScanLine size={18} />}
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      )}

      {/* ─── Camera mode: manual fallback ─── */}
      {mode === 'camera' && !insecureCtx && !loading && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">o ingresa manualmente</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="flex-1">
              {renderInputWithSuggestions({ compact: true })}
            </div>
            <button
              type="submit"
              disabled={loading || !manualInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-colors disabled:opacity-50"
            >
              <Search size={16} />
            </button>
          </form>
        </>
      )}

      {/* ─── Results ─── */}
      {result && (
        <div className="space-y-4 animate-in">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              Resultado para: <span className="text-text font-mono">{lastScanned}</span>
            </p>
            <button onClick={restartScanner} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <ScanLine size={13} /> Escanear otro
            </button>
          </div>

          {result.tipo === 'lote' && result.data && (
            <LoteDirectCard lote={result.data} navigate={navigate} formatDate={formatDate} />
          )}
          {result.tipo === 'producto' && result.data && (
            <ProductoConLotes data={result.data} navigate={navigate} formatDate={formatDate} />
          )}
          {result.tipo === 'no_encontrado' && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <EmptyState message={result.message || 'No se encontró ninguna coincidencia.'} />
            </div>
          )}
          {result.tipo === 'error' && (
            <div className="bg-card border border-danger/20 rounded-2xl p-6 text-center">
              <AlertTriangle size={36} className="mx-auto text-danger mb-3" />
              <p className="text-sm text-danger font-medium">{result.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ Sub-component: Lote Direct Card ═══
function LoteDirectCard({ lote, navigate, formatDate }) {
  const colors = statusColors[lote.status] || statusColors.Disponible;
  const diasColor = lote.dias_para_caducar <= 3 ? 'text-danger' : lote.dias_para_caducar <= 7 ? 'text-warning' : 'text-success';

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-mono text-muted mb-1">{lote.id_lote}</p>
            <h2 className="text-lg font-bold text-text">{lote.producto?.nombre || 'Producto'}</h2>
            <p className="text-xs text-muted mt-0.5">{lote.producto?.marca} · SKU: {lote.producto?.sku_id}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
            {lote.status}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-xl p-3 border border-border/50 text-center">
            <Package size={16} className="text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-text">{lote.stock_total}</p>
            <p className="text-[10px] text-muted">Unidades</p>
          </div>
          <div className="bg-surface rounded-xl p-3 border border-border/50 text-center">
            <Clock size={16} className={`mx-auto mb-1 ${diasColor}`} />
            <p className={`text-lg font-bold ${diasColor}`}>{lote.dias_para_caducar > 0 ? lote.dias_para_caducar : 0}</p>
            <p className="text-[10px] text-muted">{lote.dias_para_caducar > 0 ? 'Días restantes' : 'Vencido'}</p>
          </div>
          <div className="bg-surface rounded-xl p-3 border border-border/50 text-center">
            <MapPin size={16} className="text-muted mx-auto mb-1" />
            <p className="text-lg font-bold text-text">{Object.keys(lote.ubicaciones || {}).length}</p>
            <p className="text-[10px] text-muted">Áreas</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted bg-surface rounded-lg px-3 py-2 border border-border/50">
          <span>Fabricación: <span className="text-text">{formatDate(lote.fecha_fabricacion)}</span></span>
          <span className="text-border">|</span>
          <span>Caduca: <span className={diasColor}>{formatDate(lote.fecha_caducidad)}</span></span>
        </div>

        {lote.ubicaciones && Object.keys(lote.ubicaciones).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted">Ubicaciones:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(lote.ubicaciones).map(([area, info]) => (
                <span key={area} className="px-2.5 py-1 bg-surface border border-border rounded-lg text-xs text-text">
                  {area}: <span className="font-semibold text-primary">{info.total_unidades}</span> uds
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate(`/lotes/${lote.id_lote}`)}
        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-surface/50 border-t border-border text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
      >
        Ver expediente completo <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ═══ Sub-component: Producto + Lotes list ═══
function ProductoConLotes({ data, navigate, formatDate }) {
  const { producto, lotes, total_lotes, stock_global } = data;
  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(`/productos/${producto.sku_id}`)}
        className="w-full bg-card border border-border rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-all group text-left"
      >
        <div className="w-14 h-14 shrink-0 rounded-xl bg-surface border border-border flex items-center justify-center overflow-hidden">
          {producto.url_img ? <img src={producto.url_img} alt={producto.nombre} className="w-full h-full object-cover" /> : <Package size={24} className="text-muted/50" />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-text truncate">{producto.nombre}</h2>
          <p className="text-xs text-muted mt-0.5">
            {producto.marca} · SKU: {producto.sku_id}
            {producto.codigo_ean && <span className="ml-1">· EAN: {producto.codigo_ean}</span>}
          </p>
          <p className="text-[11px] text-primary mt-1.5 font-medium">Ver expediente del producto →</p>
        </div>
        <ChevronRight size={18} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <BoxesIcon size={18} className="text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-text">{total_lotes}</p>
          <p className="text-[11px] text-muted">Lotes activos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <Package size={18} className="text-success mx-auto mb-1" />
          <p className="text-2xl font-bold text-text">{stock_global}</p>
          <p className="text-[11px] text-muted">Stock total</p>
        </div>
      </div>

      {lotes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted">Lotes ordenados por caducidad <span className="text-primary">(FEFO)</span>:</p>
          <div className="grid grid-cols-1 gap-2">
            {lotes.map((lote) => (
              <ScanLoteCard key={lote.id_lote} lote={lote} navigate={navigate} formatDate={formatDate} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState message="Este producto no tiene lotes activos en el sistema." />
      )}
    </div>
  );
}

// ═══ Sub-component: Compact Lote Card ═══
function ScanLoteCard({ lote, navigate, formatDate }) {
  const colors = statusColors[lote.status] || statusColors.Disponible;
  const diasColor = lote.dias_para_caducar <= 3 ? 'text-danger' : lote.dias_para_caducar <= 7 ? 'text-warning' : 'text-muted';

  return (
    <button
      onClick={() => navigate(`/lotes/${lote.id_lote}`)}
      className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>{lote.status}</span>
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
}
