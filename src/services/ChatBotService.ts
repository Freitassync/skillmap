import { OPENAI_API_KEY } from '@env';
import DatabaseService from './DatabaseService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * ChatBotService - Integração com OpenAI GPT para assistente de carreira
 */
class ChatBotService {
  private static instance: ChatBotService;
  private apiKey: string;
  private apiUrl = 'https://api.openai.com/v1/chat/completions';
  private model = 'gpt-3.5-turbo';

  private systemPrompt = `Você é um assistente virtual especializado em desenvolvimento de carreira e requalificação profissional (reskilling). 
Seu objetivo é ajudar profissionais a:
- Identificar habilidades necessárias para novas carreiras
- Criar planos de aprendizado personalizados
- Orientar sobre transições de carreira
- Sugerir recursos de aprendizado
- Dar feedback sobre progresso e roadmaps

Seja sempre encorajador, prático e forneça conselhos acionáveis. Use exemplos concretos quando possível.`;

  private constructor() {
    this.apiKey = OPENAI_API_KEY;
    if (!this.apiKey || this.apiKey.trim() === '') {
      console.warn('⚠️  OpenAI API Key not configured. ChatBot will work in mock mode.');
    }
  }

  public static getInstance(): ChatBotService {
    if (!ChatBotService.instance) {
      ChatBotService.instance = new ChatBotService();
    }
    return ChatBotService.instance;
  }

  /**
   * Envia mensagem para o ChatGPT e retorna resposta
   */
  public async sendMessage(
    usuarioId: string,
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatMessage> {
    console.log('🤖 ChatBotService.sendMessage called');
    console.log('  User ID:', usuarioId);
    console.log('  Message:', message);
    console.log('  History length:', conversationHistory.length);
    
    try {
      // Salva mensagem do usuário no banco
      console.log('💾 Saving user message to database...');
      await DatabaseService.saveChatMessage(usuarioId, 'user', message);
      console.log('✅ User message saved');

      // Se não houver API key, retorna resposta mock
      if (!this.apiKey || this.apiKey.trim() === '') {
        console.log('⚠️  No API key configured, using mock response');
        return this.getMockResponse(message);
      }

      console.log('🔑 API key configured, calling OpenAI...');
      // Prepara histórico para contexto
      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      console.log(`📡 Sending request to OpenAI (${messages.length} messages in context)...`);
      // Chama API da OpenAI
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      console.log('📥 OpenAI response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ OpenAI API Error:', errorData);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ OpenAI response received');
      const assistantMessage = data.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';

      // Salva resposta do assistente no banco
      console.log('💾 Saving assistant response to database...');
      await DatabaseService.saveChatMessage(usuarioId, 'assistant', assistantMessage);
      console.log('✅ Assistant message saved');

      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
      };

      return chatMessage;

    } catch (error) {
      console.error('❌ Error in ChatBotService.sendMessage:', error);
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      
      // Em caso de erro, retorna mensagem de fallback
      const fallbackMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, encontrei um problema ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date(),
      };

      return fallbackMessage;
    }
  }

  /**
   * Resposta mock quando API key não está configurada (modo de desenvolvimento)
   */
  private getMockResponse(message: string): ChatMessage {
    const lowerMessage = message.toLowerCase();
    
    let response = '';

    if (lowerMessage.includes('roadmap') || lowerMessage.includes('plano')) {
      response = `Ótima escolha! Para criar um roadmap eficaz de ${lowerMessage}, recomendo:

1. **Avalie suas skills atuais** - Identifique gaps de conhecimento
2. **Defina objetivos claros** - Onde você quer estar em 6-12 meses?
3. **Divida em etapas** - Metas pequenas e alcançáveis
4. **Pratique regularmente** - Consistência é mais importante que intensidade

Posso te ajudar a detalhar alguma dessas etapas?`;
    } else if (lowerMessage.includes('carreira') || lowerMessage.includes('transição')) {
      response = `Mudanças de carreira são desafiadoras mas muito recompensadoras! Algumas dicas importantes:

✅ Identifique habilidades transferíveis da sua carreira atual
✅ Faça networking na nova área (LinkedIn, eventos, comunidades)
✅ Comece com projetos paralelos para ganhar experiência
✅ Considere certificações relevantes
✅ Seja paciente - transições levam tempo

Sobre qual área você está pensando em migrar?`;
    } else if (lowerMessage.includes('habilidade') || lowerMessage.includes('skill')) {
      response = `Desenvolver novas habilidades é fundamental! Aqui está meu framework:

🎯 **Hard Skills**: Competências técnicas (programação, design, análise de dados)
💡 **Soft Skills**: Competências comportamentais (comunicação, liderança, trabalho em equipe)

Dica: Combine 70% de prática + 20% de aprendizado social + 10% de teoria (regra 70-20-10).

Qual skill você quer desenvolver primeiro?`;
    } else {
      response = `Olá! Sou seu assistente de carreira IA. Estou aqui para ajudar você com:

📚 Planejamento de roadmaps de aprendizado
🎯 Orientação sobre transição de carreira
💼 Desenvolvimento de habilidades (hard e soft skills)
📈 Estratégias de crescimento profissional

Como posso te ajudar hoje?`;
    }

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };
  }

  /**
   * Carrega histórico de conversas do banco de dados
   */
  public async loadChatHistory(usuarioId: string): Promise<ChatMessage[]> {
    console.log('📚 ChatBotService.loadChatHistory called for user:', usuarioId);
    try {
      const history = await DatabaseService.getChatHistory(usuarioId, 50);
      console.log(`✅ Retrieved ${history.length} messages from database`);
      
      const chatMessages = history.map((msg, index) => ({
        id: `msg_${index}_${msg.timestamp}`,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
      }));

      return chatMessages;
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  /**
   * Limpa histórico de conversas
   */
  public async clearChatHistory(usuarioId: string): Promise<void> {
    try {
      await DatabaseService.clearChatHistory(usuarioId);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }

  /**
   * Gera sugestões contextuais baseadas no roadmap do usuário
   */
  public async getSuggestions(usuarioId: string, context: string): Promise<string[]> {
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
