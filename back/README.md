# ⚙️ Backend SILPP (Node.js & Express)

Este repositorio contiene la API RESTful que actúa como el cerebro transaccional del Sistema de Inventario por Lotes de Productos Perecederos.

## 🧠 Lógica de Negocio y Trazabilidad

El backend de SILPP no es un simple CRUD. Implementa una lógica de negocio avanzada diseñada para almacenes de alto flujo:
- **Trazabilidad Dinámica:** No almacenamos un campo "stock_actual" estático propenso a desincronizaciones. El stock es un cálculo dinámico en tiempo real derivado de la agregación matemática de entradas y salidas en la tabla `Historial_Movimiento`.
- **Integridad Transaccional (ACID):** Operaciones complejas, como el ingreso de un lote, implican múltiples tablas (`Lote`, `Entrada`, `Existencia_Ubicacion`, `Historial_Movimiento`). El backend utiliza transacciones SQL (`BEGIN`, `COMMIT`, `ROLLBACK`) para garantizar que la base de datos jamás quede en un estado inconsistente.

## 🗄️ Estructura de Base de Datos SQL

La base de datos relacional está altamente normalizada para enfocarse en la rotación por lotes:

- **`Producto`**: Catálogo maestro con detalles como SKU, Código EAN y si es perecedero.
- **`Lote`**: El núcleo del sistema. Un producto puede tener muchos lotes. Almacena la `fecha_fabricacion` y `fecha_caducidad`.
- **`Ubicacion` / `Existencia_Ubicacion`**: Mapa tridimensional (Pasillo, Rack, Nivel). Permite saber exactamente cuántas unidades de qué lote están en qué coordenada física.
- **`Historial_Movimiento`**: Bitácora inmutable. Todo ingreso, salida, ajuste o merma genera un registro auditable vinculado al usuario que lo ejecutó.

## 🚀 Endpoints Principales

La API expone los siguientes recursos esenciales (todos devuelven respuestas estandarizadas en formato JSON):

### 🔐 Autenticación
- `POST /api/auth/login`
  - **Body:** `{ "id_usuario": 1 }` *(JWT pendiente de activación completa)*
  - **Uso:** Valida el usuario, comprueba si está activo y retorna su perfil con sus roles asignados concatenados.

### 📦 Catálogo de Productos
- `GET /api/productos/search?q={query}`
  - **Uso:** Buscador universal (SKU, nombre, EAN, marca). Esencial para la rápida identificación en el muelle de recepción.

### 🏷️ Gestión de Lotes
- `POST /api/lotes`
  - **Uso:** Registra de forma atómica la llegada de mercancía. Autogenera un ID único (`LOT-YYYYMMDD-XXXX`), lo asigna al Área de Recepción y genera el registro de historial.
- `GET /api/lotes/search`
  - **Uso:** Motor de consulta con soporte para filtros de "Power Search" (estados, próximos a vencer, etc.).
- `GET /api/lotes/:id`
  - **Uso:** Genera el "Expediente Clínico" del lote, calculando en tiempo real su stock total, sus coordenadas en almacén y los días restantes para caducar.

---

### 💻 Instalación Rápida

1. Instalar dependencias: `npm install`
2. Configurar base de datos: Renombrar `.env.example` a `.env` y configurar credenciales.
3. Iniciar servidor: `npm run dev` (utiliza nodemon) o `npm start`.
