import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';

export const ChatRoom: React.FC = () => {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { username, logout } = useAuth();
  const {
    messages,
    onlineUsers,
    isConnected,
    loading,
    error,
    connectToChat,
    sendMessage,
    disconnect
  } = useChat();

  useEffect(() => {
    connectToChat();
    return () => disconnect();
  }, [connectToChat, disconnect]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(messageInput);
      setMessageInput('');
    }
  };

  const handleLogout = () => {
    disconnect();
    logout();
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={loadingSpinnerStyle}>Connexion au chat...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerLeftStyle}>
          <h1 style={titleStyle}>Écrire - Chat</h1>
          <div style={statusStyle}>
            <span style={{
              ...statusIndicatorStyle,
              backgroundColor: isConnected ? '#4caf50' : '#f44336'
            }}></span>
            {isConnected ? 'Connecté' : 'Déconnecté'}
          </div>
        </div>
        <div style={headerRightStyle}>
          <span style={usernameStyle}>👋 {username}</span>
          <button onClick={handleLogout} style={logoutButtonStyle}>
            Déconnexion
          </button>
        </div>
      </div>

      <div style={mainContentStyle}>
        {/* Sidebar avec utilisateurs en ligne */}
        <div style={sidebarStyle}>
          <h3 style={sidebarTitleStyle}>
            Utilisateurs en ligne ({onlineUsers.length})
          </h3>
          <div style={userListStyle}>
            {onlineUsers.map((user, index) => (
              <div key={index} style={userItemStyle}>
                <div style={userAvatarStyle}>
                  {user.charAt(0).toUpperCase()}
                </div>
                <span style={userNameStyle}>{user}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zone de messages */}
        <div style={chatAreaStyle}>
          {error && (
            <div style={errorBannerStyle}>
              ⚠️ {error}
              <button onClick={connectToChat} style={retryButtonStyle}>
                Réessayer
              </button>
            </div>
          )}

          <div style={messagesContainerStyle}>
            {messages.length === 0 ? (
              <div style={emptyStateStyle}>
                <p>Aucun message pour le moment...</p>
                <p>Commencez la conversation ! 💬</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    ...messageStyle,
                    ...(message.username === username ? myMessageStyle : otherMessageStyle)
                  }}
                >
                  <div style={messageHeaderStyle}>
                    <span style={messageAuthorStyle}>{message.username}</span>
                    <span style={messageTimeStyle}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div style={messageContentStyle}>{message.text}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <form onSubmit={handleSendMessage} style={messageFormStyle}>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Tapez votre message..."
              style={messageInputStyle}
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected || !messageInput.trim()}
              style={{
                ...sendButtonStyle,
                ...((!isConnected || !messageInput.trim()) ? disabledButtonStyle : {})
              }}
            >
              📤
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f8f9fa',
};

const loadingContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: '#f8f9fa',
};

const loadingSpinnerStyle: React.CSSProperties = {
  fontSize: '18px',
  color: '#6c757d',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '15px 20px',
  backgroundColor: 'white',
  borderBottom: '1px solid #e9ecef',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const headerLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
};

const headerRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#343a40',
  fontSize: '24px',
};

const statusStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: '#6c757d',
};

const statusIndicatorStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
};

const usernameStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#495057',
};

const logoutButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
};

const mainContentStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
};

const sidebarStyle: React.CSSProperties = {
  width: '250px',
  backgroundColor: 'white',
  borderRight: '1px solid #e9ecef',
  padding: '20px',
  overflowY: 'auto',
};

const sidebarTitleStyle: React.CSSProperties = {
  margin: '0 0 15px 0',
  color: '#495057',
  fontSize: '16px',
  fontWeight: 'bold',
};

const userListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const userItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px',
  borderRadius: '4px',
  backgroundColor: '#f8f9fa',
};

const userAvatarStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#007bff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '14px',
  fontWeight: 'bold',
};

const userNameStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#495057',
};

const chatAreaStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'white',
};

const errorBannerStyle: React.CSSProperties = {
  backgroundColor: '#f8d7da',
  color: '#721c24',
  padding: '10px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #f5c6cb',
};

const retryButtonStyle: React.CSSProperties = {
  padding: '4px 8px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '3px',
  cursor: 'pointer',
  fontSize: '12px',
};

const messagesContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#6c757d',
  marginTop: '50px',
};

const messageStyle: React.CSSProperties = {
  maxWidth: '70%',
  padding: '12px',
  borderRadius: '12px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
};

const myMessageStyle: React.CSSProperties = {
  alignSelf: 'flex-end',
  backgroundColor: '#007bff',
  color: 'white',
};

const otherMessageStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  backgroundColor: '#e9ecef',
  color: '#495057',
};

const messageHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '5px',
  fontSize: '12px',
  opacity: 0.8,
};

const messageAuthorStyle: React.CSSProperties = {
  fontWeight: 'bold',
};

const messageTimeStyle: React.CSSProperties = {
  fontSize: '11px',
};

const messageContentStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.4',
};

const messageFormStyle: React.CSSProperties = {
  display: 'flex',
  padding: '20px',
  borderTop: '1px solid #e9ecef',
  gap: '10px',
};

const messageInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  border: '1px solid #ced4da',
  borderRadius: '25px',
  fontSize: '14px',
  outline: 'none',
};

const sendButtonStyle: React.CSSProperties = {
  padding: '12px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '25px',
  cursor: 'pointer',
  fontSize: '16px',
};

const disabledButtonStyle: React.CSSProperties = {
  backgroundColor: '#6c757d',
  cursor: 'not-allowed',
};