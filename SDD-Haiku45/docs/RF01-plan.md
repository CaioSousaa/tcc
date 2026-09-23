# RF01: Plano Técnico - Autenticação e Gerenciamento de Sessão

## 1. Stack Tecnológico

### Backend
- **Linguagem/Framework**: Node.js com Express (ou framework existente do projeto)
- **Banco de Dados**: PostgreSQL (persistência de usuários e sessões)
- **Hash de Senha**: bcrypt (mínimo 10 rounds)
- **Sessão**: Armazenamento server-side com identificador em HttpOnly cookie
- **Validação**: Schema validation (ex: Zod, Joi)

### Frontend
- **Framework**: React (ou framework existente)
- **State Management**: Context API ou Redux (para manter estado de autenticação)
- **HTTP Client**: Fetch API ou Axios (com suporte a credenciais)
- **Roteamento**: React Router v6+ (com rota protegida/guarded)

### Segurança
- **HTTPS Obrigatório**: Todos endpoints em produção via HTTPS
- **CORS**: Configurar domain específico (não wildcard)
- **CSRF**: Token CSRF em cookies (se não usar SameSite=Strict)
- **Headers de Segurança**: Content-Security-Policy, X-Frame-Options, Strict-Transport-Security

## 2. Arquitetura de Componentes

### Backend

#### 2.1 Camada de Roteamento
- `POST /api/auth/signup` → ValidateSignupInput → CreateUser → CreateSession → SetCookie
- `POST /api/auth/login` → ValidateLoginInput → AuthenticateUser → CreateSession → SetCookie
- `POST /api/auth/logout` → ValidateSession → InvalidateSession → ClearCookie
- `GET /api/auth/session` → ValidateSession → ReturnCurrentUser

#### 2.2 Camada de Aplicação (Services)
- **UserService**
  - `createUser(email, password)`: Valida email, encripta senha, persiste
  - `findByEmail(email)`: Busca usuário (case-insensitive)
  - `verifyPassword(inputPassword, hashedPassword)`: Compara com bcrypt
  
- **SessionService**
  - `createSession(userId)`: Cria ID único, armazena no DB
  - `validateSession(sessionId)`: Verifica existência e expiração
  - `invalidateSession(sessionId)`: Marca como invalidada
  - `renewActivityTime(sessionId)`: Atualiza última atividade (para renovar expiração)

- **ValidationService**
  - `validateEmail(email)`: RFC 5322 simplificado
  - `validatePassword(password)`: Mínimo 8 caracteres
  - `sanitizeEmail(email)`: Trim, lowercase

#### 2.3 Camada de Persistência (Repository/DAO)
- **UserRepository**
  - `insert(user)`: Cria novo usuário
  - `findByEmail(email)`: Busca por email
  - `updateLastLogin(userId, timestamp)`: Atualiza data/hora último login
  
- **SessionRepository**
  - `insert(session)`: Cria nova sessão
  - `findById(sessionId)`: Busca sessão
  - `updateActivity(sessionId, timestamp)`: Atualiza atividade
  - `delete(sessionId)`: Remove sessão
  - `deleteExpired(olderThan)`: Limpeza background

#### 2.4 Middleware
- **ParseCookie**: Extrai sessionId de HttpOnly cookie
- **RequireAuth**: Valida sessão, rejeita 401 se inválida
- **ErrorHandler**: Traduz erros em respostas HTTP apropriadas

### Frontend

#### 2.5 Componentes React
- **SignupForm**: Formulário cadastro (email, senha, confirmação senha)
- **LoginForm**: Formulário login (email, senha)
- **ProtectedRoute**: Wrapper que redireciona não autenticados
- **AuthContext/Provider**: Fornece estado global de autenticação

#### 2.6 Hooks
- `useAuth()`: Acessa contexto de autenticação
- `useLogin(email, password)`: Hook para fazer login
- `useSignup(email, password)`: Hook para cadastro
- `useLogout()`: Hook para logout
- `useAuthCheck()`: Verifica sessão ao carregar página

