<div align="center">
  <h1>📦 SILPP</h1>
  <h3>Sistema de Inventario por Lotes de Productos Perecederos</h3>
  <p><i>Gestión inteligente FEFO · Trazabilidad absoluta · Control de mermas</i></p>

  <img src="https://img.shields.io/badge/Frontend-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/State-Zustand-443E38?style=for-the-badge&logo=react&logoColor=white" alt="Zustand" />
  <img src="https://img.shields.io/badge/Backend-Node.js_+_Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Database-MySQL/MariaDB-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Scanner-html5--qrcode-FF6600?style=for-the-badge&logo=qrcode&logoColor=white" alt="Scanner" />
</div>

---

## Índice

1. [Visión del Proyecto](#-visión-del-proyecto)
2. [Arquitectura](#-arquitectura)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Requisitos Previos](#-requisitos-previos)
5. [Instalación y Ejecución](#-instalación-y-ejecución)
6. [Variables de Entorno](#-variables-de-entorno)
7. [Estado del Desarrollo](#-estado-del-desarrollo)
8. [Vulnerabilidades Identificadas](#-vulnerabilidades-identificadas)
9. [Estructura del Proyecto](#-estructura-del-proyecto)
10. [Autores](#-autores)

---

## 👁️ Visión del Proyecto

En la industria de alimentos y productos perecederos, el tiempo es el factor más crítico. **SILPP** nace con un objetivo claro: **erradicar las pérdidas por caducidad (mermas)** mediante un control logístico estricto basado en la metodología **FEFO** (*First Expired, First Out*).

El sistema garantiza que cada unidad que ingresa al almacén esté vinculada a un **Lote** específico con fecha de fabricación y caducidad. Su pieza central es el **Algoritmo de Despacho por Caducidad Crítica**: una lógica automática que siempre prioriza la salida del lote con menor tiempo de vida útil restante.

> ⚠️ **SILPP no es un POS.** Se enfoca exclusivamente en la logística interna: recepción, almacenamiento, rotación y retiro de mercancía.

---

## 🏗️ Arquitectura

```
┌──────────────────┐         ┌──────────────────┐
│   Frontend SPA   │  HTTP   │   Backend API    │
│   React + Vite   │ ◄─────► │  Node + Express  │
│   Puerto: 5173   │  JSON   │   Puerto: 3000   │
└──────────────────┘         └────────┬─────────┘
                                      │ mysql2
                              ┌───────┴────────┐
                              │  MySQL/MariaDB  │
                              │  InnoDB + ACID  │
                              │  Puerto: 3306   │
                              └────────────────┘
```

**Principio de stock dinámico:** Las existencias NO se almacenan como un campo estático. Se calculan en tiempo real como:

```
stock = SUM(Historial_Movimiento.qty_afectada × TipoMovimiento.factor)
```

Donde `factor = 1` (entradas) o `factor = -1` (salidas). Esto garantiza una auditoría perfecta y evita inconsistencias.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Frontend** | React 19 + Vite 8 | SPA reactiva, mobile-first |
| **Estado global** | Zustand + persist | Manejo de sesión y config |
| **Estilos** | Tailwind CSS 4 | Design system Dark Industrial |
| **Escáner** | html5-qrcode | Lectura de códigos de barras por cámara |
| **Iconografía** | Lucide React | Iconos SVG consistentes |
| **Backend** | Node.js + Express | API RESTful |
| **Base de datos** | MySQL 8 / MariaDB 11 | Motor InnoDB (transacciones ACID) |
| **ORM/Driver** | mysql2 (pool) | Conexiones preparadas contra SQL injection |

---

## 📋 Requisitos Previos

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MySQL 8** o **MariaDB 11** con motor InnoDB
- Navegador moderno con soporte de cámara (Chrome, Safari, Edge)

---

## 🚀 Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone <repo-url> SILPP && cd SILPP

# 2. Crear la base de datos
mysql -u root -p < scriptCreacionDB.sql

# 3. Backend
cd back
cp .env.example .env          # Configurar variables (ver sección abajo)
npm install
npm run dev                   # Servidor en http://localhost:3000

# 4. Frontend (en otra terminal)
cd ../front
npm install
npm run dev                   # App en http://localhost:5173
```

---

## 🔐 Variables de Entorno

Crear `back/.env` con:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=inventario_silpp
```

---

## 📊 Estado del Desarrollo

### ✅ Fase 1 — Implementado

| Módulo | Descripción | Archivos clave |
|--------|-------------|----------------|
| **Autenticación** | Login por ID de usuario con persistencia local | `auth.controller.js`, `useAuthStore.js` |
| **Ingreso de Lotes** | Registro transaccional con validación de fechas | `lotes.controller.js`, `IngresarLote.jsx` |
| **Búsqueda Universal** | Filtros por texto, status, área, caducidad + paginación | `megaBusqueda()`, `Lotes.jsx` |
| **Expediente de Lote** | Detalle con stock dinámico, ubicaciones y trazabilidad | `detalleLote()`, `LoteDetail.jsx` |
| **Expediente de Producto** | Catálogo + lotes activos FEFO | `detalleProducto()`, `ProductDetail.jsx` |
| **Escáner Híbrido** | Cámara + manual + autocomplete + feedback háptico | `scan.controller.js`, `Scanner.jsx` |
| **Trazabilidad** | Timeline cronológico de movimientos por lote | `trazabilidadLote()`, `Timeline.jsx` |
| **Gestión de Usuarios** | CRUD + baja/alta lógica + roles multi-valor | `usuarios.controller.js` |
| **Panel de Operaciones** | Grid de acciones rápidas por rol | `Operations.jsx`, `useConfigStore.js` |

### 🔜 Fase 2 — En Diseño (Roadmap)

| Módulo | UC | Prioridad |
|--------|----|-----------|
| Salida a Exhibición (FEFO activo) | UC-1.1 | 🔴 Alta |
| Reporte de Merma | UC-1.3 | 🔴 Alta |
| Baja por Caducidad | UC-1.4 | 🟡 Media |
| Reubicación Interna | UC-1.6 | 🟡 Media |
| Panel de Alertas de Caducidad | UC-2.4 | 🟡 Media |
| Bloqueo/Desbloqueo de Lote | UC-2.5/2.6 | 🟡 Media |
| Auditoría Cíclica | UC-3.1 | 🟢 Baja |
| Reportes PDF/Excel | UC-3.3 | 🟢 Baja |
| Sincronización POS | UC-4.1/4.2 | 🟢 Baja |

---

## 🛡️ Vulnerabilidades Identificadas y Mitigación Futura

> Estas vulnerabilidades son **conocidas y documentadas**. Representan decisiones de alcance, no descuidos.

| # | Vulnerabilidad | Riesgo | Mitigación Planificada |
|---|---------------|--------|----------------------|
| 1 | **Sin JWT** — Autenticación por ID numérico sin token criptográfico | Alto | Implementar `jsonwebtoken` + middleware `verifyToken` en todas las rutas protegidas |
| 2 | **Sin restricción de rol en backend** — Todas las rutas API son accesibles para cualquier usuario autenticado | Alto | Middleware `requireRole(['Táctico', 'Auditor'])` por ruta |
| 3 | **Sin HTTPS en desarrollo** — La cámara del escáner requiere contexto seguro | Medio | Certificado SSL en producción (DigitalOcean). El sistema ya detecta contexto inseguro y muestra alerta |
| 4 | **CORS abierto** — `app.use(cors())` sin restricción de origen | Medio | Configurar `origin: process.env.FRONTEND_URL` en producción |

---

## 📁 Estructura del Proyecto

```
SILPP/
├── especificaciones.md          # Documento de requisitos completo
├── scriptCreacionDB.sql         # Script SQL (PascalCase + InnoDB)
├── diagrmaDBenPlainUM.txt       # Diagrama UML en PlantUML
│
├── back/                        # API RESTful (Node + Express)
│   ├── index.js                 # Entry point del servidor
│   ├── .env                     # Variables de entorno (no versionado)
│   └── src/
│       ├── config/db.js         # Pool de conexiones MySQL
│       ├── controllers/         # Lógica de negocio
│       │   ├── auth.controller.js
│       │   ├── lotes.controller.js
│       │   ├── productos.controller.js
│       │   ├── scan.controller.js
│       │   └── usuarios.controller.js
│       ├── services/
│       │   └── stock.service.js # Cálculo dinámico de existencias
│       ├── middlewares/
│       │   └── errorHandler.js  # Manejo centralizado de errores
│       └── routes/              # Definición de endpoints
│
└── front/                       # SPA (React + Vite)
    └── src/
        ├── App.jsx              # Router principal
        ├── index.css            # Design system (tokens + scanner CSS)
        ├── api/client.js        # Axios configurado
        ├── store/               # Estado global (Zustand)
        ├── components/          # Componentes reutilizables
        ├── layouts/             # MainLayout con Navbar + BottomNav
        └── pages/               # Vistas por ruta
```

---

## 👨‍💻 Autores

| Alumno | Matrícula |
|--------|-----------|
| Jesús Suarez Licea | 24150047 |
| José Guadalupe García Castorena | 24150042 |

**Instituto Tecnológico de Aguascalientes**
Taller de Ingeniería de Software · Docente: Laura Cecilia Rodríguez Martínez
Abril 2026

---

<div align="center">
  <i>Desarrollado con altos estándares de ingeniería de software.</i>
</div>
