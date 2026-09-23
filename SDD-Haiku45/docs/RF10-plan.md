# RF10: Plano Técnico - Prazos em Cartões (Due Dates)

## 1. Stack Tecnológico

Mesmo stack RF01-RF09, sem novas dependências:

### Backend
- **ORM**: TypeORM (Entity relationships, DATE column type, FK constraints)
- **Banco**: PostgreSQL (DATE type, indexes for performance, FK ON DELETE CASCADE)
- **Validação**: Class-validator (date format, not-null)
- **Framework**: Express.js

### Frontend
- **Framework**: Next.js 16 (App Router)
- **HTTP**: Fetch API com credentials
- **UI**: Tailwind CSS
- **State**: React local state + refetch
- **Date Picker**: HTML5 native `<input type="date">` (sem biblioteca externa)

---

## 2. Arquitetura de Componentes

### Backend (Novos Componentes Mínimos)

#### 2.1 Entities (Novas ou Modificadas)

**Card Entity (Modificada)**
```
- Adicionar: due_date: DATE | null (coluna nova, nullable)
- Relação: OneToMany NÃO necessária (due_date é valor primitivo, não entidade)
- Sem FK especial: armazena data direto, sem tabela separada
```

#### 2.2 Repositories (Novas)

**CardRepository (Estendido)**
- `findOverdueCards(boardId)`: WHERE due_date < CURRENT_DATE AND due_date IS NOT NULL
- `findDueSoonCards(boardId, days)`: WHERE due_date BETWEEN TODAY AND TODAY+days
- `findByDueFilter(boardId, filter)`: Route filter string para WHERE clause (overdue, due_today, next_7_days, next_30_days, no_due)
- `countByDueStatus(boardId)`: Retorna counts { overdue, due_today, next_7_days, next_30_days, no_due }
- `updateDueDate(cardId, listId, dueDate)`: UPDATE cards SET due_date = ?
- `removeDueDate(cardId, listId)`: UPDATE cards SET due_date = NULL

#### 2.3 Services (Novas)

**CardService (Estendido)**
- `setDueDate(boardId, cardId, listId, dueDate, userId)`: Definir prazo
  - Validação: user role admin/editor (viewer bloqueado)
  - Validação: dueDate formato YYYY-MM-DD
  - Validação: card existe no board
  - INSERT/UPDATE due_date
  - Retorna card atualizado
  
- `removeDueDate(boardId, cardId, listId, userId)`: Remover prazo
  - Validação: role admin/editor
  - UPDATE due_date = NULL
  - Retorna card atualizado
  
- `calculateDueStatus(dueDate)`: Função pura
  - Comparar dueDate com CURRENT_DATE (server time, UTC)
  - Retorna: "no_due" | "due_today" | "due_soon" | "overdue"
  - Sem I/O, sem transação

#### 2.4 Routes (Novas)

```http
-- Definir/editar prazo
PUT    /api/lists/:listId/cards/:cardId
       Body: { due_date: "2026-09-20" } (opcional)

-- Remover prazo
DELETE /api/lists/:listId/cards/:cardId/due-date

-- Listar cards filtrado por prazo
GET    /api/boards/:boardId/cards?filter=overdue|due_today|next_7_days|next_30_days|no_due
       Response: { cards: [...], filter, total, counts: {} }
```

#### 2.5 Middleware (Existente, usado)

- **requireAuth**: Validação
- **validateBoardAccess**: Validação ownership

#### 2.6 Validação

- **Due Date Format**: YYYY-MM-DD, validado via regex ou Date.parse()
- **Date Validation**: Permitir qualquer data (passado, futuro, hoje)
- **Role Validation**: Apenas admin/editor conseguem set/remove; viewer apenas lê
- **Card Existence**: Cartão deve existir e pertencer ao board

### Frontend (Novos Componentes)

#### 2.7 Componentes Novos

**DueDatePicker.tsx**
- Props: cardId, boardId, currentDueDate, onSave, onCancel
- `<input type="date">` com value pré-preenchido
- Botões: Salvar, Cancelar, Remover
- Validações: date format, não-vazio
- Estados: loading, error

**DueDateBadge.tsx**
- Props: dueDate (string "YYYY-MM-DD" ou null)
- Renderiza indicador visual:
  - Nada se dueDate = null
  - "Sem prazo" (cinza) se nenhum
  - "Vence em X dias" (verde) se futuro (>7 dias)
  - "Próximo vencer" (amarelo) se 0-7 dias futuro
  - "Vence hoje" (laranja)
  - "Atrasado desde X dias" (vermelho) se passado
