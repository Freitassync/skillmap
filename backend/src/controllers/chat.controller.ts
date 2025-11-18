import { Response } from 'express';
import OpenAI from 'openai';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { ChatMessageFormatter } from '../utils/formatters';
import { asyncHandler } from '../middleware/asyncHandler';
import type { ApiResponse } from '../types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId;
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Mensagem inválida',
    } as ApiResponse);
    return;
  }

  await prisma.chatMessage.create({
    data: {
      userId: userId!,
      role: 'user',
      content: message.trim(),
    },
  });

  if (!OPENAI_API_KEY) {
    logger.warn('OpenAI API key not configured, using mock response');

    const mockResponse = `Esta é uma resposta simulada. Configure OPENAI_API_KEY para usar o chatbot real.

Sua mensagem foi: "${message.trim()}"

Para configurar o chatbot:
1. Obtenha uma chave de API da OpenAI
2. Adicione OPENAI_API_KEY ao arquivo .env
3. Reinicie o servidor`;

    const savedMessage = await prisma.chatMessage.create({
      data: {
        userId: userId!,
        role: 'assistant',
        content: mockResponse,
      },
    });

    res.json({
      success: true,
      data: { message: ChatMessageFormatter.toApi(savedMessage) },
    } as ApiResponse);
    return;
  }

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

  const messages = history.reverse().map((msg: { role: any; content: string }) => ({
    role: msg.role,
    content: msg.content,
  }));

  try {
    const response = await openai!.responses.create({
      model: 'gpt-4.1-mini',
      tools: [{ type: 'web_search' }],
      input: messages
    });

    const assistantMessageContent = response.output_text || 'Desculpe, não consegui gerar uma resposta.';

    const savedMessage = await prisma.chatMessage.create({
      data: {
        userId: userId!,
        role: 'assistant',
        content: assistantMessageContent,
      },
    });

    res.json({
      success: true,
      data: { message: ChatMessageFormatter.toApi(savedMessage) },
    } as ApiResponse);
  } catch (openaiError: any) {
    logger.error({ error: openaiError.response?.data || openaiError.message }, 'OpenAI API error');

    const fallbackMessageContent = 'Desculpe, não foi possível processar sua mensagem no momento. Por favor, tente novamente.';

    const savedMessage = await prisma.chatMessage.create({
      data: {
        userId: userId!,
        role: 'assistant',
        content: fallbackMessageContent,
      },
    });

    res.json({
      success: true,
      data: {
        message: ChatMessageFormatter.toApi(savedMessage),
        error: 'OpenAI API temporarily unavailable',
      },
    } as ApiResponse);
  }
});

export const getChatHistory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

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

  res.json({
    success: true,
    data: { messages: ChatMessageFormatter.toApiList(messages) },
  } as ApiResponse);
});

export const clearChatHistory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;

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
});
