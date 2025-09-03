import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/config/api';

export interface Message {
  username: string;
  text: string;
  timestamp: Date;
}

export interface UserStatus {
  username: string;
  status: 'online' | 'offline';
}

class ChatService {
  private socket: Socket | null = null;
  private messageCallbacks: ((message: Message) => void)[] = [];
  private userListCallbacks: ((users: string[]) => void)[] = [];
  private historyCallbacks: ((messages: Message[]) => void)[] = [];

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(API_CONFIG.SOCKET_URL, {
        withCredentials: true,
        extraHeaders: {
          Cookie: `token=${token}`
        }
      });

      this.socket.on('connect', () => {
        console.log('Connecté au serveur de chat');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Erreur de connexion:', error);
        reject(error);
      });

      // Écouter les messages du chat
      this.socket.on('chat message', (message: Message) => {
        this.messageCallbacks.forEach(callback => callback(message));
      });

      // Écouter l'historique des messages
      this.socket.on('history', (messages: Message[]) => {
        this.historyCallbacks.forEach(callback => callback(messages));
      });

      // Écouter les erreurs
      this.socket.on('error', (error: string) => {
        console.error('Erreur du serveur:', error);
      });
    });
  }

  sendMessage(message: string): void {
    if (this.socket) {
      this.socket.emit('chat message', message);
    }
  }

  onMessage(callback: (message: Message) => void): void {
    this.messageCallbacks.push(callback);
  }

  onUserList(callback: (users: string[]) => void): void {
    this.userListCallbacks.push(callback);
  }

  onHistory(callback: (messages: Message[]) => void): void {
    this.historyCallbacks.push(callback);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageCallbacks = [];
    this.userListCallbacks = [];
    this.historyCallbacks = [];
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const chatService = new ChatService();