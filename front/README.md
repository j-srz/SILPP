# 🎨 SILPP — Frontend

SPA React para el Sistema de Inventario por Lotes de Productos Perecederos.

---

## Ejecución

```bash
npm install
npm run dev       # Desarrollo: http://localhost:5173
npm run build     # Build de producción
npm run preview   # Preview del build
```

---

## Design System — Dark Industrial

El sistema visual se define en `src/index.css` mediante CSS custom properties:

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-bg` | `#020617` (slate-950) | Fondo de la app |
| `--color-surface` | `#0f172a` (slate-900) | Paneles secundarios |
| `--color-card` | `#1e293b` (slate-800) | Cards y contenedores |
| `--color-border` | `#334155` (slate-700) | Bordes |
| `--color-muted` | `#94a3b8` (slate-400) | Texto secundario |
| `--color-text` | `#f1f5f9` (slate-100) | Texto principal |
| `--color-primary` | `#0ea5e9` (sky-500) | Acento principal |
| `--color-success` | `#22c55e` | Estados positivos |
| `--color-warning` | `#f59e0b` | Alertas |
| `--color-danger` | `#ef4444` | Errores / caducidad crítica |

**Tipografía:** Inter (Google Fonts) — pesos 300-800.

---

## Arquitectura de Componentes

```
src/
├── App.jsx                  # Router principal (react-router-dom v7)
├── main.jsx                 # Entry point (React 19)
├── index.css                # Design tokens + scanner CSS
│
├── api/
│   └── client.js            # Axios con baseURL configurada
│
├── store/                   # Estado global (Zustand + persist)
│   ├── useAuthStore.js      # Sesión: user, isAuthenticated, login(), logout()
│   └── useConfigStore.js    # Shortcuts de acceso rápido por rol
│
├── layouts/
│   └── MainLayout.jsx       # Navbar (top) + BottomNav (móvil) + <Outlet>
│
├── components/              # Reutilizables
│   ├── Navbar.jsx           # Barra superior con logout global
│   ├── BottomNav.jsx        # Navegación inferior (móvil)
│   ├── ProtectedRoute.jsx   # Guard de autenticación
│   ├── LoteCard.jsx         # Card compacta de lote con status
│   ├── EmptyState.jsx       # Estado vacío genérico
│   ├── Timeline.jsx         # Línea de tiempo de trazabilidad
│   ├── TaskCard.jsx         # Card de tarea en Operations
│   └── QuickAccessGrid.jsx  # Grid de accesos rápidos en Home
│
└── pages/                   # Vistas por ruta
    ├── Login.jsx            # Autenticación por ID
    ├── Home.jsx             # Dashboard con accesos rápidos
    ├── Lotes.jsx            # Búsqueda universal + filtros
    ├── LoteDetail.jsx       # Expediente completo del lote
    ├── ProductDetail.jsx    # Expediente del producto + lotes FEFO
    ├── IngresarLote.jsx     # Formulario de alta (transaccional)
    ├── Scanner.jsx          # Escáner híbrido (cámara + manual)
    ├── Operations.jsx       # Grid de operaciones por rol
    └── NotFound.jsx         # Página 404
```

---

## Mapa de Rutas

| Ruta | Página | Protegida |
|------|--------|-----------|
| `/login` | Login | No |
| `/home` | Home (Dashboard) | Sí |
| `/lotes` | Búsqueda de Lotes | Sí |
| `/lotes/:id` | Expediente de Lote | Sí |
| `/productos/:sku` | Expediente de Producto | Sí |
| `/ingresar` | Ingreso de Nuevo Lote | Sí |
| `/scanner` | Escáner Híbrido | Sí |
| `/operaciones` | Panel de Operaciones | Sí |
| `/*` | NotFound (404) | No |

---

## Flujo de Autenticación

1. `Login.jsx` recibe el `id_usuario`
2. Llama a `useAuthStore.login(id)` → `POST /api/auth/login`
3. Si es exitoso, persiste `user` en `localStorage` vía Zustand persist
4. `ProtectedRoute` verifica `isAuthenticated` en cada navegación
5. `logout()` limpia el store y redirige a `/login`

---

## Módulo de Escáner

`Scanner.jsx` implementa un flujo "Zen" para operarios de almacén:

1. **Modo Cámara:** Usa `html5-qrcode` con overlay de máscara (bordes opacos + centro transparente)
2. **Stop-on-Success:** Al detectar un código, la cámara se detiene inmediatamente
3. **Feedback:** Vibración háptica (100ms) + beep (1200Hz × 120ms via AudioContext)
4. **Flash verde:** Animación de confirmación "¡Código detectado!" con CheckCircle2
5. **Autocomplete:** Input manual con debounce 300ms → `GET /api/scan/suggest?q=`
6. **Detección HTTPS:** Si el contexto no es seguro, fuerza modo Manual con alerta

### Flujo de navegación post-escaneo:

```
Escáner → (LOT-xxx) → Expediente de Lote → ← (navigate -1)
Escáner → (EAN/SKU) → Resultado con lotes → Ver Producto → Seleccionar Lote → ← → ← → Escáner
```

---

## Dependencias Principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| `react` | 19.x | UI framework |
| `react-router-dom` | 7.x | Routing SPA |
| `zustand` | 5.x | Estado global (reemplazo de Redux) |
| `axios` | 1.x | HTTP client |
| `html5-qrcode` | 2.x | Lectura de códigos de barras |
| `lucide-react` | 0.4x | Iconos SVG |
| `react-barcode` | 1.x | Generación de códigos de barras |
| `tailwindcss` | 4.x | Utility-first CSS |
