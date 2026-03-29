import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 25000, // avoid infinite "loading" if API is down or wrong URL
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Paths where 401 must NOT trigger refresh (wrong password, etc.) */
function isAuthPublicPath(url) {
  if (!url) return false;
  const u = String(url);
  return (
    u.includes('/auth/login') ||
    u.includes('/auth/register') ||
    u.includes('/auth/refresh-token') ||
    u.includes('/auth/forgot-password') ||
    u.includes('/auth/reset-password')
  );
}

/** zustand persist key — must match authStore `name` */
const AUTH_PERSIST_KEY = 'auth-store';

function clearPersistedAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem(AUTH_PERSIST_KEY);
}

/** Refresh failed before we got an HTTP response (timeout, offline, CORS, etc.) */
function isRefreshLikelyTransient(err) {
  if (!err) return true;
  if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') return true;
  if (err.message === 'Network Error') return true;
  if (!err.response) return true;
  return false;
}

// Handle 401 — refresh token or redirect (never for login/register)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const baseHint =
      typeof window !== 'undefined'
        ? (api.defaults.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
        : '';
    if (err.code === 'ECONNABORTED') {
      err.message =
        'انتهت مهلة الاتصال — تحقق من الإنترنت أو أن الخادم يعمل.\nConnection timed out — check your network or that the server is running.' +
        (baseHint ? `\nAPI: ${baseHint}` : '');
    }
    if (err.message === 'Network Error') {
      err.message =
        'تعذر الاتصال بالخادم — شغّل الواجهة الخلفية (مثلاً: مجلد backend ثم npm run dev) وتأكد من NEXT_PUBLIC_API_URL في .env.local\n' +
        'Could not connect — start the API (backend: npm run dev on port 5000) and check NEXT_PUBLIC_API_URL in frontend/.env.local' +
        (baseHint ? `\nTrying: ${baseHint}` : '');
    }
    const original = err.config;
    const requestUrl = original?.url || '';
    const base = api.defaults.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    if (
      err.response?.status === 401 &&
      !original?._retry &&
      !isAuthPublicPath(requestUrl)
    ) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshUrl = `${String(base).replace(/\/$/, '')}/auth/refresh-token`;
          const { data } = await axios.post(refreshUrl, { refreshToken }, { timeout: 15000 });
          localStorage.setItem('token', data.token);
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        }
      } catch (refreshErr) {
        // Never sign the user out on flaky network — only when refresh is explicitly rejected.
        if (isRefreshLikelyTransient(refreshErr)) {
          return Promise.reject(refreshErr);
        }
        const st = refreshErr.response?.status;
        if (st === 401 || st === 403) {
          clearPersistedAuth();
          if (typeof window !== 'undefined') window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
        // 5xx or other — keep session; caller may retry
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
