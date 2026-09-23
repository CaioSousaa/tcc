# RF06: Plano Técnico - Checklists em Cartões com Acompanhamento de Progresso

## 1. Stack Tecnológico

Mesmo stack RF01-RF05, sem novas dependências:

### Backend
- **ORM**: TypeORM (Entity relationships, FK constraints)
- **Banco**: PostgreSQL (transações, integridade referencial)
- **Validação**: Class-validator ou Zod
- **Framework**: Express.js

### Frontend
- **Framework**: Next.js 16 (App Router)
- **HTTP**: Fetch API com credentials
- **UI**: Tailwind CSS
- **State**: React local state + refetch

---

## 2. Arquitetura de Componentes

### Backend (Novos Componentes Mínimos)

#### 2.1 Entities (Novas)

**Checklist Entity**
```
- id: UUID (PK)
- card_id: UUID (FK → Card, ON DELETE CASCADE)
- created_at: Timestamp
- updated_at: Timestamp
```

**ChecklistItem Entity**
```
- id: UUID (PK)
- checklist_id: UUID (FK → Checklist, ON DELETE CASCADE)
- title: VARCHAR(500) NOT NULL
- is_completed: BOOLEAN DEFAULT false
- position: INT NOT NULL (ordem de criação)
- created_at: Timestamp
- updated_at: Timestamp
```

#### 2.2 Repositories (Novas)

**ChecklistRepository**
- `findByCardId(cardId)`: GET checklist de um card
- `insert(checklist)`: Criar novo checklist
- `delete(checklistId)`: Deletar checklist (cascata remove items)

**ChecklistItemRepository**
- `findByChecklistId(checklistId)`: GET todos items de um checklist
- `insert(item)`: Criar novo item
- `update(itemId, data)`: Atualizar is_completed ou title
- `delete(itemId)`: Remover item
- `countCompleted(checklistId)`: COUNT items onde is_completed=true

#### 2.3 Services (Novas)

**ChecklistService**
- `createChecklist(cardId, userId)`: Cria checklist vazio para card
- `deleteChecklist(checklistId, cardId, userId)`: Deleta checklist + items (cascata)
- `getChecklistWithProgress(checklistId, userId)`: GET checklist + items + progress
- `addItem(checklistId, title, userId)`: Cria novo item
- `removeItem(itemId, checklistId, userId)`: Remove item
- `updateItem(itemId, data, userId)`: Atualiza is_completed ou title
- `getProgress(checklistId)`: Calcula { completed: N, total: M, percentage: P }

**CardService (Modificado)**
- Ao deletar card: cascata remove checklist via FK (existente em RF05)

#### 2.4 Routes (Novas)

```http
POST   /api/boards/:boardId/cards/:cardId/checklist
GET    /api/boards/:boardId/cards/:cardId/checklist
DELETE /api/boards/:boardId/cards/:cardId/checklist

POST   /api/boards/:boardId/cards/:cardId/checklist/items
PUT    /api/boards/:boardId/cards/:cardId/checklist/items/:itemId
DELETE /api/boards/:boardId/cards/:cardId/checklist/items/:itemId
```

#### 2.5 Middleware (Sem Mudanças)
- **requireAuth**: Existente
- **validateBoardAccess**: Existente (valida user_id === board.user_id)

### Frontend (Novos Componentes)

#### 2.6 Componentes Novos

**ChecklistSection.tsx**
- Renderiza checklist com lista de items
- Exibe progresso (X de Y)
- Contém input para adicionar novo item
- Cada item tem checkbox + texto + botões (editar, remover)

**ChecklistItem.tsx**
- Componente individual de um item
- Checkbox (clicável, atualiza is_completed)
- Texto do item (editável inline ou modal)
- Botão remover (ícone X)
- Visual condicional (strikethrough se completed)

**ChecklistProgress.tsx** (Opcional)
- Exibe barra de progresso ou percentual
- Passível ser reutilizado em múltiplas views

