import { logger } from '../utils/logger';
import ApiClient from './ApiClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// ChatBotService - Integração com Backend API para assistente de carreira
class ChatBotService {
  private static instance: ChatBotService;

  private constructor() {
    // Singleton instance
  }

  public static getInstance(): ChatBotService {
    if (!ChatBotService.instance) {
      ChatBotService.instance = new ChatBotService();
    }
    return ChatBotService.instance;
  }

  public async sendMessage(
    userId: string,
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatMessage> {
    logger.debug('ChatBotService.sendMessage called');
    console.log('  User ID:', userId);
    console.log('  Message:', message);
    console.log('  History length:', conversationHistory.length);

    try {
      // Send message to backend API
      const response = await ApiClient.post<{ message: ChatMessage }>('/chat/send', {
        user_id: userId,
        message: message,
      });

      if (!response.success || !response.data) {
        console.error('Erro ao enviar mensagem:', response.error);
        throw new Error(response.error || 'Erro ao enviar mensagem');
      }

      logger.info('Resposta recebida do backend');

      return response.data.message;
    } catch (error) {
      console.error('Error in ChatBotService.sendMessage:', error);
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');

      // Fallback error message
      const fallbackMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, encontrei um problema ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date(),
      };

      return fallbackMessage;
    }
  }

  public async loadChatHistory(userId: string): Promise<ChatMessage[]> {
    logger.info('ChatBotService.loadChatHistory called for user:', userId);
    try {
      const response = await ApiClient.get<{ messages: ChatMessage[] }>(`/chat/history/${userId}`);

      if (!response.success || !response.data) {
        console.error('Erro ao carregar histórico:', response.error);
        return [];
      }

      console.log(`Retrieved ${response.data.messages.length} messages from backend`);

      // Convert timestamp strings to Date objects
      const chatMessages = response.data.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      return chatMessages;
    } catch (error) {
      console.error('Error loading chat history:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  public async clearChatHistory(userId: string): Promise<void> {
    try {
      console.log(' ChatBotService.clearChatHistory called for user:', userId);

      const response = await ApiClient.delete(`/chat/history/${userId}`);

      if (!response.success) {
        console.error('Erro ao limpar histórico:', response.error);
        return;
      }

      logger.info('Chat history cleared successfully');
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }

  public async getSuggestions(_userId: string, _context: string): Promise<string[]> {
    const suggestions = [
      'Como posso melhorar minhas soft skills?',
      'Quais recursos você recomenda para aprender programação?',
      'Como fazer networking na área de tecnologia?',
      'Dicas para entrevistas de emprego',
      'Como lidar com síndrome do impostor?',
    ];

    // TODO: Implementar sugestões personalizadas baseadas no contexto do usuário
    return suggestions;
  }
}

export default ChatBotService.getInstance();
