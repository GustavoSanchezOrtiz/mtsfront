import { create } from 'zustand';
import apiClient, { clearStoredAuth } from '../lib/axios';

/**
 * Helper para obtener valores iniciales seguros desde localStorage
 */
const getInitialState = () => {
  const token = localStorage.getItem('token') || null;
  const refreshToken = localStorage.getItem('refreshToken') || null;
  let user = null;
  try {
    const storedUser = localStorage.getItem('user');
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error al deserializar el usuario de localStorage:', error);
    localStorage.removeItem('user');
  }
  return { token, refreshToken, user };
};

/**
 * Store global de autenticación con Zustand y persistencia para PWA
 */
export const useAuth = create((set, get) => ({
  ...getInitialState(),
  isAuthenticated: !!(localStorage.getItem('token') || localStorage.getItem('refreshToken')),

  /**
   * Sincroniza el estado en memoria con localStorage (tras refresh silencioso o cambios entre pestañas)
   */
  syncFromStorage: () => {
    const { token, refreshToken, user } = getInitialState();
    set({
      token,
      refreshToken,
      user,
      isAuthenticated: !!(token || refreshToken),
    });
  },

  /**
   * Registra el inicio de sesión exitoso o renovación con tokens
   * @param {string} accessToken - JWT de acceso emitido por FastAPI
   * @param {string|object} refreshTokenOrUser - Refresh Token de larga duración o datos de usuario
   * @param {object} [maybeUser] - Datos del usuario autenticado si se pasa refreshToken por separado
   */
  login: (accessToken, refreshTokenOrUser, maybeUser) => {
    let refreshToken = null;
    let user = null;

    if (typeof refreshTokenOrUser === 'string') {
      refreshToken = refreshTokenOrUser;
      user = maybeUser || null;
    } else {
      user = refreshTokenOrUser || null;
      refreshToken = localStorage.getItem('refreshToken') || get().refreshToken;
    }

    if (accessToken) {
      localStorage.setItem('token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    set({
      token: accessToken,
      refreshToken: refreshToken || get().refreshToken,
      user: user || get().user,
      isAuthenticated: true,
    });
  },

  /**
   * Actualiza únicamente los tokens tras un ciclo de Refresh Token Rotation
   */
  setTokens: (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem('token', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    set({
      token: accessToken,
      refreshToken: refreshToken || localStorage.getItem('refreshToken') || get().refreshToken,
      isAuthenticated: true,
    });
  },

  /**
   * Actualiza los datos sincronizados del usuario (rol, estado, proyectos asignados)
   */
  updateUser: (userData) => {
    if (!userData) return;
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData });
  },

  /**
   * Cierra sesión revocando la sesión única en el servidor y purgando almacenamiento
   */
  logout: () => {
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      apiClient.post('/auth/logout').catch(() => {});
    }
    clearStoredAuth();
    set({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('mts:auth-sync', () => {
    useAuth.getState().syncFromStorage();
  });
  window.addEventListener('storage', (event) => {
    if (!event.key || event.key === 'token' || event.key === 'refreshToken' || event.key === 'user') {
      useAuth.getState().syncFromStorage();
    }
  });
}
