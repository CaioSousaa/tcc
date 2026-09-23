# RF08: Plano Técnico - Etiquetas Coloridas e Filtros por Etiqueta

## 1. Stack Tecnológico

Mesmo stack RF01-RF07, sem novas dependências:

### Backend
- **ORM**: TypeORM (FK constraints, cascata automática)
- **Banco**: PostgreSQL (UNIQUE constraints, índices)
- **Validação**: Class-validator (HEX color, name length)
- **Framework**: Express.js
- **Real-time**: WebSocket ou polling (sincronização labels)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **HTTP**: Fetch API com credentials
- **UI**: Tailwind CSS
- **State**: React local state + refetch
- **Real-time**: useEffect polling ou WebSocket listener (sincronização)

---

## 2. Arquitetura de Componentes

### Backend (Novos Componentes)

#### 2.1 Entities (Novas)

**Label Entity**
```
- id: UUID (PK)
- board_id: UUID (FK → Board, ON DELETE CASCADE)
- name: VARCHAR 50 (UNIQUE per board: UNIQUE(board_id, name))
- color: VARCHAR 7 (HEX #RRGGBB, format validation)
- created_at: Timestamp
- updated_at: Timestamp

Constraints:
- UNIQUE(board_id, name) para evitar duplicação
- Color deve ser HEX válido (6 dígitos após #)
```

**CardLabel Entity**
```
- id: UUID (PK)
- card_id: UUID (FK → Card, ON DELETE CASCADE)
- label_id: UUID (FK → Label, ON DELETE CASCADE)
- created_at: Timestamp

Constraints:
- UNIQUE(card_id, label_id) para evitar duplicação
```

#### 2.2 Repositories (Novas)

**LabelRepository**
- `insert(label)`: Criar etiqueta
- `findByBoardId(boardId)`: GET todas etiquetas do quadro (com card count)
- `findById(labelId, boardId)`: GET etiqueta específica
- `findByName(boardId, name)`: Checar duplicação de nome
- `update(labelId, boardId, data)`: Atualizar nome/cor
- `delete(labelId, boardId)`: Deletar etiqueta (cascata automática)
- `countByLabel(labelId)`: Contar cartões com etiqueta

**CardLabelRepository**
- `insert(cardLabel)`: Aplicar etiqueta a cartão
- `findByCardId(cardId)`: GET etiquetas do cartão
- `findByLabelId(labelId)`: GET cartões com etiqueta
- `delete(cardLabelId)`: Remover etiqueta de cartão
- `deleteByLabelId(labelId)`: Remover todos quando label deletado
- `deleteByCardId(cardId)`: Remover todas quando card deletado
- `findDuplicate(cardId, labelId)`: Checar UNIQUE constraint

#### 2.3 Services (Novas)

