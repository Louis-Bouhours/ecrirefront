import React, { useEffect, useMemo, useRef, useState } from 'react';

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  room: string;
  self?: boolean;
}

// Singleton WS shared across mounts (works fine with StrictMode too).
let sharedWs: WebSocket | null = null;
let sharedUrl = '';
let reconnectTimer: number | null = null;

function openSharedSocket(url: string, onOpen?: () => void) {
  if (sharedWs && sharedUrl === url && sharedWs.readyState !== WebSocket.CLOSED) {
    return sharedWs;
  }
  if (sharedWs && sharedWs.readyState === WebSocket.OPEN) {
    try { sharedWs.close(); } catch {}
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

  const wsRef = useRef<WebSocket | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const room = useMemo(() => 'general', []);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      window.location.href = '/login';
      return;
    }
    setUsername(storedUsername);

    // Use the Vite proxy: connect to same-origin ws path → Vite forwards to :8081
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
    const ws = openSharedSocket(url);
    wsRef.current = ws;

    const handleOpen = () => setConnected(true);
    const handleClose = () => {
      setConnected(false);
      // simple autoreconnect
      if (reconnectTimer == null) {
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = null;
          openSharedSocket(url, () => setConnected(true));
        }, 800);
      }
    };
    const handleError = () => { /* optional log */ };
    const handleMessage = (ev: MessageEvent) => {
      try {
        const raw = JSON.parse(ev.data);
        const iso = typeof raw?.timestamp === 'string'
          ? raw.timestamp
          : raw?.timestamp ? new Date(raw.timestamp).toISOString() : new Date().toISOString();
        const msg: Message = {
          id: raw?.id ?? `srv-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          username: raw?.username ?? 'Inconnu',
          text: raw?.text ?? '',
          timestamp: iso,
          room: raw?.room ?? room,
        };
        setMessages((prev) => [...prev, msg]);
      } catch {}
    };

    ws.addEventListener('open', handleOpen);
    ws.addEventListener('close', handleClose);
    ws.addEventListener('error', handleError);
    ws.addEventListener('message', handleMessage);

    // Cleanup: detach listeners, but DO NOT close sharedWs (StrictMode would close it immediately)
    return () => {
      ws.removeEventListener('open', handleOpen);
      ws.removeEventListener('close', handleClose);
      ws.removeEventListener('error', handleError);
      ws.removeEventListener('message', handleMessage);
    };
  }, [room]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      wsRef.current?.send(JSON.stringify({ text, room }));
    } finally {
      setSending(false);
    }
  };

  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-2 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-700">#</span>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">#général</h1>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span className="text-xs text-slate-500">{connected ? 'Connecté' : 'Reconnexion...'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {username ? `Connecté en tant que ${username}` : '...'}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('username');
                window.location.href = '/login';
              }}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 active:scale-[0.99]"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <main className="mx-auto my-6 flex w-full max-w-3xl flex-1 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <section className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[40vh] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4a2 2 0 0 0-2 2v14l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600">Bienvenue dans #général</p>
                  <p className="text-xs text-slate-500">Dites bonjour pour commencer la discussion</p>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isSelf = m.self || (username && m.username === username);
                return (
                  <div key={m.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ring-1 ${
                      isSelf ? 'bg-violet-600 text-white ring-violet-600/10' : 'bg-white text-slate-800 ring-slate-200'
                    }`}>
                      {!isSelf && <div className="mb-0.5 text-xs font-medium text-slate-500">{m.username}</div>}
                      <div className="whitespace-pre-wrap break-words text-sm">{m.text}</div>
                      <div className={`mt-1 text-right text-[10px] ${isSelf ? 'text-violet-100/90' : 'text-slate-400'}`}>{time(m.timestamp)}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </section>

          <section className="sticky bottom-0 border-t border-slate-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Écrivez un message..."
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none ring-violet-300 placeholder:text-slate-400 focus:ring-2"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending || !connected}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Envoyer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="-mt-px h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
                <span className="ml-2 hidden sm:inline">Envoyer</span>
              </button>
            </div>
          </section>
        </main>

        <footer className="pb-6 text-center text-xs text-slate-400">
          WS natif — diffusion en temps réel, aucun stockage
        </footer>
      </div>
    </div>
  );
};

export default ChatPage;