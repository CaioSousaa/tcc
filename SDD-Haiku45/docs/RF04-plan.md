# RF04: Plano Técnico - Gerenciamento de Cartões

## 1. Stack Tecnológico

Mesmo stack RF01/RF02/RF03, sem novas dependências:

### Backend
- **ORM**: TypeORM (Entity: Card)
- **Validação**: Zod ou class-validator (title: 1-255, description: 0-5000)
- **Banco**: PostgreSQL (cascata delete, reordenação position)
- **UUID**: uuid package (gerado client-side)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **HTTP**: Fetch API com credentials
- **Drag-Drop**: react-beautiful-dnd ou nativa (v1 simples, v2+ completa)
- **State**: React Context + local state para UI
- **Componentes**: Tailwind CSS

---

## 2. Arquitetura de Componentes

### Backend

#### 2.1 Entity TypeORM (Nova)
- **Card**
  - id: UUID (PK)
  - list_id / column_id: UUID (FK Lists, cascade delete)
  - title: varchar(255), not null
  - description: varchar(5000), nullable
  - position: int (sequencial dentro lista)
  - created_at: timestamp
  - updated_at: timestamp
  - Relacionamento: 1 Card ← N (futuro: Labels, Comments, Checklist Items)

#### 2.2 Repository
- **CardRepository** (novo)
  - `insert(card)`: Cria novo Card
  - `findById(cardId, listId)`: Busca 1 Card (valida list_id)
  - `findByList(listId)`: Lista Cards de uma lista (order by position ASC)
  - `update(cardId, listId, { title, description })`: Atualiza conteúdo
  - `delete(cardId, listId)`: Delete com validação list_id
  - `updatePositions(listId, cardsData)`: Reordena múltiplos atomicamente
  - `moveCard(cardId, fromListId, toListId, position)`: Move entre listas
  - `countByList(listId)`: Contar cartões

#### 2.3 Services
- **CardService** (novo)
  - `createCard(listId, userId, title, description)`: Valida ownership, título, cria Card
  - `getCardsByList(listId, userId)`: Lista com validação
  - `updateCard(cardId, listId, userId, { title, description })`: Atualiza
  - `moveCard(cardId, listId, userId, { toListId, position })`: Move ou reordena
  - `deleteCard(cardId, listId, userId)`: Delete com validação

- **ValidationService** (expandir)
  - `validateCardTitle(title)`: 1-255 chars, não vazio
  - `validateCardDescription(description)`: 0-5000 chars, optional
  - `sanitizeCardTitle(title)`: Preserva espaços (sem trim)
  - `sanitizeCardDescription(description)`: Preserva espaços

#### 2.4 Middleware
- **validateBoardAccess**: Existente, valida lista → board ownership
- **validateListAccess**: Novo (ou reutilizar validateBoardAccess)
  - Verifica se List pertence a Board do usuário autenticado
  - Rejeita 403 se não owner

#### 2.5 Routes/Endpoints
- `POST /api/lists/:listId/cards`: Criar Card (requireAuth + validateBoardAccess)
- `GET /api/lists/:listId/cards`: Listar Cards (requireAuth + validateBoardAccess)
- `PUT /api/lists/:listId/cards/:cardId`: Atualizar (requireAuth + validateBoardAccess)
- `DELETE /api/lists/:listId/cards/:cardId`: Deletar (requireAuth + validateBoardAccess)

### Frontend

#### 2.6 Páginas
- `/boards/:id`: Usa ColumnList que exibe Cards
  - GET /api/lists/:listId/cards (implícito via ColumnList)
  - Exibe cards em cada coluna
  - Botões ações (editar, deletar, move via drag-drop)

#### 2.7 Componentes
- **CardItem**: Card visual
  - Exibe título + descrição (truncada)
  - Menu ações (editar, deletar)
  - Draggable (react-beautiful-dnd)

- **CardEditModal**: Edit title/description
  - Input fields (validação client)
  - Botões Salvar/Cancelar
  - Error handling

