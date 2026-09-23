# RF05: Plano Técnico - Cascata de Exclusão de Listas com Cartões

## 1. Stack Tecnológico

Mesmo stack RF01/RF02/RF03/RF04, sem novas dependências:

### Backend
- **ORM**: TypeORM (Entity relationships, FK ON DELETE CASCADE)
- **Banco**: PostgreSQL (transações, integridade referencial)
- **Validação**: Zod ou class-validator
- **Framework**: Express.js

### Frontend
- **Framework**: Next.js 16 (App Router)
- **HTTP**: Fetch API com credentials
- **UI**: Tailwind CSS
- **State**: React local state + refetch

---

## 2. Arquitetura de Componentes

### Backend (Mínimas Mudanças)

#### 2.1 Entity (Sem Mudanças)
- **Card** entity: já tem `list_id` FK com `ON DELETE CASCADE`
- **Column** entity: já existente

#### 2.2 Repository (Sem Mudanças)
- **CardRepository**: já tem `countByList(listId)` (RF04)
- **ColumnRepository**: não precisa mudança
  - Delete já usa FK CASCADE automático

#### 2.3 Service (Sem Mudanças Significativas)
- **ColumnService.deleteColumn**: já implementado (RF03)
  - Já valida: não deletar última lista
  - Já reajusta positions
  - FK CASCADE remove cards automaticamente
  
**Mudança Mínima**: Antes de deletar, chamar `cardRepository.countByList(columnId)` para saber quantos cards existem (para mensagem frontend)

#### 2.4 Routes (Sem Mudanças)
- **DELETE /api/boards/:boardId/columns/:columnId**: já existe (RF03)
- Response 204: sem mudança
- Validações: já cobertas

#### 2.5 Middleware (Sem Mudanças)
- **requireAuth**: existente
- **validateBoardAccess**: existente

### Frontend (Mudanças Pontuais)

#### 2.6 Componentes

**ColumnList.tsx** (modificado):
- Já tem botão delete + dialog
- Mudança: antes de exibir dialog, chamar `cardRepository.countByList(columnId)` via backend

**ColumnHeader.tsx** (sem mudanças)
- Já tem botão delete

**DeleteColumnConfirmation.tsx** (modificado ou novo):
- Existente: simples "Tem certeza?"
- Mudança: adicionar quantidade de cards se > 0
- Mensagem: "Todos os N cartões nesta lista também serão deletados"
- Se 0 cards: "Tem certeza? Esta ação é irreversível." (sem menção cards)

#### 2.7 Hooks (Nova ou modificada)

**useDeleteColumn** (já existe em RF03):
- Retorna: deleteColumn(columnId), loading, error
- Mudança: antes de chamar DELETE, buscar card count via GET /api/boards/:boardId/columns/:columnId/cards-count (novo endpoint v2)

Alternativa (mais simples):
- Não cria novo endpoint
- Frontend já tem lista de cards via CardList
- Contar cards no estado React antes de confirmar

#### 2.8 Página

**/boards/[id]/page.tsx** (sem mudanças necessárias):
- Já renderiza ColumnList
- ColumnList já tem delete dialog

---

## 3. Modelos de Dados

### Schema: Sem Mudanças

```sql
-- Existente
CREATE TABLE columns (
  id UUID PRIMARY KEY,
  board_id UUID NOT NULL FOREIGN KEY (boards.id),
  name VARCHAR(100) NOT NULL,
  position INT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(board_id, name)
);

-- Existente
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  list_id UUID NOT NULL FOREIGN KEY (columns.id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(5000) NULL,
  position INT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX (list_id, position)
);
```

**Chave para RF05**: `ON DELETE CASCADE` já está em Card.list_id FK
- Quando coluna é deletada, PostgreSQL automaticamente deleta todos os cards com aquele list_id
- Não precisa lógica adicional no backend

---

## 4. Interfaces de API

### Opção A: Reusar Endpoint Existente (Recomendado)

#### DELETE /api/boards/:boardId/columns/:columnId
**Request**: (vazio, apenas headers com auth)

**Backend**:
1. Validar autenticação + autorização (existente)
2. Buscar coluna (existente)
3. Contar cards naquela coluna: `cardRepository.countByList(columnId)`
4. Retornar 200 OK com { cardCount: N } **ANTES de deletar**

```json
{
  "columnId": "uuid",
  "cardCount": 5
}
```

5. Frontend exibe confirmação com a mensagem
6. Se usuário confirma, executa DELETE de verdade (segunda chamada ou form submit)

**Alternativa**: Tudo em uma chamada, retornar card count já na resposta antes do delete

#### OU Opção B: Novo Endpoint (v2 mais limpo)

