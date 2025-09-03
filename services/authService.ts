import { API_CONFIG } from '../src/config/api';
import type { LoginRequest, RegisterRequest, AuthResponse, ChatTokenRequest } from '../src/config/api';

class AuthService {
  private token: string | null = null;
  private username: string | null = null;

  constructor() {
    this.token = localStorage.getItem('access_token');
    this.username = localStorage.getItem('username');
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Convertir email en username pour votre backend
    const backendCredentials = {
      username: credentials.email, // ← Votre backend attend username, mais votre form envoie email
      password: credentials.password,
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(backendCredentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Échec de la connexion');
    }

    const data: AuthResponse = await response.json();
    this.setAuthData(data.username);
    return data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Adapter pour votre backend - utiliser email comme username
    const backendUserData = {
      username: userData.email, // ← Utiliser email comme username
      password: userData.password,
      avatar: userData.username, // ← Utiliser le username du form comme avatar/display name
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendUserData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Échec de l\'inscription');
    }

    const data: AuthResponse = await response.json();
    this.setAuthData(data.username);
    return data;
  }

  async getChatToken(username: string): Promise<string> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username } as ChatTokenRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Échec de l\'obtention du token de chat');
    }

    const data = await response.json();
    return data.token;
  }

  logout(): void {
    this.token = null;
    this.username = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');

    fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGOUT}`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  }

  private setAuthData(username: string): void {
    this.username = username;
    localStorage.setItem('username', username);
  }

  getToken(): string | null {
    return this.token;
  }

  getUsername(): string | null {
    return this.username;
  }

  isAuthenticated(): boolean {
    return this.username !== null;
  }
}

export const authService = new AuthService();