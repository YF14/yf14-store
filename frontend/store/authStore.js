import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,

      setUser: (user) => set({ user }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          set({ user: data.user, token: data.token, refreshToken: data.refreshToken });
          return { success: true };
        } catch (err) {
          return { success: false, error: err.response?.data?.error || 'Login failed' };
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', userData);
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          set({ user: data.user, token: data.token, refreshToken: data.refreshToken });
          return { success: true };
        } catch (err) {
          return { success: false, error: err.response?.data?.error || 'Registration failed' };
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {}
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        set({ user: null, token: null, refreshToken: null });
        toast.success('Logged out successfully');
      },

      fetchMe: async () => {
        if (!localStorage.getItem('token')) return;
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user });
        } catch {
          localStorage.removeItem('token');
          set({ user: null });
        }
      },

      isAdmin: () => get().user?.role === 'admin',
      isAuthenticated: () => !!get().user,
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
