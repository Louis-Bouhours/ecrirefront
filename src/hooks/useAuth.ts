import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

export const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        authService.me()
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            await authService.login(email, password);
            const me = await authService.me();
            setUser(me);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur');
            throw err;
        } finally {
            setLoading(false);
        }
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

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return { user, loading, error, login, register, logout };
};
