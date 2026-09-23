# RF03: Plano Técnico - Gerenciamento de Listas

## 1. Stack Tecnológico

Mesmo stack RF01/RF02, sem novas dependências:

### Backend
- **ORM**: TypeORM (Entity: Column expandida)
- **Validação**: Zod ou class-validator (name: 1-100 chars, unique per board)
- **Banco**: PostgreSQL (cascata delete, reordenação position)
- **UUID**: uuid package (gerado client-side)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **HTTP**: Fetch API com credentials
- **Drag-Drop**: react-beautiful-dnd ou similar (v1 opcional, v2 obrigatório)
- **State**: React Context + local state para UI
- **Componentes**: Tailwind CSS

---

## 2. Arquitetura de Componentes

### Backend

#### 2.1 Entity TypeORM (Expandida)
- **Column** (existente, novos métodos no repository)
  - id: UUID (PK)
  - board_id: UUID (FK Boards, cascade delete)
  - name: varchar(100), unique(board_id, name)
  - position: int (sequencial 0, 1, 2, ...)
  - created_at: timestamp
  - Relacionamento: 1 Column → N Cards (existente)

#### 2.2 Repository
- **ColumnRepository** (expandir)
  - `insert(column)`: Cria nova Column
  - `findById(columnId, boardId)`: Busca 1 Column (valida board_id)
  - `findByBoard(boardId)`: Lista Columns de um Board (order by position ASC)
  - `update(columnId, boardId, { name, position })`: Atualiza nome ou posição
  - `delete(columnId, boardId)`: Delete com validação board_id
  - `updatePositions(boardId, columnsData)`: Reordena múltiplas columns atomicamente
  - `checkNameDuplicate(boardId, name, excludeColumnId?)`: Query EXISTS

#### 2.3 Services
- **ColumnService** (novo)
  - `createColumn(boardId, userId, name)`: Valida ownership, nome, cria Column
  - `getColumnsByBoard(boardId, userId)`: Lista com validação
  - `updateColumn(columnId, boardId, userId, { name })`: Renomeia
  - `reorderColumns(boardId, userId, columns[])`: Atualiza positions atomicamente
  - `deleteColumn(columnId, boardId, userId)`: Delete com validação (min 1 list)

- **ValidationService** (expandir)
  - `validateColumnName(name)`: 1-100 chars, não vazio
  - `checkColumnNameDuplicate(boardId, name, excludeId?)`: Único por board
  - `sanitizeName(name)`: Preserva espaços (sem trim)

#### 2.4 Middleware
- **validateBoardAccess**: Existente, usado para validar ownership
- **validateColumnAccess**: Novo (middleware ou função helper)
  - Verifica se Column pertence a Board do usuário autenticado
  - Rejeita 403 se não owner

#### 2.5 Routes/Endpoints
- `POST /api/boards/:boardId/columns`: Criar Column (requireAuth + validateBoardAccess)
- `GET /api/boards/:boardId/columns`: Listar Columns (requireAuth + validateBoardAccess)
- `PUT /api/boards/:boardId/columns/:columnId`: Renomear/Reordenar (requireAuth + validateBoardAccess)
- `DELETE /api/boards/:boardId/columns/:columnId`: Deletar Column (requireAuth + validateBoardAccess)

### Frontend

#### 2.6 Páginas
- `/boards/:id`: Visualizar quadro + gerenciar colunas
  - GET /api/boards/:id (columns)
  - Exibe colunas lado a lado
  - Botões ações (editar, reordenar, deletar)

#### 2.7 Componentes
- **ColumnHeader**: Header coluna
  - Exibe nome + menu ações
  - Botão editar, reordenar (setas up/down), deletar
  
- **ColumnEditForm**: Inline/modal edit
  - Input name (validação client)
  - Botões Salvar/Cancelar
  - Error handling (vazio, duplicado)

- **ColumnList**: Exibe colunas
  - Grid/horizontal scroll
  - Cada coluna com cards (v2 onwards)
  - Drag-drop reorder (v2)

- **AddColumnButton**: Botão adicionar lista
  - Form inline ou modal
  - Valida antes submit
  - Exibe erros

- **DeleteColumnConfirmation**: Diálogo confirmação
  - Avisa sobre cascata delete (cartões)
  - Botões Confirmar/Cancelar

