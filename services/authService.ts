import { API_CONFIG } from '../src/config/api';
import type { LoginRequest, RegisterRequest, AuthResponse, ChatTokenRequest } from '../src/config/api';
import { jwtDecode } from "/IdeaProjects/ecrirefront/node_modules/jwt-decode/build/esm/index"


interface JwtPayload {
  user_id: string;
  username: string;
  token_type: string;
  exp: number;
}

class AuthService {
  constructor() {
    // Ne plus initialiser depuis localStorage
  }

  // Récupérer le token JWT depuis les cookies
  private getAccessToken(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'access_token') {
        return value;
      }
    }
    return null;
  }

  // Fonction pour décoder le JWT
  private decodeToken(): JwtPayload | null {
    try {
      const token = this.getAccessToken();
      if (!token) return null;

      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const backendCredentials = {
      identifier: credentials.email, // Utiliser identifier au lieu de username
      password: credentials.password,
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important pour recevoir les cookies
      body: JSON.stringify(backendCredentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Identifiants incorrects');
    }

    const data: AuthResponse = await response.json();
    return data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const backendUserData = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important pour recevoir les cookies
      body: JSON.stringify(backendUserData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Échec de l\'inscription');
    }

    const data: AuthResponse = await response.json();
    return data;
  }

  async getChatToken(username: string): Promise<string> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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
    fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGOUT}`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  }

  getUsername(): string | null {
    // Récupérer depuis le JWT au lieu du localStorage
    const decoded = this.decodeToken();
    return decoded?.username || null;
  }

  getUserId(): string | null {
    // Récupérer l'ID utilisateur depuis le JWT
    const decoded = this.decodeToken();
    return decoded?.user_id || null;
  }

  isAuthenticated(): boolean {
    // Vérifier si le JWT est valide et non expiré
    const decoded = this.decodeToken();
    if (!decoded) return false;

    // Vérifier si le token n'est pas expiré (timestamp en secondes)
    return decoded.exp * 1000 > Date.now();
  }
}

export const authService = new AuthService();