#### 2.7 Hooks (Novos)

**useChecklist(cardId)**
- `checklist`: { id, items: [...], progress: {...} }
- `loading`: boolean
- `error`: string | null
- `refetch()`: Recarrega checklist

**useChecklistItem(cardId, checklistId)**
- `addItem(title)`: POST item
- `updateItem(itemId, data)`: PUT item (is_completed ou title)
- `removeItem(itemId)`: DELETE item
- `loading`: boolean
- `error`: string | null

#### 2.8 Páginas (Modificadas)

**/boards/[id]/cards/[cardId]** (Modal ou página de card)
- Já renderiza CardDetail
- Adiciona seção de ChecklistSection se checklist existir
- Botão "Adicionar Checklist" se ainda não houver

---

## 3. Modelos de Dados

### Schema: Novas Tabelas

```sql
-- Checklist (1 por card)
CREATE TABLE checklists (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL UNIQUE REFERENCES cards(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ChecklistItem (múltiplos por checklist)
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  position INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_checklist_items_checklist_id ON checklist_items(checklist_id);
CREATE INDEX idx_checklist_items_position ON checklist_items(checklist_id, position);
CREATE INDEX idx_checklists_card_id ON checklists(card_id);
```

### Modificações em Tabelas Existentes

**cards table**
- Sem mudanças obrigatórias
- Opcionalmente: adicionar `progress_percentage` para denormalização (v2)

---

## 4. Interfaces de API

### Criar Checklist

```http
POST /api/boards/:boardId/cards/:cardId/checklist
```

**Headers**: Authorization (bearer token)

**Request**: (vazio)

**Response: 201 Created**
```json
{
  "id": "uuid",
  "card_id": "uuid",
  "items": [],
  "progress": {
    "completed": 0,
    "total": 0,
    "percentage": 0
  }
}
```

### Obter Checklist

```http
GET /api/boards/:boardId/cards/:cardId/checklist
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "card_id": "uuid",
  "items": [
    {
      "id": "uuid",
      "title": "Implementar login",
      "is_completed": false,
      "position": 0
    },
    {
      "id": "uuid",
      "title": "Testar login",
      "is_completed": true,
      "position": 1
    }
  ],
  "progress": {
    "completed": 1,
    "total": 2,
    "percentage": 50
  }
}
```

### Adicionar Item

```http
POST /api/boards/:boardId/cards/:cardId/checklist/items
```

**Request Body**:
```json
{
  "title": "Deploy em staging"
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "checklist_id": "uuid",
  "title": "Deploy em staging",
  "is_completed": false,
  "position": 2
}
```

### Atualizar Item

```http
PUT /api/boards/:boardId/cards/:cardId/checklist/items/:itemId
```

**Request Body** (um dos campos):
```json
{
  "title": "Deploy em staging (atualizado)" // OR
  "is_completed": true
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "title": "Deploy em staging (atualizado)",
  "is_completed": true,
  "updated_at": "2026-09-14T..."
}
```

### Remover Item

```http
DELETE /api/boards/:boardId/cards/:cardId/checklist/items/:itemId
```

**Response: 204 No Content**

### Deletar Checklist Inteiro

```http
DELETE /api/boards/:boardId/cards/:cardId/checklist
```

**Response: 204 No Content**

### Respostas de Erro

#### Validação: Item Vazio
- 400 Bad Request
- `{ "error": "Item não pode estar vazio" }`

#### Validação: Muito Longo
- 400 Bad Request
- `{ "error": "Máximo 500 caracteres" }`

#### Não Autorizado
- 403 Forbidden
- `{ "error": "Você não tem permissão para modificar este card" }`

#### Não Autenticado
- 401 Unauthorized
- Redireciona para /login

#### Card/Checklist não Existe
- 404 Not Found
- `{ "error": "Card não encontrado" }`

#### Checklist já Existe
- 409 Conflict
- `{ "error": "Este card já possui um checklist" }`

---

