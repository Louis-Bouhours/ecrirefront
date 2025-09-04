import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    username: string;
    text: string;
    timestamp: string;
    room: string;
    self?: boolean;
}

// Singleton WS shared across mounts
let sharedWs: WebSocket | null = null;
let sharedUrl = '';
let reconnectTimer: number | null = null;

function openSharedSocket(url: string, onOpen?: () => void) {
    if (sharedWs && sharedUrl === url && sharedWs.readyState !== WebSocket.CLOSED) {
        return sharedWs;
    }
    if (sharedWs && sharedWs.readyState === WebSocket.OPEN) {
        try {
            sharedWs.close();
        } catch (err) {
            console.debug('WS close failed (ignored):', err);
        }
    }
    sharedUrl = url;
    sharedWs = new WebSocket(url);
    if (onOpen) sharedWs.addEventListener('open', onOpen, { once: true });
    return sharedWs;
}

const ChatPage: React.FC = () => {
    const [username, setUsername] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const room = useMemo(() => 'general', []);

    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const atBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!atBottom && messages.length > 5);
    };

    useEffect(() => {
        const fromLocal = localStorage.getItem('username');
        if (fromLocal) {
            setUsername(fromLocal);
            return;
        }
        fetch('/api/me', { credentials: 'include' })
            .then(async (res) => {
                if (!res.ok) throw new Error('unauthorized');
                return res.json();
            })
            .then((data) => {
                if (data?.username) {
                    setUsername(data.username);
                    try {
                        localStorage.setItem('username', data.username);
                    } catch (err) {
                        console.debug('localStorage.setItem failed (ignored):', err);
                    }
                } else {
                    throw new Error('no username');
                }
            })
            .catch(() => {
                window.location.href = '/login';
            });
    }, []);

    useEffect(() => {
        if (!username) return;
        const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
        const ws = openSharedSocket(url);
        wsRef.current = ws;

        const handleOpen = () => setConnected(true);
        const handleClose = () => {
            setConnected(false);
            if (reconnectTimer == null) {
                reconnectTimer = window.setTimeout(() => {
                    reconnectTimer = null;
                    openSharedSocket(url, () => setConnected(true));
                }, 800);
            }
        };

        const handleError = (ev: Event) => {
            console.warn('WS error:', ev);
        };

        const handleMessage = (ev: MessageEvent) => {
            try {
                const raw = JSON.parse(ev.data);
                const iso =
                    typeof raw?.timestamp === 'string'
                        ? raw.timestamp
                        : raw?.timestamp
                            ? new Date(raw.timestamp).toISOString()
                            : new Date().toISOString();
                const msg: Message = {
                    id: raw?.id ?? `srv-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    username: raw?.username ?? 'Inconnu',
                    text: raw?.text ?? '',
                    timestamp: iso,
                    room: raw?.room ?? room,
                };
                setMessages((prev) => [...prev, msg]);
            } catch (err) {
                console.warn('WS message parse error (ignored):', err);
            }
        };

        ws.addEventListener('open', handleOpen);
        ws.addEventListener('close', handleClose);
        ws.addEventListener('error', handleError);
        ws.addEventListener('message', handleMessage);

        return () => {
            ws.removeEventListener('open', handleOpen);
            ws.removeEventListener('close', handleClose);
            ws.removeEventListener('error', handleError);
            ws.removeEventListener('message', handleMessage);
        };
    }, [room, username]);

    useEffect(() => {
        const messageContainer = messagesContainerRef.current;
        if (messageContainer) {
            messageContainer.addEventListener('scroll', handleScroll);
            return () => messageContainer.removeEventListener('scroll', handleScroll);
        }
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const scrollToBottom = () => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = () => {
        if (!input.trim() || !username || !connected) return;
        const text = input.trim();

        const local: Message = {
            id: `local-${Date.now()}`,
            username,
            text,
            timestamp: new Date().toISOString(),
            room,
            self: true,
        };
        setMessages((prev) => [...prev, local]);
        setInput('');
        setSending(true);
        try {
            wsRef.current?.send(JSON.stringify({ text, room, username }));
        } finally {
            setSending(false);
        }
    };

    const time = (iso: string) =>
        new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const generateUserColor = (username: string) => {
        const colors = [
            '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#84CC16'
        ];
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash % colors.length);
        return colors[index];
    };

    return (
        <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />

            {/* Floating Orbs */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

            {/* Sidebar */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute left-0 top-0 h-full w-80 backdrop-blur-xl bg-white/5 border-r border-white/10 p-6 flex flex-col"
            >
                {/* User Profile */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="backdrop-blur-sm bg-white/5 rounded-3xl p-6 border border-white/10 mb-6"
                >
                    <div className="flex items-center space-x-4">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-lg"
                            style={{ backgroundColor: username ? generateUserColor(username) : '#6366F1' }}
                        >
                            {username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-white font-semibold text-lg">{username}</h2>
                            <div className="flex items-center space-x-2 mt-1">
                                <motion.div
                                    animate={connected ?
                                        { backgroundColor: '#10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' } :
                                        { backgroundColor: '#ef4444', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)', scale: [1, 1.1, 1] }
                                    }
                                    transition={{ duration: connected ? 0.3 : 1.5, repeat: connected ? 0 : Infinity }}
                                    className="w-3 h-3 rounded-full"
                                />
                                <span className="text-blue-200/70 text-sm">
                  {connected ? 'En ligne' : 'Déconnecté'}
                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Channel Info */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="backdrop-blur-sm bg-white/5 rounded-3xl p-6 border border-white/10 mb-6"
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">#</span>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">général</h3>
                            <p className="text-blue-200/70 text-sm">Salon principal</p>
                        </div>
                    </div>
                    <div className="text-blue-200/70 text-sm">
                        {messages.length} message{messages.length > 1 ? 's' : ''}
                    </div>
                </motion.div>

                {/* Actions */}
                <div className="flex-1" />
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                        try {
                            await fetch('http://localhost:8081/api/logout', {
                                method: 'POST',
                                credentials: 'include',
                            });
                        } catch (err) {
                            console.debug('Logout API failed (ignored):', err);
                        }
                        window.location.href = '/login';
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    Déconnexion
                </motion.button>
            </motion.div>

            {/* Main Chat Area */}
            <div className="ml-80 h-full flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 p-8 overflow-hidden">
                    <div
                        ref={messagesContainerRef}
                        className="h-full overflow-y-auto pr-4"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(59, 130, 246, 0.3) transparent'
                        }}
                    >
                        <AnimatePresence>
                            {messages.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex items-center justify-center"
                                >
                                    <div className="text-center">
                                        <motion.div
                                            animate={{
                                                rotate: [0, 10, -10, 0],
                                                scale: [1, 1.1, 1]
                                            }}
                                            transition={{
                                                duration: 4,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500/20 to-cyan-400/20 backdrop-blur-sm border border-white/10 flex items-center justify-center mx-auto mb-8"
                                        >
                                            <svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </motion.div>
                                        <h3 className="text-3xl font-bold text-white mb-4">Commencez la conversation</h3>
                                        <p className="text-blue-200/70 text-lg max-w-md mx-auto">
                                            Bienvenue dans le salon général. Dites bonjour à la communauté !
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="space-y-6 pb-6">
                                    {messages.map((message, index) => {
                                        const isSelf = message.self || (username && message.username === username);
                                        const userColor = generateUserColor(message.username);

                                        return (
                                            <motion.div
                                                key={message.id}
                                                initial={{ opacity: 0, y: 20, x: isSelf ? 50 : -50 }}
                                                animate={{ opacity: 1, y: 0, x: 0 }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 25,
                                                    delay: index * 0.05
                                                }}
                                                className="flex items-start space-x-4 max-w-4xl"
                                                style={{
                                                    marginLeft: isSelf ? 'auto' : '0',
                                                    marginRight: isSelf ? '0' : 'auto',
                                                    flexDirection: isSelf ? 'row-reverse' : 'row'
                                                }}
                                            >
                                                {/* Avatar */}
                                                <motion.div
                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                    className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-xl border-2 border-white/20"
                                                    style={{ backgroundColor: userColor }}
                                                >
                                                    {message.username.charAt(0).toUpperCase()}
                                                </motion.div>

                                                {/* Message Content */}
                                                <motion.div
                                                    whileHover={{ y: -2 }}
                                                    className={`max-w-lg ${isSelf ? 'mr-4' : 'ml-4'}`}
                                                >
                                                    {/* Message Header */}
                                                    <div className={`flex items-center space-x-3 mb-2 ${isSelf ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <span
                                className="font-bold text-sm"
                                style={{ color: userColor }}
                            >
                              {message.username}
                            </span>
                                                        <span className="text-blue-200/50 text-xs">
                              {time(message.timestamp)}
                            </span>
                                                    </div>

                                                    {/* Message Bubble */}
                                                    <motion.div
                                                        className={`rounded-3xl px-6 py-4 backdrop-blur-sm border shadow-lg ${
                                                            isSelf
                                                                ? 'bg-gradient-to-r from-blue-500/80 to-cyan-400/80 text-white border-white/20'
                                                                : 'bg-white/10 text-white border-white/10'
                                                        }`}
                                                        whileHover={{
                                                            scale: 1.02,
                                                            boxShadow: isSelf
                                                                ? '0 20px 40px rgba(59, 130, 246, 0.3)'
                                                                : '0 20px 40px rgba(255, 255, 255, 0.1)'
                                                        }}
                                                    >
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                            {message.text}
                                                        </p>
                                                    </motion.div>
                                                </motion.div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </AnimatePresence>
                        <div ref={endRef} />
                    </div>
                </div>

                {/* Input Area */}
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="p-8 border-t border-white/10 backdrop-blur-sm bg-white/5"
                >
                    <div className="flex items-center space-x-4 max-w-4xl mx-auto">
                        <div className="flex-1 relative">
                            <motion.input
                                whileFocus={{ scale: 1.02 }}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Tapez votre message..."
                                disabled={!connected}
                                className="w-full px-8 py-5 bg-white/10 border border-white/20 rounded-full text-white placeholder-blue-200/50 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all duration-300 text-lg disabled:opacity-50"
                            />

                            {/* Send Button (integrated in input) */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={sendMessage}
                                disabled={!input.trim() || sending || !connected}
                                className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    !input.trim() || sending || !connected
                                        ? 'bg-white/10 text-blue-200/50 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg hover:shadow-xl'
                                }`}
                            >
                                {sending ? (
                                    <motion.svg
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </motion.svg>
                                ) : (
                                    <svg className="w-5 h-5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Scroll to bottom FAB */}
            <AnimatePresence>
                {showScrollButton && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 100 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={scrollToBottom}
                        className="fixed bottom-32 right-8 w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white shadow-2xl z-50"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatPage;