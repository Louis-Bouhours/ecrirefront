import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

// Define a custom interface to include CSS custom properties
interface CustomCSSProperties extends React.CSSProperties {
  '--primary-color'?: string;
  '--primary-light'?: string;
  '--text-color'?: string;
  '--text-secondary'?: string;
  '--background-color'?: string;
  '--border-color'?: string;
  '--muted-background'?: string;
  '--online-color'?: string;
  '--away-color'?: string;
  '--font-family'?: string;
  '--shadow'?: string;
  '--radius'?: string;
}

// --- Styles (extracted from styles.css) ---
const globalStyles: CustomCSSProperties = {
  '--primary-color': '#8a2be2',
  '--primary-light': 'rgba(138, 43, 226, 0.1)',
  '--text-color': '#333',
  '--text-secondary': '#666',
  '--background-color': '#fff',
  '--border-color': '#e0e0e0',
  '--muted-background': '#f5f5f5',
  '--online-color': '#4caf50',
  '--away-color': '#ffc107',
  '--font-family': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
  '--shadow': '0 2px 10px rgba(0, 0, 0, 0.1)',
  '--radius': '8px',
};

const chatContainerStyles: React.CSSProperties = {
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
  width: '100%', // Ensure it takes full width
};

const sidebarStyles: React.CSSProperties = {
  width: '320px',
  borderRight: '1px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--background-color)',
};

const sidebarHeaderStyles: React.CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const sidebarH1Styles: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  color: 'var(--primary-color)',
};

const searchContainerStyles: React.CSSProperties = {
  padding: '12px 16px',
  position: 'relative',
};

const searchIconStyles: React.CSSProperties = {
  position: 'absolute',
  left: '24px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-secondary)',
  fontSize: '0.875rem',
};

const searchInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '8px 8px 8px 32px',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  fontSize: '0.875rem',
};

const conversationsListStyles: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px',
};

const conversationItemBaseStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const conversationItemHoverStyles: React.CSSProperties = {
  backgroundColor: 'var(--muted-background)',
};

const conversationItemActiveStyles: React.CSSProperties = {
  backgroundColor: 'var(--primary-light)',
};

const conversationContentStyles: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const conversationHeaderStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px',
};

const conversationNameStyles: React.CSSProperties = {
  fontWeight: 500,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const conversationTimeStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
};

const conversationPreviewStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const conversationLastMessageStyles: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '200px',
};

const unreadCountStyles: React.CSSProperties = {
  backgroundColor: 'var(--primary-color)',
  color: 'white',
  fontSize: '0.75rem',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const currentUserStyles: React.CSSProperties = {
  padding: '16px',
  borderTop: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const chatMainStyles: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--background-color)',
};

const chatHeaderStyles: React.CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const chatHeaderUserStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const chatHeaderActionsStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
};

const messagesContainerStyles: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  backgroundColor: 'var(--background-color)',
};

const emptyStateStyles: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-secondary)',
  textAlign: 'center',
};

const emptyStateH2Styles: React.CSSProperties = {
  fontSize: '1.25rem',
  marginBottom: '8px',
};

const messagesStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const messageBaseStyles: React.CSSProperties = {
  display: 'flex',
  maxWidth: '70%',
};

const messageOutgoingStyles: React.CSSProperties = {
  alignSelf: 'flex-end',
};

const messageBubbleBaseStyles: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '18px',
  position: 'relative',
};

const messageIncomingBubbleStyles: React.CSSProperties = {
  backgroundColor: 'var(--muted-background)',
  borderTopLeftRadius: '4px',
};

const messageOutgoingBubbleStyles: React.CSSProperties = {
  backgroundColor: 'var(--primary-color)',
  color: 'white',
  borderTopRightRadius: '4px',
};

const messageTimeStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  marginTop: '4px',
  textAlign: 'right',
  opacity: 0.7,
};

const messageInputContainerStyles: React.CSSProperties = {
  padding: '16px',
  borderTop: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const messageInputWrapperStyles: React.CSSProperties = {
  flex: 1,
  position: 'relative',
};

const messageInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 40px 10px 16px',
  border: '1px solid var(--border-color)',
  borderRadius: '24px',
  fontSize: '0.9375rem',
};

const sendButtonBaseStyles: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'var(--primary-color)',
  color: 'white',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const sendButtonHoverStyles: React.CSSProperties = {
  backgroundColor: '#7823c7',
};

const sendButtonDisabledStyles: React.CSSProperties = {
  backgroundColor: '#c4a6e9',
  cursor: 'not-allowed',
};

const avatarBaseStyles: React.CSSProperties = {
  position: 'relative',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  overflow: 'hidden',
  flexShrink: 0,
};

const avatarImgStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const statusIndicatorBaseStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  right: 0,
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  border: '2px solid var(--background-color)',
};

const statusIndicatorOnlineStyles: React.CSSProperties = {
  backgroundColor: 'var(--online-color)',
};

const statusIndicatorAwayStyles: React.CSSProperties = {
  backgroundColor: 'var(--away-color)',
};

const statusIndicatorOfflineStyles: React.CSSProperties = {
  backgroundColor: 'var(--text-secondary)',
};

const userInfoStyles: React.CSSProperties = {
  minWidth: 0,
};

const userNameStyles: React.CSSProperties = {
  fontWeight: 500,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const userStatusStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
}

const iconButtonBaseStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};


const mobileMenuButtonStyles: React.CSSProperties = {
  display: 'none', // Hidden by default, shown on mobile
  background: 'none',
  border: 'none',
  fontSize: '1.25rem',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  marginRight: '12px',
};

// --- Interfaces for data structures ---
interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  message?: string; // Used for socket messages, sometimes `text` is populated from this
  timestamp: string;
  read: boolean;
  room?: string; // Added for socket messages
  username?: string; // Added for socket messages
}

interface Conversation {
  id: string;
  user: User;
  lastMessage: Message | null;
  unreadCount: number;
  pinned?: boolean;
  name?: string; // Used for group chats or general room
}