- Tooltip: data completa (ex: "15 de setembro")

**DueDateFilter.tsx**
- Props: boardId, onFilterChange
- Botões/select: "Atrasados", "Vencendo hoje", "Próximos 7 dias", "Próximos 30 dias", "Sem prazo", "Todos"
- Exibe contador por filtro: "5 atrasados", "2 vencendo hoje"
- Retorna filter string selecionado

#### 2.8 Hooks (Novos)

**useDueDate(cardId, boardId)**
- GET /api/lists/:listId/cards/:cardId (retorna card com due_date)
- Retorna: { dueDate, status, loading, error, refetch }

**useDueDateManagement(cardId, listId, boardId)**
- `setDueDate(dueDate)`: PUT com { due_date }
- `removeDueDate()`: DELETE /due-date
- Ambos disparam refetch
- Retorna: { loading, error }

**useDueFilter(boardId)**
- GET /api/boards/:boardId/cards?filter=X
- Retorna: { cards, filter, counts, setFilter, loading }

#### 2.9 Páginas (Modificadas)

**/boards/[id]** (Board view)
- Adicionar <DueDateFilter boardId={boardId} onFilterChange={setFilter} />
- Filtrar cards exibidos baseado no filter selecionado

**/boards/[id]/cards/[cardId]** (CardEditModal ou detalhe)
- Adicionar <DueDatePicker> para set/edit/remove prazo
- Adicionar <DueDateBadge> para exibir status (abaixo do título)
- Integrar useDueDateManagement para CRUD

---

## 3. Modelos de Dados

### Schema: Modificação em Tabela Existente

```sql
-- Cards table modification
ALTER TABLE cards
ADD COLUMN due_date DATE NULL;

-- Índices
CREATE INDEX idx_cards_due_date ON cards(due_date);
CREATE INDEX idx_cards_board_due_date ON cards(board_id, due_date);
```

### Sem novas tabelas
- **Prazo é coluna da Card**, não entidade separada
- Simplifica schema, queries e cascata delete

### Constraints de Negócio
- `due_date` pode ser NULL (sem prazo)
- Sem constraint `NOT NULL` (prazo é opcional)
- Sem unique constraint (vários cards podem ter mesma due_date)

---

## 4. Interfaces de API

### Definir/Editar Prazo

```http
PUT /api/lists/:listId/cards/:cardId
Authorization: Bearer <token>
```

**Request Body** (parcial):
```json
{
  "due_date": "2026-09-20"
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "due_date": "2026-09-20",
  "updated_at": "2026-09-17T..."
}
```

### Remover Prazo

```http
DELETE /api/lists/:listId/cards/:cardId/due-date
Authorization: Bearer <token>
```

**Response: 204 No Content**

### Listar Cards por Filtro de Prazo

```http
GET /api/boards/:boardId/cards?filter=overdue
Authorization: Bearer <token>
```

**Response: 200 OK**
```json
{
  "cards": [
    { "id": "uuid", "title": "...", "due_date": "2026-09-15", ... }
  ],
  "filter": "overdue",
  "total": 5,
  "counts": {
    "overdue": 5,
    "due_today": 2,
    "next_7_days": 8,
    "next_30_days": 15,
    "no_due": 20
  }
}
```

### Erros

- 400 Bad Request: due_date formato inválido
- 403 Forbidden: viewer tentando set/edit/remove
- 404 Not Found: card não existe
- 401 Unauthorized: não autenticado

---

## 5. Fluxos de Integração

### Fluxo 1: Definir Prazo

```
Frontend: Usuário abre card, clica "Definir Prazo"
  ↓
Frontend: DueDatePicker renderiza com <input type="date">
  ↓
Usuário seleciona data (ex: 2026-09-20), clica "Salvar"
  ↓
Frontend: useDueDateManagement.setDueDate("2026-09-20")
  ↓
PUT /api/lists/:listId/cards/:cardId Body: { due_date: "2026-09-20" }
  ↓
Backend: CardService.setDueDate() valida role + formato + card
  ↓
Backend: CardRepository.updateDueDate(cardId, "2026-09-20")
  ↓
Response: 200 OK com card atualizado
  ↓
Frontend: refetch dispara, DueDateBadge recalcula status
  ↓
DueDateBadge renderiza "Vence em X dias" com cor apropriada
```

### Fluxo 2: Identificar Atrasado

