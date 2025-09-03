import { useState, useEffect, useCallback } from 'react';
import { chatService} from '../../services/chatService.ts';
import { authService } from '../../services/authService.ts';
import type {Message} from '../../services/chatService.ts';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectToChat = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const username = authService.getUsername();
      if (!username) {
        throw new Error('Utilisateur non connecté');
      }

      // Obtenir un token de chat depuis votre backend
      const chatToken = await authService.getChatToken(username);

      // Se connecter au chat via Socket.IO
      await chatService.connect(chatToken);
      setIsConnected(true);

      // Écouter les nouveaux messages
      chatService.onMessage((message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      // Écouter l'historique des messages
      chatService.onHistory((historyMessages: Message[]) => {
        setMessages(historyMessages);
      });

      // Écouter la liste des utilisateurs en ligne
      chatService.onUserList((users: string[]) => {
        setOnlineUsers(users);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion au chat');
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (text.trim() && isConnected) {
      chatService.sendMessage(text);
    }
  }, [isConnected]);

  const disconnect = useCallback(() => {
    chatService.disconnect();
    setIsConnected(false);
    setMessages([]);
    setOnlineUsers([]);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    messages,
    onlineUsers,
    isConnected,
    loading,
    error,
    connectToChat,
    sendMessage,
    disconnect,
  };
};