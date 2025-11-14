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

### **Tabela: `usuarios`**

Armazena dados dos usuários cadastrados.

```sql
CREATE TABLE usuarios (
  id TEXT PRIMARY KEY,                    -- UUID gerado: user-{timestamp}-{random}
  nome TEXT NOT NULL,                     -- Nome do usuário
  email TEXT UNIQUE NOT NULL,             -- Email único (usado no login)
  senha_hash TEXT NOT NULL,               -- Hash SHA-256 da senha
  nivel_xp INTEGER DEFAULT 1,             -- Nível de XP atual (1-100)
  xp_atual INTEGER DEFAULT 0,             -- XP acumulado no nível atual
  data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,
  ultimo_onboarding TEXT                  -- Último onboarding visualizado
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
  usuario_id TEXT NOT NULL,               -- FK para usuarios.id
  titulo TEXT NOT NULL,
  objetivo_carreira TEXT NOT NULL,
  nivel_experiencia TEXT NOT NULL,        -- 'iniciante', 'intermediario', 'avancado'
  data_criacao TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
```

---

### **Tabela: `skills`**

Skills (hard e soft) disponíveis no sistema.

```sql
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('hard', 'soft')),
  categoria TEXT                          -- Ex: 'tecnologia', 'gestao', 'comunicacao'
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
  ordem INTEGER NOT NULL,                 -- Ordem de aprendizado (0, 1, 2...)
  concluida INTEGER DEFAULT 0,            -- 0 = pendente, 1 = concluída
  data_conclusao TEXT,
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
  usuario_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
```

---

## 🔐 Sistema de Autenticação

### **Fluxo de Cadastro**

```typescript
// 1. Usuário preenche formulário
const dados = {
  nome: "João Silva",
  email: "joao@example.com",
  senha: "Senha123"
};

// 2. AuthService sanitiza e valida dados
const emailLimpo = sanitizeEmail(dados.email);
const nomeLimpo = sanitizeNome(dados.nome);

// 3. Verifica se email já existe no SQLite
const existe = await DatabaseService.getUsuarioByEmail(emailLimpo);

// 4. Cria hash da senha (SHA-256)
const senhaHash = await hashPassword(dados.senha);

// 5. Insere usuário no banco
await DatabaseService.createUsuario({
  id: `user-${Date.now()}-${random}`,
  nome: nomeLimpo,
  email: emailLimpo,
  senha_hash: senhaHash,
  nivel_xp: 1,
  xp_atual: 0
});

// 6. Gera token de sessão
await SecureStore.setItemAsync('AUTH_TOKEN', usuario.id);

// 7. Armazena dados do usuário no cache
await AsyncStorage.setItem('USER_DATA', JSON.stringify(usuario));
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
const usuario = await DatabaseService.getUsuarioByEmail(credentials.email);

// 3. Compara hash da senha
const senhaCorreta = await comparePassword(
  credentials.senha, 
  usuario.senha_hash
);

// 4. Se correto, cria sessão
if (senhaCorreta) {
  await SecureStore.setItemAsync('AUTH_TOKEN', usuario.id);
  await AsyncStorage.setItem('USER_DATA', JSON.stringify(usuario));
}
```

---

### **Validação de Sessão**

```typescript
// Executado ao iniciar o app (App.tsx e useAuth.ts)

// 1. Busca token no SecureStore
const token = await SecureStore.getItemAsync('AUTH_TOKEN');

// 2. Valida token no SQLite
const usuario = await DatabaseService.getUsuarioById(token);

// 3. Se válido, restaura sessão
if (usuario) {
  await AsyncStorage.setItem('USER_DATA', JSON.stringify(usuario));
  return usuario;
}

// 4. Se inválido, limpa sessão
await SecureStore.deleteItemAsync('AUTH_TOKEN');
```

---

## 🛠️ API do DatabaseService

### **CRUD Usuários**

```typescript
// Criar usuário
await DatabaseService.createUsuario({
  id: 'user-123',
  nome: 'João Silva',
  email: 'joao@example.com',
  senha_hash: 'hash_sha256',
  nivel_xp: 1,
  xp_atual: 0
});

// Buscar por email
const usuario = await DatabaseService.getUsuarioByEmail('joao@example.com');

// Buscar por ID
const usuario = await DatabaseService.getUsuarioById('user-123');

// Atualizar XP
await DatabaseService.updateUsuarioXP('user-123', 5, 150);

// Atualizar onboarding
await DatabaseService.updateUsuarioOnboarding('user-123', 'login');
```

---

### **CRUD Roadmaps**

```typescript
// Criar roadmap
await DatabaseService.createRoadmap({
  id: 'roadmap-123',
  usuario_id: 'user-123',
  titulo: 'Dev Full Stack',
  objetivo_carreira: 'Desenvolvedor Full Stack',
  nivel_experiencia: 'intermediario'
});

// Listar roadmaps do usuário
const roadmaps = await DatabaseService.getRoadmapsByUsuarioId('user-123');

// Deletar roadmap (CASCADE para skills)
await DatabaseService.deleteRoadmap('roadmap-123');
```

---

### **CRUD Skills**

```typescript
// Criar skill
await DatabaseService.createSkill({
  id: 'skill-123',
  nome: 'React Native',
  descricao: 'Desenvolvimento mobile com React',
  tipo: 'hard',
  categoria: 'tecnologia'
});

// Buscar skill
const skill = await DatabaseService.getSkillById('skill-123');

// Associar skill a roadmap
await DatabaseService.createRoadmapSkill({
  id: 'rs-123',
  roadmap_id: 'roadmap-123',
  skill_id: 'skill-123',
  ordem: 0,
  concluida: false
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
  const senhaHash = await hashPassword(senha);
  return senhaHash === hash;
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
await DatabaseService.createUsuario({
  id: 'test-user-1',
  nome: 'Teste Usuario',
  email: 'teste@skillmap.com',
  senha_hash: await hashPassword('Teste123'),
  nivel_xp: 10,
  xp_atual: 500
});

// Criar roadmap de teste
await DatabaseService.createRoadmap({
  id: 'test-roadmap-1',
  usuario_id: 'test-user-1',
  titulo: 'Roadmap Teste',
  objetivo_carreira: 'Desenvolvedor',
  nivel_experiencia: 'iniciante'
});
```

---

## 📱 Integração com Frontend

### **useAuth Hook**

```typescript
import { useAuth } from '../hooks/useAuth';

const MyScreen = () => {
  const { usuario, login, cadastrar, logout, atualizarXP } = useAuth();

  // Fazer login
  const handleLogin = async () => {
    const result = await login({ 
      email: 'joao@example.com', 
      senha: 'Senha123' 
    });
    
    if (result.success) {
      console.log('Usuário logado:', result.usuario);
    } else {
      console.error('Erro:', result.error);
    }
  };

  // Atualizar XP
  const handleGanharXP = async () => {
    if (usuario) {
      await atualizarXP(usuario.nivel_xp + 1, 0);
    }
  };

  return (
    <View>
      {usuario ? (
        <Text>Bem-vindo, {usuario.nome}!</Text>
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
