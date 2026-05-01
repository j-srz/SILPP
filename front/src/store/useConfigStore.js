import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultsByRole = {
  1: [
    { id: 'reubicar',  label: 'Reubicar lote',  icon: 'ArrowLeftRight', path: '/reubicar' },
    { id: 'lotes',     label: 'Lotes',           icon: 'Package',       path: '/lotes' },
    { id: 'ingresar',  label: 'Ingresar lote',   icon: 'PackagePlus',   path: '/ingresar' },
  ],
  2: [
    { id: 'alertas',   label: 'Panel de Alertas',    icon: 'AlertTriangle',  path: '/alertas' },
    { id: 'algoritmo', label: 'Ajustar Algoritmo',   icon: 'Settings',       path: '/algoritmo' },
    { id: 'lotes',     label: 'Lotes',               icon: 'Package',        path: '/lotes' },
    { id: 'reportes',  label: 'Reportes Mensuales',  icon: 'FileBarChart',   path: '/reportes' },
  ],
  3: [
    { id: 'ajustar',   label: 'Ajustar Stock',       icon: 'ClipboardCheck', path: '/ajustar' },
    { id: 'lotes',     label: 'Lotes',               icon: 'Package',        path: '/lotes' },
    { id: 'reportes',  label: 'Reportes Mensuales',  icon: 'FileBarChart',   path: '/reportes' },
  ],
};

const useConfigStore = create(
  persist(
    (set, get) => ({
      shortcuts: null,

      getShortcuts: (idRol) => {
        const current = get().shortcuts;
        if (current && current.roleId === idRol) return current.items;
        const items = defaultsByRole[idRol] || defaultsByRole[1];
        set({ shortcuts: { roleId: idRol, items } });
        return items;
      },

      updateShortcuts: (items, idRol) => {
        set({ shortcuts: { roleId: idRol, items } });
      },

      resetShortcuts: (idRol) => {
        const items = defaultsByRole[idRol] || defaultsByRole[1];
        set({ shortcuts: { roleId: idRol, items } });
        return items;
      },
    }),
    { name: 'silpp-config' }
  )
);

export default useConfigStore;
