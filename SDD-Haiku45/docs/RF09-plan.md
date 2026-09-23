# RF09: Plano Técnico - Comentários em Cards com Histórico

## 1. Stack Tecnológico

Mesmo stack RF01-RF08, sem novas dependências:

### Backend
- **ORM**: TypeORM (FK constraints, cascata automática, timestamps)
- **Banco**: PostgreSQL (UNIQUE constraints, índices, text search opcional)
- **Validação**: Class-validator (string length, non-empty)
- **Framework**: Express.js
- **Real-time**: Polling (refetch) ou WebSocket opcional para sincronização

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

**Comment Entity**
```
- id: UUID (PK)
- card_id: UUID (FK → Card, ON DELETE CASCADE)
- user_id: UUID (FK → User)
- content: TEXT ou VARCHAR 1000 (não-nulo)
- created_at: Timestamp (imutável)
- updated_at: Timestamp (muda na edição)
- edited_at: Timestamp nullable (null se nunca editado)

Constraints:
- created_at ≤ updated_at (lógico)
- edited_at ≥ updated_at ou null (lógico)
- content length 1-1000 caracteres (validação DB + app)
```

#### 2.2 Repositories (Novas)

**CommentRepository**
- `insert(comment)`: Criar comentário
- `findByCardId(cardId)`: GET comentários do cartão (ordenado por created_at ASC)
- `findById(commentId, cardId)`: GET comentário específico
- `update(commentId, cardId, data)`: Atualizar conteúdo + edited_at
- `delete(commentId, cardId)`: Deletar comentário
- `countByCardId(cardId)`: Contar comentários de um cartão
- `deleteByCardId(cardId)`: Remover todos quando cartão deletado (cascata helper)

#### 2.3 Services (Novas)

**CommentService**
- `createComment(cardId, content, userId)`: Criar comentário
  - Validação: user_id é membro ativo do board (status ACTIVE)
  - Validação: content não-vazio, ≤1000 chars
  - Validação: cartão existe e pertence ao board
  - INSERT Comment (created_at = updated_at = now, edited_at = null)
  - Retorna comentário criado

- `updateComment(commentId, cardId, content, userId)`: Editar comentário
  - Validação: user_id é autor do comentário
  - Validação: content não-vazio, ≤1000 chars
  - UPDATE Comment (updated_at = now, edited_at = now)
  - created_at não muda
  - Retorna comentário atualizado

- `deleteComment(commentId, cardId, userId)`: Deletar comentário
  - Validação: user_id é autor OU admin/editor do board
  - DELETE Comment
  - Retorna sucesso

- `getCommentsOfCard(cardId)`: GET comentários do cartão
  - SELECT Comment JOIN User (para author_name)
  - ORDER BY created_at ASC (cronológico)
  - Retorna array com { id, author_name, content, created_at, updated_at, edited_at }

- `getCommentById(commentId, cardId)`: GET comentário específico
  - Retorna comentário ou null

- `getCommentCount(cardId)`: Contar comentários
  - Retorna número inteiro

#### 2.4 Routes (Novas)

```http
-- Comentários (Membro Ativo)
POST   /api/boards/:boardId/cards/:cardId/comments
GET    /api/cards/:cardId/comments
PUT    /api/boards/:boardId/cards/:cardId/comments/:commentId
DELETE /api/boards/:boardId/cards/:cardId/comments/:commentId

-- Meta
GET    /api/cards/:cardId/comments/count (opcional)
```

#### 2.5 Middleware (Existente, usado)

- **requireAuth**: Valida se autenticado
- **requireMemberActive**: Valida se membro ativo do board (novo middleware)
- **requireRole(['admin', 'editor'])**: Para deletar comentário de outro (novo uso)
- Viewer consegue criar, mas não editar/deletar alheios

#### 2.6 Validação

- **Content Validation**: Trim, length 1-1000, não-vazio, XSS escape (React ou DOMPurify)
- **Author Validation**: Apenas autor pode editar
- **Role Validation**: Admin/Editor pode deletar qualquer, viewer não
- **Card Existence**: Cartão deve existir e pertencer ao board
- **Member Status**: Apenas ACTIVE podem comentar

