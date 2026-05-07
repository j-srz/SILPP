/**
 * NativeBarcodeScanner — Motor de escaneo que usa la API BarcodeDetector
 * nativa del navegador (Chrome Android → ML Kit, Safari 17.2+ → Vision).
 *
 * Ventajas sobre ZXing.js (html5-qrcode):
 * - 3-5x más rápido (procesamiento por GPU/nativo, no JS interpretado)
 * - Mayor precisión en condiciones de brillo adverso
 * - Menor consumo de batería
 *
 * Se usa como motor primario; html5-qrcode queda como fallback para
 * navegadores sin soporte (Firefox, Safari <17.2).
 */

// ── Formatos de código de barras relevantes para el contexto de almacén ──
const BARCODE_FORMATS = [
  'ean_13', 'ean_8', 'code_128', 'code_39',
  'qr_code', 'upc_a', 'upc_e', 'itf',
];

/**
 * Verifica si el navegador soporta BarcodeDetector.
 */
export function isNativeBarcodeSupported() {
  return 'BarcodeDetector' in window;
}

/**
 * Motor de escaneo nativo con control total de cámara.
 */
export class NativeBarcodeScanner {
  constructor(containerId) {
    this.containerId = containerId;
    this.video = null;
    this.stream = null;
    this.track = null;
    this.detector = null;
    this.scanning = false;
    this.animFrameId = null;
    this._onDetected = null;
  }

  /**
   * Inicia la cámara y el loop de detección.
   * @param {Function} onDetected - Callback con (rawValue: string)
   */
  async start(onDetected) {
    this._onDetected = onDetected;

    // 1. Crear BarcodeDetector con formatos soportados
    const allFormats = await BarcodeDetector.getSupportedFormats();
    const formats = BARCODE_FORMATS.filter(f => allFormats.includes(f));
    this.detector = new BarcodeDetector({
      formats: formats.length > 0 ? formats : undefined,
    });

    // 2. Obtener stream de cámara trasera a resolución óptima
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    this.track = this.stream.getVideoTracks()[0];

    // 3. Crear elemento <video> e inyectarlo en el contenedor
    const container = document.getElementById(this.containerId);
    if (!container) throw new Error('Container not found');

    this.video = document.createElement('video');
    this.video.srcObject = this.stream;
    this.video.setAttribute('playsinline', '');
    this.video.setAttribute('autoplay', '');
    this.video.setAttribute('muted', '');
    this.video.style.width = '100%';
    this.video.style.minHeight = '280px';
    this.video.style.objectFit = 'cover';
    this.video.style.borderRadius = '16px';
    container.innerHTML = '';
    container.appendChild(this.video);

    await this.video.play();

    // 4. Iniciar loop de detección
    this._startDetectLoop();
  }

  /**
   * Loop de detección por requestAnimationFrame con throttle.
   * Detecta a ~12fps para balance rendimiento/batería.
   */
  _startDetectLoop() {
    this.scanning = true;
    let lastDetectTime = 0;
    const DETECT_INTERVAL = 80; // ~12fps

    const detectLoop = async (timestamp) => {
      if (!this.scanning) return;

      if (timestamp - lastDetectTime >= DETECT_INTERVAL) {
        lastDetectTime = timestamp;
        try {
          if (this.video && this.video.readyState >= 2) {
            const barcodes = await this.detector.detect(this.video);
            if (barcodes.length > 0 && this.scanning) {
              // Stop-on-success: pausar inmediatamente
              this.scanning = false;
              if (this._onDetected) {
                this._onDetected(barcodes[0].rawValue);
              }
              return;
            }
          }
        } catch {
          // detect() puede fallar si el video no está listo
        }
      }

      this.animFrameId = requestAnimationFrame(detectLoop);
    };

    this.animFrameId = requestAnimationFrame(detectLoop);
  }

  /**
   * Retorna el MediaStreamTrack activo para aplicar constraints.
   */
  getRunningTrack() {
    return this.track;
  }

  /**
   * Pausa solo la detección (mantiene cámara viva para el video preview).
   */
  pauseDetection() {
    this.scanning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /**
   * Reanuda la detección tras un stop-on-success.
   * @param {Function} [onDetected] - Nuevo callback (opcional, reutiliza el anterior)
   */
  resumeDetection(onDetected) {
    if (onDetected) this._onDetected = onDetected;
    if (!this.detector || !this.video) return;
    this._startDetectLoop();
  }

  /**
   * Detiene completamente cámara y detección. Limpia el DOM.
   */
  async stop() {
    this.scanning = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
      this.video.remove();
      this.video = null;
    }

    this.track = null;
    this.detector = null;
    this._onDetected = null;
  }
}
