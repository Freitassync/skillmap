import { Response } from 'express';
import OpenAI from 'openai';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import type { ApiResponse, ChatMessage } from '../types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/**
 * Send message to chatbot and save conversation
 */
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { message } = req.body;

    // Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Mensagem inválida',
      } as ApiResponse);
      return;
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        userId: userId!,
        role: 'user',
        content: message.trim(),
      },
    });

    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured, using mock response');

      // Mock response for development
      const mockResponse = `Esta é uma resposta simulada. Configure OPENAI_API_KEY para usar o chatbot real.

Sua mensagem foi: "${message.trim()}"

Para configurar o chatbot:
1. Obtenha uma chave de API da OpenAI
2. Adicione OPENAI_API_KEY ao arquivo .env
3. Reinicie o servidor`;

      // Save assistant response
      const savedMessage = await prisma.chatMessage.create({
        data: {
          userId: userId!,
          role: 'assistant',
          content: mockResponse,
        },
      });

      // Format response as ChatMessage object
      const chatMessage: ChatMessage = {
        id: savedMessage.id,
        user_id: savedMessage.userId,
        role: savedMessage.role as 'user' | 'assistant',
        content: savedMessage.content,
        timestamp: savedMessage.timestamp,
      };

      res.json({
        success: true,
        data: { message: chatMessage },
      } as ApiResponse);
      return;
    }

    // Get conversation history (last 10 messages for context)
    const history = await prisma.chatMessage.findMany({
      where: { userId: userId! },
      select: {
        role: true,
        content: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
    });

    // Build messages array (reverse to chronological order)
    const messages = history.reverse().map((msg: { role: any; content: string }) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Call OpenAI Responses API with web search using SDK
    try {
      const response = await openai!.responses.create({
        model: 'gpt-4.1-mini',
        tools: [{ type: 'web_search' }],
        input: messages
      });

      // Extract response text from OpenAI Responses API
      const assistantMessageContent = response.output_text || 'Desculpe, não consegui gerar uma resposta.';

      // Save assistant response
      const savedMessage = await prisma.chatMessage.create({
        data: {
          userId: userId!,
          role: 'assistant',
          content: assistantMessageContent,
        },
      });

      // Format response as ChatMessage object
      const chatMessage: ChatMessage = {
        id: savedMessage.id,
        user_id: savedMessage.userId,
        role: savedMessage.role as 'user' | 'assistant',
        content: savedMessage.content,
        timestamp: savedMessage.timestamp,
      };

      res.json({
        success: true,
        data: { message: chatMessage },
      } as ApiResponse);
    } catch (openaiError: any) {
      logger.error({ error: openaiError.response?.data || openaiError.message }, 'OpenAI API error');

      // Fallback response
      const fallbackMessageContent = 'Desculpe, não foi possível processar sua mensagem no momento. Por favor, tente novamente.';

      const savedMessage = await prisma.chatMessage.create({
        data: {
          userId: userId!,
          role: 'assistant',
          content: fallbackMessageContent,
        },
      });

      // Format response as ChatMessage object
      const chatMessage: ChatMessage = {
        id: savedMessage.id,
        user_id: savedMessage.userId,
        role: savedMessage.role as 'user' | 'assistant',
        content: savedMessage.content,
        timestamp: savedMessage.timestamp,
      };

      res.json({
        success: true,
        data: {
          message: chatMessage,
          error: 'OpenAI API temporarily unavailable',
        },
      } as ApiResponse);
    }
  } catch (error) {
    logger.error({ error }, 'Send message error');
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem',
    } as ApiResponse);
  }
};

/**
 * Get chat history for user
 */
export const getChatHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Verify user has access to their own chat history
    if (req.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado',
      } as ApiResponse);
      return;
    }

    const messages = await prisma.chatMessage.findMany({
      where: { userId: userId },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Map to expected format with snake_case
    const formattedMessages = messages.map((msg: any) => ({
      ...msg,
      user_id: msg.userId,
    }));

    res.json({
      success: true,
      data: { messages: formattedMessages },
    } as ApiResponse);
  } catch (error) {
    logger.error({ error }, 'Get chat history error');
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico de chat',
    } as ApiResponse);
  }
};

/**
 * Clear chat history for user
 */
export const clearChatHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Verify user is clearing their own chat history
    if (req.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Acesso negado',
      } as ApiResponse);
      return;
    }

    await prisma.chatMessage.deleteMany({
      where: { userId: userId },
    });

    res.json({
      success: true,
      message: 'Histórico de chat limpo com sucesso',
    } as ApiResponse);
  } catch (error) {
    logger.error({ error }, 'Clear chat history error');
    res.status(500).json({
      success: false,
      error: 'Erro ao limpar histórico de chat',
    } as ApiResponse);
  }
};
