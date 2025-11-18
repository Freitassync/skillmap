# 🗄️ Backend Local de Desenvolvimento - SkillMap 4.0

## 📋 Visão Geral

O SkillMap 4.0 utiliza um **backend local baseado em SQLite** para desenvolvimento e testes. Este sistema permite simular um ambiente de produção completo sem necessidade de servidor externo.

---

## 🏗️ Arquitetura do Backend

### **Componentes Principais**

1. **DatabaseService** (`src/services/DatabaseService.ts`)
   - Singleton pattern para gerenciamento do banco SQLite
   - Métodos CRUD completos para todas as entidades
   - Suporte a transações e queries complexas

2. **AuthService** (`src/services/AuthService.ts`)
   - Sistema de autenticação baseado em tokens
   - Hash de senhas com crypto SHA-256
   - Validação de sessão com SecureStore

3. **SQLite Database** (`skillmap.db`)
   - Banco de dados local Expo SQLite
   - Persistência automática entre sessões
   - Suporte a migrações e reset

---

## 📊 Estrutura do Banco de Dados

### **Tabela: `users`**

Armazena dados dos usuários cadastrados.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- UUID gerado: user-{timestamp}-{random}
  name TEXT NOT NULL,                     -- Nome do usuário
  email TEXT UNIQUE NOT NULL,             -- Email único (usado no login)
  password_hash TEXT NOT NULL,               -- Hash SHA-256 da senha
  xp_level INTEGER DEFAULT 1,             -- Nível de XP atual (1-100)
  current_xp INTEGER DEFAULT 0,             -- XP acumulado no nível atual
  creation_date TEXT DEFAULT CURRENT_TIMESTAMP,
  last_onboarding TEXT                  -- Último onboarding visualizado
);
```

**Índices:**
- `UNIQUE INDEX` em `email` para login rápido

---

### **Tabela: `roadmaps`**

Roadmaps de carreira criados pelos usuários.

```sql
CREATE TABLE roadmaps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,               -- FK para users.id
  title TEXT NOT NULL,
  career_goal TEXT NOT NULL,
  experience TEXT NOT NULL,        -- 'beginner', 'intermediate', 'advanced'
  creation_date TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

### **Tabela: `skills`**

Skills (hard e soft) disponíveis no sistema.

```sql
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('hard', 'soft')),
  category TEXT                          -- Ex: 'tecnologia', 'gestao', 'comunicacao'
);
```

---

### **Tabela: `roadmap_skills`**

Relação N:N entre roadmaps e skills com controle de progresso.

```sql
CREATE TABLE roadmap_skills (
  id TEXT PRIMARY KEY,
  roadmap_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  order INTEGER NOT NULL,                 -- Ordem de aprendizado (0, 1, 2...)
  is_concluded INTEGER DEFAULT 0,            -- 0 = pendente, 1 = concluída
  conclusion_date TEXT,
  FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
```

---

### **Tabela: `chat_messages`**

Histórico de conversas com o chatbot de IA.

```sql
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔐 Sistema de Autenticação

### **Fluxo de Cadastro**

```typescript
// 1. Usuário preenche formulário
const dados = {
  name: "João Silva",
  email: "joao@example.com",
  senha: "Senha123"
};

// 2. AuthService sanitiza e valida dados
const emailLimpo = sanitizeEmail(dados.email);
const nameLimpo = sanitizeNome(dados.name);

// 3. Verifica se email já existe no SQLite
const existe = await DatabaseService.getUserByEmail(emailLimpo);

// 4. Cria hash da senha (SHA-256)
const passwordHash = await hashPassword(dados.senha);

// 5. Insere usuário no banco
await DatabaseService.createUser({
  id: `user-${Date.now()}-${random}`,
  name: nameLimpo,
  email: emailLimpo,
  password_hash: passwordHash,
  xp_level: 1,
  current_xp: 0
});

// 6. Gera token de sessão
await SecureStore.setItemAsync('AUTH_TOKEN', user.id);

// 7. Armazena dados do usuário no cache
await AsyncStorage.setItem('USER_DATA', JSON.stringify(user));
```

---

### **Fluxo de Login**

```typescript
// 1. Usuário fornece credenciais
const credentials = {
  email: "joao@example.com",
  senha: "Senha123"
};