**LabelService**
- `createLabel(boardId, name, color, userId)`: Criar etiqueta
  - Validação: user_id === admin/editor
  - Validação: name não-vazio, ≤50 chars
  - Validação: color é HEX válido (#RRGGBB)
  - Validação: name único por boardId
  - INSERT Label
  - Retorna label criada

- `updateLabel(boardId, labelId, name, color, userId)`: Editar etiqueta
  - Validação: user_id === admin/editor
  - Validação: mesmas validações de create
  - UPDATE Label
  - Notifica clientes de mudança (real-time)
  - Retorna label atualizada

- `deleteLabel(boardId, labelId, userId)`: Deletar etiqueta
  - Validação: user_id === admin/editor
  - DELETE Label (cascata remove CardLabels)
  - Notifica clientes (real-time)
  - Retorna sucesso

- `getLabelsOfBoard(boardId)`: GET todas etiquetas do quadro
  - SELECT + COUNT cartões por label
  - Retorna array de labels com card_count

- `getLabelsOfCard(cardId)`: GET etiquetas aplicadas a cartão
  - Retorna array de labels

- `applyLabel(boardId, cardId, labelId, userId)`: Aplicar etiqueta a cartão
  - Validação: user_id === admin/editor
  - Validação: label pertence ao quadro
  - Validação: cartão pertence ao quadro
  - Validação: UNIQUE(card_id, label_id) - não duplicar
  - INSERT CardLabel
  - Notifica clientes (real-time)
  - Retorna cardLabel criado

- `removeLabel(boardId, cardId, cardLabelId, userId)`: Remover etiqueta de cartão
  - Validação: user_id === admin/editor
  - Validação: cardLabel pertence a cartão/quadro
  - DELETE CardLabel
  - Notifica clientes (real-time)
  - Retorna sucesso

#### 2.4 Routes (Novas)

```http
-- Gerenciamento de Etiquetas (Editor+)
POST   /api/boards/:boardId/labels
GET    /api/boards/:boardId/labels
PUT    /api/boards/:boardId/labels/:labelId
DELETE /api/boards/:boardId/labels/:labelId

-- Aplicação em Cartões (Editor+)
POST   /api/boards/:boardId/cards/:cardId/labels
DELETE /api/boards/:boardId/cards/:cardId/labels/:cardLabelId

-- Filtro/Listagem (qualquer usuário)
GET    /api/boards/:boardId/labels/:labelId/cards (cards com label)
GET    /api/cards/:cardId/labels (etiquetas do cartão)
```

#### 2.5 Middleware (Existente, usado)

- **requireAuth**: Valida se autenticado
- **requireRole(['admin', 'editor'])**: Valida papel para CRUD labels
- Viewer consegue GET/filter mas não POST/PUT/DELETE labels

#### 2.6 Validação

- **HEX Color Validation**: Regex `/^#[0-9A-Fa-f]{6}$/` ou library (hex-color-regex)
- **Name Validation**: Length 1-50, non-empty, trim whitespace
- **Duplicate Check**: UNIQUE constraint DB + application-level check antes de INSERT

### Frontend (Novos Componentes)

#### 2.7 Componentes Novos

**LabelManager.tsx** (Admin/Editor)
- Renderiza lista de labels com CRUD
- Exibe cor ao lado de cada label
- Modal para criar/editar label
- Botão deletar com confirmação
- Exibe card_count por label
- Sincronização: escuta WebSocket/polls para mudanças

**LabelBadge.tsx**
- Renderiza label com cor + nome
- Usado em: cards list, card detail, filtro dropdown
- Props: name, color, onRemove (opcional)
- Accessibility: title com nome da cor se necessário

**LabelSelector.tsx** (Editor+)
- Dropdown para selecionar etiqueta para aplicar a cartão
- Filtra labels do quadro
- Mostra cor + nome
- Props: boardId, cardId, onApply
- Desabilitado para viewers

**LabelList.tsx**
- Renderiza etiquetas aplicadas a um cartão
- Cada label tem botão X para remover (se editor+)
- Props: cardId, labels, onRemove, readonly

**LabelFilter.tsx**
- Painel de filtros por label
- Checkboxes ou chips para seleção
- Multi-select (OR logic)
- Props: boardId, selectedLabels, onFilterChange
- Acessível para todos (viewers incluído)

**CardListWithLabelFilter.tsx** (ou integrado em CardList)
- Renderiza cards filtrados por etiquetas
- Mostra filtros ativos
- Props: boardId, filters, cards
- Atualiza quando filtro muda

#### 2.8 Hooks (Novos)

**useLabels(boardId)**
- Retorna: { labels, loading, error, refetch }
- GET /api/boards/:boardId/labels
- Polls/listens para mudanças em tempo real

**useLabelManagement(boardId)**
- Retorna: { createLabel, updateLabel, deleteLabel, loading, error }
- POST /create, PUT /update, DELETE /delete
- Dispara refetch em useLabels após mudança

**useCardLabels(cardId)**
- Retorna: { labels, loading, error, refetch }
- GET /api/cards/:cardId/labels
- Polls para sincronização

**useCardLabelManagement(boardId, cardId)**
- Retorna: { applyLabel, removeLabel, loading, error }
- POST /apply, DELETE /remove
- Dispara refetch em useCardLabels

**useCardLabelFilter()**
- Retorna: { selectedLabels, toggleLabel, clearFilter }
- localStorage para persistir filtro (opcional)
- Retorna array de label IDs selecionados

#### 2.9 Páginas (Modificadas)

**/boards/[id]** (Existente)
- Adicionar painel LabelFilter acima ou ao lado da lista de cards
- Passar filtered cards a CardList
- Estado do filtro em local state ou URL params

**/boards/[id]/settings** (Potencial)
- Página para gerenciar etiquetas do quadro
- Renderiza LabelManager
- Acessível apenas para admin/editor

**/boards/[id]/cards/[cardId]** (Existente)
- Adicionar LabelList mostrando etiquetas do cartão
- Adicionar LabelSelector para adicionar etiqueta (se editor+)
- Mostrar labels no header do cartão

#### 2.10 Real-time Synchronization (Opcional)

Se WebSocket implementado:
- Backend envia evento quando label criado/atualizado/deletado
- Frontend listeners em LabelManager, CardList (refetch)
- Fallback: polling a cada 5-10 segundos

Se apenas polling:
- useLabels faz refetch a cada 5-10s
- Suficiente para MVP

---

## 3. Modelos de Dados

### Schema: Novas Tabelas

```sql
-- Etiquetas do quadro
CREATE TABLE labels (
  id UUID PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL, -- HEX #RRGGBB
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(board_id, name)
);

-- Aplicação de etiqueta em cartão
CREATE TABLE card_labels (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(card_id, label_id)
);

-- Índices
CREATE INDEX idx_labels_board_id ON labels(board_id);
CREATE INDEX idx_card_labels_card_id ON card_labels(card_id);
CREATE INDEX idx_card_labels_label_id ON card_labels(label_id);
```

### Modificações em Tabelas Existentes

**cards table**
- Sem mudanças obrigatórias
- updated_at já existe (atualiza ao aplicar/remover label)

**boards table**
- Sem mudanças

---

## 4. Interfaces de API

### Criar Etiqueta

```http
POST /api/boards/:boardId/labels
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "Bug",
  "color": "#FF0000"
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "board_id": "uuid",
  "name": "Bug",
  "color": "#FF0000",
  "created_at": "2026-09-14T12:00:00Z",
  "updated_at": "2026-09-14T12:00:00Z"
}
```

### Listar Etiquetas do Quadro

```http
GET /api/boards/:boardId/labels
```

**Response: 200 OK**
```json
{
  "labels": [
    { "id": "uuid", "name": "Bug", "color": "#FF0000", "card_count": 5 },
    { "id": "uuid", "name": "Feature", "color": "#00FF00", "card_count": 8 }
  ]
}
```

### Editar Etiqueta

```http
PUT /api/boards/:boardId/labels/:labelId
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "name": "BugReport",
  "color": "#FF8800"
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "name": "BugReport",
  "color": "#FF8800",
  "updated_at": "2026-09-14T13:00:00Z"
}
```

### Deletar Etiqueta

```http
DELETE /api/boards/:boardId/labels/:labelId
Authorization: Bearer <token>
```

**Response: 204 No Content**

### Aplicar Etiqueta a Cartão

```http
POST /api/boards/:boardId/cards/:cardId/labels
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "label_id": "uuid"
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "card_id": "uuid",
  "label_id": "uuid",
  "created_at": "2026-09-14T12:00:00Z"
}
```

### Remover Etiqueta de Cartão

```http
DELETE /api/boards/:boardId/cards/:cardId/labels/:cardLabelId
Authorization: Bearer <token>
```

**Response: 204 No Content**

### Listar Etiquetas de um Cartão

```http
GET /api/cards/:cardId/labels
```

**Response: 200 OK**
```json
{
  "labels": [
    { "id": "uuid", "name": "Bug", "color": "#FF0000" },
    { "id": "uuid", "name": "Urgent", "color": "#FF0000" }
  ]
}
```

### Erros

- 400 Bad Request: Nome vazio, cor inválida, nome > 50 chars
- 401 Unauthorized: Não autenticado
- 403 Forbidden: Viewer tenta gerenciar etiqueta
- 404 Not Found: Label/card não existe
- 409 Conflict: Nome duplicado no quadro

---

## 5. Fluxos de Integração

### Fluxo 1: Criar Etiqueta

```
Frontend: Editor clica "Nova Etiqueta"
  ↓
Modal abre com inputs: name, color picker
  ↓
Frontend: POST /api/boards/:boardId/labels
  Body: { name: "Feature", color: "#00FF00" }
  ↓
Backend: LabelService.createLabel
  - Validação: editor+ role
  - Validação: name 1-50 chars
  - Validação: color HEX válido
  - Validação: UNIQUE(board_id, name) via DB constraint
  - INSERT Label
  - Notifica clientes (WebSocket ou refetch)
  ↓
Response: 201 Created
  ↓
Frontend: Modal fecha, lista atualiza com nova label
  ↓
Outros usuários veem label em tempo real
```

### Fluxo 2: Aplicar Etiqueta a Cartão

```
Frontend: Editor abre cartão
  ↓
Clica "Adicionar Etiqueta"
  ↓
Dropdown exibe labels do quadro
  ↓
Seleciona "Feature"
  ↓
Frontend: POST /api/boards/:boardId/cards/:cardId/labels
  Body: { label_id: "uuid" }
  ↓
Backend: LabelService.applyLabel
  - Validação: editor+ role
  - Validação: label pertence ao quadro
  - Validação: UNIQUE(card_id, label_id) - não duplicar
  - INSERT CardLabel
  - Notifica clientes
  ↓
Response: 201 Created
  ↓
Frontend: Label aparece no cartão
  ↓
CardList refetch mostra label com cor
```

### Fluxo 3: Filtrar Cartões por Etiqueta

```
Frontend: CardList renderiza labels como filtros
  ↓
Usuário (qualquer role) seleciona "Bug"
  ↓
Estado: selectedLabels = ["bug-uuid"]
  ↓
CardList filtra: cards com "Bug" label (client-side OR server-side)
  ↓
Se server-side:
  - POST /api/boards/:boardId/cards?labels=uuid1,uuid2
  - Backend retorna cards com qualquer label
  ↓
Se client-side:
  - Frontend já tem cards com labels
  - Filtra array: cards.filter(c => c.labels.some(l => selectedLabels.includes(l.id)))
  ↓
Usuário seleciona também "Urgent"
  ↓
selectedLabels = ["bug-uuid", "urgent-uuid"]
  ↓
Cards com "Bug" OU "Urgent" aparecem (OR logic)
  ↓
Usuário clica X em "Bug"
  ↓
selectedLabels = ["urgent-uuid"]
  ↓
Apenas cards com "Urgent" aparecem
```

### Fluxo 4: Editar Etiqueta (Sincronização)

```
Frontend A: Admin clica editar "Bug"
  ↓
Modal abre com nome "Bug" + cor vermelha
  ↓
Muda para "BugReport" + cor laranja
  ↓
Frontend A: PUT /api/boards/:boardId/labels/:labelId
  Body: { name: "BugReport", color: "#FF8800" }
  ↓
Backend: LabelService.updateLabel
  - Validação: admin/editor role
  - Validação: name, color (mesmas validações create)
  - UPDATE labels
  - Notifica clientes (WebSocket ou server-sent events)
  ↓
Response: 200 OK
  ↓
Frontend A: Modal fecha, lista atualiza
  ↓
Frontend B (outro usuário):
  - Recebe notificação de mudança
  - Refetch labels
  - Cards que tinham "Bug" agora exibem "BugReport" com cor laranja
  - Se tinha "Bug" no filtro, filtro continua ativo (referencia por ID, não name)
```

### Fluxo 5: Deletar Etiqueta (Cascata)

```
Frontend: Admin clica deletar "WontFix"
  ↓
Confirmação: "Deletar etiqueta? Será removida de X cartões."
  ↓
Frontend: DELETE /api/boards/:boardId/labels/:labelId
  ↓
Backend: LabelService.deleteLabel
  - Validação: admin/editor role
  - DELETE labels (cascata remove card_labels via FK)
  - Notifica clientes
  ↓
Response: 204 No Content
  ↓
Frontend: Label desaparece de lista + de todos cartões
  ↓
Se usuário tinha "WontFix" no filtro, filtro limpa automaticamente
  ↓
CardList volta a exibir todos cartões
```

---

## 6. Requisitos Não-Funcionais

### Segurança

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Autenticação | requireAuth middleware | Sem mudança |
| Autorização | requireRole(['admin', 'editor']) | CRUD labels editor+ apenas |
| Validação | HEX color, name length, UNIQUE(board_id, name) | Frontend + backend |
| SQL Injection | TypeORM parameterized queries | FK CASCADE seguro |
| XSS | Renderização escapada (React) | Labels são dados user-generated |

**Resultado**: ✅ 5/5 Requisitos

### Performance

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Get labels list | SELECT com COUNT em single query ou 2 queries | Índice em board_id |
| Get card labels | SELECT CardLabel + JOIN Label | Índice em card_id |
| Filter cards | Client-side OR (já tem cards) | Server-side optional (POST com label_ids) |
| Apply label | INSERT 1 row, UNIQUE constraint | Índice em card_id, label_id |
| Delete label | DELETE (cascata automática) | FK cascade instantâneo |

**Resultado**: ✅ 5/5 Requisitos

### Escalabilidade

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Stateless | Validação em cada request | Sem sessão label |
| Índices | board_id, card_id, label_id | Query optimization |
| Cascata DB | FK ON DELETE CASCADE | Automático, não application-level |
| Real-time | WebSocket opcional | Polling fallback simples |

**Resultado**: ✅ 4/4 Requisitos

### Confiabilidade

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Atomicidade | DB constraints + indexes | Cascata garantida |
| Consistência | UNIQUE constraints | Duplicação impossível |
| Error handling | 400/401/403/404/409 | Específicos |
| Syncronization | WebSocket + fallback polling | Eventual consistency |

**Resultado**: ✅ 4/4 Requisitos

---

## 7. Restrições Implementação

1. **Nome Obrigatório**: 1-50 caracteres, não vazio
2. **Cor Obrigatória**: HEX válido (#RRGGBB)
3. **Unique por Quadro**: UNIQUE(board_id, name) constraint
4. **Sem Duplicação**: UNIQUE(card_id, label_id) constraint
5. **Editor+**: Apenas admin/editor podem criar/editar/deletar labels
6. **Viewer Pode Filtrar**: Qualquer usuário consegue usar filtro
7. **Cascata Automática**: FK ON DELETE CASCADE
8. **Sem Limite Explícito**: Cartões podem ter N etiquetas (prático: <100)
9. **Filtro OR**: Múltiplas seleções = OR logic, não AND
10. **Real-time Opcional**: WebSocket para sincronização imediata, polling fallback

---

## 8. Mudanças Específicas no Código

### Backend

#### Novos Arquivos
- `src/entities/Label.ts`
- `src/entities/CardLabel.ts`
- `src/repositories/LabelRepository.ts`
- `src/repositories/CardLabelRepository.ts`
- `src/services/LabelService.ts`
- `src/routes/labels.ts`
- `src/routes/cardLabels.ts` (ou integrado em labels.ts)

#### Modificados
- `src/routes/index.ts`: Registrar rotas /labels
- `src/types/errors.ts`: Adicionar ConflictError se não existir
- `src/middlewares/index.ts`: requireRole já existe

#### Dependências
- Nenhuma nova (class-validator já está para email)

### Frontend

#### Novos Arquivos
- `src/components/LabelManager.tsx`
- `src/components/LabelBadge.tsx`
- `src/components/LabelSelector.tsx`
- `src/components/LabelList.tsx`
- `src/components/LabelFilter.tsx`
- `src/hooks/useLabels.ts`
- `src/hooks/useLabelManagement.ts`
- `src/hooks/useCardLabels.ts`
- `src/hooks/useCardLabelManagement.ts`
- `src/hooks/useCardLabelFilter.ts`

#### Modificados
- `src/app/boards/[id]/page.tsx`: Integrar LabelFilter
- `src/app/boards/[id]/cards/[cardId]/page.tsx`: Integrar LabelList + LabelSelector
- Potencial: `src/app/boards/[id]/settings/page.tsx` (nova página para gerenciar labels)

#### Dependências
- Nenhuma nova

---

## 9. Dependências Entre RFs

### RF08 ← RF01 (Autenticação)
- Auth obrigatória para CRUD labels

### RF08 ← RF02 (Quadros)
- Label pertence a um quadro (FK)

### RF08 ← RF04 (Cartões)
- Label é aplicada a cartões (FK CardLabel)

### RF08 ← RF05 (Cascade Delete)
- Deletar board/card remove labels automaticamente (cascata FK)

---

## 10. Casos de Teste Previstos

### Unitários

**LabelService**
- createLabel: nome válido, inválido, duplicado, cor inválida
- updateLabel: nome/cor atualizados, UNIQUE mantido
- deleteLabel: deletado, cascata card_labels
- applyLabel: aplicado, duplicação rejeitada
- removeLabel: removido, continua em outros cartões

**Validação**
- HEX color validation: #FF0000 válido, "red" inválido, "FF000" inválido
- Name validation: 1-50 chars, vazio rejeitado, trimmed

### Integração

- Criar label → aplicar a cartão → filtrar por label → resultados corretos
- Editar label → cores atualizam em todos os cartões
- Deletar label → remove de cartões, filtro limpa se ativo

### E2E

- Admin cria 3 labels → editor aplica a cartões → viewer filtra por combinação

---

## 11. Pseudo-código Key Methods

```
LabelService.createLabel(boardId, name, color, userId):
  1. Validate userId is admin/editor
  2. Validate name: 1-50 chars, non-empty
  3. Validate color: HEX format #RRGGBB
  4. SELECT FROM labels WHERE board_id=X AND name=Y
  5. If exists: Error 409 Conflict
  6. INSERT labels(board_id, name, color)
  7. Notify clients (WebSocket)
  8. Return label

LabelService.deleteLabel(boardId, labelId, userId):
  1. Validate userId is admin/editor
  2. SELECT FROM labels WHERE id=X AND board_id=Y
  3. If not found: Error 404
  4. DELETE labels (cascata removes card_labels)
  5. Notify clients (WebSocket)
  6. Return success

LabelService.applyLabel(boardId, cardId, labelId, userId):
  1. Validate userId is admin/editor
  2. Validate card belongs to board
  3. Validate label belongs to board
  4. SELECT FROM card_labels WHERE card_id=X AND label_id=Y
  5. If exists: Error 400 (already applied)
  6. INSERT card_labels
  7. Notify clients (WebSocket)
  8. Return cardLabel

Frontend: filterCards(cards, selectedLabelIds):
  1. If selectedLabelIds.length === 0: return all cards
  2. Return cards.filter(card =>
       card.labels.some(label => selectedLabelIds.includes(label.id))
     )
  3. (OR logic: any label matches)
```

---

## Conclusão

**Implementação Focada**: RF08 adiciona 2 novas entities (Label, CardLabel), 2 repositories, 1 service, 6+ endpoints, 5 componentes frontend, 5 hooks.

**Stack Completo**: Reutiliza PostgreSQL + TypeORM + Express + Next.js, nenhuma dependência nova.

**Cascata Automática**: Deletar label remove associações via FK ON DELETE CASCADE.

**Permissões**: Editor+ gerencia labels, Viewer filtra apenas.

**Real-time**: WebSocket opcional, polling fallback suficiente para MVP.

**Performance**: Índices em board_id, card_id para queries rápidas.

**Escalabilidade**: Stateless, queries otimizadas, cascata DB-level.

