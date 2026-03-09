import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function  flushQueue(token: string | null, err: unknown = null) {
  pendingQueue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(err)));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry || original.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      localStorage.removeItem('token');
      window.location.href = '/auth';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<{ token: string; refreshToken: string }>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
      );

      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);

      api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
      original.headers.Authorization = `Bearer ${data.token}`;

      flushQueue(data.token);
      return api(original);
    } catch (refreshError) {
      flushQueue(null, refreshError);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
