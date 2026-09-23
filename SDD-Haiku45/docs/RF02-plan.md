# RF02: Plano Técnico - Gerenciamento de Quadros

## 1. Stack Tecnológico

Mesmo stack RF01, adicionando:

### Backend
- **ORM**: TypeORM (Entities: Board, Column)
- **Validação**: Zod ou class-validator (name: 1-100 chars)
- **Banco**: PostgreSQL (cascata delete via FK)
- **UUID**: uuid package (gerado client-side antes inserção)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **HTTP**: Fetch API com credentials
- **State**: React Context ou local state
- **Componentes**: Tailwind CSS

---

## 2. Arquitetura de Componentes

### Backend

#### 2.1 Entities TypeORM
- **Board**
  - id: UUID (PK)
  - user_id: UUID (FK Users, cascade delete)
  - name: varchar(100), unique(user_id, name)
  - created_at: timestamp
  - updated_at: timestamp
  - Relacionamento: 1 Board → N Columns

- **Column**
  - id: UUID (PK)
  - board_id: UUID (FK Boards, cascade delete)
  - name: varchar (fixo: "Backlog", "To Do", "Doing", "Done")
  - position: int (0, 1, 2, 3)
  - created_at: timestamp
  - Relacionamento: 1 Column → N Cards (em Cards entity, não aqui)

#### 2.2 Repositories
- **BoardRepository**
  - `insert(board)`: Cria novo Board
  - `findById(boardId, userId)`: Busca 1 Board com validação user_id
  - `findByUser(userId)`: Lista todos Boards do user (order by created_at DESC)
  - `update(boardId, userId, { name })`: Atualiza nome com validação
  - `delete(boardId, userId)`: Delete com validação user_id

- **ColumnRepository**
  - `insertMany(columns)`: Cria 4 Columns padrão atomicamente
  - `findByBoard(boardId)`: Lista Columns de um Board (order by position)
  - `deleteByBoard(boardId)`: Delete cascata Columns+Cards

#### 2.3 Services
- **BoardService**
  - `createBoard(userId, name)`: Valida nome (1-100), checks duplicado, cria Board + 4 Columns
  - `getBoardsList(userId)`: Lista com count colunas/cartões
  - `getBoard(boardId, userId)`: Retorna Board + Columns com Cards
  - `updateBoard(boardId, userId, { name })`: Valida, atualiza
  - `deleteBoard(boardId, userId)`: Delete cascata + validação

- **ValidationService**
  - `validateBoardName(name)`: 1-100 chars, não vazio
  - `checkNameDuplicate(userId, name)`: Query EXISTS
  - `sanitizeName(name)`: Preserva espaços (sem trim)

#### 2.4 Middleware
- **requireAuth**: Valida sessão (existente RF01)
- **validateBoardAccess**: Middleware novo
  - Verifica se Board pertence ao usuário autenticado
  - Rejeita 403 se acesso não autorizado
  - Usado em routes PUT, DELETE, GET (por ID)

#### 2.5 Routes/Endpoints
- `POST /api/boards`: Criar Board (requireAuth)
- `GET /api/boards`: Listar Boards do user (requireAuth)
- `GET /api/boards/:boardId`: Detalhes Board (requireAuth + validateBoardAccess)
- `PUT /api/boards/:boardId`: Atualizar nome (requireAuth + validateBoardAccess)
- `DELETE /api/boards/:boardId`: Deletar Board (requireAuth + validateBoardAccess)

### Frontend

#### 2.6 Páginas
- `/boards`: Lista de quadros do user
  - Fetch GET /api/boards
  - Exibe lista ou empty state
  - Link para criar novo

- `/boards/new`: Criar novo quadro
  - Form com input name
  - POST /api/boards
  - Redireciona /boards/:id

- `/boards/:id`: Visualizar/editar quadro
  - Fetch GET /api/boards/:id
  - Exibe Board com Columns/Cards
  - Botão editar nome + deletar

#### 2.7 Componentes
- **BoardsList**: Lista boards
  - Itera boards, exibe card por board
  - Link "Abrir" → /boards/:id
  - Botão "Criar Novo" → /boards/new

- **BoardForm**: Criar board
  - Input name + validação client
  - POST /api/boards
  - Handling erro (duplicado, vazio)
  - Redireciona sucesso