#### 2.7 Fluxo de Validação de Sessão
```
App.js monta
  ↓
useEffect → GET /api/auth/session
  ↓
Se 200: Usuário autenticado (restaura estado)
Se 401: Usuário não autenticado (redireciona login)
  ↓
AuthContext atualizado
  ↓
ProtectedRoute permite ou bloqueia acesso
```

## 3. Modelos de Dados

### Schema: `users`
```
id              UUID PRIMARY KEY
email           VARCHAR(255) UNIQUE NOT NULL (indexed)
password_hash   VARCHAR(255) NOT NULL
created_at      TIMESTAMP NOT NULL DEFAULT now()
last_login_at   TIMESTAMP NULL
```

**Restrições**:
- `email` case-insensitive na busca (usar LOWER() em queries)
- `password_hash` nunca retornar em APIs
- Sem soft-delete nesta versão (delete é permanente)

### Schema: `sessions`
```
id              UUID PRIMARY KEY (gerado aleatório)
user_id         UUID FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE
created_at      TIMESTAMP NOT NULL DEFAULT now()
last_activity_at TIMESTAMP NOT NULL DEFAULT now()
expires_at      TIMESTAMP NOT NULL (created_at + 24h)
status          ENUM('active', 'invalidated') DEFAULT 'active'
```

**Restrições**:
- `id` único por sessão, impossível reutilizar
- `expires_at` calculado em CREATE, não renovado (apenas last_activity_at)
- Background job remove registros com `expires_at < now()` 1x/hora
- ON DELETE CASCADE garante limpeza se usuário deletado

## 4. Interfaces de API

### Endpoint: POST /api/auth/signup
**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Validação**:
- `email`: Não vazio, formato válido
- `password`: Mínimo 8 caracteres

**Respostas**:
- `201 Created`: Usuário criado
  ```json
  { "id": "uuid", "email": "user@example.com" }
  ```
- `400 Bad Request`: Campo vazio ou formato inválido
  ```json
  { "error": "email", "message": "Email inválido" }
  ```
- `409 Conflict`: Email já existe
  ```json
  { "error": "email", "message": "Email já cadastrado" }
  ```

### Endpoint: POST /api/auth/login
**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Validação**:
- Ambos campos obrigatórios
- Nenhuma validação de formato (pode estar vazio ou inválido)

**Respostas**:
- `200 OK`: Login sucesso (Cookie Set-Cookie com sessionId)
  ```json
  { "id": "uuid", "email": "user@example.com" }
  ```
- `401 Unauthorized`: Email não existe ou senha incorreta
  ```json
  { "error": "auth", "message": "Email ou senha inválidos" }
  ```
- `400 Bad Request`: Campo vazio
  ```json
  { "error": "validation", "message": "Preencha todos os campos" }
  ```

**Cookie Set-Cookie**:
```
Set-Cookie: sessionId=<uuid>; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/
```

### Endpoint: POST /api/auth/logout
**Request**: Vazio (sessionId vem do cookie)

**Respostas**:
- `200 OK`: Logout sucesso
  ```json
  { "message": "Logout realizado" }
  ```
- `401 Unauthorized`: Nenhuma sessão ativa
  ```json
  { "error": "auth", "message": "Sessão não encontrada" }
  ```

**Cookie Clear-Cookie**:
```
Set-Cookie: sessionId=; Max-Age=0; Path=/
```

### Endpoint: GET /api/auth/session
**Request**: Vazio (sessionId vem do cookie)

**Respostas**:
- `200 OK`: Sessão válida
  ```json
  { "id": "uuid", "email": "user@example.com" }
  ```
- `401 Unauthorized`: Sessão não existe ou expirou
  ```json
  { "error": "auth", "message": "Sessão expirada" }
  ```

## 5. Fluxos de Integração

### 5.1 Fluxo: Signup → Login Automático
```
Frontend → POST /api/auth/signup
Backend cria user + sessão
Backend retorna sessionId cookie + user data
Frontend armazena em Context
Frontend redireciona para dashboard
```

