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
          const apiErr = err.response?.data?.error;
          const validationDetail = err.response?.data?.details?.[0]?.message;
          const fallback =
            err.message && err.message !== 'Network Error'
              ? err.message
              : 'Login failed';
          return {
            success: false,
            error: apiErr || validationDetail || fallback,
            code: err.response?.data?.code,
          };
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
        localStorage.removeItem('auth-store');
        set({ user: null, token: null, refreshToken: null });
        toast.success('Logged out successfully');
      },

      fetchMe: async () => {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('token') || get().token
            : null;
        if (!token) return;
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user });
        } catch (err) {
          // Only drop the session when the server rejects the token (401).
          // Network errors, timeouts, or API down must NOT wipe login — that felt like random sign-out.
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('auth-store');
            set({ user: null, token: null, refreshToken: null });
          }
        }
      },

      isAdmin: () => get().user?.role === 'admin',
      /** Full super-admin or staff with at least one admin area */
      canAccessAdmin: () => {
        const u = get().user;
        if (!u) return false;
        if (u.role === 'admin') return true;
        return u.role === 'staff' && Array.isArray(u.adminPermissions) && u.adminPermissions.length > 0;
      },
      isAuthenticated: () => !!get().user,
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;
