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
      /**
       * False until the first fetchMe() call settles (success, 401, or any error).
       * Protected pages must wait for this before redirecting to /login, otherwise
       * a brief user:null window (before persist hydrates) causes a spurious logout.
       * Not persisted — resets to false on every hard reload.
       */
      isAuthReady: false,

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
        if (!token) {
          // No token — not logged in; auth check is still complete
          set({ isAuthReady: true });
          return;
        }
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user, isAuthReady: true });
        } catch (err) {
          // Only drop the session when the server rejects the token (401).
          // Network errors, timeouts, or API down must NOT wipe login — that felt like random sign-out.
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('auth-store');
            set({ user: null, token: null, refreshToken: null, isAuthReady: true });
          } else {
            // Transient failure (network, timeout, server restart) — keep the
            // persisted user so the page doesn't bounce to /login, but mark ready.
            set({ isAuthReady: true });
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
      // isAuthReady is intentionally excluded — it must restart as false on every page load
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;
