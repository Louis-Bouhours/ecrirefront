// Configuration centralisée pour l'API
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  ENDPOINTS: {
    LOGIN: '/login',
    REGISTER: '/api/register',
    LOGOUT: '/api/logout',
    CHAT_TOKEN: '/chat/token', // Pour obtenir un token de chat
  },
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL, // URL pour Socket.IO
}

// Types pour l'authentification

// Types qui correspondent à votre AuthForm actuel
export interface LoginRequest {
  email: string;    // ← Garde email comme dans votre form
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;    // ← Garde email comme dans votre form
  password: string;
}

export interface AuthResponse {
  token?: string;
  username: string;
  avatar?: string;
}

export interface ChatTokenRequest {
  username: string;
}