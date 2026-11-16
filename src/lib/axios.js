import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://api.ingenieriamts.com/api/v1'
    : 'http://localhost:8000/api/v1');

const PUBLIC_AUTH_BYPASS_PATHS = new Set([
  '/login',
  '/privacidad',
  '/politica-de-privacidad',
  '/privacy-policy',
  '/terminos',
  '/condiciones',
  '/condiciones-del-servicio',
  '/terms-of-service',
]);

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

const notifyAuthSync = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mts:auth-sync'));
  }
};

export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

export const isTokenExpiringSoon = (token, bufferSeconds = 90) => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 <= Date.now() + bufferSeconds * 1000;
};

export const clearStoredAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  notifyAuthSync();
};

const writeStoredAuth = ({ access_token, refresh_token, usuario }) => {
  if (access_token) {
    localStorage.setItem('token', access_token);
  }
  if (refresh_token) {
    localStorage.setItem('refreshToken', refresh_token);
  }
  if (usuario) {
    localStorage.setItem('user', JSON.stringify(usuario));
  }
  notifyAuthSync();
};

const isPermanentAuthRejection = (err) => {
  const status = err?.response?.status;
  return status === 400 || status === 401 || status === 403 || status === 422;
};

const redirectToLoginIfProtected = () => {
  if (typeof window === 'undefined') return;
  if (!PUBLIC_AUTH_BYPASS_PATHS.has(window.location.pathname)) {
    window.location.href = '/login';
  }
};

let inFlightRefresh = null;

const runLockedRefresh = async (fn) => {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request('mts_auth_refresh', fn);
  }
  return fn();
};

/**
 * Renueva silenciosamente el access_token usando el refreshToken persistido en PWA.
 * Coordina llamadas concurrentes dentro de la pestaña y entre pestañas/ventanas PWA
 * para no provocar falsos 401 al rotar `active_session_id`.
 * Sólo purga la sesión si el servidor rechaza explícitamente el refresh token (400/401/403/422),
 * preservando la sesión ante errores transitorios de red, timeout o 5xx al despertar la PWA.
 */
export const refreshSession = ({ failedToken = null } = {}) => {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }

  inFlightRefresh = runLockedRefresh(async () => {
    const currentToken = localStorage.getItem('token');
    const currentRefreshToken = localStorage.getItem('refreshToken');

    // Si otra pestaña/solicitud ya renovó el access_token, reutilizarlo sin volver a rotar
    if (failedToken && currentToken && currentToken !== failedToken && !isTokenExpiringSoon(currentToken, 30)) {
      notifyAuthSync();
      return currentToken;
    }
    if (!failedToken && currentToken && !isTokenExpiringSoon(currentToken, 90)) {
      return currentToken;
    }

    if (!currentRefreshToken) {
      clearStoredAuth();
      redirectToLoginIfProtected();
      throw new Error('No hay refresh token disponible.');
    }

    try {
      const refreshResponse = await axios.post(
        `${BASE_URL}/auth/refresh`,
        { refresh_token: currentRefreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      writeStoredAuth(refreshResponse.data);
      return refreshResponse.data.access_token;
    } catch (refreshErr) {
      if (isPermanentAuthRejection(refreshErr)) {
        clearStoredAuth();
        redirectToLoginIfProtected();
      }
      throw refreshErr;
    }
  }).finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
};

/**
 * Interceptor de Request:
 * Renueva proactivamente si el access_token expiró o está por expirar y hay refreshToken,
 * e inyecta el JWT Bearer vigente.
 */
apiClient.interceptors.request.use(
  async (config) => {
    const reqUrl = config?.url || '';
    const isAuthRoute =
      reqUrl.includes('/auth/logout') ||
      reqUrl.includes('/auth/google') ||
      reqUrl.includes('/auth/refresh');

    let token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!isAuthRoute && refreshToken && isTokenExpiringSoon(token, 90)) {
      try {
        token = await refreshSession();
      } catch (err) {
        // Si falló por red transitoria, permitir que continúe o falle sin borrar la sesión
        if (isPermanentAuthRejection(err)) {
          return Promise.reject(err);
        }
        token = localStorage.getItem('token');
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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

    const isAuthRoute =
      reqUrl.includes('/auth/logout') ||
      reqUrl.includes('/auth/google') ||
      reqUrl.includes('/auth/refresh');

    if (status === 401 && !isAuthRoute && !originalRequest?._retry) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        clearStoredAuth();
        redirectToLoginIfProtected();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const authHeader = originalRequest.headers?.Authorization || originalRequest.headers?.authorization;
      const failedToken =
        typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;

      try {
        const newToken = await refreshSession({ failedToken });
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
