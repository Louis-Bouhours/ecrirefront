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

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const slideIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 500, damping: 25 } }
};

const statusVariants = {
  disconnected: { backgroundColor: "#f56565", scale: [1, 1.1, 1], transition: { repeat: Infinity, repeatType: "reverse", duration: 1.5 } },
  connected: { backgroundColor: "#48bb78", scale: 1 }
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

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

  // Check if we should show the scroll button
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!atBottom && messages.length > 5);
  };

  // Récupère le username (localStorage -> /api/me -> redirection)
  useEffect(() => {
    const fromLocal = localStorage.getItem('username');
    if (fromLocal) {
      setUsername(fromLocal);
      return;
    }

    // si pas de localStorage, tente depuis le token via /api/me
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

  // Connexion WebSocket
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
    // Add scroll event listener
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

    // Echo local immédiat
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
      // Inclure le username dans la charge utile WS pour que les autres clients l'affichent
      wsRef.current?.send(JSON.stringify({ text, room, username }));
    } finally {
      setSending(false);
    }
  };

  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const generateUserColor = (username: string) => {
    const colors = [
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-blue-500',
      'bg-teal-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-orange-500',
      'bg-red-500',
    ];

    // Simple hash function to generate a consistent color for a username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash % colors.length);
    return colors[index];
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50"
    >
      <div className="max-w-6xl mx-auto px-4 py-6 h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-indigo-100 p-4 mb-6 flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center"
            >
              <span className="text-white font-semibold text-xl">#</span>
            </motion.div>

            <div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-indigo-900"
              >
                Salon #général
              </motion.h1>

              <div className="flex items-center mt-1 space-x-2">
                <motion.div
                  variants={statusVariants}
                  animate={connected ? "connected" : "disconnected"}
                  className="h-3 w-3 rounded-full"
                />
                <span className="text-sm text-slate-600">
                  {connected ? 'Connecté' : 'Reconnexion...'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden md:flex items-center space-x-2"
            >
              {username && (
                <>
                  <div className={`w-8 h-8 rounded-full ${generateUserColor(username)} flex items-center justify-center`}>
                    <span className="text-white font-medium">{username.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-slate-700 font-medium">{username}</span>
                </>
              )}
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                try {
                  localStorage.removeItem('username');
                } catch (err) {
                  console.debug('localStorage.removeItem failed (ignored):', err);
                }
                window.location.href = '/login';
              }}
              className="py-2 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium shadow-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Déconnexion
            </motion.button>
          </div>
        </motion.header>

        {/* Main Chat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 bg-white rounded-xl shadow-sm border border-indigo-100 flex flex-col overflow-hidden"
        >
          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent"
          >
            <AnimatePresence mode="wait">
              {messages.length === 0 ? (
                <motion.div
                  key="empty-state"
                  initial="hidden"
                  animate="visible"
                  variants={slideIn}
                  className="h-full flex items-center justify-center"
                >
                  <div className="text-center max-w-md mx-auto">
                    <motion.div
                      variants={pulseVariants}
                      animate="pulse"
                      className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6"
                    >
                      <svg className="w-10 h-10 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd"></path>
                      </svg>
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-xl font-semibold text-slate-800 mb-2"
                    >
                      Aucun message
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-slate-600"
                    >
                      Soyez le premier à envoyer un message dans ce salon.
                    </motion.p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-5">
                  {messages.map((message, index) => {
                    const isSelf = message.self || (username && message.username === username);
                    return (
                      <motion.div
                        key={message.id}
                        initial="hidden"
                        animate="visible"
                        variants={messageVariants}
                        custom={index}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isSelf && (
                          <div className="flex-shrink-0 mr-3">
                            <div className={`w-9 h-9 rounded-full ${generateUserColor(message.username)} flex items-center justify-center shadow-sm`}>
                              <span className="text-white font-semibold">
                                {message.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        )}

                        <div
                          className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                            isSelf
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {!isSelf && (
                            <div className="mb-1 text-xs font-semibold">
                              {message.username}
                            </div>
                          )}
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {message.text}
                          </div>
                          <div
                            className={`text-right text-xs mt-1 ${
                              isSelf ? 'text-indigo-200' : 'text-slate-500'
                            }`}
                          >
                            {time(message.timestamp)}
                          </div>
                        </div>

                        {isSelf && (
                          <div className="flex-shrink-0 ml-3">
                            <div className={`w-9 h-9 rounded-full ${generateUserColor(message.username)} flex items-center justify-center shadow-sm`}>
                              <span className="text-white font-semibold">
                                {message.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-4 border-t border-slate-200 bg-white"
          >
            <div className="flex space-x-3 items-end relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Écrivez un message..."
                disabled={!connected}
                className="flex-1 rounded-xl border border-slate-200 py-3 px-4 bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={!input.trim() || sending || !connected}
                className={`rounded-xl px-6 py-3 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all ${
                  !input.trim() || sending || !connected
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span className="hidden md:inline">Envoyer</span>
                </div>
              </motion.button>

              {/* Scroll to bottom button */}
              <AnimatePresence>
                {showScrollButton && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToBottom}
                    className="absolute bottom-16 right-4 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md"
                    aria-label="Défiler jusqu'en bas"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-center text-xs text-slate-500"
        >
          <p>Chat en temps réel — aucun message n'est stocké</p>
        </motion.footer>
      </div>
    </motion.div>
  );
};

export default ChatPage;