```
Frontend: useEffect ou component mount
  ↓
Backend: calculateDueStatus("2026-09-15") vs TODAY
  ↓
Se dueDate < TODAY: retorna "overdue"
  ↓
DueDateBadge renderiza "Atrasado desde X dias" (vermelho)
  ↓
GET /api/boards/:boardId/cards?filter=overdue
  ↓
Backend: findByDueFilter retorna cards com due_date < TODAY
  ↓
Frontend: DueDateFilter mostra "5 atrasados"
```

### Fluxo 3: Remover Prazo

```
Frontend: Usuário clica "Remover Prazo"
  ↓
Frontend: useDueDateManagement.removeDueDate()
  ↓
DELETE /api/lists/:listId/cards/:cardId/due-date
  ↓
Backend: CardService.removeDueDate() valida role
  ↓
Backend: CardRepository.removeDueDate(cardId) → UPDATE due_date = NULL
  ↓
Response: 204 No Content
  ↓
Frontend: refetch, DueDateBadge desaparece (ou exibe "Sem prazo")
```

### Fluxo 4: Deletar Card com Prazo

```
Frontend: Usuário deleta card (via RF05)
  ↓
Backend: CardService.deleteCard(cardId)
  ↓
Backend: DELETE cards WHERE id = cardId
  ↓
PostgreSQL: FK ON DELETE CASCADE → due_date é deletado com card
  ↓
Card e seu prazo desaparecem atomicamente
```

---

## 6. Requisitos Não-Funcionais

### Segurança

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Autenticação | requireAuth middleware em rotas PUT/DELETE | Bearer token obrigatório |
| Autorização | CardService valida role admin/editor (viewer bloqueado) | 403 Forbidden se viewer |
| Input Validation | Date format YYYY-MM-DD, validado regex/Date.parse() | 400 Bad Request se inválido |
| SQL Injection | TypeORM parameterized queries | Seguro via ORM |
| CORS | Já configurado em RF01 | Sem mudanças |

**Resultado**: ✅ 5/5 Requisitos

### Performance

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Get cards by filter | SELECT indexed by (board_id, due_date), WHERE clause no DB | 1 query, O(log n) lookup |
| Update due_date | UPDATE 1 row, rápido | Índice board_id facilita |
| Calculate status | Função pura, sem DB call | O(1) comparação de datas |
| Render badge | Função pura, sem async | Instantâneo |
| Filter rendering | Fetch + render, eventual consistency | Aceitável (não real-time requerido) |

**Resultado**: ✅ 5/5 Requisitos

### Escalabilidade

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Stateless | Cada request valida de novo, sem sessão | Escalável com load balancer |
| Índices compostos | (board_id, due_date) para queries comuns | Suporta filtros rápidos |
| Sem N+1 | Eager load card com due_date (não separado) | 1 query, não múltiplas |
| Batch operations | Sem batch de prazos (prazo é per-card) | Escalável, O(1) per card |
| Limites | Sem limite de cards por board | Depende do DB |

**Resultado**: ✅ 5/5 Requisitos

### Confiabilidade

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Atomicidade | UPDATE transação DB | Tudo ou nada |
| Consistência | FK referential integrity | Card sem due_date impossível |
| Data Integrity | Validação antes de INSERT/UPDATE | Rejeta inválido antes de DB |
| Cascata delete | FK ON DELETE CASCADE automático | Não application logic |
| Date Immutability | created_at só leitura (não afeta prazo) | Sem drift de timestamp |

**Resultado**: ✅ 5/5 Requisitos

---

## 7. Restrições de Implementação

1. **Prazo Opcional**: Coluna nullable, sem NOT NULL constraint
2. **Não Entidade Separada**: due_date é coluna da Card, não tabela separada
3. **Um por Card**: Sem múltiplos prazos ou sub-prazos por card
4. **Formato Padrão**: YYYY-MM-DD (ISO 8601), sem hora específica (DATE type, não TIMESTAMP)
5. **Sem Timezone**: Assume UTC/server time, sem conversão por usuário
6. **Sem Recorrência**: Prazos não se repetem, sem regra de recorrência
7. **Sem Histórico**: Apenas last due_date visível, sem "ver edições anteriores"
8. **Sem Notificações**: Sem alertas automáticos (v2 feature)
9. **Stateless Calculation**: calculateDueStatus() recalcula on-demand, não denormalizado
10. **Role-Based**: Admin/Editor full access, Viewer read-only
11. **Cascata Automática**: FK ON DELETE CASCADE em PG, não app logic
12. **Sem Priorização Implícita**: Prazo não muda ordem dos cards (apenas cor/badge)