- **AddCardButton**: Botão adicionar cartão
  - Form inline ou modal
  - Valida antes submit
  - Exibe erros

- **DeleteCardConfirmation**: Dialog confirmação
  - Avisa sobre delete permanente
  - Botões Confirmar/Cancelar

- **CardList**: Exibe cards em coluna
  - Integrado em ColumnList
  - Drag-drop reorder + move between lists
  - Responsive a movimentos

#### 2.8 Hooks
- `useCards(listId)`: GET /api/lists/:listId/cards
- `useCreateCard(listId)`: POST /api/lists/:listId/cards
- `useUpdateCard(listId, cardId)`: PUT /api/lists/:listId/cards/:cardId
- `useDeleteCard(listId, cardId)`: DELETE /api/lists/:listId/cards/:cardId
- `useMoveCard(fromListId, toListId, cardId)`: PUT move (reorder ou change list)

---

## 3. Modelos de Dados

### Schema: `cards` (Novo)
```
id              UUID PRIMARY KEY
list_id         UUID NOT NULL FOREIGN KEY (columns.id, CASCADE)
title           VARCHAR(255) NOT NULL
description     VARCHAR(5000) NULL
position        INT NOT NULL (sequencial sem gaps)
created_at      TIMESTAMP NOT NULL DEFAULT now()
updated_at      TIMESTAMP NOT NULL DEFAULT now()

INDEX list_id
INDEX (list_id, position)
```

**Restrições**:
- title: case-sensitive, preserva espaços (sem trim)
- description: nullable, preserva espaços
- position: Inteiro sequencial, sem gaps dentro cada lista (0, 1, 2, 3, ...)
- list_id: FK garante Card sempre em uma lista válida
- Cascata delete: FK ON DELETE CASCADE (quando lista deletada, cards também)
- Delete físico: DELETE, não soft-delete

---

## 4. Interfaces de API

### POST /api/lists/:listId/cards
**Request**:
```json
{ "title": "string", "description": "string (optional)" }
```

**Validação**:
- title: 1-255 chars, obrigatório
- description: 0-5000 chars, opcional
- list_id: FK valid + user owns board

**Respostas**:
- 201 Created: Card criado
  ```json
  {
    "id": "uuid",
    "list_id": "uuid",
    "title": "string",
    "description": "string",
    "position": 5,
    "created_at": "timestamp"
  }
  ```
- 400 Bad Request: Título vazio/longo, descrição inválida
  ```json
  { "error": "validation", "message": "Título não pode estar vazio" }
  ```
- 404 Not Found: Lista não existe
- 401 Unauthorized: Não autenticado
- 403 Forbidden: Lista pertence a outro usuário

### GET /api/lists/:listId/cards
**Request**: (sem body, sessionId via cookie)

**Respostas**:
- 200 OK: Lista de cartões
  ```json
  {
    "cards": [
      {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "position": 0
      },
      ...
    ]
  }
  ```
- 404 Not Found: Lista não existe
- 401 Unauthorized: Sem permissão

### PUT /api/lists/:listId/cards/:cardId
**Request** (Atualizar):
```json
{ "title": "string", "description": "string" }
```

**Request** (Mover):
```json
{ "position": 2 }
```
ou
```json
{ "list_id": "uuid", "position": 0 }
```

**Respostas**:
- 200 OK: Card atualizado
  ```json
  {
    "id": "uuid",
    "list_id": "uuid",
    "title": "string",
    "position": 2,
    "updated_at": "timestamp"
  }
  ```
- 400 Bad Request: Título vazio, posição inválida, lista_id inválida
  ```json
  { "error": "validation", "message": "Título não pode estar vazio" }
  ```
- 404 Not Found: Card ou lista não existe
- 401 Unauthorized: Sem permissão

### DELETE /api/lists/:listId/cards/:cardId
**Request**: (vazio)

**Respostas**:
- 204 No Content: Deletado com sucesso
- 404 Not Found: Card não existe
- 401 Unauthorized: Sem permissão

---

## 5. Fluxos de Integração