## 5. Fluxos de Integração

### Fluxo 1: Criar Checklist e Adicionar Items

```
Frontend: Usuário abre card sem checklist
  ↓
Clica "Adicionar Checklist"
  ↓
Frontend: POST /api/boards/:boardId/cards/:cardId/checklist
  ↓
Backend: ChecklistService.createChecklist(cardId, userId)
  - Valida ownership (board.user_id === userId)
  - Cria Checklist entry vazio
  - Retorna checklist vazio
  ↓
Response: 201 Created
  ↓
Frontend: ChecklistSection renderiza
  ↓
Usuário digita "Item 1" e clica "Adicionar"
  ↓
Frontend: POST /api/boards/:boardId/cards/:cardId/checklist/items
  ↓
Backend: ChecklistService.addItem(checklistId, title, userId)
  - Valida: title não vazio, <= 500 chars
  - Valida: user_id === card.owner
  - Insere ChecklistItem com position = max + 1
  - Retorna item
  ↓
Response: 201 Created
  ↓
Frontend: Item 1 aparece, checkbox desmarcado, "0 de 1"
  ↓
Repete para Item 2, Item 3
  ↓
Frontend: 3 items listados, "0 de 3"
```

### Fluxo 2: Marcar Item e Atualizar Progresso

```
Frontend: Usuário clica checkbox de Item 1
  ↓
Frontend: PUT /api/boards/:boardId/cards/:cardId/checklist/items/:itemId
  Body: { is_completed: true }
  ↓
Backend: ChecklistService.updateItem(itemId, { is_completed: true }, userId)
  - Valida ownership
  - UPDATE checklist_items SET is_completed=true, updated_at=NOW()
  - Retorna item atualizado
  ↓
Response: 200 OK
  ↓
Frontend: Item 1 visual updated (strikethrough)
  ↓
Frontend: Recalcula progress (1 de 3)
  ↓
ChecklistProgress renderiza 33%
```

### Fluxo 3: Remover Item

```
Frontend: Usuário clica X em Item 2
  ↓
Frontend: DELETE /api/boards/:boardId/cards/:cardId/checklist/items/:itemId
  ↓
Backend: ChecklistService.removeItem(itemId, checklistId, userId)
  - Valida ownership
  - DELETE checklist_items WHERE id = itemId
  ↓
Response: 204 No Content
  ↓
Frontend: Item 2 desaparece
  ↓
Frontend: Progress atualiza (1 de 2)
```

### Fluxo 4: Editar Item

```
Frontend: Usuário clica editar em Item 1 (ou double-click)
  ↓
Frontend: Campo fica editável (inline)
  ↓
Usuário altera texto e pressiona Enter ou clica Save
  ↓
Frontend: PUT /api/boards/:boardId/cards/:cardId/checklist/items/:itemId
  Body: { title: "novo texto" }
  ↓
Backend: ChecklistService.updateItem(itemId, { title: "novo texto" }, userId)
  - Valida: title não vazio, <= 500 chars
  - UPDATE checklist_items SET title=..., updated_at=NOW()
  - Retorna item
  ↓
Response: 200 OK
  ↓
Frontend: Item renderiza com novo texto, estado preservado
```

### Fluxo 5: Deletar Card com Checklist

```
Frontend: Usuário deleta card (via RF05)
  ↓
Backend: ColumnService.deleteColumn → CardService.deleteCard
  ↓
Backend: DELETE cards WHERE id = cardId
  ↓
Cascata: DELETE checklists WHERE card_id = cardId
  ↓
Cascata: DELETE checklist_items WHERE checklist_id IN (SELECT id FROM checklists...)
  ↓
Card desaparece com seu checklist
  ↓
Frontend: refetch remove card da view
```

---

## 6. Requisitos Não-Funcionais