### Frontend (Novos Componentes)

#### 2.7 Componentes Novos

**CommentSection.tsx** (Container)
- Renderiza lista de comentários + formulário
- Props: cardId, boardId
- Estados: comments[], loading, error, isEditing
- Conditional render: se viewer, hide edit/delete buttons

**CommentItem.tsx**
- Renderiza um comentário individual
- Props: comment, isAuthor, canDeleteOther, onEdit, onDelete
- Exibe: author, timestamp, "editado em X", conteúdo
- Botões: Edit (se autor), Delete (se autor ou admin/editor)

**CommentForm.tsx**
- Formulário para adicionar comentário
- Props: cardId, boardId, onSuccess (refetch)
- Campo: textarea com 1000 char limit
- Botões: Enviar, Cancelar
- Estados: content, loading, error

**CommentEditForm.tsx** (Modal ou inline)
- Editar comentário existente
- Props: comment, onSave, onCancel
- Campo: textarea pre-filled com conteúdo
- Validações: mesmas de create
- Estados: content, loading, error

**CommentList.tsx**
- Lista de comentários renderizados
- Props: comments, isLoading
- Ordenação: created_at ASC (mais antigo acima)
- Estado vazio: "Nenhum comentário ainda"

#### 2.8 Hooks (Novos)

**useComments(cardId)**
- GET /api/cards/:cardId/comments
- Retorna: { comments, loading, error, refetch }
- useEffect: fetch ao montar

**useCommentManagement(cardId, boardId)**
- CREATE, UPDATE, DELETE comments
- Retorna: { createComment, updateComment, deleteComment, loading, error }
- Dispara refetch em useComments após mudança

**useCommentForm(cardId, boardId)**
- Helper para formulário
- Retorna: { content, setContent, submit, loading, error, clearError }

#### 2.9 Páginas (Modificadas)

**/boards/[id]/cards/[cardId]** (Existente ou CardEditModal)
- Adicionar <CommentSection cardId={cardId} boardId={boardId} />
- Posicionar: abaixo de descrição, acima de assignees (ou em tab)

---

## 3. Modelos de Dados

### Schema: Nova Tabela

```sql
-- Comentários em cartões
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP NULL
);

-- Índices
CREATE INDEX idx_comments_card_id ON comments(card_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
```

### Modificações em Tabelas Existentes

**cards table**
- Sem mudanças obrigatórias
- Opcionalmente: ADD comment_count INT DEFAULT 0 (cache)

**No updates necessários para boards, users, lists**

---

## 4. Interfaces de API

### Criar Comentário

```http
POST /api/boards/:boardId/cards/:cardId/comments
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "content": "Isso está pronto para deploy!"
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "card_id": "uuid",
  "user_id": "uuid",
  "author_name": "João Silva",
  "content": "Isso está pronto para deploy!",
  "created_at": "2026-09-15T10:30:00Z",
  "updated_at": "2026-09-15T10:30:00Z",
  "edited_at": null
}
```

### Listar Comentários do Cartão

```http
GET /api/cards/:cardId/comments
```

**Response: 200 OK**
```json
{
  "comments": [
    {
      "id": "uuid",
      "author_name": "João",
      "content": "Implementar Login",
      "created_at": "2026-09-15T10:00:00Z",
      "updated_at": "2026-09-15T10:00:00Z",
      "edited_at": null
    },
    {
      "id": "uuid",
      "author_name": "Maria",
      "content": "Concordo",
      "created_at": "2026-09-15T10:05:00Z",
      "updated_at": "2026-09-15T10:05:00Z",
      "edited_at": null
    },
    {
      "id": "uuid",
      "author_name": "João",
      "content": "Implementar Login OAuth",
      "created_at": "2026-09-15T10:00:00Z",
      "updated_at": "2026-09-15T10:10:00Z",
      "edited_at": "2026-09-15T10:10:00Z"
    }
  ],
  "total": 3
}
```

