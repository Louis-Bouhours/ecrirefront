import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  room: string;
  self?: boolean;
}

interface RawHistory {
  id?: string;
  username?: string;
  sender?: string;
  text?: string;
  content?: string;
  timestamp?: string | number | Date;
  created_at?: string | number | Date;
  room?: string;
}

function isRawHistoryArray(data: unknown): data is RawHistory[] {
  return Array.isArray(data);
}

const Cookies = {
  set: (name: string, value: string, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax${secure}`;
  },
  get: (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';').shift() || '');
    return null;
  },
  remove: (name: string) => {
    document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`;
  }
};

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
  const [scrollPosition, setScrollPosition] = useState({ current: 0, max: 0 });
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isHovering, setIsHovering] = useState(false);


  const scrollTimeoutRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const room = useMemo(() => 'general', []);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
    const maxScroll = scrollHeight - clientHeight;
    setScrollPosition({
      current: Math.round((scrollTop / maxScroll) * 100) || 0,
      max: 100,
    });
    setShowScrollButton(!atBottom && messages.length > 5);
  }, [messages.length]);

  useEffect(() => {
    const fromCookie = Cookies.get('username');
    if (fromCookie) {
      setUsername(fromCookie);
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
            Cookies.set('username', data.username);
          } catch (err) {
            console.debug('Cookie set failed (ignored):', err);
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
    let cancelled = false;
    setMessages([]);
    fetch(`/api/messages?room=${encodeURIComponent(room)}&limit=200`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('history fetch failed');
        return res.json();
      })
      .then((data: unknown) => {
        if (cancelled) return;
        const array = isRawHistoryArray(data) ? data : [];
        const mapped: Message[] = array.map((raw, idx) => ({
          id: raw.id || `hist-${Date.now()}-${idx}`,
          username: raw.username ?? raw.sender ?? 'Inconnu',
          text: raw.text ?? raw.content ?? '',
          timestamp: typeof raw.timestamp === 'string'
            ? raw.timestamp
            : new Date(raw.timestamp ?? raw.created_at ?? Date.now()).toISOString(),
          room: raw.room ?? room,
        }));
        setMessages(mapped);
      })
      .catch((err) => console.debug('history load failed:', err));
    return () => { cancelled = true; };
  }, [room, username]);

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
    const handleError = (ev: Event) => console.warn('WS error:', ev);
    const handleMessage = (ev: MessageEvent) => {
      try {
        const raw = JSON.parse(ev.data);
        const msg: Message = {
          id: raw?.id ?? `srv-${Date.now()}`,
          username: raw?.username ?? 'Inconnu',
          text: raw?.text ?? '',
          timestamp: typeof raw?.timestamp === 'string'
            ? raw.timestamp
            : new Date(raw?.timestamp ?? Date.now()).toISOString(),
          room: raw?.room ?? room,
        };
        setMessages((prev) => [...prev, msg]);
      } catch (err) {
        console.warn('WS message parse error:', err);
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
    const container = messagesContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (isAtBottom) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

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

  const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const generateUserColor = (username: string) => {
    const colors = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#84CC16'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash % colors.length)];
  };

  const otherUsersMessages = messages.filter(msg => !msg.self && msg.username !== 'Serveur');
  const messageCount = otherUsersMessages.length;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(59, 130, 246, 0.6) rgba(255, 255, 255, 0.1);
            scroll-behavior: smooth;
          }
          .custom-scrollbar::-webkit-scrollbar { width: 14px; }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(145deg, rgba(59, 130, 246, 0.8), rgba(6, 182, 212, 0.8), rgba(139, 92, 246, 0.7));
            border-radius: 12px;
            border: 2px solid rgba(255, 255, 255, 0.1);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(145deg, rgba(59, 130, 246, 1), rgba(6, 182, 212, 1), rgba(139, 92, 246, 0.9));
          }
        `
      }} />
      <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="flex-1 p-8 overflow-hidden">

          <div
            ref={messagesContainerRef}
            className={`h-full overflow-y-auto pr-2 custom-scrollbar ${isHovering ? 'scrollbar-visible' : 'scrollbar-hidden'}`}
            role="log"
            aria-live="polite"
            aria-label="Messages du chat"
            tabIndex={0}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex items-center justify-center">
                  {/* ... */}
                </motion.div>
              ) : (
                <div className="space-y-6 pb-6">
                  {/* ... */}
                </div>
              )}
            </AnimatePresence>
            <div ref={endRef} />
          </div>
        </div>
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute left-0 top-0 h-full w-80 backdrop-blur-xl bg-white/5 border-r border-white/10 p-6 flex flex-col"
        >
          <motion.div whileHover={{ scale: 1.02 }} className="backdrop-blur-sm bg-white/5 rounded-3xl p-6 border border-white/10 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-lg" style={{ backgroundColor: username ? generateUserColor(username) : '#6366F1' }}>
                {username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">{username}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <motion.div
                    animate={connected ? { backgroundColor: '#10b981', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' } : { backgroundColor: '#ef4444', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)', scale: [1, 1.1, 1] }}
                    transition={{ duration: connected ? 0.3 : 1.5, repeat: connected ? 0 : Infinity }}
                    className="w-3 h-3 rounded-full"
                  />
                  <span className="text-blue-200/70 text-sm">{connected ? 'En ligne' : 'Déconnecté'}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="backdrop-blur-sm bg-white/5 rounded-3xl p-6 border border-white/10 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center">
                <span className="text-white font-bold text-xl">#</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">général</h3>
                <p className="text-blue-200/70 text-sm">Salon principal</p>
              </div>
            </div>
            <div className="text-blue-200/70 text-sm">{messageCount} message{messageCount > 1 ? 's' : ''}</div>
          </motion.div>

          <div className="flex-1" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              try { await fetch('http://localhost:8081/api/logout', { method: 'POST', credentials: 'include' }); } catch (err) { console.debug('Logout API failed:', err); }
              Cookies.remove('username');
              window.location.href = '/login';
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Déconnexion
          </motion.button>
        </motion.div>

        <div className="ml-80 h-full flex flex-col">
          <div className="flex-1 p-8 overflow-hidden">
            <div
              ref={messagesContainerRef}
              className="h-full overflow-y-auto pr-2 custom-scrollbar"
              role="log"
              aria-live="polite"
              aria-label="Messages du chat"
              tabIndex={0}
            >
              <AnimatePresence>
                {messages.length === 0 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500/20 to-cyan-400/20 backdrop-blur-sm border border-white/10 flex items-center justify-center mx-auto mb-8"
                      >
                        <svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </motion.div>
                      <h3 className="text-3xl font-bold text-white mb-4">Commencez la conversation</h3>
                      <p className="text-blue-200/70 text-lg max-w-md mx-auto">Bienvenue dans le salon général. Dites bonjour à la communauté !</p>
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
                          transition={{ type: "spring", stiffness: 400, damping: 25, delay: index * 0.05 }}
                          className="flex items-start space-x-4 max-w-4xl"
                          style={{ marginLeft: isSelf ? 'auto' : '0', marginRight: isSelf ? '0' : 'auto', flexDirection: isSelf ? 'row-reverse' : 'row' }}
                        >
                          <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-xl border-2 border-white/20" style={{ backgroundColor: userColor }}>
                            {message.username.charAt(0).toUpperCase()}
                          </motion.div>
                          <motion.div whileHover={{ y: -2 }} className={`max-w-lg ${isSelf ? 'mr-4' : 'ml-4'}`}>
                            <div className={`flex items-center space-x-3 mb-2 ${isSelf ? 'flex-row-reverse space-x-reverse' : ''}`}>
                              <span className="font-bold text-sm" style={{ color: userColor }}>{message.username}</span>
                              <span className="text-blue-200/50 text-xs">{time(message.timestamp)}</span>
                            </div>
                            <motion.div
                              className={`rounded-3xl px-6 py-4 backdrop-blur-sm border shadow-lg ${isSelf ? 'bg-gradient-to-r from-blue-500/80 to-cyan-400/80 text-white border-white/20' : 'bg-white/10 text-white border-white/10'}`}
                              whileHover={{ scale: 1.02, boxShadow: isSelf ? '0 20px 40px rgba(59, 130, 246, 0.3)' : '0 20px 40px rgba(255, 255, 255, 0.1)' }}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
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

          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="p-8 border-t border-white/10 backdrop-blur-sm bg-white/5">
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
                  aria-label="Message à envoyer"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={sendMessage}
                  disabled={!input.trim() || sending || !connected}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${!input.trim() || sending || !connected ? 'bg-white/10 text-blue-200/50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg hover:shadow-xl'}`}
                  aria-label="Envoyer le message"
                >
                  {sending ? (
                    <motion.svg animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </motion.svg>
                  ) : (
                    <svg className="w-5 h-5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {showScrollButton && (
            <motion.div initial={{ opacity: 0, scale: 0.5, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5, y: 100 }} className="fixed bottom-32 right-8 z-50">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={scrollToBottom}
                className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white shadow-2xl"
                aria-label="Faire défiler vers le bas"
              >
                {messages.length > 0 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                    {Math.min(messages.filter(m => !m.self).length, 99)}
                  </motion.div>
                )}
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </motion.button>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-gray-900/90 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap backdrop-blur-sm border border-white/20">
                Aller au bas ({scrollPosition.current}%)
                <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900/90 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ChatPage;
