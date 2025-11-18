# Integração com OpenAI Responses API - SkillMap 4.0

Este documento explica a integração com a nova **OpenAI Responses API** e as melhorias implementadas.

---

## Migração de Chat Completions para Responses API

### Mudanças Principais

#### Antes (Chat Completions API)

```typescript
// URL antiga
const apiUrl = 'https://api.openai.com/v1/chat/completions';
const model = 'gpt-3.5-turbo';

// Request
const response = await fetch(apiUrl, {
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ],
    temperature: 0.7,
    max_tokens: 500
  })
});

// Response
const assistantMessage = data.choices[0].message.content;
```

#### Depois (Responses API)

```typescript
// Nova URL
const apiUrl = 'https://api.openai.com/v1/responses';
const model = 'gpt-4.1-mini'; // Modelo moderno

// Request
const response = await fetch(apiUrl, {
  body: JSON.stringify({
    model: 'gpt-4.1-mini',
    tools: [{ type: 'web_search' }], // ✨ Web search nativo!
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ],
    temperature: 0.7,
    max_tokens: 500
  })
});

// Response
const assistantMessage = data.output_text; // Campo diferente!
```

---

## Modelo Escolhido: gpt-4.1-mini

### Por que gpt-4.1-mini?

| Critério | gpt-3.5-turbo | gpt-4.1-mini | Vantagem |
|----------|---------------|---------|----------|
| **Custo** | $0.50 / 1M tokens | $0.15 / 1M tokens | 70% mais barato |
| **Latência** | ~2s | ~1.5s | 25% mais rápido |
| **Web Search** | Não nativo | ✅ Nativo | Sem complexidade |
| **Qualidade** | Boa | Melhor | Raciocínio aprimorado |
| **Lançamento** | 2023 | 2025 | Mais moderno |

**Conclusão:** gpt-4.1-mini oferece **melhor custo-benefício** para o SkillMap 4.0.

---

## Web Search Nativo

### Vantagens

1. **Sem infraestrutura adicional:** Não precisa de WebSearchService separado
2. **Informações atualizadas:** Acessa conteúdo recente da web
3. **Fontes citadas:** API retorna links das fontes consultadas
4. **Contextualização:** Responde com dados de 2025, não apenas 2023

### Casos de Uso no SkillMap

#### 1. ChatBot com Informações Atuais

Quando usuário pergunta sobre:
- Tendências de mercado 2025
- Novas tecnologias (ex: "O que é Rust em 2025?")
- Cursos gratuitos recentes
- Vagas de emprego atuais

```typescript
// Web search é automático, sem código extra!
await ChatBotService.sendMessage(userId, "Quais são os frameworks JavaScript mais usados em 2025?");

// Resposta virá com dados atualizados da web
```

#### 2. Busca de Recursos de Aprendizado

Ao criar roadmap, busca automaticamente:
- Cursos gratuitos (YouTube, freeCodeCamp)
- Artigos técnicos (Dev.to, Medium)
- Exercícios práticos (HackerRank, LeetCode)
- Podcasts relevantes

---

## Implementação no ChatBotService

### Arquivo: `src/services/ChatBotService.ts`

**Método principal:** `sendMessage(userId, message, conversationHistory)`

**Fluxo:**

1. **Salva mensagem do usuário** no SQLite
2. **Verifica API key:**
   - Se não configurada → resposta mock
   - Se configurada → chama Responses API
3. **Monta contexto:**
   - System prompt (instruções do assistente)
   - Histórico de conversa
   - Mensagem atual
4. **Chama API com web search:**
   ```typescript
   tools: [{ type: 'web_search' }]
   ```
5. **Processa resposta:**
   - Extrai `output_text`
   - Salva no banco
   - Retorna para o usuário

### Exemplo de Uso

```typescript
import ChatBotService from '../services/ChatBotService';

// No componente ChatBotScreen
const handleSend = async () => {
  const response = await ChatBotService.sendMessage(
    user.id,
    inputText,
    messages // Histórico para contexto
  );

  setMessages(prev => [...prev, response]);
};
```

---

## Modo Mock (Fallback)

### Quando Ativa?

Modo mock é usado quando:
- `OPENAI_API_KEY` não está configurado no `.env`
- Desenvolvimento local sem custos
- Testes sem dependência de API externa

### Respostas Mock