- **BoardHeader**: Header dentro board
  - Exibe nome + botão editar
  - Modal/inline edit nome
  - Botão deletar (com confirmação)

- **BoardKanban**: Exibe colunas + cartões
  - 4 colunas lado a lado
  - Cartões dentro colunas
  - Drag-drop (v2, não v1)

- **ProtectedBoardRoute**: Wrapper
  - Valida autenticação
  - Redireciona /login se não autenticado

---

## 3. Modelos de Dados

### Schema: `boards`
```
id              UUID PRIMARY KEY
user_id         UUID NOT NULL FOREIGN KEY (users.id, CASCADE)
name            VARCHAR(100) NOT NULL
created_at      TIMESTAMP NOT NULL DEFAULT now()
updated_at      TIMESTAMP NOT NULL DEFAULT now()

UNIQUE(user_id, name)
INDEX user_id
INDEX created_at DESC
```

### Schema: `columns`
```
id              UUID PRIMARY KEY
board_id        UUID NOT NULL FOREIGN KEY (boards.id, CASCADE)
name            VARCHAR(50) NOT NULL (fixo)
position        INT NOT NULL (0-3)
created_at      TIMESTAMP NOT NULL DEFAULT now()

INDEX board_id
INDEX board_id, position
```

**Restrições**:
- name (boards): case-sensitive, preserva espaços
- unique constraint (user_id, name): Impossível 2 boards mesmo user com mesmo nome
- Cascata delete: FK com ON DELETE CASCADE garante Columns+Cards deletados
- Sem soft-delete: DELETE físico, não marcar como deleted

---

## 4. Interfaces de API

### POST /api/boards
**Request**:
```json
{ "name": "string" }
```

**Validação**:
- name: 1-100 chars, obrigatório

**Respostas**:
- 201 Created: Board criado
  ```json
  {
    "id": "uuid",
    "name": "string",
    "created_at": "timestamp",
    "columns": [
      { "id": "uuid", "name": "Backlog", "position": 0 },
      { "id": "uuid", "name": "To Do", "position": 1 },
      { "id": "uuid", "name": "Doing", "position": 2 },
      { "id": "uuid", "name": "Done", "position": 3 }
    ]
  }
  ```
- 400 Bad Request: Nome vazio/inválido
  ```json
  { "error": "validation", "message": "Nome não pode estar vazio" }
  ```
- 409 Conflict: Nome duplicado
  ```json
  { "error": "duplicate", "message": "Já existe quadro com este nome" }
  ```
- 401 Unauthorized: Não autenticado

### GET /api/boards
**Request**: (sem body, sessionId via cookie)

**Respostas**:
- 200 OK: Lista de boards
  ```json
  {
    "boards": [
      {
        "id": "uuid",
        "name": "string",
        "created_at": "timestamp",
        "column_count": 4,
        "card_count": 12
      },
      ...
    ]
  }
  ```
- 401 Unauthorized: Não autenticado

### GET /api/boards/:boardId
**Request**: (sessionId via cookie)

**Respostas**:
- 200 OK: Detalhes board
  ```json
  {
    "id": "uuid",
    "name": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "columns": [
      {
        "id": "uuid",
        "name": "Backlog",
        "position": 0,
        "cards": [
          { "id": "uuid", "title": "...", "position": 0 },
          ...
        ]
      },
      ...
    ]
  }
  ```
- 404 Not Found: Board não existe
- 401 Unauthorized: Sem permissão

### PUT /api/boards/:boardId
**Request**:
```json
{ "name": "string" }
```

**Respostas**:
- 200 OK: Board atualizado
  ```json
  { "id": "uuid", "name": "string", "updated_at": "timestamp" }
  ```
- 400 Bad Request: Nome vazio/inválido
- 409 Conflict: Nome duplicado
- 404 Not Found: Board não existe
- 401 Unauthorized: Sem permissão

### DELETE /api/boards/:boardId
**Request**: (vazio)

**Respostas**:
- 204 No Content: Deletado com sucesso
- 404 Not Found: Board não existe
- 401 Unauthorized: Sem permissão

---

## 5. Fluxos de Integração

### Fluxo 1: Criar Board
```
Frontend → POST /api/boards { name: "Meu Projeto" }
  ↓
Backend: BoardService.createBoard(userId, name)
  - ValidateBoard Name (1-100)
  - Check duplicate (user_id, name)
  - Insert Board
  - Insert 4 Columns
  ↓
Response 201 + Board + Columns
  ↓
Frontend: redireciona /boards/:id
  ↓
GET /api/boards/:id
  ↓
Exibe Board + Colunas + Cartões
```