// 2. Busca usuário no SQLite por email
const user = await DatabaseService.getUserByEmail(credentials.email);

// 3. Compara hash da senha
const senhaCorreta = await comparePassword(
  credentials.senha, 
  user.password_hash
);

// 4. Se correto, cria sessão
if (senhaCorreta) {
  await SecureStore.setItemAsync('AUTH_TOKEN', user.id);
  await AsyncStorage.setItem('USER_DATA', JSON.stringify(user));
}
```

---

### **Validação de Sessão**

```typescript
// Executado ao iniciar o app (App.tsx e useAuth.ts)

// 1. Busca token no SecureStore
const token = await SecureStore.getItemAsync('AUTH_TOKEN');

// 2. Valida token no SQLite
const user = await DatabaseService.getUserById(token);

// 3. Se válido, restaura sessão
if (user) {
  await AsyncStorage.setItem('USER_DATA', JSON.stringify(user));
  return user;
}

// 4. Se inválido, limpa sessão
await SecureStore.deleteItemAsync('AUTH_TOKEN');
```

---

## 🛠️ API do DatabaseService

### **CRUD Usuários**

```typescript
// Criar usuário
await DatabaseService.createUser({
  id: 'user-123',
  name: 'João Silva',
  email: 'joao@example.com',
  password_hash: 'hash_sha256',
  xp_level: 1,
  current_xp: 0
});

// Buscar por email
const user = await DatabaseService.getUserByEmail('joao@example.com');

// Buscar por ID
const user = await DatabaseService.getUserById('user-123');

// Atualizar XP
await DatabaseService.updateUserXP('user-123', 5, 150);

// Atualizar onboarding
await DatabaseService.updateUserOnboarding('user-123', 'login');
```

---

### **CRUD Roadmaps**

```typescript
// Criar roadmap
await DatabaseService.createRoadmap({
  id: 'roadmap-123',
  user_id: 'user-123',
  title: 'Dev Full Stack',
  career_goal: 'Desenvolvedor Full Stack',
  experience: 'intermediate'
});

// Listar roadmaps do usuário
const roadmaps = await DatabaseService.getRoadmapsByUserId('user-123');

// Deletar roadmap (CASCADE para skills)
await DatabaseService.deleteRoadmap('roadmap-123');
```

---

### **CRUD Skills**

```typescript
// Criar skill
await DatabaseService.createSkill({
  id: 'skill-123',
  name: 'React Native',
  description: 'Desenvolvimento mobile com React',
  type: 'hard',
  category: 'tecnologia'
});

// Buscar skill
const skill = await DatabaseService.getSkillById('skill-123');

// Associar skill a roadmap
await DatabaseService.createRoadmapSkill({
  id: 'rs-123',
  roadmap_id: 'roadmap-123',
  skill_id: 'skill-123',
  order: 0,
  is_concluded: false
});

// Marcar skill como concluída
await DatabaseService.updateRoadmapSkillConcluida('rs-123', true);

// Listar skills de um roadmap (com JOIN)
const skills = await DatabaseService.getRoadmapSkills('roadmap-123');
```

---

### **Chat Messages**

```typescript
// Salvar mensagem do usuário
await DatabaseService.saveChatMessage(
  'user-123',
  'user',
  'Como me tornar um desenvolvedor?'
);

// Salvar resposta do assistente
await DatabaseService.saveChatMessage(
  'user-123',
  'assistant',
  'Para se tornar desenvolvedor, recomendo...'
);

// Buscar histórico (últimas 50 mensagens)
const historico = await DatabaseService.getChatHistory('user-123', 50);

// Limpar histórico
await DatabaseService.clearChatHistory('user-123');
```

---

## 🔒 Segurança

### **Hash de Senhas**

Utilizamos SHA-256 com Expo Crypto:

```typescript
import * as Crypto from 'expo-crypto';

export async function hashPassword(senha: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    senha + SALT // SALT adiciona entropia
  );
  return hash;
}