### Fluxo 1: Criar Cartão
```
Frontend: Clica "Adicionar Cartão"
  ↓
Form exibido (input título)
  ↓
Frontend: POST /api/lists/:listId/cards { title: "...", description: "..." }
  ↓
Backend: validateBoardAccess middleware (403 se não owner)
  ↓
CardService.createCard(listId, userId, title, description)
  - Validate title (1-255)
  - Validate description (0-5000)
  - Check list exists
  - Insert Card com position = count_atual
  ↓
Response 201 + Card
  ↓
Frontend: Renderiza novo card ao final da coluna, sem reload
```

### Fluxo 2: Editar Cartão
```
Frontend: Clica em cartão para abrir detalhes
  ↓
Modo edição ativado
  ↓
Usuário muda título/descrição, clica "Salvar"
  ↓
Frontend: PUT /api/lists/:listId/cards/:cardId { title: "...", description: "..." }
  ↓
Backend: validateBoardAccess
  ↓
CardService.updateCard(cardId, listId, userId, { title, description })
  - Validate title
  - Validate description
  - Update
  ↓
Response 200
  ↓
Frontend: close modal, refresh card visualmente
```

### Fluxo 3: Mover Cartão
```
Frontend: Usuário arrasta cartão para nova posição/lista (drag-drop)
  ↓
Drag handler detecta posição final + lista destino
  ↓
Frontend: PUT /api/lists/:listId/cards/:cardId { position: N, list_id: "..." }
  ↓
Backend: validateBoardAccess
  ↓
CardService.moveCard(cardId, listId, userId, { toListId, position })
  - Validate position (sequencial)
  - Validate list exists
  - If different list: update list_id + reorder both lists
  - If same list: just reorder
  - Update all affected positions in transaction
  ↓
Response 200
  ↓
Frontend: Renderiza novo layout (sem reload)
```

### Fluxo 4: Deletar Cartão
```
Frontend: Clica botão "Deletar"
  ↓
Diálogo confirmação exibido
  ↓
Usuário clica "Confirmar"
  ↓
Frontend: DELETE /api/lists/:listId/cards/:cardId
  ↓
Backend: validateBoardAccess
  ↓
CardService.deleteCard(cardId, listId, userId)
  - Delete card
  - Reajust positions de cartões restantes
  ↓
Response 204
  ↓
Frontend: Remove card da lista, reajusta layout
```

---

## 6. Requisitos Não Funcionais

### Segurança
- **Acesso**: validateBoardAccess em todo endpoint /cards (via list→board validation)
- **User isolation**: Query sempre filtra list_id + validates board ownership
- **CORS**: Já configurado RF01
- **SQL Injection**: ORM TypeORM (parameterized queries)

### Performance
- **Índices**: (list_id, position) para sort
- **N+1**: Fetch Cards com list_id em 1 query
- **Reordenação**: Batch update atomicamente (transaction)
- **Drag-drop**: Otimista UI update, reconciliação server
- **Limite cards**: Sem hard limit (assume <1000/lista)

### Escalabilidade
- **Stateless**: Cada request valida board ownership
- **Transação reorder**: Múltiplas updates em transação
- **Cascade delete**: FK ON DELETE CASCADE (quando lista deletada)

### Confiabilidade
- **Validação**: Server-side obrigatório (client só UX)
- **Position sequencial**: Invariante mantido sempre
- **Concorrência**: Last-write-wins em move
- **Idempotência**: Editar para mesmo título = OK
- **Error handling**: Específicos (400, 404, 403)

---

## 7. Restrições Implementação

1. **User Isolation**: OBRIGATÓRIO, validar board.user_id em CADA operação
2. **Title Required**: OBRIGATÓRIO, title 1-255 chars
3. **Description Optional**: OBRIGATÓRIO, 0-5000 chars, pode ser vazio
4. **Position Sequencial**: OBRIGATÓRIO, manter sem gaps (0, 1, 2, ..., N-1)
5. **UUID Identificador**: OBRIGATÓRIO, não expor sequential IDs
6. **Validação Server**: OBRIGATÓRIO, client validação só UX
7. **Name Preservation**: OBRIGATÓRIO, não trimmar espaços
8. **Atomicidade Batch**: OBRIGATÓRIO, reorder múltiplas em transação
9. **Reajuste Position**: OBRIGATÓRIO, após delete/move ajustar positions
10. **No Soft-Delete**: OBRIGATÓRIO, delete físico para cascata funcionar
11. **FK List Validation**: OBRIGATÓRIO, card sempre em lista válida
12. **Cascade Delete**: OBRIGATÓRIO, quando lista deletada, cards também

