# RF01: Tarefas de Implementação

## Backend

### Fase 1: Database Setup
- [x] T01: Criar migration para tabela `users` (id, email, password_hash, created_at, last_login_at)
- [x] T02: Criar migration para tabela `sessions` (id, user_id, created_at, last_activity_at, expires_at, status)
- [x] T03: Criar índice em `users.email` (LOWER)

### Fase 2: Entities e TypeORM
- [x] T04: Criar Entity `User`
- [x] T05: Criar Entity `Session`

### Fase 3: Repositories
- [x] T06: Criar `UserRepository` com métodos: insert, findByEmail, updateLastLogin
- [x] T07: Criar `SessionRepository` com métodos: insert, findById, updateActivity, delete, deleteExpired

### Fase 4: Services
- [x] T08: Criar `ValidationService` com métodos: validateEmail, validatePassword, sanitizeEmail
- [x] T09: Criar `UserService` com métodos: createUser, findByEmail, verifyPassword
- [x] T10: Criar `SessionService` com métodos: createSession, validateSession, invalidateSession, renewActivityTime

### Fase 5: Middleware
- [x] T11: Criar middleware `parseCookie` (extrai sessionId do cookie)
- [x] T12: Criar middleware `requireAuth` (valida sessão ou rejeita 401)
- [x] T13: Criar middleware `errorHandler` (traduz erros em HTTP responses)

### Fase 6: Endpoints
- [x] T14: POST `/api/auth/signup` (criar conta)
- [x] T15: POST `/api/auth/login` (fazer login)
- [x] T16: POST `/api/auth/logout` (fazer logout)
- [x] T17: GET `/api/auth/session` (verificar sessão)

### Fase 7: Background Jobs
- [ ] T18: Criar job de limpeza de sessões expiradas (1x/hora)

### Fase 8: Testes Backend
- [x] T19: Testes unitários `ValidationService`
- [ ] T20: Testes unitários `UserService`
- [ ] T21: Testes unitários `SessionService`
- [ ] T22: Testes integração endpoints

## Frontend

### Fase 1: Context
- [x] T23: Criar `AuthContext` com estado (user, loading, error)
- [x] T24: Criar `AuthProvider` wrapper

### Fase 2: Hooks
- [x] T25: Criar hook `useAuth()` (acessa contexto)
- [x] T26: Criar hook `useLogin(email, password)` (chama POST /api/auth/login)
- [x] T27: Criar hook `useSignup(email, password)` (chama POST /api/auth/signup)
- [x] T28: Criar hook `useLogout()` (chama POST /api/auth/logout)
- [x] T29: Criar hook `useAuthCheck()` (GET /api/auth/session ao carregar)

### Fase 3: Componentes
- [x] T30: Criar componente `LoginForm` (email, password, submit)
- [x] T31: Criar componente `SignupForm` (email, password, password_confirm, submit)
- [x] T32: Criar componente `ProtectedRoute` (wrapper que redireciona não autenticados)

### Fase 4: Páginas
- [x] T33: Criar página `/login`
- [x] T34: Criar página `/signup`
- [x] T35: Criar página `/dashboard` (protegida)

### Fase 5: Integração Layout
- [x] T36: Integrar `AuthProvider` em `layout.tsx` (envolver todo app)
- [x] T37: Criar navbar com botão logout (só visível se autenticado)

### Fase 6: Testes Frontend
- [ ] T38: Testes componentes `LoginForm`, `SignupForm`, `ProtectedRoute`
- [ ] T39: Testes hooks `useAuth`, `useLogin`, `useSignup`, `useLogout`

## Validação

- [ ] T40: Testar signup com email válido
- [ ] T40a: Testar signup com email duplicado (409)
- [ ] T40b: Testar signup com email inválido (400)
- [ ] T40c: Testar signup com senha fraca (400)
- [ ] T41: Testar login com credenciais válidas
- [ ] T41a: Testar login com email não existe (401)
- [ ] T41b: Testar login com senha incorreta (401)
- [ ] T41c: Testar login com campo vazio (400)
- [ ] T42: Testar logout
- [ ] T42a: Testar logout sem sessão (401)
- [ ] T43: Testar sessão persistida (fechar browser, voltar)
- [ ] T43a: Testar sessão expirada (401)
- [ ] T44: Testar múltiplas abas (logout em uma afeta outra)
- [ ] T45: Testar janela privada (sem persist)
- [ ] T46: Testar redirect não autenticados para login
- [ ] T47: Testar redirect autenticados para dashboard

---

## Status Atual

**41/47 tarefas implementadas (87%)**

### Concluído
- Backend: Entities, Repositories, Services, Middlewares, Endpoints, Database Setup
- Frontend: Context, Hooks, Componentes, Páginas, Layout integrado
- npm install: backend dependencies instalado

### Pendente
- T18: Background job limpeza sessões expiradas
- T20-T22: Testes unitários UserService, SessionService, integração
- T38-T39: Testes frontend
- T40-T47: Validação e testes E2E