#### 2.8 Hooks
- `useColumns(boardId)`: GET /api/boards/:boardId/columns
- `useCreateColumn(boardId)`: POST /api/boards/:boardId/columns
- `useUpdateColumn(boardId, columnId)`: PUT /api/boards/:boardId/columns/:columnId
- `useDeleteColumn(boardId, columnId)`: DELETE /api/boards/:boardId/columns/:columnId
- `useReorderColumns(boardId)`: PUT (múltiplas columns)

---

## 3. Modelos de Dados

### Schema: `columns` (Existente, Validação Expandida)
```
id              UUID PRIMARY KEY
board_id        UUID NOT NULL FOREIGN KEY (boards.id, CASCADE)
name            VARCHAR(100) NOT NULL
position        INT NOT NULL (sequencial sem gaps)
created_at      TIMESTAMP NOT NULL DEFAULT now()

UNIQUE(board_id, name)
INDEX board_id
INDEX (board_id, position)
```

**Restrições**:
- name: case-sensitive, preserva espaços (sem trim)
- unique constraint (board_id, name): Impossível 2 columns mesmo board com mesmo nome
- position: Inteiro sequencial, sem gaps (0, 1, 2, 3, ...)
- Cascata delete: FK ON DELETE CASCADE deleta Cards (v2)
- Min 1 column: Quadro sempre tem >= 1 coluna (v1: >=4 padrão)

---

## 4. Interfaces de API

### POST /api/boards/:boardId/columns
**Request**:
```json
{ "name": "string" }
```

**Validação**:
- name: 1-100 chars, obrigatório, unique per board

**Respostas**:
- 201 Created: Column criada
  ```json
  {
    "id": "uuid",
    "board_id": "uuid",
    "name": "string",
    "position": 4,
    "created_at": "timestamp"
  }
  ```
- 400 Bad Request: Nome vazio/muito longo
  ```json
  { "error": "validation", "message": "Nome não pode estar vazio" }
  ```
- 409 Conflict: Nome duplicado
  ```json
  { "error": "duplicate", "message": "Já existe uma lista com este nome neste quadro" }
  ```
- 401 Unauthorized: Não autenticado
- 403 Forbidden: Quadro não pertence ao usuário

### GET /api/boards/:boardId/columns
**Request**: (sem body, sessionId via cookie)

**Respostas**:
- 200 OK: Lista de colunas
  ```json
  {
    "columns": [
      {
        "id": "uuid",
        "name": "Backlog",
        "position": 0,
        "card_count": 5
      },
      {
        "id": "uuid",
        "name": "To Do",
        "position": 1,
        "card_count": 3
      },
      ...
    ]
  }
  ```
- 404 Not Found: Quadro não existe
- 401 Unauthorized: Sem permissão

### PUT /api/boards/:boardId/columns/:columnId
**Request** (Renomear):
```json
{ "name": "string" }
```

**Request** (Reordenar):
```json
{ "position": 2 }
```

**Respostas**:
- 200 OK: Column atualizada
  ```json
  {
    "id": "uuid",
    "name": "string",
    "position": 2,
    "updated_at": "timestamp"
  }
  ```
- 400 Bad Request: Nome vazio, posição inválida
  ```json
  { "error": "validation", "message": "Nome não pode estar vazio" }
  ```
- 409 Conflict: Nome duplicado
  ```json
  { "error": "duplicate", "message": "Já existe uma lista com este nome neste quadro" }
  ```
- 404 Not Found: Column não existe
- 401 Unauthorized: Sem permissão

### DELETE /api/boards/:boardId/columns/:columnId
**Request**: (vazio)

**Respostas**:
- 204 No Content: Deletado com sucesso
- 400 Bad Request: Última coluna do quadro (não pode deletar)
  ```json
  { "error": "validation", "message": "Quadro deve ter pelo menos uma lista" }
  ```
- 404 Not Found: Column não existe
- 401 Unauthorized: Sem permissão

### PUT /api/boards/:boardId/columns (Batch Reorder)
**Request**:
```json
{
  "columns": [
    { "id": "uuid1", "position": 0 },
    { "id": "uuid2", "position": 1 },
    { "id": "uuid3", "position": 2 },
    { "id": "uuid4", "position": 3 }
  ]
}
```

**Respostas**:
- 200 OK: Colunas reordenadas
  ```json
  {
    "columns": [
      { "id": "uuid1", "position": 0 },
      ...
    ]
  }
  ```