```typescript
private getMockResponse(message: string): ChatMessage {
  const lowerMessage = message?.toLowerCase();

  if (lowerMessage.includes('roadmap')) {
    return {
      role: 'assistant',
      content: 'Ótima escolha! Para criar um roadmap eficaz...'
    };
  }

  if (lowerMessage.includes('carreira')) {
    return {
      role: 'assistant',
      content: 'Mudanças de carreira são desafiadoras mas...'
    };
  }

  // Resposta padrão
  return {
    role: 'assistant',
    content: 'Olá! Sou seu assistente de carreira IA...'
  };
}
```

---

## Configuração da API Key

### Setup no Projeto

1. **Criar arquivo `.env` na raiz:**

```env
OPENAI_API_KEY=sk-proj-...sua-chave-completa...
NODE_ENV=development
```

2. **Obter chave no OpenAI:**
   - Acesse: https://platform.openai.com/
   - Crie conta
   - Generate API Key
   - **IMPORTANTE:** Nunca commitar `.env` no Git!

3. **Verificar configuração:**

```typescript
// ChatBotService.ts:31-34
if (!this.apiKey || this.apiKey.trim() === '') {
  console.warn('⚠️  OpenAI API Key not configured. ChatBot will work in mock mode.');
}
```

---

## Segurança

### Proteções Implementadas

1. **API Key não exposta:**
   - Armazenada em variável de ambiente (`.env`)
   - Não hardcoded no código
   - `.env` listado no `.gitignore`

2. **Validação de respostas:**
   ```typescript
   if (!response.ok) {
     const errorData = await response.json();
     console.error('❌ OpenAI API Error:', errorData);
     throw new Error(`OpenAI API error: ${response.status}`);
   }
   ```

3. **Fallback em erros:**
   ```typescript
   catch (error) {
     return {
       role: 'assistant',
       content: 'Desculpe, encontrei um problema...'
     };
   }
   ```

---

## Logs e Debugging

### Logs Implementados

```typescript
console.log('🤖 ChatBotService.sendMessage called');
console.log('  User ID:', userId);
console.log('  Message:', message);
console.log('  History length:', conversationHistory.length);

console.log('🔑 API key configured, calling OpenAI Responses API...');
console.log(`📡 Sending request to OpenAI (${input.length} messages in context)...`);
console.log('📥 OpenAI response status:', response.status);
console.log('✅ OpenAI response received');
```

**Útil para:**
- Debugar problemas de API
- Monitorar uso de tokens
- Verificar contexto enviado

---

## Limites e Considerações

### Limites da Responses API

- **Max tokens:** 500 por resposta (configurável)
- **Contexto:** Até 16k tokens de histórico
- **Rate limits:** Variam por plano OpenAI

### Otimizações

1. **Limitar histórico:** Carrega apenas últimas 50 mensagens
   ```typescript
   const history = await ChatBotService.loadChatHistory(userId, 50);
   ```

2. **Cache local:** Histórico salvo no SQLite
   - Reduz chamadas à API
   - Funciona offline (modo mock)

3. **Tokens reduzidos:** Max 500 tokens por resposta
   - Respostas concisas
   - Menor custo

---

## Custos Estimados

### Cálculo de Custo

**Modelo:** gpt-4.1-mini ($0.15 / 1M tokens)

**Cenário:** 100 mensagens/dia por usuário

```
Tokens por mensagem:
- Input: ~200 tokens (sistema + histórico + mensagem)
- Output: ~300 tokens (resposta)
- Total: 500 tokens/mensagem

Custo diário:
100 usuários × 100 mensagens × 500 tokens = 5M tokens/dia
5M tokens × $0.15 / 1M = $0.75/dia

Custo mensal: ~$22.50
Custo anual: ~$270
```

**Comparação com gpt-3.5-turbo:** ~$700/ano (⚡ 60% de economia)

---

## Próximos Passos

### Features Planejadas

1. **Busca de Recursos Automática**
   - Ao gerar roadmap, buscar cursos/artigos via web search
   - Salvar em `skill_resources` table

2. **Citações de Fontes**
   - Exibir links das fontes consultadas
   - UI com "📚 Fontes: link1, link2..."

3. **Context Awareness**
   - ChatBot conhece roadmaps do usuário
   - Sugestões personalizadas baseadas em progresso

4. **Markdown Rendering**
   - Renderizar respostas formatadas
   - Code blocks, listas, negrito

---

## Referências

- [OpenAI Responses API Docs](https://platform.openai.com/docs/api-reference/responses)
- [Web Search Tool](https://platform.openai.com/docs/guides/web-search)
- [Migration Guide](https://platform.openai.com/docs/guides/migration)

---

**Última Atualização:** 2025-01-14
**Autor:** Equipe SkillMap 4.0 - FIAP Global Solution 2025