### Segurança

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Autenticação | requireAuth middleware (existente) | Sem mudança |
| Autorização | validateBoardAccess + user_id === card.owner | Revalidar em cada operação |
| SQL Injection | TypeORM parameterized queries | FK CASCADE DB-level |
| CORS | Já configurado RF01 | Sem mudança |
| Input Validation | Class-validator na Service | Max 500 chars, não vazio |

### Performance

| Requisito | Implementação | Notas |
|-----------|---------------|---|
| Get checklist | SELECT items + COUNT em 1 query | Índice em (checklist_id, is_completed) |
| Add item | INSERT 1 row | Posição = MAX(position) + 1 |
| Mark item | UPDATE 1 row | Index (checklist_id) |
| List items | SELECT all from checklist | Índice em checklist_id |
| Count completed | SELECT COUNT(*) WHERE is_completed=true | Subquery ou denormalização (v2) |
| N+1 prevention | Load checklist + items em 1 query | Não múltiplas queries |

### Escalabilidade

| Requisito | Implementação | Notas |
|-----------|---------------|---|
| Stateless | Cada request valida ownership | Sem estado session |
| Transação | Operações atomicamente DB | INSERT/UPDATE/DELETE transação |
| Cascata DB-level | FK ON DELETE CASCADE | Não application-level |
| Reusabilidade | ChecklistService centralizado | Sem duplicação lógica |
| Limites | Sem limite funcional (0-100+) | V2 pode ter UI limite |

### Confiabilidade

| Requisito | Implementação | Notas |
|-----------|---------------|---|
| Atomicidade | Transação DB | Tudo ou nada |
| Consistência | FK referential integrity | Checklist sem card inválido |
| Validação | Máximo 500 chars | Rejeita entrada inválida |
| Error Handling | 400/403/401/404/409 | Específicos por erro |
| Cascata delete | FK ON DELETE CASCADE | Remover card remove checklist |
| Concorrência | Transação DB | Last-write-wins |

---

## 7. Restrições Implementação

1. **Checklist Opcional**: Um card pode ou não ter checklist (não obrigatório)
2. **Um por Card**: Apenas 1 checklist por card (validação unique card_id)
3. **Ordem Preservada**: Itens mantêm order de adição (position field)
4. **Título Obrigatório**: Cada item precisa ter texto não-vazio
5. **Comprimento Máximo**: Máximo 500 caracteres por item
6. **Sem Reordenação v1**: Ordem de criação, sem drag-and-drop (v2)
7. **Sem Hierarquia**: Itens não têm subitens (lista flat)
8. **Sem Duplicação Automática**: Permitir mesmo título em múltiplos items
9. **Delete Físico**: DELETE, não soft-delete (FK CASCADE)
10. **Atomicidade**: Marcação/desmarção/adição/remoção são transações
11. **Validação Prévia**: Rejeitar entrada inválida antes de INSERT
12. **Cascata Obrigatória**: Deletar card deleta checklist + items automaticamente

---

## 8. Mudanças Específicas no Código

### Backend

#### Novos Arquivos
- `src/entities/Checklist.ts`
- `src/entities/ChecklistItem.ts`
- `src/repositories/ChecklistRepository.ts`
- `src/repositories/ChecklistItemRepository.ts`
- `src/services/ChecklistService.ts`
- `src/routes/checklist.routes.ts`

#### Modificados
- `src/routes/index.ts`: Registrar rotas de checklist
- `src/services/CardService.ts`: Cascata já via FK (sem mudança explícita)
- `src/services/ValidationService.ts`: Reutilizar sanitizeText, validações

#### Dependências (Sem Mudanças)
- TypeORM, PostgreSQL, Express já presentes

### Frontend

#### Novos Arquivos
- `src/components/ChecklistSection.tsx`
- `src/components/ChecklistItem.tsx`
- `src/components/ChecklistProgress.tsx` (opcional)
- `src/hooks/useChecklist.ts`
- `src/hooks/useChecklistItem.ts`

#### Modificados
- `src/app/boards/[id]/cards/[cardId]/page.tsx`: Adicionar ChecklistSection
- `src/components/CardDetail.tsx`: Integrar checklist se existir

