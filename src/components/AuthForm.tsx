import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';

export const AuthForm: React.FC = () => {
  // UI state only
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Keep existing logic/state intact
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const { login, register, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
      }
      navigate({ to: '/general-chat' });
    } catch (err) {
      // L'erreur est déjà gérée par le hook useAuth et affichée dans le composant
      console.error('Erreur d\'authentification:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl"
      >
        {/* Header with logo */}
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-600/20 to-cyan-500/20 border border-slate-700"
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <path
                fill="url(#g)"
                d="M12 2l2.39 4.84L20 7.27l-3.73 3.64.88 5.15L12 13.77 6.85 16.06l.88-5.15L4 7.27l5.61-.43L12 2z"
              />
            </svg>
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-white m-0">Bienvenue</h1>
            <p className="text-sm text-slate-400 mt-1">
              {isLogin
                ? 'Ravi de vous revoir. Connectez-vous pour continuer.'
                : 'Créez votre compte en quelques secondes.'}
            </p>
          </div>
        </div>

        {/* Toggle between login and register */}
        <div className="grid grid-cols-2 bg-slate-800/50 rounded-xl p-1 mb-6">
          <motion.button
            onClick={() => setIsLogin(true)}
            className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
              isLogin
                ? 'bg-gradient-to-r from-indigo-600/50 to-cyan-500/50 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            whileTap={{ scale: 0.97 }}
          >
            Connexion
          </motion.button>
          <motion.button
            onClick={() => setIsLogin(false)}
            className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
              !isLogin
                ? 'bg-gradient-to-r from-indigo-600/50 to-cyan-500/50 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            whileTap={{ scale: 0.97 }}
          >
            Inscription
          </motion.button>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-lg mb-4"
          >
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm leading-tight">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username field (only for register) */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Ex. jean.dupont"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="bg-slate-800/60 border border-slate-700 text-white pl-10 pr-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  required
                  autoComplete="username"
                />
              </div>
            </motion.div>
          )}

          {/* Email field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="vous@exemple.com"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-slate-800/60 border border-slate-700 text-white pl-10 pr-4 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                required
                autoComplete={isLogin ? 'email' : 'new-email'}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder={isLogin ? 'Votre mot de passe' : 'Créez un mot de passe'}
                value={formData.password}
                onChange={handleInputChange}
                className="bg-slate-800/60 border border-slate-700 text-white pl-10 pr-10 py-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </motion.button>
            </div>
            {!isLogin && (
              <p className="text-xs text-slate-500 mt-2">
                8+ caractères recommandés, mélangez lettres, chiffres et symboles.
              </p>
            )}
          </div>

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3 px-4 mt-6 rounded-xl font-semibold text-white ${
              loading
                ? 'bg-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:shadow-lg hover:shadow-indigo-500/20'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Chargement...</span>
              </div>
            ) : isLogin ? (
              'Se connecter'
            ) : (
              "S'inscrire"
            )}
          </motion.button>
        </form>

        {/* Footer text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            {isLogin ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
            <motion.button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              whileHover={{ scale: 1.05 }}
              className="text-cyan-400 font-semibold hover:text-cyan-300 focus:outline-none"
            >
              {isLogin ? 'Créer un compte' : 'Se connecter'}
            </motion.button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};