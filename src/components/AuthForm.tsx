import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthForm: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const { login, register, loading, error } = useAuth();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await register(formData.username, formData.email, formData.password);
            }
            navigate({ to: '/general-chat' });
        } catch (err) {
            return;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:100px_100px]" />
            </div>

            {/* Main Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Glass Card */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Logo Section */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-center mb-8"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-2xl mb-4 relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-2 border-2 border-white/30 rounded-xl"
                            />
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="relative z-10">
                                <path d="M12 2L22 8.5V15.5C22 19.64 18.64 23 12 23C5.36 23 2 19.64 2 15.5V8.5L12 2Z"
                                      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 12L11 15L16 9"
                                      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {isLogin ? 'Bon retour' : 'Commencer'}
                        </h1>
                        <p className="text-blue-200/70 text-sm">
                            {isLogin ? 'Connexion a votre compte' : 'Création de votre compte'}
                        </p>
                    </motion.div>

                    {/* Tab Switcher */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="relative mb-8"
                    >
                        <div className="relative bg-white/5 p-1 rounded-2xl">
                            <motion.div
                                layout
                                className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl shadow-lg"
                                initial={false}
                                animate={{
                                    left: isLogin ? '4px' : '50%',
                                    right: isLogin ? '50%' : '4px'
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                            <div className="relative z-10 grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setIsLogin(true)}
                                    className={`py-3 px-4 text-sm font-semibold rounded-xl transition-colors duration-200  ${
                                        isLogin ? 'text-white' : 'text-blue-200/60 hover:text-blue-200'
                                    }`}
                                >
                                    Connexion
                                </button>
                                <button
                                    onClick={() => setIsLogin(false)}
                                    className={`py-3 px-4 text-sm font-semibold rounded-xl transition-colors duration-200 ${
                                        !isLogin ? 'text-white' : 'text-blue-200/60 hover:text-blue-200'
                                    }`}
                                >
                                    Crée un compte
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm"
                            >
                                <div className="flex items-center text-red-200">
                                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Field */}
                        <AnimatePresence>
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="Nom d'utilisateur"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            onFocus={() => setFocusedField('username')}
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all duration-300"
                                            required
                                        />
                                        <motion.div
                                            className="absolute inset-0 rounded-2xl border-2 border-blue-400/50 pointer-events-none"
                                            initial={{ opacity: 0, scale: 1.05 }}
                                            animate={{
                                                opacity: focusedField === 'username' ? 1 : 0,
                                                scale: focusedField === 'username' ? 1 : 1.05
                                            }}
                                            transition={{ duration: 0.2 }}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <svg className={`w-5 h-5 transition-colors ${focusedField === 'username' ? 'text-blue-400' : 'text-blue-200/40'}`}
                                                 fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email Field */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                        >
                            <div className="relative group">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all duration-300"
                                    required
                                />
                                <motion.div
                                    className="absolute inset-0 rounded-2xl border-2 border-blue-400/50 pointer-events-none"
                                    initial={{ opacity: 0, scale: 1.05 }}
                                    animate={{
                                        opacity: focusedField === 'email' ? 1 : 0,
                                        scale: focusedField === 'email' ? 1 : 1.05
                                    }}
                                    transition={{ duration: 0.2 }}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <svg className={`w-5 h-5 transition-colors ${focusedField === 'email' ? 'text-blue-400' : 'text-blue-200/40'}`}
                                         fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                </div>
                            </div>
                        </motion.div>

                        {/* Password Field */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                        >
                            <div className="relative group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Mot de passe"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    className="w-full px-4 py-4 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all duration-300"
                                    required
                                />
                                <motion.div
                                    className="absolute inset-0 rounded-2xl border-2 border-blue-400/50 pointer-events-none"
                                    initial={{ opacity: 0, scale: 1.05 }}
                                    animate={{
                                        opacity: focusedField === 'password' ? 1 : 0,
                                        scale: focusedField === 'password' ? 1 : 1.05
                                    }}
                                    transition={{ duration: 0.2 }}
                                />
                                <motion.button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-200/40 hover:text-blue-400 transition-colors"
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {showPassword ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3.182-3.182l4.243 4.243" />
                                        )}
                                    </svg>
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                        >
                            <motion.button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                                whileHover={!loading ? { scale: 1.02 } : {}}
                                whileTap={!loading ? { scale: 0.98 } : {}}
                            >
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500"
                                    initial={{ x: '-100%' }}
                                    whileHover={{ x: '0%' }}
                                    transition={{ duration: 0.3 }}
                                />
                                <span className="relative z-10 flex items-center justify-center">
                                    {loading ? (
                                        <>
                                            <motion.svg
                                                className="w-5 h-5 mr-2"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </motion.svg>
                                            Chargement...
                                        </>
                                    ) : (
                                        <>
                                            {isLogin ? 'Sign In' : 'Create Account'}
                                            <motion.svg
                                                className="w-5 h-5 ml-2"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                animate={{ x: [0, 4, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </motion.svg>
                                        </>
                                    )}
                                </span>
                            </motion.button>
                        </motion.div>
                    </form>

                </div>

                {/* Floating Elements */}
                <motion.div
                    className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-2xl backdrop-blur-sm"
                    animate={{ rotate: [0, 180, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-xl backdrop-blur-sm"
                    animate={{ rotate: [360, 180, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>
        </div>
    );
};