#### Dependências (Sem Mudanças)
- Next.js, React, Tailwind já presentes

---

## 9. Dependências Entre RFs

### RF06 ← RF01 (Autenticação)
- Autenticação obrigatória (existente)

### RF06 ← RF02 (Quadros)
- Validação ownership via board (existente)

### RF06 ← RF04 (Cartões)
- Card é entidade pai do checklist
- FK card_id (obrigatória, UNIQUE)

### RF06 ← RF05 (Cascade Delete)
- Ao deletar card, checklist é deletado automaticamente
- FK ON DELETE CASCADE (obrigatória)

---

## 10. Casos de Teste Previstos

### Unitários

**ChecklistService**
- createChecklist: Cria vazio, retorna id
- addItem: Insere item, incrementa position
- removeItem: Remove item, não reordena restantes
- updateItem: Atualiza is_completed ou title
- getProgress: Calcula { completed: 1, total: 3, percentage: 33 }

**Validação**
- Empty item rejected
- Whitespace-only rejected
- 501+ chars rejected
- Valid 1-500 chars accepted

### Integração

- Criar checklist, adicionar 3 items, marcar 1: "1 de 3"
- Remover item no meio: restantes preservam posição
- Editar item: posição preservada, progresso recalculado
- Deletar card: checklist removido via cascata

### E2E

- Abrir card, criar checklist, adicionar items
- Marcar items, visualizar progresso
- Editar item, remover item
- Fechar/reabrir card: dados persistem
- Deletar card: checklist desaparece

---

## 11. Pseudo-código Key Methods

Nenhum novo padrão arquitetural necessário. Reutiliza existentes:

```
ChecklistService.createChecklist(cardId, userId):
  1. Validate userId owns card
  2. Check if checklist already exists → Error 409 if yes
  3. Create Checklist(card_id=cardId)
  4. Return checklist empty

ChecklistService.addItem(checklistId, title, userId):
  1. Validate user owns card (via checklist.card)
  2. Validate title: not empty, max 500 chars
  3. position = SELECT MAX(position) FROM checklist_items WHERE checklist_id
  4. Insert ChecklistItem(checklist_id, title, position=position+1, is_completed=false)
  5. Return item

ChecklistService.updateItem(itemId, data, userId):
  1. Validate user owns card
  2. If data.title: validate not empty, max 500 chars
  3. UPDATE checklist_items SET data, updated_at=NOW()
  4. Return item

ChecklistService.getProgress(checklistId):
  1. completed = SELECT COUNT(*) WHERE is_completed=true
  2. total = SELECT COUNT(*) WHERE checklist_id
  3. percentage = (completed / total) * 100 OR 0 if total=0
  4. Return { completed, total, percentage }

Frontend:
  useChecklist(cardId):
    1. GET /api/boards/:boardId/cards/:cardId/checklist
    2. Store { items, progress }
    3. Return { checklist, loading, error, refetch }

  useChecklistItem(cardId, checklistId):
    1. addItem(title): POST item, refetch
    2. updateItem(itemId, data): PUT item, refetch
    3. removeItem(itemId): DELETE item, refetch
```

---

## Conclusão

**Implementação Focada**: RF06 adiciona 2 novas entities (Checklist, ChecklistItem), 2 repositories, 1 service, 5 novos endpoints, 3 componentes frontend, 2 hooks.

**Stack Completo**: Reutiliza PostgreSQL + TypeORM + Express + Next.js, sem novas dependências.

**Cascata Automática**: Deletar card remove checklist via FK ON DELETE CASCADE (já padrão de RF05).

**Mudanças Mínimas**: Nenhuma mudança em entities existentes, apenas novos componentes.

**Validação Forte**: Input validation na service layer, DB constraints para integridade.

**Performance**: Single query para obter checklist + items + progress, índices em lookups.

**Segurança**: Ownership validation em cada operação, SQL injection prevention via TypeORM.
