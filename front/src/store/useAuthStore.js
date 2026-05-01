import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import client from '../api/client';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (id_usuario) => {
        const { data } = await client.post('/auth/login', { id_usuario });
        if (data.success) {
          set({ user: data.user, isAuthenticated: true });
          return data.user;
        }
        throw new Error('Login fallido');
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'silpp-auth',
    }
  )
);

export default useAuthStore;