### Editar Comentário

```http
PUT /api/boards/:boardId/cards/:cardId/comments/:commentId
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "content": "Implementar Login OAuth2"
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "content": "Implementar Login OAuth2",
  "updated_at": "2026-09-15T10:11:00Z",
  "edited_at": "2026-09-15T10:11:00Z"
}
```

### Deletar Comentário

```http
DELETE /api/boards/:boardId/cards/:cardId/comments/:commentId
Authorization: Bearer <token>
```

**Response: 204 No Content**

### Erros

- 400 Bad Request: content vazio, >1000 chars
- 401 Unauthorized: não autenticado
- 403 Forbidden: não é autor (edit), ou viewer tentando deletar alheio
- 404 Not Found: comment/card não existe
- 409 Conflict: (raro, salvo concorrência extrema)

---

## 5. Fluxos de Integração

### Fluxo 1: Criar Comentário

```
Frontend: Membro digita em CommentForm
  ↓
Clica "Enviar"
  ↓
Frontend: POST /api/boards/:boardId/cards/:cardId/comments
  Body: { content: "Implementar autenticação" }
  ↓
Backend: CommentService.createComment
  - Validação: user_id é membro ativo
  - Validação: content 1-1000 chars
  - INSERT Comment (created_at = updated_at = now, edited_at = null)
  ↓
Response: 201 Created
  ↓
Frontend: useCommentManagement dispara refetch
  - useComments chama GET /api/cards/:cardId/comments
  ↓
CommentSection renderiza nova lista com novo comentário
  ↓
Outros usuários veem comentário ao refrescar ou via polling
```

### Fluxo 2: Editar Comentário

```
Frontend: Autor vê seu comentário, clica "Editar"
  ↓
CommentEditForm abre com conteúdo pre-filled
  ↓
Modifica texto, clica "Salvar"
  ↓
Frontend: PUT /api/boards/:boardId/cards/:cardId/comments/:commentId
  Body: { content: "Novo conteúdo" }
  ↓
Backend: CommentService.updateComment
  - Validação: user_id === comment.user_id
  - Validação: content 1-1000 chars
  - UPDATE Comment (updated_at = now, edited_at = now)
  - created_at não muda
  ↓
Response: 200 OK
  ↓
Frontend: refetch comentários
  ↓
CommentItem renderiza conteúdo novo + "editado em HH:MM"
  ↓
Outros veem atualização ao refrescar
```

### Fluxo 3: Deletar Comentário

```
Frontend: Autor ou Admin/Editor clica "Deletar"
  ↓
Confirmação: "Deletar comentário?"
  ↓
Clica "Confirmar"
  ↓
Frontend: DELETE /api/boards/:boardId/cards/:cardId/comments/:commentId
  ↓
Backend: CommentService.deleteComment
  - Validação: user_id === author OR role in [ADMIN, EDITOR]
  - DELETE Comment
  - Cascata FK automática (se cartão deletado)
  ↓
Response: 204 No Content
  ↓
Frontend: refetch comentários
  ↓
CommentList renderiza sem o comentário deletado
  ↓
Contador atualizado (3 → 2)
```

### Fluxo 4: Visualizar Histórico Longo

```
Frontend: Membro abre cartão com 100+ comentários
  ↓
GET /api/cards/:cardId/comments (sem pagination ou com limit=50)
  ↓
CommentList renderiza primeiros 50
  ↓
Botão "Carregar mais" ou scroll infinito dispara próxima busca
  ↓
(Ou: limit+offset implementado)
  ↓
Todos os comentários aparecem (não há limite hard)
```

---

## 6. Requisitos Não-Funcionais

### Segurança

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Autenticação | requireAuth middleware | Sem mudança |
| Autorização | requireMemberActive + role checks | RBAC por autor/admin |
| Validação | Content length, non-empty, trim | Frontend + backend |
| SQL Injection | TypeORM parameterized queries | Seguro |
| XSS | React escaped rendering, DOMPurify opcional | HTML tags escapadas |
| CSRF | Express CSRF token (se aplicável) | Padrão framework |

