-- ════════════════════════════════════════════════════════════════════════
-- SILPP · Script de Creación de Base de Datos
-- Sistema de Inventario por Lotes de Productos Perecederos
-- Instituto Tecnológico de Aguascalientes (ITA)
--
-- Motor: InnoDB (requerido para transacciones ACID)
-- Charset: utf8mb4 (soporte completo de Unicode)
-- Collation: utf8mb4_unicode_ci (ordenamiento natural en español)
--
-- ⚠️  IMPORTANTE (Linux / DigitalOcean):
--     Todos los nombres de tabla usan PascalCase.
--     MySQL en Linux es case-sensitive por defecto (lower_case_table_names=0).
--     Mantener esta convención es obligatorio para producción.
-- ════════════════════════════════════════════════════════════════════════

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Base de datos
CREATE DATABASE IF NOT EXISTS `inventario_silpp`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `inventario_silpp`;

-- ────────────────────────────────────────────────────────────────────────
-- CATÁLOGOS MAESTROS
-- ────────────────────────────────────────────────────────────────────────

-- Unidades de medida (kg, pz, lt, etc.)
CREATE TABLE IF NOT EXISTS `UnidadMedida` (
  `unidad_id`       INT            NOT NULL AUTO_INCREMENT,
  `nombre_unidad`   VARCHAR(50)    NOT NULL,
  `abreviatura`     VARCHAR(10)    NOT NULL,
  `es_fraccionable` TINYINT(1)     NOT NULL DEFAULT 0,
  PRIMARY KEY (`unidad_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo de productos
CREATE TABLE IF NOT EXISTS `Producto` (
  `sku_id`          VARCHAR(50)    NOT NULL,
  `nombre`          VARCHAR(200)   NOT NULL,
  `descripcion`     TEXT           DEFAULT NULL,
  `categoria`       VARCHAR(100)   DEFAULT NULL,
  `marca`           VARCHAR(100)   DEFAULT NULL,
  `url_img`         VARCHAR(500)   DEFAULT NULL,
  `contenido_valor` DECIMAL(10,2)  DEFAULT NULL,
  `es_perecedero`   TINYINT(1)     NOT NULL DEFAULT 1,
  `unidad_id`       INT            DEFAULT NULL,
  PRIMARY KEY (`sku_id`),
  KEY `idx_producto_categoria` (`categoria`),
  KEY `idx_producto_marca` (`marca`),
  CONSTRAINT `fk_producto_unidad` FOREIGN KEY (`unidad_id`)
    REFERENCES `UnidadMedida` (`unidad_id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Códigos de barras (EAN-13, UPC-A, etc.) — Un producto puede tener varios
CREATE TABLE IF NOT EXISTS `CodigoBarras` (
  `codigo_ean` VARCHAR(50)  NOT NULL,
  `sku_id`     VARCHAR(50)  NOT NULL,
  PRIMARY KEY (`codigo_ean`),
  KEY `idx_cb_sku` (`sku_id`),
  CONSTRAINT `fk_cb_producto` FOREIGN KEY (`sku_id`)
    REFERENCES `Producto` (`sku_id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────────────
-- ESTRUCTURA FÍSICA Y ÁREAS
-- ────────────────────────────────────────────────────────────────────────

-- Áreas lógicas del almacén
CREATE TABLE IF NOT EXISTS `Area` (
  `id_area`     INT          NOT NULL AUTO_INCREMENT,
  `nombre_area` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id_area`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ubicaciones físicas (pasillo-rack-nivel) dentro de un área
CREATE TABLE IF NOT EXISTS `Ubicacion` (
  `id_ubicacion` INT          NOT NULL AUTO_INCREMENT,
  `id_area`      INT          NOT NULL,
  `pasillo`      VARCHAR(20)  DEFAULT NULL,
  `rack`         VARCHAR(20)  DEFAULT NULL,
  `nivel`        VARCHAR(20)  DEFAULT NULL,
  PRIMARY KEY (`id_ubicacion`),
  KEY `idx_ubic_area` (`id_area`),
  CONSTRAINT `fk_ubic_area` FOREIGN KEY (`id_area`)
    REFERENCES `Area` (`id_area`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────────────
-- SEGURIDAD Y ROLES
-- ────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `Rol` (
  `id_rol`     INT          NOT NULL AUTO_INCREMENT,
  `nombre_rol` VARCHAR(50)  NOT NULL,
  PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Usuario` (
  `id_usuario` INT          NOT NULL AUTO_INCREMENT,
  `nombre`     VARCHAR(200) NOT NULL,
  `activo`     TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla puente: un usuario puede tener múltiples roles
CREATE TABLE IF NOT EXISTS `Acceso` (
  `id_usuario` INT NOT NULL,
  `id_rol`     INT NOT NULL,
  PRIMARY KEY (`id_usuario`, `id_rol`),
  CONSTRAINT `fk_acceso_usuario` FOREIGN KEY (`id_usuario`)
    REFERENCES `Usuario` (`id_usuario`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_acceso_rol` FOREIGN KEY (`id_rol`)
    REFERENCES `Rol` (`id_rol`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────────────
-- INVENTARIO Y LOTES
-- ────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `Lote` (
  `id_lote`           VARCHAR(50)  NOT NULL,
  `sku_id`            VARCHAR(50)  NOT NULL,
  `fecha_fabricacion` DATE         NOT NULL,
  `fecha_caducidad`   DATE         NOT NULL,
  `status`            ENUM('Disponible','Cuarentena','Vencido') NOT NULL DEFAULT 'Disponible',
  PRIMARY KEY (`id_lote`),
  KEY `idx_lote_sku` (`sku_id`),
  KEY `idx_lote_caducidad` (`fecha_caducidad`),
  KEY `idx_lote_status` (`status`),
  CONSTRAINT `fk_lote_producto` FOREIGN KEY (`sku_id`)
    REFERENCES `Producto` (`sku_id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registro de entradas (recepción de mercancía)
CREATE TABLE IF NOT EXISTS `Entrada` (
  `id_entrada`    INT          NOT NULL AUTO_INCREMENT,
  `folio`         VARCHAR(100) NOT NULL,
  `fecha_llegada` DATETIME     NOT NULL,
  `id_usuario`    INT          NOT NULL,
  `id_lote`       VARCHAR(50)  NOT NULL,
  PRIMARY KEY (`id_entrada`),
  UNIQUE KEY `uk_entrada_folio` (`folio`),
  KEY `idx_entrada_lote` (`id_lote`),
  KEY `idx_entrada_usuario` (`id_usuario`),
  CONSTRAINT `fk_entrada_usuario` FOREIGN KEY (`id_usuario`)
    REFERENCES `Usuario` (`id_usuario`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_entrada_lote` FOREIGN KEY (`id_lote`)
    REFERENCES `Lote` (`id_lote`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Existencias por ubicación (snapshot de dónde está cada lote)
CREATE TABLE IF NOT EXISTS `Existencia_Ubicacion` (
  `id_existencia` INT          NOT NULL AUTO_INCREMENT,
  `id_lote`       VARCHAR(50)  NOT NULL,
  `id_ubicacion`  INT          NOT NULL,
  `cantidad`      DECIMAL(12,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_existencia`),
  KEY `idx_eu_lote` (`id_lote`),
  KEY `idx_eu_ubic` (`id_ubicacion`),
  CONSTRAINT `fk_eu_lote` FOREIGN KEY (`id_lote`)
    REFERENCES `Lote` (`id_lote`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_eu_ubic` FOREIGN KEY (`id_ubicacion`)
    REFERENCES `Ubicacion` (`id_ubicacion`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────────────
-- TRANSACCIONES Y TRAZABILIDAD
-- ────────────────────────────────────────────────────────────────────────

-- Catálogo de tipos de movimiento
CREATE TABLE IF NOT EXISTS `TipoMovimiento` (
  `id_tipo`     INT          NOT NULL AUTO_INCREMENT,
  `descripcion` VARCHAR(100) NOT NULL,
  `factor`      TINYINT      NOT NULL COMMENT '1 = suma (entrada), -1 = resta (salida)',
  PRIMARY KEY (`id_tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historial de movimientos (FUENTE DE VERDAD para el stock dinámico)
-- stock = SUM(qty_afectada × factor)
CREATE TABLE IF NOT EXISTS `Historial_Movimiento` (
  `id_movimiento` INT           NOT NULL AUTO_INCREMENT,
  `id_lote`       VARCHAR(50)   NOT NULL,
  `id_ubicacion`  INT           NOT NULL,
  `id_usuario`    INT           NOT NULL,
  `id_tipo`       INT           NOT NULL,
  `qty_afectada`  DECIMAL(12,2) NOT NULL,
  `fecha_hora`    DATETIME      NOT NULL,
  PRIMARY KEY (`id_movimiento`),
  KEY `idx_hm_lote` (`id_lote`),
  KEY `idx_hm_ubic` (`id_ubicacion`),
  KEY `idx_hm_tipo` (`id_tipo`),
  KEY `idx_hm_fecha` (`fecha_hora`),
  CONSTRAINT `fk_hm_lote` FOREIGN KEY (`id_lote`)
    REFERENCES `Lote` (`id_lote`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_hm_ubic` FOREIGN KEY (`id_ubicacion`)
    REFERENCES `Ubicacion` (`id_ubicacion`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_hm_usuario` FOREIGN KEY (`id_usuario`)
    REFERENCES `Usuario` (`id_usuario`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_hm_tipo` FOREIGN KEY (`id_tipo`)
    REFERENCES `TipoMovimiento` (`id_tipo`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ventas (cabecera)
CREATE TABLE IF NOT EXISTS `Venta` (
  `id_venta`   INT      NOT NULL AUTO_INCREMENT,
  `fecha_hora` DATETIME NOT NULL,
  PRIMARY KEY (`id_venta`),
  KEY `idx_venta_fecha` (`fecha_hora`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Detalle de ventas (líneas por lote)
CREATE TABLE IF NOT EXISTS `DetalleVenta` (
  `id_detalle`      INT           NOT NULL AUTO_INCREMENT,
  `id_venta`        INT           NOT NULL,
  `id_lote`         VARCHAR(50)   NOT NULL,
  `id_ubicacion`    INT           NOT NULL,
  `cantidad`        DECIMAL(12,2) NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `idx_dv_venta` (`id_venta`),
  KEY `idx_dv_lote` (`id_lote`),
  CONSTRAINT `fk_dv_venta` FOREIGN KEY (`id_venta`)
    REFERENCES `Venta` (`id_venta`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_dv_lote` FOREIGN KEY (`id_lote`)
    REFERENCES `Lote` (`id_lote`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_dv_ubic` FOREIGN KEY (`id_ubicacion`)
    REFERENCES `Ubicacion` (`id_ubicacion`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registros de merma
CREATE TABLE IF NOT EXISTS `Merma` (
  `id_merma`           INT           NOT NULL AUTO_INCREMENT,
  `id_lote`            VARCHAR(50)   NOT NULL,
  `id_ubicacion`       INT           NOT NULL,
  `id_usuario`         INT           NOT NULL,
  `fecha`              DATETIME      NOT NULL,
  `motivo`             VARCHAR(200)  DEFAULT NULL,
  `cantidad`           DECIMAL(12,2) NOT NULL,
  `url_foto_evidencia` VARCHAR(500)  DEFAULT NULL,
  PRIMARY KEY (`id_merma`),
  KEY `idx_merma_lote` (`id_lote`),
  CONSTRAINT `fk_merma_lote` FOREIGN KEY (`id_lote`)
    REFERENCES `Lote` (`id_lote`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_merma_ubic` FOREIGN KEY (`id_ubicacion`)
    REFERENCES `Ubicacion` (`id_ubicacion`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_merma_usuario` FOREIGN KEY (`id_usuario`)
    REFERENCES `Usuario` (`id_usuario`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────────────
-- DATOS SEMILLA (SEED)
-- ────────────────────────────────────────────────────────────────────────

-- Roles del sistema
INSERT INTO `Rol` (`id_rol`, `nombre_rol`) VALUES
  (1, 'Operativo'),
  (2, 'Táctico'),
  (3, 'Auditor');

-- Áreas del almacén
INSERT INTO `Area` (`id_area`, `nombre_area`) VALUES
  (1, 'Almacén'),
  (2, 'Exhibición'),
  (3, 'Devoluciones'),
  (4, 'Cuarentena'),
  (5, 'Recepción');

-- Tipos de movimiento
INSERT INTO `TipoMovimiento` (`id_tipo`, `descripcion`, `factor`) VALUES
  (1, 'Entrada por Recepción',        1),
  (2, 'Salida a Exhibición',         -1),
  (3, 'Entrada por Devolución',       1),
  (4, 'Merma por Daño',             -1),
  (5, 'Merma por Caducidad',        -1),
  (6, 'Ajuste Positivo (Auditoría)',  1),
  (7, 'Ajuste Negativo (Auditoría)', -1),
  (8, 'Reubicación (Salida)',       -1),
  (9, 'Reubicación (Entrada)',       1),
  (10, 'Venta (POS)',               -1);

-- Ubicaciones de ejemplo en el Área de Recepción (id_ubicacion = 501)
INSERT INTO `Ubicacion` (`id_ubicacion`, `id_area`, `pasillo`, `rack`, `nivel`) VALUES
  (501, 5, 'R', '01', 'P');

-- Unidades de medida
INSERT INTO `UnidadMedida` (`unidad_id`, `nombre_unidad`, `abreviatura`, `es_fraccionable`) VALUES
  (1, 'Pieza',      'pz',  0),
  (2, 'Kilogramo',   'kg',  1),
  (3, 'Litro',       'lt',  1),
  (4, 'Paquete',     'paq', 0),
  (5, 'Caja',        'cja', 0);

COMMIT;

-- ════════════════════════════════════════════════════════════════════════
-- FIN DEL SCRIPT
-- Para ejecutar:  mysql -u root -p < scriptCreacionDB.sql
-- ════════════════════════════════════════════════════════════════════════
