import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://api.ingenieriamts.com/api/v1'
    : 'http://localhost:8000/api/v1');

/**
 * Instancia global de Axios para la plataforma MTS
 * En producción apunta a https://api.ingenieriamts.com/api/v1
 */
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Interceptor de Request:
 * Inyecta automáticamente el token JWT en formato Bearer si existe en localStorage
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Estado de sincronización para evitar múltiples llamadas simultáneas a /auth/refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Interceptor de Response:
 * Si una petición responde 401 Unauthorized, intenta renovar silenciosamente la sesión
 * con el Refresh Token de la PWA mediante rotación segura sin pedir re-login.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const reqUrl = originalRequest?.url || '';

    // Si el 401 proviene de login, refresh o logout, purgar sesión y redirigir
    const isAuthRoute =
      reqUrl.includes('/auth/logout') ||
      reqUrl.includes('/auth/google') ||
      reqUrl.includes('/auth/refresh');

    if (status === 401 && !isAuthRoute && !originalRequest?._retry) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Encolar peticiones concurrentes mientras se completa el refresh activo
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Instancia limpia para no ciclar el interceptor
        const refreshResponse = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          }
        );

        const { access_token, refresh_token: newRefreshToken, usuario } = refreshResponse.data;

        localStorage.setItem('token', access_token);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        if (usuario) {
          localStorage.setItem('user', JSON.stringify(usuario));
        }

        processQueue(null, access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
