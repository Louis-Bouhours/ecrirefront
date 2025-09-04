// Configuration centralisée pour l'API
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  ENDPOINTS: {
    LOGIN: '/api/login',
    REGISTER: '/api/register',
    LOGOUT: '/api/logout',
    CHAT_TOKEN: '/chat/token',
    CHAT_HISTORY: '/chat/history',
      ME: '/api/me',
  },
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL, // URL pour Socket.IO
}

// Types pour l'authentification
export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { username: string; email: string; password: string }
export interface AuthResponse { token?: string; username: string; avatar?: string }
export interface ChatTokenRequest { username: string }