```http
GET /api/boards/:boardId/columns/:columnId/cards-count
```

Response:
```json
{ "cardCount": 5, "columnName": "To Do" }
```

Usado pelo frontend para mostrar confirmação.

### Respostas

#### Delete Bem-Sucedido
- 204 No Content
- Nenhum body
- Database: coluna + todos seus cards deletados (transação FK CASCADE)

#### Erro: Última Lista
- 400 Bad Request
- Mensagem: "Quadro deve ter pelo menos uma lista"
- Existente (RF03)

#### Erro: Não Autorizado
- 403 Forbidden
- Mensagem: "Você não tem permissão"
- Existente (RF03)

#### Erro: Não Autenticado
- 401 Unauthorized
- Existente (RF03)

#### Erro: Lista não Existe
- 404 Not Found
- Existente (RF03)

---

## 5. Fluxos de Integração

### Fluxo 1: Deletar Lista Vazia

```
Frontend: Usuário clica "Deletar" em lista (CardCount conhecida = 0)
  ↓
Dialog: "Tem certeza? Esta ação é irreversível."
[sem menção a cards pois não há]
  ↓
Usuário clica "Confirmar Exclusão"
  ↓
Frontend: DELETE /api/boards/:boardId/columns/:columnId
  ↓
Backend: validateBoardAccess + countByBoard
  ↓
Backend: ColumnService.deleteColumn (já faz tudo)
  - FK CASCADE não afeta nada (0 cards)
  - Reajusta positions de listas restantes
  ↓
Response: 204 No Content
  ↓
Frontend: ColumnList refetch, lista desaparece
```

### Fluxo 2: Deletar Lista com Cartões

```
Frontend: Usuário clica "Deletar" em lista (CardCount = 5)
  ↓
GET /api/boards/:boardId/columns/:columnId/cards-count
↓ (ou count local em React)
Response: { cardCount: 5 }
  ↓
Dialog exibido:
"Tem certeza? Esta ação é irreversível.
Todos os 5 cartões nesta lista também serão deletados."
  ↓
Usuário clica "Confirmar Exclusão"
  ↓
Frontend: DELETE /api/boards/:boardId/columns/:columnId
  ↓
Backend: ColumnService.deleteColumn
  - Delete coluna
  - FK CASCADE automático: DELETE cards WHERE list_id = columnId
  - Reajusta positions listas restantes
  ↓
Response: 204 No Content
  ↓
Frontend: ColumnList refetch
  - Lista desaparece
  - Todos 5 cards desaparecem
  - Outras listas reordenadas
```

### Fluxo 3: Cancelar Exclusão

```
Frontend: Usuário clica "Deletar"
  ↓
Dialog exibido (com ou sem menção cards)
  ↓
Usuário clica "Cancelar"
  ↓
Dialog fechado, nenhuma requisição backend
  ↓
Lista e cards permanecem
```

---

## 6. Requisitos Não-Funcionais

### Segurança

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Autenticação | requireAuth middleware (existente) | Sem mudança |
| Autorização | validateBoardAccess + user_id === board.user_id | Existente RF03 |
| SQL Injection | TypeORM parameterized queries | FK CASCADE DB-level |
| CORS | Já configurado RF01 | Sem mudança |

### Performance

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Card count query | `SELECT COUNT(*) WHERE list_id = X` | 1 query, indexed |
| Delete eficiência | FK CASCADE + transação | Atomic, O(N) cards |
| Reajuste positions | updatePositions loop (existente) | Batch update |
| N+1 prevention | Single count query | Sem múltiplas queries |
| Índices | (list_id) em cards | Existente RF04 |

### Escalabilidade

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Stateless | Cada request valida ownership | Sem estado |
| Transação | DELETE cards + DELETE column | Atômico (tudo ou nada) |
| Cascata DB-level | FK ON DELETE CASCADE | Não application-level |
| Reusabilidade | ColumnService.deleteColumn reutilizado | Sem duplicação |

### Confiabilidade

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Atomicidade | Transação DB (FK CASCADE) | Tudo ou nada |
| Consistência | FK referential integrity | Cards não órfãos |
| Delete físico | DELETE, não UPDATE status | Permanent removal |
| Reajuste automático | Positions sem gaps | Existente |
| Error handling | 400/403/401/404 | Específicos por erro |
| Concorrência | Last-write-wins via transação | DB handles race conditions |

---

## 7. Restrições Implementação