---

## 8. Mudanças Específicas no Código

### Backend

#### Novos Arquivos
- Nenhum (CardService, CardRepository já existem, apenas estendem)

#### Modificados
- `src/entities/Card.ts`: Adicionar coluna `due_date: Date | null`
- `src/repositories/CardRepository.ts`: Adicionar 6 novos métodos
- `src/services/CardService.ts`: Adicionar 3 novos métodos (setDueDate, removeDueDate, calculateDueStatus)
- `src/routes/cards.ts`: Modificar PUT para aceitar due_date; adicionar DELETE e GET filtrado
- `src/main.ts`: Sem mudanças (rotas já registradas como sub-paths de /api/lists)

#### Dependências
- Nenhuma nova

### Frontend

#### Novos Arquivos
- `src/components/DueDatePicker.tsx`
- `src/components/DueDateBadge.tsx`
- `src/components/DueDateFilter.tsx`
- `src/hooks/useDueDate.ts`
- `src/hooks/useDueDateManagement.ts`
- `src/hooks/useDueFilter.ts`

#### Modificados
- `src/components/CardEditModal.tsx`: Integrar DueDatePicker + DueDateBadge
- `src/app/boards/[id]/page.tsx` (ou lista): Integrar DueDateFilter
- `src/app/boards/[id]/cards/[cardId]/page.tsx`: Exibir DueDateBadge

#### Dependências
- Nenhuma nova

---

## 9. Dependências Entre RFs

### RF10 ← RF01 (Autenticação)
- Auth obrigatória para set/remove prazos

### RF10 ← RF02 (Quadros)
- Card pertence a um quadro, validação ownership

### RF10 ← RF04 (Cartões)
- Due date é propriedade do Card

### RF10 ← RF07 (Membros)
- Valida role de quem pode editar (admin, editor, viewer)

### RF10 ← RF05 (Cascade Delete)
- Deletar card remove due_date (FK ON DELETE CASCADE)

---

## 10. Casos de Teste Previstos

### Unitários

**CardService**
- setDueDate: content válido, formato inválido, user viewer rejeitado
- removeDueDate: remove com sucesso, viewer rejeitado
- calculateDueStatus: overdue, due_today, due_soon, no_due

**Validação**
- Date format YYYY-MM-DD, invalid date, empty, future date, past date

### Integração

- Definir prazo → GET card → due_date preenchido
- Editar prazo → calculateDueStatus muda
- Remover prazo → due_date NULL
- Viewer consegue ler, não consegue set/edit/remove
- Filter "overdue" retorna cards com due_date < TODAY

### E2E

- Abrir card, definir prazo → badge aparece
- Prazo muda de status automaticamente (diariamente)
- Filtro funciona (atrasados, próximos 7 dias)
- Deletar card remove prazo atomicamente

---

## 11. Considerações Arquiteturais

### Choice: due_date como coluna vs tabela separada
- **Pro coluna**: Simples, 1-1 com card, sem joins, sem FK extra
- **Con tabela**: Normalização, reutilização possível (v2)
- **Decision**: Coluna para MVP (KISS)

### Choice: calculateDueStatus recalcular vs denormalizar
- **Pro recalcular**: Sem drift, sempre correto, sem job de atualização
- **Con denormalizar**: Mais rápido (mas ainda O(1) comparação)
- **Decision**: Recalcular para simplicidade (sem hidden state)

### Choice: Date vs Timestamp
- **Pro DATE**: Sem timezone confusion, prazo é "end of day"
- **Con TIMESTAMP**: Mais preciso (mas não necessário)
- **Decision**: DATE para simplificar (valida intenção: "vence neste dia")

### Choice: Filter como query param vs separada
- **Pro query param**: RESTful, cacheável, simples
- **Con separada**: Mais flexível (mas ganha complexidade)
- **Decision**: Query param (filter=X)

---

## Conclusão

**Implementação Focada**: RF10 adiciona 1 coluna (Card.due_date), 6 repository methods, 3 service methods, 2 endpoints modificados, 3 componentes frontend, 3 hooks.

**Stack Completo**: Reutiliza PostgreSQL + TypeORM + Express + Next.js, nenhuma dependência nova.

**Cascata Automática**: FK ON DELETE CASCADE (já padrão de RF05).

**Performance**: Índices compostos, queries O(log n), função pura para status.

**Escalabilidade**: Stateless, sem N+1, sem limite de cards.

**Segurança**: RBAC clara (admin/editor vs viewer), input validation.
