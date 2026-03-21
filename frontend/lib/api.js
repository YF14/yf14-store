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
    u.includes('/auth/forgot-password')
  );
}

// Handle 401 — refresh token or redirect (never for login/register)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.code === 'ECONNABORTED') {
      err.message = 'انتهت مهلة الاتصال — تحقق من الإنترنت أو إعدادات API';
    }
    if (err.message === 'Network Error') {
      err.message = 'تعذر الاتصال بالخادم — تحقق من الرابط أو أن الخادم يعمل';
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
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