**Resultado**: ✅ 6/6 Requisitos

### Performance

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Get comments | SELECT indexed by card_id, ORDER BY created_at | Índice essencial |
| Create comment | INSERT 1 row (created_at = updated_at = now) | Rápido |
| Edit comment | UPDATE set updated_at, edited_at = now | Rápido |
| Delete comment | DELETE (FK cascata automática) | Rápido |
| Count comments | SELECT COUNT com índice | Rápido |

**Resultado**: ✅ 5/5 Requisitos

### Escalabilidade

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Stateless | Sem sessão, validação per-request | Escalável |
| Índices | card_id, user_id, created_at | Query optimization |
| Cascata DB | FK ON DELETE CASCADE automático | DB-level |
| Real-time | Polling via refetch (WebSocket optional) | Eventual consistency |
| Large histories | Sem limite hard, paginação opcional | Suporta 100+ comentários |

**Resultado**: ✅ 5/5 Requisitos

### Confiabilidade

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Atomicidade | DB constraints + FK cascata | Garantido |
| Consistência | created_at ≤ updated_at ≤ edited_at | Lógica validada |
| Error handling | 400/401/403/404 específicos | Clara |
| Sync | Eventual consistency com polling | Aceitável MVP |

**Resultado**: ✅ 4/4 Requisitos

---

## 7. Restrições Implementação

1. **Content Obrigatório**: 1-1000 caracteres, não-vazio
2. **Created_at Imutável**: Não pode ser alterado após criação
3. **Edited_at Nullable**: Null se nunca editado, atualiza com UPDATE
4. **Membro Ativo**: Apenas status ACTIVE conseguem comentar
5. **Edit Próprio**: Apenas autor pode editar seu comentário
6. **Delete por Autor ou Admin**: Autor sempre pode deletar; admin/editor pode deletar qualquer
7. **Viewer Pode Criar**: Viewers conseguem comentar (criar)
8. **Cascata Automática**: Deletar cartão remove comentários via FK
9. **Sem Histórico de Versões**: Apenas última versão visível (não "ver edições anteriores")
10. **Sincronização Eventual**: Polling fallback, WebSocket optional

---

## 8. Mudanças Específicas no Código

### Backend

#### Novos Arquivos
- `src/entities/Comment.ts`
- `src/repositories/CommentRepository.ts`
- `src/services/CommentService.ts`
- `src/routes/comments.ts`

#### Modificados
- `src/main.ts`: Registrar rotas /comments
- `src/middlewares/index.ts`: Adicionar requireMemberActive se não existir
- `src/types/errors.ts`: Já tem ValidationError, ForbiddenError, etc

#### Dependências
- Nenhuma nova

### Frontend

#### Novos Arquivos
- `src/components/CommentSection.tsx`
- `src/components/CommentItem.tsx`
- `src/components/CommentForm.tsx`
- `src/components/CommentEditForm.tsx`
- `src/components/CommentList.tsx`
- `src/hooks/useComments.ts`
- `src/hooks/useCommentManagement.ts`
- `src/hooks/useCommentForm.ts`

#### Modificados
- `src/app/boards/[id]/cards/[cardId]/page.tsx`: Integrar CommentSection
- Ou: `src/components/CardEditModal.tsx`: Adicionar CommentSection tab

#### Dependências
- Nenhuma nova

---

## 9. Dependências Entre RFs

### RF09 ← RF01 (Autenticação)
- Auth obrigatória para comentar

### RF09 ← RF02 (Quadros)
- Cartão pertence a um quadro

### RF09 ← RF04 (Cartões)
- Comentário pertence a um cartão

### RF09 ← RF07 (Membros)
- Valida role de quem comenta (admin, editor, viewer)
- Status ACTIVE necessário

### RF09 ← RF05 (Cascade Delete)
- Deletar cartão remove comentários (cascata FK)

---

## 10. Casos de Teste Previstos

### Unitários

