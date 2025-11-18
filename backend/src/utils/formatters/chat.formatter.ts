import type { ChatMessage } from '@prisma/client';

export interface ApiChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class ChatMessageFormatter {
  static toApi(msg: ChatMessage): ApiChatMessage {
    return {
      id: msg.id,
      user_id: msg.userId,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.timestamp,
    };
  }

  static toApiList(messages: ChatMessage[]): ApiChatMessage[] {
    return messages.map(this.toApi);
  }
}
