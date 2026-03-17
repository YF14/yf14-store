import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
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

// Handle 401 — refresh token or redirect
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
            { refreshToken }
          );
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