export async function comparePassword(
  senha: string, 
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(senha);
  return passwordHash === hash;
}
```

---

### **Armazenamento de Tokens**

- **SecureStore**: Tokens de autenticação (criptografado)
- **AsyncStorage**: Dados do usuário em cache (não sensível)
- **SQLite**: Dados persistentes (senha hash, nunca plaintext)

---

## 🧪 Testes em Desenvolvimento

### **Resetar Banco de Dados**

```typescript
// Limpar todos os dados (útil para testes)
await DatabaseService.clearAllData();
```

### **Popular Dados de Teste**

```typescript
// Criar usuário de teste
await DatabaseService.createUser({
  id: 'test-user-1',
  name: 'Teste User',
  email: 'teste@skillmap.com',
  password_hash: await hashPassword('Teste123'),
  xp_level: 10,
  current_xp: 500
});

// Criar roadmap de teste
await DatabaseService.createRoadmap({
  id: 'test-roadmap-1',
  user_id: 'test-user-1',
  title: 'Roadmap Teste',
  career_goal: 'Desenvolvedor',
  experience: 'beginner'
});
```

---

## 📱 Integração com Frontend

### **useAuth Hook**

```typescript
import { useAuth } from '../hooks/useAuth';

const MyScreen = () => {
  const { user, login, cadastrar, logout, atualizarXP } = useAuth();

  // Fazer login
  const handleLogin = async () => {
    const result = await login({ 
      email: 'joao@example.com', 
      senha: 'Senha123' 
    });
    
    if (result.success) {
      console.log('Usuário logado:', result.user);
    } else {
      console.error('Erro:', result.error);
    }
  };

  // Atualizar XP
  const handleGanharXP = async () => {
    if (user) {
      await atualizarXP(user.xp_level + 1, 0);
    }
  };

  return (
    <View>
      {user ? (
        <Text>Bem-vindo, {user.nome}!</Text>
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
};
```

---

## 🚀 Logs de Desenvolvimento

O sistema possui logging extensivo para debug:

```
🔐 AuthService.login - Email: joao@example.com
✅ Usuário encontrado: João Silva
✅ Senha correta
✅ Login realizado com sucesso

📝 AuthService.cadastrar - Email: maria@example.com
✅ Usuário criado: Maria Santos
✅ Cadastro realizado com sucesso

🔍 AuthService.verificarSessao
✅ Token encontrado: user-1763076863178-qclsdw1lu
✅ Sessão válida: João Silva

💾 DatabaseService.saveChatMessage
  User ID: user-123
  Role: user
  Content length: 45
✅ Message saved to database
```

---

## 📂 Localização do Banco

O banco SQLite é criado automaticamente em:

- **iOS**: `~/Library/Application Support/ExpoGo/.expo-internal/...`
- **Android**: `/data/data/host.exp.exponent/files/.expo-internal/...`

Para acessar o banco (Android):

```bash
# Via adb
adb shell
cd /data/data/host.exp.exponent/files/.expo-internal/
ls -la skillmap.db

# Copiar para desktop
adb pull /data/data/host.exp.exponent/files/.expo-internal/skillmap.db .
```

---

## 🔄 Migração para Produção

Quando migrar para backend real:

1. **Substituir DatabaseService** por chamadas HTTP
2. **Manter AuthService** (ajustar para JWT)
3. **API REST** com endpoints similares:
   - `POST /auth/login`
   - `POST /auth/register`
   - `GET /auth/verify`
   - `POST /roadmaps`
   - `GET /roadmaps/:userId`
   - etc.

4. **Manter estrutura de tabelas** (schema já está otimizado)

---

## ✅ Checklist de Funcionalidades

- ✅ Cadastro de usuários com hash de senha
- ✅ Login com validação de credenciais
- ✅ Verificação de sessão persistente
- ✅ Logout e limpeza de tokens
- ✅ CRUD completo de roadmaps
- ✅ Sistema de skills com progresso
- ✅ Histórico de chat com IA
- ✅ Sistema de XP e gamificação
- ✅ Onboarding tracking
- ✅ Logging extensivo para debug
- ✅ Foreign keys e CASCADE deletes
- ✅ Índices para performance

---

## 📚 Referências

- [Expo SQLite Docs](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Expo Crypto](https://docs.expo.dev/versions/latest/sdk/crypto/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

---

**Desenvolvido para SkillMap 4.0 - Global Solution 2025**