### 5.2 Fluxo: Refresh de Sessão (Janela Privada)
```
Frontend carrega página
useEffect chama GET /api/auth/session
401 Unauthorized (sem cookie)
Frontend limpa Context, redireciona login
```

### 5.3 Fluxo: Login com Sessão Anterior Ativa
```
Usuário faz POST /api/auth/login
Backend busca sessão anterior do user_id
Backend invalida sessão anterior (status='invalidated')
Backend cria nova sessão
Backend retorna novo sessionId cookie
```

### 5.4 Fluxo: Logout Múltiplas Abas
```
Aba 1 faz POST /api/auth/logout
Backend invalida sessionId
Backend retorna Clear-Cookie
Aba 2 tenta acessar área protegida
GET /api/auth/session retorna 401 (sessionId inválido no cookie)
Aba 2 redireciona login
```

## 6. Requisitos Não Funcionais

### Segurança
- **Senhas**: Hash bcrypt, custo 10+ (protege contra rainbow tables)
- **Sessão**: ID aleatório 32+ bytes (UUID v4 suficiente)
- **Cookies**: HttpOnly + Secure obrigatório (previne XSS, força HTTPS)
- **Comparação Timing-Safe**: `bcrypt.compare()` nativa (não equals() simples)
- **Email Case-Insensitive**: Busca em DB usa LOWER() para prevenir duplicatas
- **Rate-Limiting**: Não implementado v1 (especificação permite)

### Performance
- **Índice**: Email indexado no schema `users` (busca O(1) vs O(n))
- **Expiração Background**: Job limpeza 1x/hora de sessões expiradas
- **Session Storage**: Server-side DB, não memória (escalável)

### Escalabilidade
- **Banco Centralizado**: PostgreSQL único (assumir <1M usuários v1)
- **Sessões Distribuídas**: Se multi-servidor, usar Redis para sessões (v2+)
- **Stateless REST**: Cada requisição valida sessionId (não precisa sticky sessions)

### Confiabilidade
- **Transações**: Cadastro em 1 transação (user + sessão inicial, atomicidade)
- **Retry Logic**: Cliente retenta POST /api/auth/login em 5xx
- **Error Messages**: Genéricas para login (não revela user existe)
- **Logs**: Registra falhas auth, não registra senhas

### Validação Contrato
- **Schema Validation**: Lado servidor sempre (não confia cliente)
- **MIME Type**: Aceita `application/json` apenas
- **Tamanho Payload**: Limitar POST body <10KB

## 7. Restrições Implementação

1. **Sessão em DB**: OBRIGATÓRIO, não em memória (permite reinicialização servidor)
2. **Password Hash**: OBRIGATÓRIO bcrypt ou libsodium, nunca plaintext/MD5
3. **HttpOnly Cookie**: OBRIGATÓRIO, sessionId nunca acessível JavaScript
4. **Email Lowercase**: Busca sempre LOWER(email) para consistência
5. **Expiração 24h**: OBRIGATÓRIO, calculado em CREATE (not renewable)
6. **Genérico Login Fail**: "Email ou senha inválidos" para ambos casos (não revela user existe)
7. **Validação Server**: OBRIGATÓRIO, cliente validação só UX (não segurança)
8. **No Password Recovery v1**: Resetar senha bloqueado (regra negócio)

## 8. Dados de Teste

### User Test Valid
- Email: `test@example.com`
- Password: `ValidPass123`

### User Test Duplicate
- Email: `duplicate@example.com` (criar 2x para testar conflict)

### Edge Cases
- Email: `  spaces@example.com  ` → Deve trimmar
- Email: `UPPERCASE@EXAMPLE.COM` → Deve case-normalize
- Password: `12345678` (mínimo 8) → Deve aceitar
- Password: `1234567` (7 caracteres) → Deve rejeitar
- Password: `pass word` (espaços) → Deve aceitar (faz parte senha)