- 400 Bad Request: Posições inválidas (gaps, negativas)
- 409 Conflict: Column deletada durante operação (race condition)
- 401 Unauthorized: Sem permissão

---

## 5. Fluxos de Integração

### Fluxo 1: Criar Lista
```
Frontend: Clica "Adicionar Lista"
  ↓
Form exibido (input nome)
  ↓
Frontend: POST /api/boards/:boardId/columns { name: "..." }
  ↓
Backend: validateBoardAccess middleware (403 se não owner)
  ↓
ColumnService.createColumn(boardId, userId, name)
  - Validate name (1-100)
  - Check duplicate (board_id, name)
  - Insert Column com position = count_atual
  ↓
Response 201 + Column
  ↓
Frontend: Renderiza nova coluna ao final, sem reload
```

### Fluxo 2: Renomear Lista
```
Frontend: Clica no nome da coluna (ou ícone editar)
  ↓
Modo edição ativado (inline ou modal)
  ↓
Usuário muda nome, clica "Salvar"
  ↓
Frontend: PUT /api/boards/:boardId/columns/:columnId { name: "Novo Nome" }
  ↓
Backend: validateBoardAccess
  ↓
ColumnService.updateColumn(columnId, boardId, userId, { name })
  - Validate name
  - Check duplicate
  - Update
  ↓
Response 200
  ↓
Frontend: close modal, refresh nome visualmente
```

### Fluxo 3: Reordenar Lista
```
Frontend: Usuário arrasta coluna para nova posição (drag-drop)
  ↓
Drag handler detecta posição final
  ↓
Frontend: PUT /api/boards/:boardId/columns/:columnId { position: N }
  OU
Frontend: PUT /api/boards/:boardId/columns (batch)
  ↓
Backend: validateBoardAccess
  ↓
ColumnService.reorderColumns(boardId, userId, columnsData)
  - Valida positions (sequencial, sem gaps)
  - Atualiza todas em transação
  ↓
Response 200
  ↓
Frontend: Renderiza nova ordem (transição suave, sem reload)
```

### Fluxo 4: Deletar Lista
```
Frontend: Clica botão "Deletar"
  ↓
Diálogo confirmação exibido
  ("Tem certeza? Esta ação é irreversível. Cartões serão movidos/deletados.")
  ↓
Usuário clica "Confirmar"
  ↓
Frontend: DELETE /api/boards/:boardId/columns/:columnId
  ↓
Backend: validateBoardAccess
  ↓
ColumnService.deleteColumn(columnId, boardId, userId)
  - Check se é última coluna (error 400 se sim)
  - Delete Column
  - Cascade delete Cards (FK) (v2) ou delete logicamente
  - Reajusta positions das colunas restantes
  ↓
Response 204
  ↓
Frontend: Remove coluna de UI, reajusta layout, sem reload
```

---

## 6. Requisitos Não Funcionais

### Segurança
- **Acesso**: validateBoardAccess em todo endpoint /columns
- **User isolation**: Query sempre inclui board_id + board.user_id == userId
- **CORS**: Já configurado RF01
- **SQL Injection**: ORM TypeORM (parameterized)

### Performance
- **Índices**: (board_id, name) unique, (board_id, position) para sort
- **N+1**: Fetch Columns com card_count em 1 query
- **Reordenação**: Batch update atomicamente (transaction)
- **Drag-drop**: Otimista UI update, reconciliação server
- **Limite colunas**: Sem hard limit (assume <100/board)

### Escalabilidade
- **Stateless**: Cada request valida board ownership
- **Transação reorder**: Múltiplas updates em 1 transação
- **Cascade delete**: FK ON DELETE CASCADE (v2)

### Confiabilidade
- **Validação**: Server-side obrigatório (client só UX)
- **Position sequencial**: Invariante mantido sempre
- **Min 1 coluna**: Erro se deletar última
- **Concorrência**: Last-write-wins em reorder
- **Idempotência**: Renomear para mesmo nome = OK

---

## 7. Restrições Implementação

