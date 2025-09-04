import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      const user = authService.getUsername();
      setIsAuthenticated(isAuth);
      setUsername(user);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);
      setIsAuthenticated(true);
      setUsername(response.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      throw err; // Propager l'erreur pour que le composant puisse la gérer
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.register(userData);
      setIsAuthenticated(true);
      setUsername(response.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'inscription');
      throw err; // Propager l'erreur pour que le composant puisse la gérer
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUsername(null);
  };

  return {
    isAuthenticated,
    username,
    loading,
    error,
    login,
    register,
    logout,
  };
};