### Fluxo 2: Editar Nome
```
Frontend: Modal edição name
  ↓
PUT /api/boards/:id { name: "Novo Nome" }
  ↓
Backend: validateBoardAccess middleware (403 se não owner)
  ↓
BoardService.updateBoard(boardId, userId, { name })
  - Validate name
  - Check duplicate
  - Update
  ↓
Response 200
  ↓
Frontend: close modal, refresh nome
```

### Fluxo 3: Deletar Board
```
Frontend: Diálogo confirmação "Tem certeza?"
  ↓
DELETE /api/boards/:id
  ↓
Backend: validateBoardAccess
  ↓
BoardService.deleteBoard(boardId, userId)
  - Cascade delete Columns
  - Cascade delete Cards (via FK)
  - Delete Board
  ↓
Response 204
  ↓
Frontend: Redireciona /boards
  ↓
GET /api/boards
  ↓
Board removido de lista
```

---

## 6. Requisitos Não Funcionais

### Segurança
- **Acesso**: Middleware validateBoardAccess em todo endpoint com :boardId
- **User isolation**: Queries sempre filtram `WHERE user_id = :userId`
- **CORS**: Já configurado RF01 (credentials: true)
- **SQL Injection**: ORM TypeORM (parameterized queries)

### Performance
- **Índices**: user_id (busca lista), (user_id, name) (unique + query), created_at DESC (sort)
- **N+1**: Fetch Board com Columns em 1 query (eager load)
- **Listagem grande**: Paginação v2 (v1 assume <1000 boards/user)
- **Cache**: Header ETag nos boards (v2)

### Escalabilidade
- **Banco**: PostgreSQL single (v1), multi-region replication (v2+)
- **Stateless**: Cada requisição valida sessão, sem state server
- **Soft-delete**: Não usar (simplifica queries, easier cascade)

### Confiabilidade
- **Transações**: Criar Board + 4 Columns em 1 transação (atomicidade)
- **Cascade delete**: FK ON DELETE CASCADE garante consistência
- **Retry**: Cliente pode retentar (idempotent se name mesmo)
- **Logs**: Registra delete operations (audit trail v2)

---

## 7. Restrições Implementação

1. **User Isolation**: OBRIGATÓRIO, validar user_id em toda query board-specific
2. **Name Unique**: OBRIGATÓRIO, constraint (user_id, name) em DB
3. **Cascade Delete**: OBRIGATÓRIO, FK ON DELETE CASCADE
4. **Atomicidade Criação**: OBRIGATÓRIO, Board + 4 Columns em transação
5. **UUID Identificador**: OBRIGATÓRIO, não expor sequential IDs
6. **Validação Server**: OBRIGATÓRIO, client validação só UX
7. **Name Preservation**: OBRIGATÓRIO, não trimmar espaços (aceitar "  name  ")
8. **Ordenação Padrão**: OBRIGATÓRIO, GET /api/boards order by created_at DESC

---

## 8. Dependências Entre RFs

### RF02 ← RF01 (Autenticação)
- RF02 depende de SessionService (requireAuth middleware)
- User autenticado em todo /api/boards

### RF02 → RF06 (Checklist Items)
- RF06 depende de Board + Column (para criar cards em columns)
- Columns criadas em RF02 são usadas por RF06

### RF02 → RF07 (Board Members)
- RF07 usa Board como agregado (adicionar members ao board)
- Não bloqueia RF02

### RF02 → RF08 (Labels + Comments)
- RF08 usa Cards que usam Columns que usam Boards
- Não bloqueia RF02

---

## 9. Dados de Teste

### Board Válido
- Name: "Projeto Q1"
- User: autenticado

### Casos Edge
- Name: " " (espaços apenas) → deve validar, provavelmente rejeitar (length 1+)
- Name: "a" (1 char) → aceitar
- Name: "x" * 100 (100 chars) → aceitar
- Name: "x" * 101 (101 chars) → rejeitar
- Name: "Projeto\nNovidade" (newline) → aceitar
- Name: "Projeto™" (unicode) → aceitar
- Name: duplicado (já existe) → 409