// --- ChatPage Component ---
const ChatPage: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Array<Conversation>>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<Message>>([]); // Messages for the active conversation
  const [messageInput, setMessageInput] = useState<string>('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // For auto-scrolling

  // Ref to hold the latest activeConversationId, used in socket event listeners
  const activeConversationIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedToken = localStorage.getItem('token');

    if (!storedUsername || !storedToken) {
      window.location.href = '/'; // Redirect to login if not authenticated
      return;
    }

    setUsername(storedUsername);
    setToken(storedToken);

    // Initialize Socket.io
    socketRef.current = io("/", { forceNew: true });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      // Join the general room immediately
      socketRef.current?.emit('join', { username: storedUsername, token: storedToken, room: "general" });
    });

    socketRef.current.on('message', (msg: Message) => {
      console.log('Received message:', msg);
      // Only add message if it belongs to the currently active conversation
      // Use the ref to get the latest activeConversationId
      if (msg.room === activeConversationIdRef.current) {
        setMessages((prevMessages) => [...prevMessages, msg]);
      }
      // Update last message in conversation list
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === msg.room
            ? { ...conv, lastMessage: { ...msg, text: msg.text || msg.message || '' } } // Use msg.message if msg.text is not present
            : conv
        )
      );
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Initial conversations (from app.js and ChatLoginHandler.js)
    const initialConversations: Array<Conversation> = [
      {
        id: "general",
        name: "#général",
        pinned: true,
        user: { id: "general-user", name: "#général", avatar: "https://via.placeholder.com/40", status: "online" },
        lastMessage: null,
        unreadCount: 0,
      },
      {
        id: "conv1",
        user: {
          id: "user1",
          name: "Sophie Martin",
          avatar: "https://via.placeholder.com/40/FF5733/FFFFFF?text=SM", // More vibrant placeholder
          status: "online",
        },
        lastMessage: {
          id: "msg1",
          senderId: "user1",
          text: "On se retrouve où pour le déjeuner demain ?",
          timestamp: "10:42",
          read: true,
        },
        unreadCount: 0,
      },
      {
        id: "conv2",
        user: {
          id: "user2", // Changed ID to make it distinct
          name: "Jean Dupont",
          avatar: "https://via.placeholder.com/40/3366FF/FFFFFF?text=JD",
          status: "away",
        },
        lastMessage: {
          id: "msg2",
          senderId: "user2",
          text: "J'ai une idée pour le projet, je t'appelle ce soir.",
          timestamp: "Hier",
          read: false,
        },
        unreadCount: 2,
      },
      {
        id: "conv3",
        user: {
          id: "user3", // Changed ID to make it distinct
          name: "Marie Curie",
          avatar: "https://via.placeholder.com/40/33FF66/FFFFFF?text=MC",
          status: "offline",
        },
        lastMessage: {
          id: "msg3",
          senderId: "user3",
          text: "Ok, super ! Hâte de voir ça.",
          timestamp: "Dim.",
          read: true,
        },
        unreadCount: 4,
      },
    ];
    setConversations(initialConversations);

    // Select "general" conversation on load
    setActiveConversationId("general");

    return () => {
      socketRef.current?.disconnect();
    };
  }, []); // Empty dependency array: runs only once on component mount

  // Scroll to bottom of messages whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', { method: 'POST' });
      if (response.ok) {
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        window.location.href = '/';
      } else {
        // Replace alert with a more user-friendly modal or message display
        console.error('Erreur lors de la déconnexion.');
        // alert('Erreur lors de la déconnexion.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Replace alert
      // alert('Erreur lors de la déconnexion.');
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeConversationId || !username || !token) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: username, // Assuming current user's ID is their username
      text: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true, // Sent messages are read by sender
      room: activeConversationId,
      username: username,
    };

    // Emit message via socket
    socketRef.current?.emit('message', {
      username: username,
      room: activeConversationId,
      message: messageInput.trim(),
      token: token,
    });

    // Add message to local state immediately for optimistic update
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    // Update last message in conversation list
    setConversations((prevConversations) =>
      prevConversations.map((conv) =>
        conv.id === activeConversationId
          ? { ...conv, lastMessage: newMessage }
          : conv
      )
    );

    setMessageInput('');
  };

  const activeConversation = conversations.find(
    (conv) => conv.id === activeConversationId
  );

  return (
    <div style={{ ...globalStyles, ...chatContainerStyles }}>
      {/* Ensure Font Awesome is loaded in your HTML file for icons to display:
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" xintegrity="sha512-..." crossorigin="anonymous" referrerpolicy="no-referrer" />
      */}

      {/* Sidebar */}
      <div style={sidebarStyles}>
        <div style={sidebarHeaderStyles}>
          <h1 style={sidebarH1Styles}>Écrire</h1>
          <button className="icon-button" aria-label="Plus d'options" style={iconButtonBaseStyles}>
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
        <div style={searchContainerStyles}>
          <i className="fas fa-search search-icon" style={searchIconStyles}></i>
          <label>
            <input type="text" placeholder="Rechercher une conversation..." style={searchInputStyles} />
          </label>
        </div>
        <div style={conversationsListStyles}>
          {conversations
            .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) // Pinned first
            .map((conv) => (
              <div
                key={conv.id}
                style={{
                  ...conversationItemBaseStyles,
                  ...(activeConversationId === conv.id ? conversationItemActiveStyles : {}),
                }}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  // When selecting a conversation, clear messages and load new ones (or fetch from API)
                  setMessages([]);
                  // For "general" chat, re-join the room to get messages
                  // Note: The 'join' event on connection handles initial join.
                  // For switching rooms, a specific 'leave' and 'join' logic might be needed on the backend.
                  if (socketRef.current) {
                    socketRef.current.emit('join', { username: username, token: token, room: conv.id });
                  }
                  // In a real app, you'd fetch messages for this conversation from your backend
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = conversationItemHoverStyles.backgroundColor as string)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = activeConversationId === conv.id ? (conversationItemActiveStyles.backgroundColor as string) : 'transparent')}
              >
                <div style={avatarBaseStyles}>
                  <img src={conv.user.avatar} alt={conv.user.name} style={avatarImgStyles} />
                  <span
                    style={{
                      ...statusIndicatorBaseStyles,
                      ...(conv.user.status === 'online' ? statusIndicatorOnlineStyles : conv.user.status === 'away' ? statusIndicatorAwayStyles : statusIndicatorOfflineStyles),
                    }}
                  ></span>
                </div>
                <div style={conversationContentStyles}>
                  <div style={conversationHeaderStyles}>
                    <span style={conversationNameStyles}>{conv.name || conv.user.name}</span>
                    {conv.lastMessage && <span style={conversationTimeStyles}>{conv.lastMessage.timestamp}</span>}
                  </div>
                  {conv.lastMessage && (
                    <div style={conversationPreviewStyles}>
                      <span style={conversationLastMessageStyles}>{conv.lastMessage.text}</span>
                      {conv.unreadCount > 0 && <span style={unreadCountStyles}>{conv.unreadCount}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
        <div style={currentUserStyles}>
          <div style={userInfoStyles}>
            <p style={userNameStyles}>{username || 'Utilisateur'}</p>
            <p style={userStatusStyles}>En ligne</p>
          </div>
          <div style={avatarBaseStyles}>
            <img src="https://via.placeholder.com/40/8a2be2/FFFFFF?text=ME" alt="Votre avatar" style={avatarImgStyles} />
            <span style={{ ...statusIndicatorBaseStyles, ...statusIndicatorOnlineStyles }}></span>
          </div>
        </div>
      </div>

      {/* Chat Main */}
      <div style={chatMainStyles}>
        <div style={chatHeaderStyles}>
          <button className="mobile-menu-button" aria-label="Menu" style={mobileMenuButtonStyles}>
            <i className="fas fa-bars"></i>
          </button>
          <div style={chatHeaderUserStyles}>
            <div style={avatarBaseStyles}>
              <img src={activeConversation?.user.avatar || "https://via.placeholder.com/40"} alt="Avatar du contact" style={avatarImgStyles} />
              <span
                style={{
                  ...statusIndicatorBaseStyles,
                  ...(activeConversation?.user.status === 'online' ? statusIndicatorOnlineStyles : activeConversation?.user.status === 'away' ? statusIndicatorAwayStyles : statusIndicatorOfflineStyles),
                }}
              ></span>
            </div>
            <div style={userInfoStyles}>
              <p style={userNameStyles}>{activeConversation?.name || activeConversation?.user.name || 'Sélectionnez une conversation'}</p>
              <p style={userStatusStyles}>
                {activeConversation?.user.status === 'online' ? 'En ligne' : activeConversation?.user.status === 'away' ? 'Absent' : 'Hors ligne'}
              </p>
            </div>
          </div>
          <div style={chatHeaderActionsStyles}>
            <button className="icon-button" aria-label="Appel" style={iconButtonBaseStyles}>
              <i className="fas fa-phone"></i>
            </button>
            <button className="icon-button" aria-label="Vidéo" style={iconButtonBaseStyles}>
              <i className="fas fa-video"></i>
            </button>
            <button className="icon-button" aria-label="Déconnexion" onClick={handleLogout} style={iconButtonBaseStyles}>
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>

        <div style={messagesContainerStyles}>
          {!activeConversation ? (
            <div style={emptyStateStyles}>
              <h2 style={emptyStateH2Styles}>Aucune conversation sélectionnée</h2>
              <p>Sélectionnez une conversation pour commencer à discuter</p>
            </div>
          ) : (
            <div style={messagesStyles}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    ...messageBaseStyles,
                    ...(msg.senderId === username ? messageOutgoingStyles : {}),
                  }}
                >
                  <div
                    style={{
                      ...messageBubbleBaseStyles,
                      ...(msg.senderId === username ? messageOutgoingBubbleStyles : messageIncomingBubbleStyles),
                    }}
                  >
                    {msg.text || msg.message} {/* Use msg.message if msg.text is not present */}
                    <div style={messageTimeStyles}>{msg.timestamp}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} /> {/* Scroll target */}
            </div>
          )}
        </div>

        <div style={messageInputContainerStyles}>
          <button className="icon-button" aria-label="Pièce jointe" style={iconButtonBaseStyles}>
            <i className="fas fa-paperclip"></i>
          </button>
          <div style={messageInputWrapperStyles}>
            <input
              type="text"
              placeholder="Écrivez un message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              style={messageInputStyles}
            />
          </div>
          <button
            className="send-button"
            aria-label="Envoyer"
            onClick={handleSendMessage}
            style={{
              ...sendButtonBaseStyles,
              ...(messageInput.trim() ? sendButtonHoverStyles : sendButtonDisabledStyles),
            }}
            disabled={!messageInput.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
