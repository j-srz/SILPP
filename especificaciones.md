# Sistema de Inventario por Lotes de Productos Perecederos

**Instituto Tecnológico de Aguascalientes (ITA)**  
Taller de Ingeniería de Software · Docente: Laura Cecilia Rodríguez Martínez  
Autores: Jesús Suarez Licea (24150047) · José Guadalupe García Castorena (24150042)  
Fecha de entrega: 5 de abril de 2026 — Aguascalientes, Ags.

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Problemática a Resolver](#2-problemática-a-resolver)
3. [Objetivos y Metas del Sistema](#3-objetivos-y-metas-del-sistema)
4. [Limitaciones Conocidas](#4-limitaciones-conocidas)
5. [Usuarios y Roles](#5-usuarios-y-roles)
6. [Ámbito del Software](#6-ámbito-del-software)
7. [Funcionalidades Principales](#7-funcionalidades-principales)
8. [Casos de Uso](#8-casos-de-uso)
9. [Modelo de Dominio (Diagrama de Clases)](#9-modelo-de-dominio-diagrama-de-clases)
10. [Objetos de Contenido (UI)](#10-objetos-de-contenido-ui)
11. [Diagramas de Secuencia](#11-diagramas-de-secuencia)
12. [Análisis de Relación-Navegación](#12-análisis-de-relación-navegación)
13. [Errores y Correcciones Aplicadas](#13-errores-y-correcciones-aplicadas)
14. [Fuentes de Información](#14-fuentes-de-información)

---

## 1. Descripción General

**PerishTrack** *(nombre de referencia)* es una Web App especializada en la **gestión de inventario de productos perecederos por lotes**. A diferencia de un sistema de inventarios genérico, este software administra el stock vinculando cada unidad a su **lote y fecha de caducidad**. Su pieza central es el **Algoritmo de Despacho por Caducidad Crítica**: una lógica automática que siempre prioriza la salida del lote con menor tiempo de vida útil restante, minimizando la merma por vencimiento.

El sistema **no es un punto de venta (POS)**. Se enfoca exclusivamente en la logística interna: recepción, almacenamiento, rotación y retiro de mercancía. La interacción con cajas o cobros es indirecta, a través de una sincronización unidireccional con el POS.

---

## 2. Problemática a Resolver

Este proyecto nació de la experiencia directa de sus autores en empresas del sector retail (Soriana), donde identificaron dos causas raíz de pérdidas operativas:

### 2.1 Mala rotación de stock

El personal despacha productos sin seguir ningún criterio de caducidad. Los lotes más antiguos quedan en el fondo del anaquel mientras se venden los nuevos, hasta que los primeros vencen.

> *"Las buenas políticas de inventario pierden sentido si la administración no sabe qué hay disponible. La exactitud de los registros permite enfocarse en los artículos más necesarios."*

### 2.2 Desincronización entre inventario lógico y físico

El sistema registra existencias que físicamente ya no están (por merma no reportada, robo, o error de captura), o no registra existencias que sí existen (por entradas sin capturar). Esta brecha hace que las alertas y decisiones operativas sean incorrectas.

### 2.3 Ausencia de trazabilidad

Cuando un producto vence o genera una queja de calidad, no existe un mecanismo para rastrear su origen, lote, proveedor, ni la cadena de personas que lo manipularon. Esto impide hacer reclamos a proveedores o identificar responsabilidades.

---

## 3. Objetivos y Metas del Sistema

### Objetivos principales

| # | Objetivo |
|---|----------|
| 1 | Garantizar la rotación FEFO *(First Expired, First Out)* mediante el Algoritmo de Despacho por Caducidad Crítica. |
| 2 | Sincronizar el inventario lógico con el físico a través de auditorías cíclicas, reportes de merma y ajustes manuales. |
| 3 | Proveer trazabilidad completa de cada lote: desde su recepción hasta su venta, merma o retiro. |
| 4 | Restringir las acciones críticas (ajustes, bloqueos, configuración) a usuarios con el rol adecuado. |

### Metas informativas

- Visualizar el estado del inventario priorizando los lotes gestionados por el algoritmo.
- Proveer reportes de trazabilidad que muestren el historial completo, movimientos y usuarios que interactuaron con cada lote.
- Respaldar incidencias físicas del inventario (evidencia fotográfica de daños y rechazos).

### Metas aplicables

- **Gestión de flujos:** Registrar entradas, salidas y reubicaciones entre Almacén y Exhibición de manera precisa.
- **Automatización logística:** Ejecutar el algoritmo FEFO para asignar automáticamente qué lote debe salir primero.
- **Control de integridad:** Sincronizar inventario lógico y físico mediante auditorías cíclicas y registro de mermas.
- **Seguridad operativa:** Restringir funciones según el rol del usuario, evitando ajustes no autorizados.

---

## 4. Limitaciones Conocidas

Estas limitaciones no son errores del sistema; son decisiones de diseño deliberadas que deben estar claras para todos los involucrados.

| Limitación | Descripción | Impacto |
|------------|-------------|---------|
| **No es un POS** | El sistema no procesa pagos ni gestiona transacciones de venta al público. Solo recibe datos del POS externo. | Requiere integración con un POS ya existente. |
| **Dependencia de disciplina operativa** | La efectividad del sistema es directamente proporcional a la disciplina del personal al registrar entradas, mermas y movimientos. | Un registro deficiente produce alertas incorrectas y toma de decisiones errónea. |
| **Requiere conectividad constante** | El sistema necesita conexión permanente a la base de datos para garantizar que el stock mostrado sea real y actualizado. | No funciona en modo offline. |
| **Autenticación obligatoria** | Todas las operaciones requieren un usuario autenticado. Sin control de acceso robusto, las fechas de caducidad y ajustes de stock son vulnerables a alteraciones no autorizadas. | Incrementa la fricción para el usuario pero es no negociable. |
| **Inventario negativo posible** | Si el POS reporta una venta mayor a las existencias registradas en Exhibición, el sistema puede dejar el stock en cero o negativo, generando una alerta crítica. Esto no se previene automáticamente, sino que se detecta y escala. | Requiere revisión manual por el usuario Táctico. |
| **Criterio de desempate único** | Cuando dos lotes tienen la misma fecha de caducidad, el algoritmo prioriza por orden de registro en el sistema. Esto asume rotación física homogénea, lo cual puede no cumplirse siempre. | Posible imprecisión en escenarios de alta rotación con lotes simultáneos. |

---

## 5. Usuarios y Roles

El sistema permite asignar **múltiples roles a un mismo usuario**, facilitando funciones híbridas según la necesidad operativa.

### 5.1 Operativo

**Perfil:** Personal de piso del almacén o área de recepción.  
**Responsabilidad:** Capturar la realidad física del almacén en el sistema.

| Función | Descripción |
|---------|-------------|
| Registrar entradas de lote | SKU, cantidad, fecha de fabricación, fecha de caducidad. |
| Ejecutar salidas a Exhibición | Siguiendo las sugerencias del algoritmo. |
| Reportar mermas | Productos dañados, vencidos o consumidos sin registro. |
| Reubicar lotes internamente | Actualizar coordenadas físicas (pasillo, rack, nivel). |
| Rechazar mercancía en recepción | Registrar y documentar la devolución al proveedor. |

### 5.2 Táctico

**Perfil:** Supervisores de área o jefes de piso.  
**Responsabilidad:** Toma de decisiones operativas basada en los datos del sistema.

| Función | Descripción |
|---------|-------------|
| Monitorear el panel de alertas | Identificar productos con caducidad crítica. |
| Bloquear y desbloquear lotes | Poner en cuarentena lotes bajo sospecha de contaminación. |
| Configurar el algoritmo de salida | Ajustar parámetros por categoría de producto. |
| Ejecutar el cierre mensual | Generar el Reporte de Eficiencia Logística. |

### 5.3 Auditor

**Perfil:** Responsable de integridad del inventario y control de accesos.  
**Responsabilidad:** Garantizar que el inventario lógico coincida con el físico.

| Función | Descripción |
|---------|-------------|
| Realizar auditorías cíclicas | Conteo físico y reconciliación con el sistema. |
| Consultar trazabilidad de lotes | Historial completo de un lote por número de lote o SKU. |
| Generar reportes diarios | Resumen de todas las transacciones de las últimas 24 horas. |
| Administrar accesos | Asignar, modificar o desactivar roles de usuarios. |

---

## 6. Ámbito del Software

### 6.1 Entidades externas

| Entidad | Tipo | Relación con el sistema |
|---------|------|------------------------|
| **Base de Datos** | Sistema | Almacena de forma persistente el catálogo, lotes y movimientos. |
| **Sistema POS** | Sistema externo | Envía al sistema eventos de venta y devolución en tiempo real. |
| **Proveedor** | Organización | Origen de los lotes y sus datos (fechas, cantidades). |
| **Usuarios** (tres roles) | Personas | Interactúan con el sistema según sus privilegios. |

### 6.2 Datos de entrada y salida

**Entradas capturadas por el Operativo:**

- SKU del producto
- Cantidad de piezas recibidas
- Fecha de fabricación
- Fecha de caducidad
- Número de lote del proveedor
- Ubicación física de almacenamiento (pasillo, rack, nivel)

**Salidas que el sistema genera:**

- Panel de alertas de caducidad crítica (Dashboard)
- Reportes de trazabilidad por lote (PDF/Excel)
- Reporte diario de movimientos (PDF/Excel)
- Reporte de eficiencia logística mensual
- Comprobantes de rechazo de mercancía
- Alertas de stock mínimo y stock en cero

### 6.3 El Algoritmo de Despacho por Caducidad Crítica

El núcleo funcional del sistema. Ordena los lotes disponibles de menor a mayor fecha de caducidad y siempre sugiere despachar primero el de menor tiempo restante.

**Regla de desempate:** Si dos o más lotes tienen la misma fecha de caducidad, el algoritmo prioriza por **orden de registro** (el que entró primero al sistema sale primero). Esta regla asume rotación física homogénea en el piso de venta.

**Características de rendimiento del algoritmo:**

| Característica | Requisito |
|----------------|-----------|
| **Integridad transaccional** | Si el registro de salida falla, el stock no debe verse afectado (operaciones atómicas). |
| **Concurrencia** | Debe soportar múltiples usuarios registrando operaciones simultáneas sobre el mismo producto sin generar duplicados ni descuentos incorrectos. |
| **Tiempo de respuesta** | Las consultas de alertas de caducidad deben procesarse en milisegundos para no interrumpir la operación del almacén. |

---

## 7. Funcionalidades Principales

### Módulo 1 — Gestión de Almacén (Flujo Operativo)

- Registrar entrada de nuevo lote al almacén.
- Ejecutar salida de almacén a exhibición (guiado por el algoritmo).
- Reportar merma por producto dañado.
- Dar de baja un lote por caducidad vencida.
- Rechazar mercancía en el muelle de recepción.
- Reubicar internamente un lote entre zonas del almacén.

### Módulo 2 — Supervisión y Control (Flujo Táctico)

- Consultar existencias totales de un producto (stock consolidado).
- Ver el resumen comparativo Almacén vs. Exhibición.
- Localizar la ubicación física de un lote específico.
- Visualizar el panel de alertas de caducidad (Dashboard).
- Bloquear un lote por calidad (cuarentena).
- Desbloquear un lote tras revisión de calidad.
- Configurar los parámetros del algoritmo de salida.
- Ejecutar el cierre mensual de inventario.

### Módulo 3 — Auditoría y Trazabilidad

- Realizar auditoría cíclica de piso de venta.
- Consultar la línea de tiempo completa de trazabilidad de un lote.
- Generar el reporte diario de movimientos.
- Gestionar el control de acceso por roles.

### Módulo 4 — Sincronización con el POS

- Recibir y procesar registros de ventas del POS (descuento automático de stock).
- Recibir y procesar devoluciones de clientes del POS.

---

## 8. Casos de Uso

### Módulo 1 — Gestión de Almacén

---

#### UC-1.1 · Salida de Almacén a Exhibición

| Campo | Detalle |
|-------|---------|
| **Tipo** | Básico |
| **Actores** | Operativo, Sistema |
| **Objetivo** | Trasladar el lote óptimo (el más próximo a vencer) del almacén al piso de venta. |
| **Precondición** | El producto tiene stock disponible en almacén. |
| **Pre-estado** | Las piezas en Exhibición están por debajo del mínimo definido por el Táctico. |
| **Post-estado** | Las piezas en Exhibición alcanzan el nivel óptimo. |
| **Efectos** | Actualización de stock en Almacén y Exhibición; nuevo evento en el historial de trazabilidad. |

**Flujo principal:**

1. El Operativo busca el producto por SKU (escaneado o manual) o por nombre.
2. El sistema aplica el algoritmo y muestra el lote con fecha más próxima y su ubicación física.
3. El Operativo confirma la cantidad de piezas a mover.
4. El sistema descuenta de Almacén y suma a Exhibición.

**Subflujo S-1 — División por múltiples lotes:** Si el lote óptimo no cubre la cantidad necesaria, el sistema guía al Operativo para completar el traslado con el siguiente lote más próximo a vencer.

**Excepciones:**

| Código | Situación | Acción del sistema |
|--------|-----------|--------------------|
| E-1 | SKU incorrecto o inexistente | Informa el error y solicita nueva búsqueda. |
| E-2 | Stock insuficiente en almacén | Muestra el stock disponible real y no permite continuar. |
| E-3 | Lote no encontrado físicamente | El Operativo lo reporta; el sistema marca el lote como "Extraviado / En Revisión". |

---

#### UC-1.2 · Ingreso de Nuevo Lote a Almacén

| Campo | Detalle |
|-------|---------|
| **Tipo** | Básico |
| **Actores** | Operativo, Sistema |
| **Objetivo** | Registrar la entrada de mercancía nueva garantizando la integridad de las fechas. |
| **Precondición** | El SKU del producto existe en el catálogo global del sistema. |
| **Pre-estado** | Existe mercancía física recibida sin integrar al inventario lógico. |
| **Post-estado** | El lote queda en estatus "Pendiente de Acomodo" en la Zona de Recepción, disponible para el algoritmo. |
| **Efectos** | Incremento del stock global; creación de nuevo registro de lote; evento en historial de trazabilidad. |

**Flujo principal:**

1. El Operativo busca el producto por SKU o nombre.
2. Ingresa fecha de fabricación y fecha de caducidad del lote.
3. Ingresa la cantidad total de piezas recibidas.
4. El sistema registra la entrada y el lote queda disponible para el algoritmo.

**Subflujos:**

- **S-1 — Múltiples lotes por entrega:** Si el mismo producto llega con fechas de caducidad distintas, el sistema permite registrar cada grupo como un lote independiente en el mismo proceso.
- **S-2 — Impresión de etiquetas:** El sistema genera etiquetas con el ID de lote y fecha de caducidad para etiquetado físico en anaquel.

**Excepciones:**

| Código | Situación | Acción del sistema |
|--------|-----------|--------------------|
| E-1 | Fecha de caducidad igual o anterior a la fecha actual | El sistema bloquea el ingreso automáticamente. El lote no puede entrar al inventario. |
| E-2 | Fecha de fabricación posterior a la de caducidad | El sistema impide guardar y solicita corrección. |

---

#### UC-1.3 · Reporte de Merma por Producto Dañado

| Campo | Detalle |
|-------|---------|
| **Tipo** | Básico |
| **Actores** | Operativo, Sistema |
| **Objetivo** | Registrar la baja de piezas no aptas para la venta y mantener el stock sincronizado con la realidad física. |
| **Precondición** | El lote tiene existencias activas en el sistema. |
| **Pre-estado** | Existe mercancía dañada que aún figura como disponible. |
| **Post-estado** | El stock del lote se actualiza; las piezas quedan fuera del inventario y se registra la pérdida. |
| **Efectos** | Disminución del stock; actualización del valor de pérdidas; posible alerta de reabastecimiento. |

**Flujo principal:**

1. El Operativo detecta un producto dañado y lo busca en el sistema por SKU o nombre.
2. El sistema muestra los lotes disponibles del producto y sus ubicaciones.
3. El Operativo selecciona el lote afectado e ingresa la cantidad de piezas dañadas.
4. El sistema descuenta las piezas y las registra como merma operativa.

**Subflujos:**

- **S-1 — Baja total de lote:** Si el daño es total (caída de tarima, derrame), el sistema permite "Baja Total de Lote" sin capturar pieza por pieza.
- **S-2 — Evidencia fotográfica:** El sistema permite adjuntar una fotografía del daño como respaldo documental.

**Excepciones:**

| Código | Situación | Acción del sistema |
|--------|-----------|--------------------|
| E-1 | Cantidad reportada mayor al stock del lote | El sistema bloquea la acción y solicita verificar la cantidad. |
| E-2 | Lote no presente en el área indicada | El sistema pide corregir la ubicación del reporte. |

---

#### UC-1.4 · Baja de Lote por Caducidad Vencida

| Campo | Detalle |
|-------|---------|
| **Tipo** | Básico |
| **Actores** | Operativo, Sistema |
| **Objetivo** | Retirar definitivamente del stock los productos que alcanzaron su fecha de expiración. |
| **Precondición** | El lote ha llegado a su fecha límite. El sistema lo detecta automáticamente. |
| **Pre-estado** | El sistema ha bloqueado el lote para el algoritmo y lo marca "Pendiente de Retiro". |
| **Post-estado** | El lote queda fuera del stock; se genera un registro de merma por caducidad. |
| **Efectos** | Ajuste del stock global; reporte de discrepancias si la cantidad física difiere de la esperada; actualización de indicadores de eficiencia. |

**Flujo principal:**

1. El sistema detecta la caducidad y emite una alerta con: Producto, N.° de Lote, Ubicación y Cantidad Esperada.
2. El Operativo se traslada a la ubicación física y cuenta las piezas del lote vencido.
3. El Operativo ingresa la Cantidad Real encontrada.
4. El sistema compara real vs. esperado.
5. El Operativo confirma el retiro; el sistema procesa la baja.

**Subflujos:**

- **S-1 — Registro de discrepancia:** Si la cantidad real difiere de la esperada, el sistema solicita el motivo antes de ajustar el inventario a cero.
- **S-2 — Destino de la mercancía:** El sistema indica si el producto debe ir a destrucción, devolución al proveedor o contenedor de merma.

---

#### UC-1.5 · Rechazo de Mercancía en la Recepción

| Campo | Detalle |
|-------|---------|
| **Tipo** | Básico |
| **Actores** | Operativo, Sistema |
| **Objetivo** | Evitar el ingreso de mercancía vencida, dañada o fuera de temperatura desde el muelle de carga. |
| **Precondición** | Existe una orden de compra o aviso de entrega del proveedor en el sistema. |
| **Pre-estado** | El producto está en el transporte, pendiente de descarga. |
| **Post-estado** | Se genera un folio de rechazo; el stock no se ve afectado por las piezas rechazadas. |
| **Efectos** | Notificación automática al área de compras para gestión de nota de crédito o reenvío. |

**Flujo principal:**

1. El Operativo detecta la anomalía durante la descarga.
2. Registra los datos del lote y marca la entrada como "No Aceptada".
3. El sistema genera un comprobante de rechazo para el transportista.
4. Las piezas rechazadas no ingresan al stock disponible para el algoritmo.

**Subflujos:**

- **S-1 — Registro de evidencia:** El sistema permite adjuntar fotografía del daño o lectura del termómetro del transporte.
- **S-2 — Rechazo parcial:** Si solo una parte del pedido está en mal estado, el sistema permite dar entrada a las piezas aceptables y rechazar el resto en el mismo proceso.

---

#### UC-1.6 · Reubicación Interna de Lote

| Campo | Detalle |
|-------|---------|
| **Tipo** | Básico |
| **Actores** | Operativo, Sistema |
| **Objetivo** | Actualizar la ubicación lógica de un lote cuando se mueve físicamente dentro del almacén. |
| **Precondición** | El lote existe y tiene una ubicación asignada en el sistema. |
| **Pre-estado** | El lote está registrado en una ubicación "A". |
| **Post-estado** | El lote queda registrado en la ubicación "B". |
| **Efectos** | Ninguno sobre el stock global; solo actualización de coordenadas. |

**Flujo principal:**

1. El Operativo busca el lote en el sistema por SKU o nombre.
2. El sistema muestra la ubicación actual y la cantidad disponible.
3. El Operativo mueve el lote físicamente y captura las nuevas coordenadas en el sistema.
4. El sistema valida la compatibilidad de la nueva ubicación con el tipo de producto (zona fría vs. zona seca) y actualiza el registro.

**Subflujos:**

- **S-1 — Sugerencia de espacio:** Si el Operativo no sabe dónde colocar el lote, el sistema sugiere espacios vacíos compatibles.

**Excepciones:**

| Código | Situación | Acción del sistema |
|--------|-----------|--------------------|
| E-1 | La ubicación destino ya está ocupada | El sistema alerta "colisión de ubicación". |
| E-2 | Incompatibilidad de zona | El sistema bloquea el movimiento (ej.: producto refrigerado → zona seca). |

---

### Módulo 2 — Supervisión y Control

---

#### UC-2.1 · Consulta de Existencias (Stock)

**Actores:** Operativo, Táctico · **Tipo:** Consulta  
**Objetivo:** Conocer la cantidad total disponible de un producto en tiempo real.

**Flujo:** El usuario busca el producto → el sistema identifica todos los lotes activos del SKU → suma las piezas por ubicación → muestra el resultado en pantalla.

**Excepciones:** SKU no encontrado / Stock en cero (resaltado visualmente). Ninguna de las dos modifica la base de datos.

---

#### UC-2.2 · Resumen de Stock (Almacén vs. Exhibición)

**Actores:** Operativo, Táctico · **Tipo:** Consulta  
**Objetivo:** Comparar la distribución del stock entre la bodega y el piso de venta para facilitar decisiones de reabastecimiento.

**Flujo:** El usuario busca el producto → el sistema filtra los lotes por ubicación lógica → muestra los totales de Almacén y Exhibición en formato gráfico o numérico comparativo.

---

#### UC-2.3 · Consulta de Ubicación de un Lote

**Actores:** Operativo, Táctico · **Tipo:** Consulta  
**Objetivo:** Localizar físicamente un lote específico mediante sus coordenadas en el almacén.

**Flujo:** El usuario busca por N.° de Lote, SKU o nombre → el sistema despliega las coordenadas exactas (Pasillo, Rack, Nivel) o el área lógica actual (Recepción, Exhibición, Cuarentena).

**Excepciones:** Lote dado de baja (sin registro vigente) / Lote sin ubicación asignada aún ("Pendiente de Acomodo").

---

#### UC-2.4 · Visualización del Panel de Alertas de Caducidad

**Actores:** Táctico · **Tipo:** Consulta / Monitoreo  
**Objetivo:** Identificar en tiempo real qué productos representan un riesgo inminente de merma.

**Flujo:** El Táctico ingresa al Dashboard → el sistema filtra los lotes con caducidad dentro del umbral configurado → presenta la lista jerarquizada por criticidad con indicadores de color.

**Excepción:** Si no hay lotes críticos, el sistema muestra "Inventario Saludable".

---

#### UC-2.5 · Bloqueo de Lote (Cuarentena)

**Actores:** Táctico · **Tipo:** Básico  
**Objetivo:** Aislar un lote bajo sospecha de contaminación o defecto para impedir su comercialización.

**Flujo:** El Táctico localiza el lote → activa "Bloqueo por Calidad" → el sistema inhabilita el lote para el algoritmo y para todas las operaciones de los Operativos → para las piezas ya en Exhibición, genera una alerta de retiro.

**Post-estado:** El lote tiene estatus "En Cuarentena / Bloqueado". Las piezas siguen contando en el stock global pero no son seleccionables para ningún proceso.

---

#### UC-2.6 · Desbloqueo de Lote tras Revisión de Calidad

**Actores:** Táctico · **Tipo:** Básico  
**Objetivo:** Reincorporar al flujo operativo un lote que fue previamente bloqueado y ha sido validado.

**Flujo:** El Táctico localiza el lote en cuarentena → confirma que pasó la revisión de calidad → selecciona "Desbloquear Lote" → el sistema cambia el estatus a "Disponible" y el algoritmo vuelve a considerarlo.

---

#### UC-2.7 · Configuración de Reglas del Algoritmo de Salida

**Actores:** Táctico · **Tipo:** Básico  
**Objetivo:** Personalizar el comportamiento del algoritmo por categoría de producto.

**Flujo:** El Táctico accede a la configuración → define los parámetros de prioridad por categoría → el sistema guarda las reglas y recalcula las sugerencias de salida activas.

**Subflujo S-1 — Copia de reglas:** El sistema permite copiar la configuración de una categoría a otra para agilizar el alta.

**Post-estado:** Las nuevas reglas se aplican de inmediato; el Dashboard y las sugerencias de salida se actualizan.

---

#### UC-2.8 · Cierre Mensual de Inventario

**Actores:** Táctico · **Tipo:** Básico  
**Objetivo:** Generar un balance del periodo para ajustar estrategias de compra y parámetros del algoritmo.

**Flujo:** El Táctico inicia el "Cierre Mensual" → el sistema consolida entradas, ventas y mermas del mes → calcula el Índice de Eficiencia del Algoritmo → el Táctico valida → el sistema genera el Reporte de Eficiencia Logística, bloquea la edición del periodo y reinicia los contadores.

---

### Módulo 3 — Auditoría y Trazabilidad

---

#### UC-3.1 · Auditoría Cíclica de Piso de Venta

**Actores:** Auditor, Sistema · **Tipo:** Auditoría  
**Objetivo:** Verificar que las existencias lógicas del sistema coincidan con las físicas mediante conteo cíclico.

> El conteo cíclico es la práctica de verificar un subconjunto del inventario de forma periódica, en lugar de esperar a un inventario general anual.

**Flujo:**

1. El Auditor selecciona el sector y busca el primer producto.
2. El sistema despliega los lotes y cantidades esperadas en esa ubicación.
3. El Auditor ingresa las cantidades físicas reales contadas por lote.
4. El sistema compara y genera un reporte de diferencias.
5. El Auditor confirma el ajuste; el sistema marca el sector como "Verificado".

**Excepción E-1 — Hallazgo de lote caducado:** El sistema obliga a registrar la baja del lote caducado (UC-1.4) antes de permitir cerrar la auditoría del sector.

---

#### UC-3.2 · Consulta de Trazabilidad de Lote

**Actores:** Auditor · **Tipo:** Consulta  
**Objetivo:** Visualizar el historial cronológico completo de todos los eventos de un lote.

**Flujo:** El Auditor busca el lote → el sistema despliega la línea de tiempo: fecha de entrada, movimientos entre áreas, ventas, mermas, bloqueos y el usuario responsable en cada evento → muestra el estatus final o la ubicación actual de las piezas restantes.

**Subflujo S-1 — Exportación de evidencia:** El sistema genera un PDF del historial completo para reclamos al proveedor.

---

#### UC-3.3 · Generación de Reporte Diario de Movimientos

**Actores:** Auditor · **Tipo:** Básico  
**Objetivo:** Consolidar todas las transacciones del día en un documento auditable.

**Flujo:** El Auditor solicita el reporte → el sistema analiza todas las transacciones del período → presenta el balance de entradas, salidas y ajustes → el Auditor valida y exporta el reporte (PDF o Excel).

---

#### UC-3.4 · Control de Acceso por Roles

**Actores:** Auditor · **Tipo:** Administración  
**Objetivo:** Gestionar los permisos del personal para proteger la integridad del inventario.

**Flujo:** El Auditor selecciona a un usuario → asigna o modifica roles (Operativo, Táctico, Auditor) → el sistema actualiza los permisos en tiempo real y genera un log de auditoría del cambio.

**Subflujo S-1 — Baja de empleado:** El Auditor desactiva la cuenta; el sistema bloquea el acceso inmediatamente sin borrar el historial de acciones pasadas del usuario.

**Excepción E-1 — Último Administrador:** El sistema impide que el Auditor se autodegrade si es el único con nivel "Auditor" activo, evitando un bloqueo total del sistema.

---

### Módulo 4 — Sincronización con el POS

---

#### UC-4.1 · Registro de Devolución de Cliente

**Actores:** Sistema (automático) · **Tipo:** Integración  
**Objetivo:** Reintegrar mercancía devuelta al inventario manteniendo la trazabilidad del lote original.

**Flujo:**

1. El POS reporta la devolución (SKU + Cantidad).
2. El sistema identifica el lote original de la venta.
3. Asigna las piezas al "Área de Devoluciones" con estatus "En Revisión".
4. Actualiza el stock global pero bloquea estas unidades para el algoritmo (no regresan automáticamente a Exhibición).

---

#### UC-4.2 · Sincronización Automática de Ventas

**Actores:** Sistema (automático) · **Tipo:** Integración  
**Objetivo:** Descontar del stock de Exhibición las piezas vendidas en caja, aplicando el criterio FEFO.

**Flujo:**

1. El POS reporta la venta (SKU + Cantidad).
2. El sistema localiza todos los lotes del producto en Exhibición.
3. Ordena los lotes por fecha de caducidad (más próxima primero).
4. Descuenta las piezas del lote más antiguo aplicando el algoritmo.
5. Actualiza el stock global y registra el evento en el historial.

**Subflujo S-1 — Descuento multi-lote:** Si la cantidad vendida supera las piezas del lote más antiguo, el sistema agota ese lote y continúa restando del siguiente.

**Excepción E-1 — Venta en negativo:** Si el POS reporta más piezas de las existentes en Exhibición, el sistema deja el stock en cero o negativo y genera una **Alerta Crítica de Auditoría** para revisión por el Táctico.

---

## 9. Modelo de Dominio (Diagrama de Clases)

### 9.1 Tabla de conceptos del dominio

| Categoría | Concepto(s) |
|-----------|-------------|
| Objetos físicos o tangibles | Producto, Lote |
| Especificaciones o descripciones | SKU |
| Lugares | Almacén, Exhibición, Área de Descarga, Área de Devoluciones, Ubicación |
| Transacciones | Entrada, Venta, Devolución, Merma |
| Roles de personas | Operativo, Táctico, Auditor |
| Contenedores | Catálogo |
| Sistemas externos | Sistema POS |
| Conceptos abstractos | Cuarentena |
| Organizaciones | Proveedor |
| Eventos | Auditoría Cíclica |
| Procesos | Algoritmo de Despacho por Caducidad Crítica |
| Reglas y políticas | Regla de Prioridad |
| Documentos y registros | Reporte Diario de Movimientos, Historial de Trazabilidad, Comprobante de Rechazo, Reporte de Eficiencia |

### 9.2 Clases y atributos

#### `Producto`
| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `sku` | String (PK) | Código único del producto. |
| `nombre` | String | Nombre comercial. |
| `descripcion` | String | Descripción adicional. |

#### `Lote`
| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `numeroLote` | String (PK) | Identificador único del lote. |
| `fechaFabricacion` | Date | Fecha de fabricación. |
| `fechaCaducidad` | Date | Fecha de vencimiento. Debe ser > fechaFabricacion. |
| `cantidadDisponible` | Integer | Piezas activas en el sistema. |
| `estatus` | Enum | `Disponible`, `Cuarentena`, `Pendiente de Acomodo`, `Pendiente de Retiro`, `Extraviado`, `Cerrado` |
| `fechaRegistro` | DateTime | Usada para el desempate del algoritmo. |

#### `Ubicacion`
| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `area` | Enum | `Almacén`, `Exhibición`, `Recepción`, `Devoluciones`, `Cuarentena` |
| `pasillo` | String | Identificador del pasillo. |
| `rack` | String | Identificador del rack. |
| `nivel` | String | Nivel dentro del rack. |

#### `Entrada`
| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `folio` | String (PK) | Número de folio de la entrada. |
| `fecha` | Date | Fecha de recepción. |
| `estatus` | Enum | `Aceptada`, `Rechazada` |

#### `Venta`
| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `fecha` | Date | Fecha de la venta. |
| `hora` | Time | Hora de la venta. |

#### `DetalleVenta` *(línea de venta)*
| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `cantidad` | Integer | Piezas vendidas del lote. |
| `precioUnitario` | Decimal | Precio por pieza al momento de la venta. |

#### `Merma`
| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `fecha` | Date | Fecha del registro de merma. |
| `motivo` | Enum | `Daño Físico`, `Caducidad`, `Pérdida`, `Otro` |
| `cantidad` | Integer | Piezas dadas de baja. |

#### `Usuario`
| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `idUsuario` | String (PK) | Identificador único. |
| `nombre` | String | Nombre completo. |
| `rol` | Enum (multi) | `Operativo`, `Táctico`, `Auditor` (puede tener más de uno). |
| `activo` | Boolean | Indica si la cuenta está habilitada. |

---

## 10. Objetos de Contenido (UI)

Estos son los componentes visuales principales que debe implementar la interfaz.

### Panel de Alertas — Dashboard

Diseñado para el usuario Táctico. Combina gráficas de pastel o barras para mostrar la proporción de inventario "Saludable" vs. "Crítico", con indicadores de color tipo semáforo (verde / amarillo / rojo). Los SKUs y lotes que requieren salida inmediata se destacan visualmente según la urgencia calculada por el algoritmo.

### Catálogo Visual de Productos

Interfaz de consulta rápida que combina miniatura del empaque, descripción técnica y código SKU. Facilita la identificación en pasillos sin necesidad de memorizar códigos.

### Línea de Tiempo de Trazabilidad

Vista cronológica e inmutable del historial completo de un lote. Muestra qué usuario lo ingresó, movió, bloqueó o vendió, con fecha, hora y área física en cada evento.

### Reportes Exportables

Documentos estáticos descargables (PDF o Excel) para el cierre mensual y el reporte diario de movimientos. Diseñados para impresión o análisis financiero externo.

### Evidencia de Incidencias

Repositorio de imágenes adjunto a los registros de merma y rechazo. Permite almacenar y visualizar fotografías capturadas por el Operativo para respaldar reclamos ante proveedores.

---

## 11. Diagramas de Secuencia

Los diagramas de secuencia muestran qué clases del dominio participan en cada paso de un caso de uso. Las celdas marcadas con ✓ indican participación activa de esa clase.

### Módulo 1 — Gestión de Almacén

#### UC-1.1 · Salida de Almacén a Exhibición

| Paso | Producto | Lote | Ubicación | Merma | Entrada | Usuario |
|------|:--------:|:----:|:---------:|:-----:|:-------:|:-------:|
| Operativo busca el producto | ✓ | | | | | ✓ |
| Sistema aplica el algoritmo | | ✓ | | | | |
| Sistema indica lote y ubicación | | ✓ | ✓ | | | |
| Operativo confirma la cantidad | | | | | | ✓ |
| Sistema actualiza stock | | ✓ | ✓ | | | |
| **S-1** División multi-lote | | ✓ | ✓ | | | ✓ |

#### UC-1.2 · Ingreso de Nuevo Lote

| Paso | Producto | Lote | Ubicación | Merma | Entrada | Usuario |
|------|:--------:|:----:|:---------:|:-----:|:-------:|:-------:|
| Operativo busca el producto | ✓ | | | | | ✓ |
| Operativo ingresa fechas del lote | | ✓ | | | | ✓ |
| Operativo ingresa cantidad | | | | | ✓ | ✓ |
| Sistema registra la entrada | ✓ | | | | ✓ | |
| **S-1** Múltiples lotes | ✓ | | | | ✓ | ✓ |
| **S-2** Impresión de etiquetas | ✓ | | | | | ✓ |

#### UC-1.3 · Reporte de Merma por Daño

| Paso | Producto | Lote | Ubicación | Merma | Entrada | Usuario |
|------|:--------:|:----:|:---------:|:-----:|:-------:|:-------:|
| Operativo detecta el daño | | | | | | ✓ |
| Operativo busca el producto | ✓ | | | | | ✓ |
| Sistema muestra lotes y ubicaciones | | ✓ | ✓ | | | |
| Operativo selecciona el lote | | ✓ | | | | ✓ |
| Operativo ingresa cantidad dañada | | ✓ | | ✓ | | ✓ |
| Sistema descuenta y registra la merma | | ✓ | | ✓ | | |

#### UC-1.4 · Baja por Caducidad Vencida

| Paso | Producto | Lote | Ubicación | Merma | Entrada | Usuario |
|------|:--------:|:----:|:---------:|:-----:|:-------:|:-------:|
| Sistema detecta la caducidad y emite alerta | ✓ | ✓ | ✓ | | | |
| Operativo se traslada a la ubicación | | | ✓ | | | ✓ |
| Operativo cuenta las piezas físicas | ✓ | | | | | ✓ |
| Operativo ingresa la cantidad real | | | | | | ✓ |
| Sistema compara real vs. esperado | | ✓ | | | | |
| Operativo confirma el retiro | ✓ | | | ✓ | | ✓ |

### Módulo 2 — Supervisión y Control

#### UC-2.4 · Panel de Alertas de Caducidad

| Paso | Producto | Lote | Ubicación | Merma | Entrada | Usuario |
|------|:--------:|:----:|:---------:|:-----:|:-------:|:-------:|
| Táctico ingresa al Dashboard | | | | | | ✓ |
| Sistema filtra lotes críticos | | ✓ | | | | |
| Táctico visualiza productos en riesgo | ✓ | | | | | ✓ |

#### UC-2.8 · Cierre Mensual

| Paso | Producto | Lote | Ubicación | Merma | Entrada | Usuario |
|------|:--------:|:----:|:---------:|:-----:|:-------:|:-------:|
| Táctico inicia el cierre mensual | | | | | | ✓ |
| Sistema consolida entradas, ventas y mermas | | | | ✓ | ✓ | |
| Sistema calcula el Índice de Eficiencia | | | | | | |
| Táctico valida y el sistema genera reporte | | | | | | ✓ |
| Sistema bloquea edición y reinicia contadores | | | | ✓ | ✓ | |

### Módulo 4 — Sincronización con el POS

#### UC-4.2 · Sincronización Automática de Ventas

| Paso | Producto | Lote | Ubicación | Venta | Det. Venta | Merma | Entrada | Usuario |
|------|:--------:|:----:|:---------:|:-----:|:----------:|:-----:|:-------:|:-------:|
| Sistema recibe la venta del POS | ✓ | | | ✓ | ✓ | | | |
| Sistema localiza lotes en Exhibición | | ✓ | | | | | | |
| Sistema ordena lotes por caducidad | | ✓ | ✓ | | | | | |
| Sistema aplica el algoritmo y descuenta | | ✓ | | | | | | |
| Sistema actualiza el stock y registra evento | | ✓ | | | | | | |
| **S-1** Descuento multi-lote | | ✓ | | ✓ | ✓ | | | |

---

## 12. Análisis de Relación-Navegación

### 12.1 Pantalla de Escaneo

La Pantalla de Escaneo es el **punto de entrada transversal** del flujo operativo. Es invocada al inicio de casi todos los procesos del Módulo 1 y el Módulo 3.

#### Características principales

| Aspecto | Detalle |
|---------|---------|
| **Categoría** | Gestión Operativa |
| **Parámetros de entrada** | SKU (por cámara o manual) o Número de Lote |
| **Resultado según entrada** | SKU → lista de lotes en formato *card*; N.° de Lote → card única con atributos clave |
| **Módulos que la invocan** | Ingreso de Lote, Salida a Exhibición, Merma, Reubicación Interna, Auditoría Cíclica |
| **Componentes visuales** | Visor de cámara (escáner central), botones de ingreso manual (inferior), tarjetas dinámicas de lote |
| **Estructura de navegación** | Secuencial: Escanear código → Visualizar tarjeta → Seleccionar acción contextual |
| **Usuarios principales** | Operativo (uso continuo), Auditor (durante recorridos), Táctico (consulta ocasional) |

#### Decisiones de navegación

- **Acceso inmediato:** El visor de escaneo debe estar disponible con cero pasos de navegación.
- **Alertas visuales:** Si el lote tiene caducidad crítica, la tarjeta se resalta en rojo.
- **Errores:** Se manejan con notificaciones modales breves + retroalimentación háptica (vibración). No expulsa al usuario de la pantalla.
- **Sin historial persistente de navegación:** Cada escaneo carga el estado más reciente de la BD para evitar trabajar con datos desactualizados.
- **Sin personalización:** El flujo es fijo y estandarizado para todos los Operativos, reduciendo la curva de aprendizaje.

---

### 12.2 Módulo de Registro de Nuevo Lote

Es el formulario de alta de mercancía. Alimenta al sistema con la información crítica que el algoritmo necesita para funcionar correctamente.

#### Características principales

| Aspecto | Detalle |
|---------|---------|
| **Categoría** | Gestión de Entradas de Inventario |
| **Parámetros obligatorios** | SKU, N.° de Lote, Fecha de Fabricación, Fecha de Caducidad, Cantidad, Ubicación inicial |
| **Fuente de datos estáticos** | Catálogo Maestro de la BD (nombre, descripción del producto). |
| **Fuente de datos dinámicos** | Creados por primera vez en este formulario (fechas, cantidades). |
| **Componentes visuales** | Buscador de SKU, selectores de fecha, campos numéricos, listas desplegables de ubicación |
| **Estructura** | Formulario secuencial: Validar SKU → Ingresar datos del lote → Confirmar guardado |
| **Usuario principal** | Operativo de recepción (exclusivo para alta; Táctico y Auditor solo consultan resultados) |

#### Decisiones de navegación

- **Foco automático en el campo SKU** al abrir la pantalla.
- **Campos bloqueados hasta validar el SKU:** Los campos de lote y caducidad solo se habilitan tras confirmar que el SKU existe en el catálogo.
- **Validación en tiempo real:** Si la fecha de caducidad está próxima o ya venció, el campo se resalta en rojo y el botón de guardar se bloquea.
- **Autocompletado de SKU:** En entradas consecutivas del mismo producto, el sistema puede autocompletar el SKU.
- **Sin personalización:** El formulario es estándar para garantizar la misma calidad de datos en todos los registros.
- **Cancelación explícita:** Los botones "Guardar" y "Cancelar/Atrás" siempre están visibles para evitar pérdida de datos accidental.

---

## 13. Errores y Correcciones Aplicadas

Esta sección documenta los errores detectados en el documento fuente (V3.docx) y las correcciones realizadas en esta documentación.

| # | Error detectado | Tipo | Corrección aplicada |
|---|-----------------|------|---------------------|
| 1 | El sistema se describe como "similar a un POS" en algunos párrafos y como "no es un POS" en otros. | Inconsistencia conceptual | Se unificó: el sistema **no es un POS**. La sincronización con el POS es unidireccional (el POS envía datos; el sistema los procesa). |
| 2 | UC-2.7 tiene dos bloques "Pre-estado / Post-estado" duplicados con contenidos distintos. | Error de estructura | Se eliminó el bloque duplicado. Se conservó el correcto (pre: parámetros por defecto; post: nuevas reglas aplicadas). |
| 3 | La clase `Merma` no tenía un atributo `motivo` tipado. El documento solo decía "motivo" sin valores posibles. | Ambigüedad de modelo | Se definió como `Enum` con valores: `Daño Físico`, `Caducidad`, `Pérdida`, `Otro`. |
| 4 | El atributo `estatus` de `Lote` no tenía todos sus valores enumerados de forma consistente en el documento. | Ambigüedad de modelo | Se consolidaron todos los estados posibles: `Disponible`, `Cuarentena`, `Pendiente de Acomodo`, `Pendiente de Retiro`, `Extraviado`, `Cerrado`. |
| 5 | El rol `Usuario` se describe con `rol` como campo único (singular), pero el sistema permite múltiples roles por usuario. | Inconsistencia de modelo | El atributo `rol` se documenta como **multi-valor** (puede contener más de un rol). |
| 6 | UC-4.1 describe que el sistema "bloquea estas unidades para que el algoritmo no las considere" pero no especifica cuál usuario las desbloquea ni bajo qué condición. | Caso de uso incompleto | Se añadió la aclaración: las devoluciones no regresan automáticamente a Exhibición; requieren revisión manual (análoga al proceso de desbloqueo UC-2.6). |
| 7 | La tabla de "Objetos de contenido" en el documento mezcla componentes de UI con funcionalidades de exportación sin distinción clara. | Organización deficiente | Se separaron y describieron individualmente: Dashboard, Catálogo Visual, Línea de Tiempo, Reportes Exportables y Evidencia de Incidencias. |
| 8 | Varios errores ortográficos en el documento fuente: "Almacen" (sin tilde), "recicrar" en el título del chat, "concisa" escrita "cocncisa". | Ortografía | Corregidos a lo largo de toda la documentación. |
| 9 | La limitación de "inventario negativo" (E-1 de UC-4.2) se documentaba solo como excepción técnica sin explicar su impacto operativo. | Información incompleta | Se incluyó en la sección de Limitaciones (§4) como una limitación conocida con su impacto documentado. |
| 10 | El criterio de desempate del algoritmo ("orden de registro") aparecía solo en la sección de Ámbito, sin relacionarse con el diagrama de clases. | Trazabilidad incompleta | Se añadió `fechaRegistro` como atributo explícito de la clase `Lote` para respaldar el criterio de desempate. |

---

## 15. Adenda: Módulo de Escaneo Híbrido (Implementación Real)

> Esta sección documenta las funcionalidades implementadas que evolucionaron más allá del diseño original descrito en §12.1. Se incluyen como adenda para mantener la trazabilidad entre los requisitos y el sistema entregado.

### 15.1 Caso de Uso: Escaneo Híbrido (UC-E.1)

| Campo | Detalle |
|-------|---------|
| **Tipo** | Transversal (invocado por múltiples módulos) |
| **Actores** | Operativo, Táctico, Auditor |
| **Objetivo** | Identificar un lote o producto mediante cámara o entrada manual, con detección automática del tipo de código. |
| **Precondición** | El usuario está autenticado en el sistema. |
| **Resultado** | Según el tipo de código detectado, el sistema presenta la información relevante y ofrece acciones contextuales. |

**Flujo principal:**

1. El usuario accede al módulo de escaneo desde la barra de navegación inferior.
2. El sistema verifica el contexto de seguridad del navegador (HTTPS o localhost).
3. **Si es seguro:** Se activa la cámara trasera con un overlay de máscara visual (bordes opacos + recuadro central transparente) y una animación de láser confinada al área de lectura.
4. **Si no es seguro:** Se muestra una alerta explicativa y se fuerza el modo Manual.
5. Al detectar un código (cámara) o al enviar texto (manual), el sistema ejecuta la detección automática:

| Formato del código | Acción del sistema |
|---|---|
| Prefijo `LOT-` | Busca en `Lote.id_lote` → Muestra el **Expediente del Lote** (stock, ubicaciones, fechas) |
| Código numérico (EAN) | Busca en `CodigoBarras.codigo_ean` → Muestra el **Producto + Lista de Lotes activos** (FEFO) |
| Código alfanumérico (SKU) | Busca en `Producto.sku_id` → Muestra el **Producto + Lista de Lotes activos** (FEFO) |
| Sin coincidencia | Muestra estado "No encontrado" con el código escaneado |

6. Al detectar un código válido:
   - La cámara se detiene inmediatamente (**Stop-on-Success**) para evitar lecturas duplicadas.
   - Se emite **feedback háptico** (vibración de 100ms) y un **beep corto** (1200Hz × 120ms via Web Audio API).
   - Se muestra un flash verde de confirmación ("¡Código detectado!") durante 1.5 segundos.
7. El usuario puede consultar el resultado y luego presionar **"Escanear otro"** para reiniciar la cámara.

**Subflujos:**

- **S-1 — Autocompletado:** En el campo de entrada manual, el sistema ofrece sugerencias en tiempo real (búsqueda parcial con debounce de 300ms) consultando lotes y productos simultáneamente. Máximo 5 sugerencias.
- **S-2 — Navegación a detalle:** Desde los resultados, el usuario puede navegar al Expediente del Lote (`/lotes/:id`) o al Expediente del Producto (`/productos/:sku`), con soporte de navegación `navigate(-1)` para retorno.

**Excepciones:**

| Código | Situación | Acción del sistema |
|--------|-----------|-------------------|
| E-1 | Permiso de cámara denegado | Muestra mensaje explicativo y botón "Reintentar" |
| E-2 | Dispositivo sin cámara | Muestra mensaje y fuerza modo Manual |
| E-3 | Contexto inseguro (HTTP + IP) | Alerta con `window.location.origin` y fuerza modo Manual |
| E-4 | Error de red en la consulta | Muestra mensaje de error con opción de reintento |

---

### 15.2 Caso de Uso: Consulta de Expediente de Producto (UC-E.2)

| Campo | Detalle |
|-------|---------|
| **Tipo** | Consulta |
| **Actores** | Operativo, Táctico, Auditor |
| **Objetivo** | Visualizar la ficha completa de un producto y todos sus lotes activos ordenados por caducidad (FEFO). |
| **Precondición** | El SKU existe en la tabla `Producto`. |

**Flujo:**

1. El usuario accede vía escaneo de EAN/SKU o navegación directa a `/productos/:sku`.
2. El sistema muestra: nombre, descripción, marca, categoría, código EAN, indicador de perecedero.
3. Se muestran métricas resumen: total de lotes activos y stock global.
4. Se lista cada lote activo (status `Disponible` o `Cuarentena`) con: ID, stock actual, días para caducar, fecha de caducidad.
5. El usuario puede hacer clic en cualquier lote para ver su Expediente completo.

**Endpoint:** `GET /api/productos/:sku`

---

### 15.3 Endpoint de Sugerencias en Tiempo Real

**Ruta:** `GET /api/scan/suggest?q=<texto_parcial>`

| Aspecto | Detalle |
|---------|---------|
| **Mínimo de caracteres** | 2 |
| **Máximo de resultados** | 5 (3 lotes + 3 productos, truncado a 5) |
| **Campos buscados (Lotes)** | `Lote.id_lote`, `Lote.sku_id` |
| **Campos buscados (Productos)** | `Producto.sku_id`, `Producto.nombre`, `Producto.marca`, `CodigoBarras.codigo_ean` |
| **Formato de respuesta** | `{ tipo, valor, label, sublabel, status }` por cada sugerencia |

---

### 15.4 Decisiones Técnicas del Módulo de Escaneo

| Decisión | Justificación |
|----------|--------------|
| Usar `html5-qrcode` en lugar de ZXing | Menor bundle size, API más simple, soporte de códigos 1D y 2D |
| Overlay CSS puro (sin canvas) | Menor consumo de recursos; compatible con todos los navegadores |
| Feedback vía `AudioContext` (sin archivos) | Elimina dependencia de archivos `.mp3`; funciona offline |
| `navigator.vibrate()` con try-catch | API no disponible en iOS Safari; el catch evita errores silenciosos |
| Debounce de 300ms en autocomplete | Balance entre responsividad y carga del servidor |
| `AbortController` por cada request de sugerencias | Cancela requests obsoletos cuando el usuario sigue escribiendo |

---

## 16. Fuentes de Información

- Control de Inventarios. (2017). *Tesis de licenciatura*. Instituto Tecnológico de Pabellón de Arteaga.  
  https://pabellon.tecnm.mx/CENTRODEINFORMACION/app/files/101050051.pdf

- Heizer, J., & Render, B. (2009). *Principios de administración de operaciones* (7.ª ed., Cap. 12: Administración de Inventarios, pp. 481–510). Pearson Educación.  
  https://virtual.unju.edu.ar/pluginfile.php/811778/mod_resource/content/1/Principios_De_Administracion_De_Operacio%20render.pdf

- Jacobs, F. R., Chase, R. B., & Aquilano, N. J. (2011). *Administración de operaciones: Producción y cadena de suministros* (13.ª ed., pp. 521–530). McGraw-Hill Interamericana.  
  https://ucreanop.com/wp-content/uploads/2020/08/Administracion-de-Operaciones-Produccion-y-Cadena-de-Suministro-13edi-Chase.pdf

---

*Documentación técnica elaborada a partir del documento V3.docx — Instituto Tecnológico de Aguascalientes, 2026.*
*Adenda §15 incorporada el 5 de mayo de 2026 para reflejar la implementación real del Módulo de Escaneo Híbrido.*