---

## 8. Casos de Borda Abordados

### Validação Título
- Título vazio → 400
- Título com 1 char → 201 (válido)
- Título com 255 chars → 201 (válido)
- Título com 256+ chars → 400
- Título com espaços → preservar (sem trim)
- Título com unicode/acentos → 201 (aceitar)
- Descrição vazia → 201 (optional)
- Descrição 0-5000 chars → 201
- Descrição 5001+ chars → 400

### Reordenação
- Mover para mesma posição → 200 OK (sem efeito)
- Mover para primeira (position 0) → shift outras down
- Mover para última → shift outras up
- Mover para outra lista → list_id muda + reorder ambas
- Posições com gaps → 400 Bad Request (invalid)
- Move enquanto card deletado → 404

### Exclusão
- Deletar cartão com dependências (v2) → cascata ou error (spec: cascata)
- Deletar último cartão → OK (lista fica vazia)
- Reajuste positions → automático

### Idempotência
- Editar para mesmo título → 200 OK
- Mover para mesma posição → 200 OK

---

## 9. Dependências Entre RFs

### RF04 ← RF02 (Quadros)
- RF04 depende de Board existing (validado via list→board)

### RF04 ← RF03 (Listas)
- RF04 depende de List/Column existing (list_id FK)
- CardRepository.findByList usa list_id FK
- Move entre listas valida ambas

### RF04 ← RF01 (Autenticação)
- RF04 depende de SessionService (requireAuth middleware)
- validateBoardAccess valida user ownership

### RF04 → RF05-RF08 (Future)
- RF05 (Filtros) usa Cards como input
- RF06 (Checklist) depende de Cards (items em cards)
- RF07 (Board Members) pode usar Cards (assignees)
- RF08 (Labels) pode usar Cards (tags)

---

## 10. Dados de Teste

### Card Válido
- Title: "Implementar autenticação"
- Description: "Usar JWT para tokens"
- List: existente (user owner)
- Position: auto-assigned

### Casos Edge
- Title: "a" → 201
- Title: "x" * 255 → 201
- Title: "x" * 256 → 400
- Description: "" (vazio) → 201
- Description: "x" * 5000 → 201
- Description: "x" * 5001 → 400
- Title duplicado em mesma lista → 201 (permitido)
- Title duplicado em lista diferente → 201 (permitido)
- Move para mesma posição → 200 OK
- Move para lista diferente → list_id + position ambas atualizadas
- Delete: último cartão → 204 OK
- Delete: reajuste positions → automático

---

## 11. Pseudocódigo Key Methods

### CardService.createCard
```
Input: listId, userId, title, description
  1. Validate userId owns board (via list→board)
  2. Sanitize title, description (preserve spaces)
  3. Validate title (1-255, not empty)
  4. Validate description (0-5000, optional)
  5. Get current card count (for position)
  6. Insert new Card (position = count)
  7. Return Card created
```

### CardService.moveCard
```
Input: cardId, fromListId, toListId, position
  1. Validate userId owns both lists (via board)
  2. If toListId != fromListId:
     - Update card list_id = toListId
     - Reorder fromList positions
     - Reorder toList positions
  3. Else:
     - Just reorder positions in fromList
  4. Update all affected positions in transaction
  5. Return Card moved
```

### CardService.deleteCard
```
Input: cardId, listId, userId
  1. Validate userId owns list (via board)
  2. Fetch card
  3. Delete card
  4. Reajust positions of remaining (decrement position > deleted.position)
  5. Return void (204)
```

