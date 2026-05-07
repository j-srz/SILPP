/**
 * operationsConfig.js — Fuente de verdad centralizada
 *
 * Todas las operaciones del sistema definidas en un solo lugar.
 * Consumido por: Operations.jsx, QuickAccessGrid.jsx, useConfigStore.js
 */
import {
  LogIn, ArrowUpRight, AlertTriangle, Trash2, ArrowLeftRight, Undo2,
  BellRing, Lock, Unlock, Settings, CalendarCheck,
  ClipboardList, History, FileText, Users, Package,
} from 'lucide-react';

export const ALL_OPERATIONS = [
  // ── Gestión de Almacén (Operativo) ──
  { id: 'ingresar',    label: 'Ingreso de Lote',       icon: LogIn,           to: '/ingresar',             role: 'Operativo' },
  { id: 'salida',      label: 'Salida a Exhibición',   icon: ArrowUpRight,    to: '/salida',               role: 'Operativo' },
  { id: 'merma',       label: 'Reporte de Merma',      icon: AlertTriangle,   to: '/merma',                role: 'Operativo' },
  { id: 'baja',        label: 'Baja por Caducidad',    icon: Trash2,          to: '/baja-caducidad',       role: 'Operativo' },
  { id: 'reubicar',    label: 'Reubicación Interna',   icon: ArrowLeftRight,  to: '/reubicar',             role: 'Operativo' },
  { id: 'rechazo',     label: 'Rechazo en Recepción',  icon: Undo2,           to: '/rechazo',              role: 'Operativo' },
  // ── Supervisión y Control (Táctico) ──
  { id: 'alertas',     label: 'Panel de Alertas',      icon: BellRing,        to: '/alertas',              role: 'Táctico'   },
  { id: 'bloqueo',     label: 'Bloqueo de Lote',       icon: Lock,            to: '/bloqueo',              role: 'Táctico'   },
  { id: 'desbloqueo',  label: 'Desbloqueo de Lote',    icon: Unlock,          to: '/desbloqueo',           role: 'Táctico'   },
  { id: 'algoritmo',   label: 'Ajustar Algoritmo',     icon: Settings,        to: '/algoritmo',            role: 'Táctico'   },
  { id: 'cierre',      label: 'Cierre Mensual',        icon: CalendarCheck,   to: '/cierre',               role: 'Táctico'   },
  // ── Auditoría y Trazabilidad (Auditor) ──
  { id: 'auditoria',   label: 'Auditoría Cíclica',     icon: ClipboardList,   to: '/auditoria',            role: 'Auditor'   },
  { id: 'trazabilidad',label: 'Trazabilidad Total',    icon: History,         to: '/trazabilidad-global',  role: 'Auditor'   },
  { id: 'reporte',     label: 'Reporte Diario',        icon: FileText,        to: '/reporte-diario',       role: 'Auditor'   },
  { id: 'usuarios',    label: 'Gestión de Usuarios',   icon: Users,           to: '/usuarios',             role: 'Auditor'   },
  // ── Transversales ──
  { id: 'lotes',       label: 'Inventario',            icon: Package,         to: '/lotes',                role: '*'         },
];

export const ROLE_SECTIONS = {
  Operativo: { title: 'Gestión de Almacén',       description: 'Operaciones físicas y movimiento de inventario',   color: 'success' },
  Táctico:   { title: 'Supervisión y Control',    description: 'Gestión de estados, alertas y configuraciones',    color: 'primary' },
  Auditor:   { title: 'Auditoría y Trazabilidad', description: 'Revisión histórica, reportes y control de acceso', color: 'warning' },
};

/** Filtra operaciones por roles del usuario */
export function getOperationsForRoles(roles = []) {
  return ALL_OPERATIONS.filter(op => op.role === '*' || roles.includes(op.role));
}

/** Agrupa operaciones por rol para la vista de Operaciones */
export function getGroupedByRole(roles = []) {
  const ops = getOperationsForRoles(roles);
  const groups = {};
  for (const op of ops) {
    const roleKey = op.role === '*' ? roles[0] || 'Operativo' : op.role;
    if (!groups[roleKey]) groups[roleKey] = [];
    groups[roleKey].push(op);
  }
  return groups;
}

export const DEFAULT_PINNED_IDS = ['ingresar', 'lotes', 'alertas'];
