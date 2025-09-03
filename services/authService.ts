import { API_CONFIG } from '@/config/api.ts';
import type { LoginRequest, RegisterRequest, AuthResponse, ChatTokenRequest } from '@/config/api.ts';

class AuthService {
  private token: string | null = null;
  private username: string | null = null;

  constructor() {
    // Récupérer le token du localStorage au démarrage
    this.token = localStorage.getItem('token');
    this.username = localStorage.getItem('username');
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Échec de la connexion');
    }

    const data: AuthResponse = await response.json();
    this.setAuthData(data.token, data.username);
    return data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Échec de l\'inscription');
    }

    const data: AuthResponse = await response.json();
    this.setAuthData(data.token, data.username);
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
      throw new Error('Échec de l\'obtention du token de chat');
    }

    const data = await response.json();
    return data.token;
  }

  logout(): void {
    this.token = null;
    this.username = null;
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }

  private setAuthData(token: string, username: string): void {
    this.token = token;
    this.username = username;
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
  }

  getToken(): string | null {
    return this.token;
  }

  getUsername(): string | null {
    return this.username;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }
}

export const authService = new AuthService();