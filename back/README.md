# 🔧 SILPP — Backend API

API RESTful para el Sistema de Inventario por Lotes de Productos Perecederos.

---

## Ejecución

```bash
cp .env.example .env    # Configurar credenciales de BD
npm install
npm run dev             # Desarrollo con nodemon
npm start               # Producción
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `DB_HOST` | Host de MySQL/MariaDB | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de BD | `root` |
| `DB_PASSWORD` | Contraseña de BD | — |
| `DB_NAME` | Nombre de la BD | `inventario_silpp` |

---

## Guía de API

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login por ID de usuario |

```json
// Request
{ "id_usuario": 5 }

// Response 200
{
  "success": true,
  "user": {
    "id_usuario": 5,
    "nombre": "Ricardo López",
    "activo": true,
    "roles": "Operativo, Táctico",
    "id_rol": 1
  }
}
```

> ⚠️ **Nota:** La autenticación actual es simplificada (sin JWT). Ver sección de seguridad en el README raíz.

---

### Lotes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/lotes` | Registrar nuevo lote (transaccional) |
| `GET` | `/api/lotes/search` | Mega-búsqueda con filtros + paginación |
| `GET` | `/api/lotes/:id` | Expediente completo del lote |
| `GET` | `/api/lotes/:id/trazabilidad` | Timeline de movimientos |
| `GET` | `/api/lotes/ubicaciones` | Catálogo de ubicaciones |

#### `POST /api/lotes` — Registro de nuevo lote

```json
// Request
{
  "sku_id": "SKU-LECHE-001",
  "fecha_fabricacion": "2026-04-01",
  "fecha_caducidad": "2026-05-15",
  "status": "Disponible",
  "cantidad": 200,
  "id_usuario": 5
}

// Response 201
{
  "success": true,
  "data": {
    "id_lote": "LOT-20260505-A3FX",
    "sku_id": "SKU-LECHE-001",
    "status": "Disponible",
    "cantidad_ingresada": 200
  },
  "warning": null
}
```

**Operación transaccional (4 inserts atómicos):**
1. `INSERT INTO Lote` — Registro del lote
2. `INSERT INTO Entrada` — Folio de recepción
3. `INSERT INTO Existencia_Ubicacion` — Ubicación inicial (Recepción)
4. `INSERT INTO Historial_Movimiento` — Evento para stock dinámico

Si cualquier paso falla → `ROLLBACK` completo.

#### `GET /api/lotes/search` — Búsqueda universal

| Param | Tipo | Descripción |
|-------|------|-------------|
| `q` | string | Texto parcial en id_lote, SKU, EAN, nombre, marca, categoría, área |
| `status` | string | `Disponible` \| `Cuarentena` \| `Vencido` |
| `es_perecedero` | boolean | `true` \| `false` |
| `fecha_fin` | date | Lotes que vencen antes de esta fecha |
| `area` | number | ID de área |
| `page` | number | Página (default: 1) |
| `limit` | number | Resultados por página (default: 20, max: 100) |

---

### Escáner Híbrido

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/scan?code=` | Escaneo inteligente (auto-detecta tipo) |
| `GET` | `/api/scan/suggest?q=` | Sugerencias autocomplete (max 5) |

#### Lógica de detección automática

```
code = "LOT-20260505-A3FX"  → tipo: "lote"     (busca en Lote.id_lote)
code = "7501234567890"       → tipo: "producto"  (busca en CodigoBarras.codigo_ean)
code = "SKU-LECHE-001"      → tipo: "producto"  (busca en Producto.sku_id)
code = "xyz123"             → tipo: "no_encontrado"
```

---

### Productos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/productos/search?q=` | Búsqueda de productos |
| `GET` | `/api/productos/:sku` | Expediente de producto + lotes FEFO |

---

### Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/usuarios` | Listar usuarios con roles |
| `POST` | `/api/usuarios` | Crear usuario + asignar rol |
| `PATCH` | `/api/usuarios/:id/status` | Activar/desactivar usuario |
| `GET` | `/api/usuarios/roles` | Catálogo de roles |

---

### Health Check

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/health` | Verificar conexión a BD |

---

## Lógica del Stock Dinámico

El stock **nunca** se almacena como campo estático. Se calcula en tiempo real:

```sql
SELECT COALESCE(
  SUM(hm.qty_afectada * tm.factor), 0
) AS stock_actual
FROM Historial_Movimiento hm
JOIN TipoMovimiento tm ON hm.id_tipo = tm.id_tipo
WHERE hm.id_lote = ?
```

| TipoMovimiento | factor | Efecto |
|----------------|--------|--------|
| Entrada por Recepción | `+1` | Suma al stock |
| Salida a Exhibición | `-1` | Resta del stock |
| Merma por Daño | `-1` | Resta del stock |
| Ajuste Positivo (Auditoría) | `+1` | Corrección al alza |
| Ajuste Negativo (Auditoría) | `-1` | Corrección a la baja |
| Venta (POS) | `-1` | Resta del stock |

El servicio centralizado `stock.service.js` expone:
- `getStockByLote(idLote)` — Stock total
- `getStockByLoteAndUbicacion(idLote, idUbicacion)` — Stock por ubicación
- `getStockBySku(skuId)` — Stock desglosado por lote (FEFO)

---

## Nota Crítica: PascalCase en SQL

**Todas** las tablas usan PascalCase: `Lote`, `Producto`, `CodigoBarras`, `Historial_Movimiento`, etc.

MySQL en **Linux** es case-sensitive por defecto (`lower_case_table_names=0`). Usar minúsculas en las queries causará `Table not found`. El script `scriptCreacionDB.sql` en la raíz del proyecto crea las tablas con la convención correcta.

---

## Manejo de Errores

Todas las respuestas de error siguen el formato:

```json
{
  "success": false,
  "error": "Descripción del error."
}
```

| HTTP | Tipo | Ejemplo |
|------|------|---------|
| `400` | Validación | Campos faltantes, fechas inválidas |
| `404` | No encontrado | Lote o producto inexistente |
| `409` | Conflicto | Clave duplicada |
| `500` | Error interno | Bug no controlado |
