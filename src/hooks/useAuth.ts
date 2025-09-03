import { useState, useEffect } from 'react';
import { authService } from '../../services/authService.ts';
import type { LoginRequest, RegisterRequest } from '@/config/api.ts';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [username, setUsername] = useState(authService.getUsername());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
    setUsername(authService.getUsername());
  }, []);

  const login = async (credentials: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      await authService.login(credentials);
      setIsAuthenticated(true);
      setUsername(authService.getUsername());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      await authService.register(userData);
      setIsAuthenticated(true);
      setUsername(authService.getUsername());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'inscription');
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