**CommentService**
- createComment: content válido, vazio, muito longo, user não-ativo
- updateComment: content válido, não-autor, não-existente
- deleteComment: autor, admin, viewer, não-existente
- getCommentsOfCard: ordem cronológica, count correto

**Validação**
- Content 1-1000 chars, trim whitespace, não-vazio
- XSS: HTML tags escapadas

### Integração

- Criar comentário → GET lista → comentário aparece
- Editar comentário → "editado em X" aparece
- Deletar comentário → desaparece da lista
- Viewer consegue criar, não consegue editar/deletar alheios
- Admin consegue deletar qualquer

### E2E

- Membro cria comentário → outro membro vê ao refrescar
- Edição sincronizada entre usuários
- Deleção sincronizada entre usuários
- 100+ comentários carregam sem travamento

---

## 11. Pseudo-código Key Methods

```
CommentService.createComment(cardId, content, userId):
  1. Validate userId is member ACTIVE of board
  2. Validate content: 1-1000 chars, non-empty
  3. Validate card exists and belongs to board
  4. content = trim(content)
  5. INSERT Comment(card_id, user_id, content, created_at=now, updated_at=now, edited_at=null)
  6. Notify clients (refetch)
  7. Return comment

CommentService.updateComment(commentId, cardId, content, userId):
  1. SELECT Comment WHERE id=X AND card_id=Y
  2. If not found: Error 404
  3. If comment.user_id != userId: Error 403
  4. Validate content: 1-1000 chars, non-empty
  5. content = trim(content)
  6. UPDATE Comment SET content=X, updated_at=now, edited_at=now
  7. Notify clients (refetch)
  8. Return comment

CommentService.deleteComment(commentId, cardId, userId):
  1. SELECT Comment WHERE id=X AND card_id=Y
  2. If not found: Error 404
  3. If comment.user_id != userId AND userRole != ADMIN/EDITOR: Error 403
  4. DELETE Comment (cascata removes if card deleted)
  5. Notify clients (refetch)
  6. Return success

Frontend: renderComments(comments):
  1. If comments.length === 0: Show "Nenhum comentário ainda"
  2. For each comment in order (created_at ASC):
     - Render author, created_at
     - If edited_at: Render "editado em HH:MM"
     - Render content (escaped)
     - If isAuthor: Render Edit + Delete buttons
     - If admin/editor: Render Delete button
  3. Show total count
```

---

## 12. Considerações Arquiteturais

### Choice: Flat Comments (not threaded)
- **Pro**: Simples, rápido de implementar, menos DB queries
- **Con**: Sem respostas aninhadas (v2 feature)
- **Decision**: Flat é correto para MVP

### Choice: Polling vs WebSocket
- **Polling**: Simples, refetch on user action + periodic (5-10s)
- **WebSocket**: Real-time, mais complexo
- **Decision**: Polling para MVP, WebSocket v2

### Choice: Content Storage
- TEXT vs VARCHAR(1000)?
- **VARCHAR(1000)**: Limite explícito, mais rápido
- **TEXT**: Sem limite (mas validar app)
- **Decision**: VARCHAR(1000) com validação

### Choice: edited_at vs Version History
- **edited_at only**: Simples, apenas mostra "editado em X"
- **Version history**: Complexo, "ver edições anteriores"
- **Decision**: edited_at only para MVP, v2 para histórico

---

## Conclusão

**Implementação Focada**: RF09 adiciona 1 entity (Comment), 1 repository, 1 service, 4 endpoints, 5 componentes frontend, 3 hooks.

**Stack Completo**: Reutiliza PostgreSQL + TypeORM + Express + Next.js, nenhuma dependência nova.

**Cascata Automática**: Deletar cartão remove comentários via FK ON DELETE CASCADE.

**Permissões**: RBAC clara (autor edita, admin deleta qualquer, viewer cria).

**Sincronização**: Polling implementado, WebSocket optional v2.

**Performance**: Índices em card_id, created_at para queries rápidas.

**Escalabilidade**: Stateless, queries otimizadas, sem limite hard de comentários.