1. **Cascata Obrigatória**: FK ON DELETE CASCADE (não application logic)
2. **Delete Físico**: DELETE, não soft-delete (para cascata funcionar)
3. **Confirmação Explícita**: Dialog obrigatório antes de DELETE HTTP
4. **Mensagem Específica**: "Todos os N cartões" (com N real)
5. **Atomicidade**: Lista + cartões deletados em transação (tudo/nada)
6. **Reajuste Automático**: Positions sem gaps em listas restantes
7. **Contagem Real**: Mostrar número real de cartões que serão afetados
8. **Sem Undo**: Nenhuma recuperação automática (v2: soft-delete)
9. **Sem Cascata Reversa**: Deletar cartão não afeta lista
10. **Isolamento de Usuário**: Apenas dono do quadro pode deletar
11. **Validação Prévia**: Não permitir deletar última lista (existente)
12. **Sem Limite de Cards**: Funciona com 0, 1, 100+ cartões

---

## 8. Mudanças Específicas no Código

### Backend (Mínimas)

#### ColumnService.deleteColumn (RF03 - Expandir)

Adicionar antes do delete:
```typescript
const cardCount = await this.cardRepository.countByList(columnId);
// Guardar para logging/auditoria (v2)
```

Nada muda na lógica:
- FK CASCADE remove cards automaticamente
- Reajuste de positions já existe
- Validações já existem (não deletar última lista)

### Frontend (Pontuais)

#### Opção 1: Contar No Frontend (Simples)

Em `ColumnList.tsx`:
```typescript
// Já tem lista de cards renderizada
// Ao clicar delete:
const cardCount = cardsList.length;
// Mostrar confirmação com cardCount
```

Vantagem: 0 mudanças no backend
Desvantagem: Precisa manter lista de cards em estado

#### Opção 2: Contar No Backend (Cleaner)

Modificar `ColumnHeader.tsx` ou adicionar método em `useDeleteColumn`:
```typescript
// Antes de confirmar, GET card count
const cardCount = await fetchCardCount(columnId);
// Exibir confirmação com count
```

Vantagem: Sempre sincronizado
Desvantagem: 1 query adicional

### Componente DeleteConfirmation

Modificar confirmação existente para:
- Se cardCount === 0: "Tem certeza? Esta ação é irreversível."
- Se cardCount > 0: "Tem certeza? Esta ação é irreversível. **Todos os N cartões nesta lista também serão deletados.**"

---

## 9. Dependências Entre RFs

### RF05 ← RF03 (Listas)
- Usa `ColumnService.deleteColumn` (já implementado)
- Depende de reajuste de positions (já implementado)
- FK em Column.board_id

### RF05 ← RF04 (Cartões)
- **Crítica**: Card.list_id FK com `ON DELETE CASCADE`
- Depende de `CardRepository.countByList`
- Delete cascata remove todos cards da lista

### RF05 ← RF02 (Quadros)
- Validação ownership via board (existente)

### RF05 ← RF01 (Autenticação)
- Autenticação obrigatória (existente)

---

## 10. Casos de Teste Previstos

### Unitários
- countByList retorna número correto
- deleteColumn reajusta positions
- Nenhuma lógica nova (tudo existente)

### Integração
- DELETE endpoint retorna 204
- Cards desaparecem da DB (FK CASCADE)
- Positions reajustadas
- Outras listas preservadas

### E2E
- Dialog exibe quantidade correta de cards
- Confirmação deleta lista + cards
- Cancelação não deleta nada
- Frontend refetch mostra estado novo

---

## 11. Pseudo-código Key Methods

Nenhum novo método necessário. Fluxo reutiliza existentes:

```
deleteColumn(columnId, boardId, userId):
  1. Validate userId owns board
  2. Get cardCount = countByList(columnId)
  3. [Log para auditoria: "User X deletou lista Y com Z cards"]
  4. ColumnService.deleteColumn(columnId, boardId, userId) [existente]
     - Checks: não última lista
     - DELETE columns WHERE id = columnId
     - [FK CASCADE: DELETE cards WHERE list_id = columnId]
     - Reajusta positions
  5. Return { cardCount, success: true }
```

Frontend:
```
handleDelete(columnId):
  1. Fetch cardCount
  2. Show dialog com count
  3. If user confirms: DELETE /api/.../columns/:columnId
  4. Refetch ColumnList
  5. Update visual
```

---

## Conclusão

**Implementação Simples**: RF05 é primarily um frontend concern (confirmação melhorada) + leveraging existing infrastructure (FK CASCADE, reajuste positions, delete endpoint).

**Nenhum novo endpoint** necessário (pode reusar existente ou adicionar card-count GET para v2).

**Nenhuma mudança** em logica de backend delete (já é cascata via FK).

**Mudanças Mínimas**:
- Dialog exibe quantidade de cards
- Reuse ColumnService.deleteColumn (RF03)
- Frontend refetch após delete

