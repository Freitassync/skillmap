# SkillMap 4.0 🚀

**Global Solution 2 - FIAP 2025 | Futuro do Trabalho**

Aplicativo mobile para requalificação profissional (reskilling) com geração de roadmaps orientada por IA, sistema de gamificação, chatbot inteligente e acompanhamento de progresso.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Stack Técnica](#stack-técnica)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Instalação e Configuração](#instalação-e-configuração)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Boas Práticas Implementadas](#boas-práticas-implementadas)

---

## 🎯 Visão Geral

O **SkillMap 4.0** é uma solução mobile completa para profissionais que desejam fazer transição de carreira ou se requalificar em novas áreas. O app utiliza inteligência artificial (OpenAI GPT) para gerar trilhas personalizadas de habilidades e fornecer orientação profissional 24/7 através de um chatbot assistente.

### Tema: Futuro do Trabalho

- **Reskilling/Upskilling**: Requalificação profissional orientada por IA
- **Inclusão**: Interface acessível, responsiva e validações claras
- **Gamificação**: Sistema de XP e níveis para engajar usuários
- **IA Integrada**: ChatBot com OpenAI GPT-3.5 Turbo para orientação de carreira
- **Onboarding**: Experiência guiada para novos usuários

---

## 🛠️ Stack Técnica

| Categoria | Tecnologia |
|-----------|-----------|
| **Framework** | React Native (Expo SDK ~54.0.23) |
| **Linguagem** | TypeScript ~5.9.2 |
| **Navegação** | React Navigation v7 (Native Stack + Bottom Tabs) |
| **Estado** | React Context API + Custom Hooks |
| **Persistência** | SQLite (expo-sqlite) + AsyncStorage + SecureStore |
| **IA/ChatBot** | OpenAI API (GPT-3.5 Turbo) |
| **Validação** | Regex customizadas + funções utilitárias |
| **Estilização** | StyleSheet com design system |
| **Segurança** | bcrypt para hash de senha |
| **Environment** | expo-constants |

---

## 🏗️ Arquitetura

O projeto segue **Clean Architecture** e **Separation of Concerns**:

```
src/
├── types/          # Interfaces TypeScript (IUsuario, IRoadmap, DTOs)
├── constants/      # Cores, tipografia, mensagens, validações
├── utils/          # Funções utilitárias (validação, hash, sanitização)
├── services/       # Camada de dados (AuthService, RoadmapService)
├── hooks/          # Custom hooks (useAuth, useRoadmap, useRoadmapSkills)
├── components/     # Componentes reutilizáveis (Button, Input, Card)
├── screens/        # Telas da aplicação
└── navigation/     # Configuração de rotas e guards de auth
```

### Camadas

1. **Types**: Contratos de dados (interfaces, DTOs, tipos de retorno)
2. **Constants**: Configuração centralizada (cores, mensagens, regex)
3. **Utils**: Lógica pura (validação, sanitização, hash)
4. **Services**: Comunicação com persistência local (AsyncStorage/SecureStore)
5. **Hooks**: Encapsulamento de lógica de negócio e estado
6. **Components**: UI reutilizável e tipada
7. **Screens**: Composição de features
8. **Navigation**: Controle de fluxo e autenticação

---

## ✨ Funcionalidades

### 1. Autenticação Segura

- **Login/Cadastro** com validação robusta
- Senha forte (min 6 chars, maiúscula, minúscula, número)
- Hash SHA-256 (simulado para MVP local)
- Persistência segura com **Expo SecureStore**
- Guards de navegação automáticas

### 2. Dashboard (Home)

- Visualização de nível e XP do usuário
- Barra de progresso para próximo nível
- Estatísticas de roadmaps (total, em andamento, concluídos)
- Acesso rápido às features principais

### 3. Gerador de Roadmap 4.0 (Core)

### 1. Onboarding Interativo

- **Onboarding de Cadastro**: 4 slides introduzindo o app antes do cadastro
- **Onboarding de Login**: Tutorial de 4 passos explicando cada funcionalidade
- Paginação visual com dots
- Opção de pular onboarding
- Design responsivo e acessível

### 2. Autenticação Segura

- Cadastro com validação de força de senha
- Login com sanitização de email
- Armazenamento seguro (SecureStore para tokens, SQLite para dados)
- Hash de senha com expo-crypto (SHA-256)
- Validação de formulário em tempo real

### 3. Dashboard (Home)

- Exibição de nível XP e progresso
- Estatísticas de roadmaps (total, em progresso, concluídos)
- Badge de nível com cores dinâmicas
- Ações rápidas: criar roadmap, acompanhar progresso, logout
- Design responsivo com SafeAreaView

### 4. Gerador de Roadmap com IA

- Formulário para carreira desejada + skills atuais (hard/soft)
- IA mock que filtra/recomenda skills do pool
- Validação de entrada e feedback de loading
- Criação persistente no SQLite e AsyncStorage
- Integração com Bottom Tab Navigator

### 5. Skill Gap Tracker

- Listagem horizontal de roadmaps do usuário
- Seleção interativa de roadmap
- Lista de skills com status (pendente/concluído)
- Marcar skill como concluída:
  - Atualiza progresso do roadmap
  - Concede XP ao usuário (50 XP por skill)
  - Alerta de gamificação
- Deletar roadmap com confirmação
- Persistência em SQLite

### 6. ChatBot com IA (OpenAI GPT)

- Integração com OpenAI API (GPT-3.5 Turbo)
- Assistente virtual especializado em carreira
- Histórico de conversas persistido em SQLite
- Modo mock quando API key não configurada
- Interface de chat com:
  - Bubbles de mensagem (usuário e assistente)
  - Input com envio de mensagens
  - Loading indicator durante processamento
  - Scroll automático para última mensagem
  - Opção de limpar histórico

### 7. Bottom Tab Navigator

- Navegação fluida entre 4 telas principais:
  - 🏠 **Home**: Dashboard
  - 🎯 **Gerador**: Criar roadmaps
  - 📊 **Tracker**: Acompanhar progresso
  - 💬 **IA Chat**: Assistente virtual
- Ícones com emojis
- Estilo personalizado com cores do tema

### 8. Banco de Dados SQLite

- Banco local para desenvolvimento/testes
- Tabelas: usuarios, roadmaps, skills, roadmap_skills, chat_messages
- CRUD completo para todas entidades
- Migrations automáticas na inicialização
- Backup de histórico de chat

### 9. Gamificação

- Sistema de XP e níveis (Iniciante → Mestre)
- **50 XP** por skill concluída
- **500 XP** por roadmap 100% completo
- Feedback visual de progresso
- Persistência de XP no SQLite

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** 18+
- **npm** ou **yarn**
- **Expo CLI** (instalado globalmente ou via npx)
- **Expo Go** (app mobile) ou emulador Android/iOS
- **OpenAI API Key** (opcional - app funciona em modo mock)

### Setup

```bash
# 1. Clone o repositório
cd skillmap4

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
# Crie um arquivo .env na raiz do projeto
echo "OPENAI_API_KEY=sua-chave-aqui" > .env
echo "NODE_ENV=development" >> .env

# 4. Inicie o servidor Expo
npx expo start
```

### Configuração da API OpenAI

O ChatBot funciona em dois modos:

1. **Modo OpenAI** (recomendado): Configure sua chave da API no arquivo `.env`
   ```env
   OPENAI_API_KEY=sk-proj-...sua-chave-completa...
   ```

2. **Modo Mock** (fallback): Se não configurar a chave, o app usa respostas pré-programadas

Para obter uma chave da OpenAI:
- Acesse [platform.openai.com](https://platform.openai.com/)
- Crie uma conta e gere uma API key
- **IMPORTANTE**: Nunca commite sua API key no Git!

### Executar no Dispositivo

- **Android**: Pressione `a` no terminal ou escaneie o QR Code com Expo Go
- **iOS**: Pressione `i` no terminal (somente macOS) ou escaneie com Câmera
- **Web**: Pressione `w` (funcionalidade limitada para mobile)

---

## 📂 Estrutura de Pastas

```
skillmap4/
├── App.tsx                    # Entry point (NavigationContainer)
├── index.ts                   # Registro do app
├── app.json                   # Configuração Expo
├── package.json               # Dependências
├── tsconfig.json              # Config TypeScript
│
├── src/
│   ├── types/
│   │   └── models.ts          # Interfaces de domínio e DTOs
│   │
│   ├── constants/
│   │   └── index.ts           # COLORS, TYPOGRAPHY, VALIDATION, MESSAGES, etc.
│   │
│   ├── utils/
│   │   └── validation.ts      # Validação, sanitização, hash
│   │
│   ├── services/
│   │   ├── AuthService.ts     # CRUD usuários, login, cadastro
│   │   └── RoadmapService.ts  # CRUD roadmaps, IA mock, progresso
│   │
│   ├── hooks/
│   │   ├── useAuth.ts         # Hook de autenticação
│   │   └── useRoadmap.ts      # Hooks de roadmap/skills
│   │
│   ├── components/
│   │   ├── Button.tsx         # Botão tipado com variantes
│   │   ├── Input.tsx          # Input controlado com validação
│   │   ├── Card.tsx           # Container reutilizável
│   │   └── index.ts           # Barrel export
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── CadastroScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── GeradorRoadmapScreen.tsx
│   │   └── RoadmapTrackerScreen.tsx
│   │
│   └── navigation/
│       ├── AppNavigator.tsx   # Stack com guards de auth
│       └── types.ts           # RootStackParamList
│
└── assets/                    # Imagens e fontes (se houver)
```

---

## 🔒 Boas Práticas Implementadas

### Segurança

- ✅ **Hash de senha** (SHA-256 simulado para MVP; em produção, use bcrypt no backend)
- ✅ **Expo SecureStore** para tokens de sessão
- ✅ **Validação de senha forte** (regex com maiúscula, minúscula, número)
- ✅ **Sanitização de inputs** (trim, lowercase em emails)
- ✅ **Guards de navegação** (redirecionamento automático se não autenticado)

### Clean Code

- ✅ **Separação de responsabilidades** (Services, Hooks, Components)
- ✅ **Nomeação descritiva** (interfaces com `I` prefix, DTOs claros)
- ✅ **Funções puras** em `utils/` (sem side effects)
- ✅ **Comentários em português** explicando lógica de negócio
- ✅ **Constantes centralizadas** (cores, mensagens, validações)

### TypeScript

- ✅ **Tipagem estrita** em todos os arquivos
- ✅ **Interfaces para todos os modelos de dados**
- ✅ **DTOs para transferência entre camadas**
- ✅ **Tipos de retorno explícitos** em services/hooks
- ✅ **ViewStyle e TextStyle** para evitar `any` em estilos

### UX/UI

- ✅ **Feedback visual** de loading, erros e sucesso
- ✅ **Validação em tempo real** com limpeza de erros ao digitar
- ✅ **Alerts nativos** para confirmações críticas (deletar roadmap)
- ✅ **KeyboardAvoidingView** para melhor experiência mobile
- ✅ **ScrollView** com `keyboardShouldPersistTaps` em formulários

### Performance

- ✅ **useCallback** para evitar re-renders desnecessários
- ✅ **useMemo** para cálculos de progresso
- ✅ **FlatList** para listas longas (otimizado)
- ✅ **Lazy loading** de skills ao selecionar roadmap

---

## 🔮 Roadmap Futuro

### Próximos Passos (Pós-MVP)

1. **Backend Real**
   - API REST/GraphQL para autenticação
   - Integração com IA generativa (OpenAI, Gemini)
   - Banco de dados relacional (PostgreSQL)

2. **Features Adicionais**
   - **Modo Foco Gamificado**: Timer Pomodoro com registro de tempo de estudo
   - **Streak de dias consecutivos** estudando
   - **Conquistas/Badges** desbloqueáveis
   - **Compartilhamento social** de roadmaps

3. **Melhorias Técnicas**
   - Testes unitários (Jest, React Native Testing Library)
   - Testes E2E (Detox)
   - CI/CD (GitHub Actions)
   - Monitoramento (Sentry)
   - Analytics (Firebase/Mixpanel)

4. **Acessibilidade**
   - Suporte completo a screen readers
   - Modo alto contraste
   - Tamanho de fonte ajustável

5. **Internacionalização**
   - Suporte multi-idioma (i18n)
   - Localização de datas/números

---

## 👥 Autores

**Projeto desenvolvido para Global Solution 2 - FIAP 2025**

- Tema: Futuro do Trabalho
- Foco: Reskilling com IA
- Stack: React Native + TypeScript

---

## 📄 Licença

Este projeto é acadêmico e está sob licença MIT para fins educacionais.

---

## 🆘 Troubleshooting

### Erro: "Cannot find module..."
```bash
# Limpe cache e reinstale dependências
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

### TypeScript não reconhece tipagens
```bash
# Revalide o projeto
npx tsc --noEmit
```

### AsyncStorage não persiste dados
- Certifique-se de que o app não está em modo Debug com "Don't keep activities"
- Verifique se os dados não estão sendo limpos no logout

---

## 🎓 Aprendizados

Este projeto demonstra:

- Arquitetura escalável para apps React Native
- Boas práticas de TypeScript e clean code
- Implementação de autenticação local segura
- Gamificação para engajamento de usuários
- UI/UX mobile moderna com feedback consistente

**Happy coding! 🚀**
