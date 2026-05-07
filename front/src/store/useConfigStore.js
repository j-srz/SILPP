import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PINNED_IDS } from '../config/operationsConfig';

/**
 * useConfigStore — Persiste los IDs de operaciones ancladas al Home.
 *
 * Desacoplado del id_rol: los pins son del usuario, no del rol.
 * Si un usuario tiene Operativo+Táctico, puede pinear de ambos.
 */
const useConfigStore = create(
  persist(
    (set, get) => ({
      pinnedIds: [...DEFAULT_PINNED_IDS],

      togglePin: (id) => {
        const current = get().pinnedIds;
        set({
          pinnedIds: current.includes(id)
            ? current.filter(x => x !== id)
            : [...current, id],
        });
      },

      isPinned: (id) => get().pinnedIds.includes(id),

      resetPins: () => set({ pinnedIds: [...DEFAULT_PINNED_IDS] }),
    }),
    { name: 'silpp-config' }
  )
);

export default useConfigStore;