1. **User Isolation**: OBRIGATÓRIO, validar board.user_id em CADA operação
2. **Name Unique per Board**: OBRIGATÓRIO, constraint (board_id, name) em DB
3. **Position Sequencial**: OBRIGATÓRIO, manter sem gaps (0, 1, 2, ..., N-1)
4. **Min 1 Column**: OBRIGATÓRIO, rejeitar delete se último
5. **UUID Identificador**: OBRIGATÓRIO, não expor sequential IDs
6. **Validação Server**: OBRIGATÓRIO, client validação só UX
7. **Name Preservation**: OBRIGATÓRIO, não trimmar espaços
8. **Atomicidade Batch**: OBRIGATÓRIO, reorder múltiplas em transação
9. **Reajuste Position**: OBRIGATÓRIO, após delete ajustar positions restantes
10. **No Soft-Delete**: OBRIGATÓRIO, delete físico para cascata funcionar

---

## 8. Casos de Borda Abordados

### Validação Nome
- Nome vazio → 400
- Nome com 1 char → 201 (válido)
- Nome com 100 chars → 201 (válido)
- Nome com 101+ chars → 400
- Nome com espaços apenas → depende min validation (se "" após trim, rejeitar)
- Nome com espaços nas laterais → preservar (sem trim)
- Nome com unicode/acentos → 201 (aceitar)
- Nome duplicado (mesmo board) → 409
- Nome duplicado (outro board, mesmo user) → 201 (permitir)

### Reordenação
- Mover para mesma posição → sem efeito, 200 OK
- Mover para primeira posição → shift outras down
- Mover para última posição → shift outras up
- Mover entre outras → insert + shift affected
- Posições com gaps → 400 Bad Request (invalid)
- Reorder durante delete → 404 (column deletada)
- Concorrência reorder → last-write-wins (sem lock pessimista v1)

### Exclusão
- Deletar última coluna → 400 Bad Request
- Deletar coluna com cartões → cascata delete cards (v2) ou mover (spec)
- Deletar enquanto visualizando → recarrega automaticamente (frontend)
- Deletar + reorder concorrente → 404 ou 400 (depends timing)

### Casos Especiais
- Board sem colunas (invalid state, never happens v1) → bloqueia create board
- Coluna deletada + renomear → 404
- Renomear para nome de coluna deletada → permitir (nome reutilizável)

---

## 9. Dependências Entre RFs

### RF03 ← RF02 (Quadros)
- RF03 depende de Board existing (boardId validado em RF02)
- ColumnRepository.findByBoard usa board_id FK

### RF03 ← RF01 (Autenticação)
- RF03 depende de SessionService (requireAuth middleware)
- validateBoardAccess valida user ownership

### RF03 → RF04 (Cards)
- RF04 depende de Column existing (cardId → columnId)
- Cards inserem em columns da RF03
- Cascata delete column deleta cards (v2)

### RF03 → RF06 (Checklist)
- RF06 depende de Cards em Columns (RF03)
- Não bloqueia RF03

---

## 10. Dados de Teste

### Column Válida
- Name: "Review"
- Board: existente (user owner)
- Position: auto-assigned

### Casos Edge
- Name: "a" → 201
- Name: "x" * 100 → 201
- Name: "x" * 101 → 400
- Name: "  " (espaços) → depende regra (provavelmente 400)
- Name: "Lista™" → 201
- Name: "Lista\nNova" (newline) → 201
- Name: duplicado em OUTRO board do user → 201
- Position: válido (0-3) → 200
- Position: gap (pular number) → 400
- Delete: última coluna → 400
- Delete: coluna com N cartões → 204 (cards also deleted/moved)

---

## 11. Pseudocódigo Key Methods

### ColumnService.createColumn
```
Input: boardId, userId, name
  1. Validate userId owns board (via BoardRepository)
  2. Sanitize name (preserve spaces)
  3. Validate name (1-100, not empty)
  4. Check duplicate (board_id, name)
  5. Get current column count (for position)
  6. Insert new Column (position = count)
  7. Return Column created
```

### ColumnService.reorderColumns
```
Input: boardId, userId, columns[]
  1. Validate userId owns board
  2. Validate columns have valid positions (0..N-1, no gaps)
  3. Validate all columns belong to boardId
  4. Start transaction
  5. For each column in list: update position
  6. Commit transaction
  7. Return updated columns
```

### ColumnService.deleteColumn
```
Input: columnId, boardId, userId
  1. Validate userId owns board
  2. Fetch column + count of board columns
  3. If count == 1: throw Error(400, "Quadro deve ter pelo menos uma lista")
  4. Delete column (FK cascade deletes cards)
  5. Reajust positions of remaining (decrement position > deleted.position)
  6. Return void (204)
```

