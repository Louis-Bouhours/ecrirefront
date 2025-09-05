import { API_CONFIG } from '../src/config/api';

class AuthService {
  async login(email: string, password: string) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // cookies HTTP-only gérés auto
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw new Error('Échec de la connexion');
    return await response.json(); // renvoie juste { user }
  }

  async register(userData: { username: string; email: string; password: string }) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        avatar: "", // optionnel
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Échec de l'inscription");
    }

    return await response.json();
  }

  async me() {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ME}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Non authentifié');
    return await response.json(); // claims (username, email, etc.)
  }

  async logout() {
    await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGOUT}`, {
      method: 'POST',
      credentials: 'include',
    });
  }

  async getUsername() {
    try {
      const userData = await this.me();
      return userData.username || null;
    } catch (error) {
      console.error("Erreur lors de la récupération du nom d'utilisateur:", error);
      return null;
    }
  }

  async getChatToken() {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT_TOKEN}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) throw new Error("Échec de la récupération du token de chat");
    const data = await response.json();
    return data.token;
  }
}

export const authService = new AuthService();