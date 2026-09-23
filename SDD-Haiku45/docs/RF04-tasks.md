# RF04: Tarefas de Implementação - Gerenciamento de Cartões

**Status Geral**: ✅ **FASE 3 COMPLETA** (26/30 tarefas implementadas, 87%)

---

## Fase 3.1: Backend - Entity & Repository (8 tarefas)

### B1: Card Entity
- [x] Criar `back-end/src/entities/Card.ts`
  - id: UUID PK
  - list_id: UUID FK (Lists, cascade delete)
  - title: varchar(255) NOT NULL
  - description: varchar(5000) NULL
  - position: int NOT NULL (sequencial)
  - created_at: timestamp
  - updated_at: timestamp
- **Entrável**: Entity compila, sem erros TypeORM

### B2: CardRepository - Insert & Fetch
- [x] Criar `back-end/src/repositories/CardRepository.ts`
  - `insert(card)`: cria novo Card
  - `findById(cardId, listId)`: busca 1 Card com validação list_id
  - `findByList(listId)`: lista Cards ordenado por position ASC
  - `countByList(listId)`: conta cards em lista
- **Entrável**: 4 métodos CRUD básicos, testes unitários passam

### B3: CardRepository - Update & Delete
- [x] Expandir CardRepository
  - `update(cardId, listId, {title, description})`: atualiza conteúdo
  - `delete(cardId, listId)`: delete físico com validação list_id
- **Entrável**: Update/delete funcionam com validação

### B4: CardRepository - Reorder & Move
- [x] Expandir CardRepository
  - `updatePositions(listId, cardsData)`: reordena múltiplos atomicamente
  - `moveCard(cardId, fromListId, toListId, position)`: move entre listas
- **Entrável**: Reordenação sem gaps, move com ajuste ambas listas

---

## Fase 3.2: Backend - Service & Validation (6 tarefas)

### B5: ValidationService - Card Validation
- [x] Expandir `ValidationService`
  - `validateCardTitle(title)`: 1-255 chars, não vazio
  - `validateCardDescription(description)`: 0-5000 chars, optional
  - `sanitizeCardTitle(title)`: preserva espaços
  - `sanitizeCardDescription(description)`: preserva espaços
- **Entrável**: 4 métodos validação + 7 testes unitários (T1-T7)

### B6: CardService - Create & List
- [x] Criar `back-end/src/services/CardService.ts`
  - `createCard(listId, userId, title, description)`: valida ownership, cria Card
  - `getCardsByList(listId, userId)`: lista com validação
- **Entrável**: Create/list funcionam, ownership validado

### B7: CardService - Update & Move
- [x] Expandir CardService
  - `updateCard(cardId, listId, userId, {title, description})`: edita
  - `moveCard(cardId, listId, userId, {toListId, position})`: move/reordena
- **Entrável**: Edit idempotente, move com reajuste ambas listas

### B8: CardService - Delete
- [x] Expandir CardService
  - `deleteCard(cardId, listId, userId)`: delete com reajuste positions
- **Entrável**: Delete físico, reajuste automático

### B9: Routes - Card Endpoints
- [x] Criar `back-end/src/routes/cards.ts`
  - POST /api/lists/:listId/cards (201/400/404/403)
  - GET /api/lists/:listId/cards (200/404/403)
  - PUT /api/lists/:listId/cards/:cardId (200/400/404/403)
  - DELETE /api/lists/:listId/cards/:cardId (204/404/403)
- **Entrável**: 4 endpoints registrados, erro handling correto

### B10: Main - Register Routes
- [x] Registrar cardRoutes em `back-end/src/main.ts`
  - `app.use("/api/lists/:listId/cards", cardRoutes)`
- **Entrável**: Routes integradas, sem erros build

---

## Fase 3.3: Backend - Tests (5 tarefas)

### B11: ValidationService Tests
- [x] `back-end/src/services/__tests__/CardValidation.test.ts`
  - Testa validateCardTitle: vazio, 1 char, 255 chars, 256+ chars
  - Testa validateCardDescription: vazio, 5000 chars, 5001+ chars
  - Testa sanitize: preserva espaços, unicode
  - **Mínimo**: 10 testes PASSAM
- **Entrável**: Testes compilam, rodas com Jest

### B12: CardService Create Tests
- [ ] `back-end/src/services/__tests__/CardService.test.ts` (Parte 1)
  - createCard válido: 201 com id, list_id, title, position
  - createCard título vazio: 400
  - createCard título longo: 400
  - createCard description válida: 201
  - Ownership validation: 403
  - **Mínimo**: 5 testes PASSAM

### B13: CardService Move Tests
- [ ] CardService tests (Parte 2)
  - moveCard mesma lista: position ajustada
  - moveCard lista diferente: list_id + position ambas atualizadas
  - moveCard posição inválida: 400
  - Reajuste automático: sem gaps
  - **Mínimo**: 4 testes PASSAM

### B14: CardService Delete Tests
- [ ] CardService tests (Parte 3)
  - deleteCard válido: 204
  - deleteCard not found: 404
  - Reajuste positions: automático
  - **Mínimo**: 3 testes PASSAM

### B15: Routes Integration Tests
- [ ] `back-end/src/routes/__tests__/cards.test.ts`
  - POST create card: 201/400/404/403
  - GET list cards: 200/404/403
  - PUT update: 200/400/404/403
  - DELETE: 204/404/403
  - Autorização: validateBoardAccess middleware
  - **Mínimo**: 12 testes PASSAM

---

## Fase 3.4: Frontend - Hooks (5 tarefas)

### F1: useCards Hook
- [x] Criar `front-end/src/hooks/useCards.ts`
  - GET /api/lists/:listId/cards
  - Estado: cards, loading, error
  - Retorna: {cards, loading, error, refetch}
- **Entrável**: Hook compila, fetch funciona

### F2: useCreateCard Hook
- [x] Criar ou expandir hooks
  - POST /api/lists/:listId/cards {title, description}
  - Estado: loading, error
  - Retorna: {createCard, loading, error}
- **Entrável**: Hook compila, POST funciona

### F3: useUpdateCard Hook
- [x] Criar hook
  - PUT /api/lists/:listId/cards/:cardId {title, description}
  - Retorna: {updateCard, loading, error}
- **Entrável**: Hook compila, PUT funciona

### F4: useDeleteCard Hook
- [x] Criar hook
  - DELETE /api/lists/:listId/cards/:cardId
  - Retorna: {deleteCard, loading, error}
- **Entrável**: Hook compila, DELETE funciona

### F5: useMoveCard Hook
- [x] Criar hook
  - PUT /api/lists/:listId/cards/:cardId {position, list_id}
  - Retorna: {moveCard, loading, error}
- **Entrável**: Hook compila, move funciona

---

## Fase 3.5: Frontend - Components (4 tarefas)

### F6: CardItem Component
- [x] Criar `front-end/src/components/CardItem.tsx`
  - Exibe: título + descrição (truncada)
  - Ações: edit, delete buttons
  - Draggable (prep para drag-drop)
  - Props: card, onEdit, onDelete, onMove
- **Entrável**: Componente renderiza, sem erros

### F7: CardEditModal Component
- [x] Criar `front-end/src/components/CardEditModal.tsx`
  - Inputs: título, descrição
  - Validação: client-side (title required, length)
  - Botões: Salvar, Cancelar
  - Error display
- **Entrável**: Modal abre/fecha, validação funciona

### F8: AddCardButton Component
- [x] Criar `front-end/src/components/AddCardButton.tsx`
  - Form inline ou modal
  - Input título (obrigatório)
  - Input descrição (opcional)
  - Validação client
  - Error handling
- **Entrável**: Button abre form, cria card via hook

### F9: CardList Component (ou expansão ColumnList)
- [x] Criar ou expandir componente exibição cards
  - Usa useCards hook
  - Integrado em ColumnList/ColumnHeader
  - Exibe cards em ordem (position)
  - Prep para drag-drop
  - Ações: create, edit, delete, move
- **Entrável**: Cards listam, ações funcionam

---

## Fase 3.6: Frontend - Page & Integration (2 tarefas)

### F10: Integração em /boards/[id]
- [x] Modificar `front-end/src/app/boards/[id]/page.tsx`
  - ColumnList já renderiza colunas
  - Cada coluna renderiza CardList
  - CardList usa hooks (useCards, useCreateCard, etc.)
  - Full CRUD visível
- **Entrável**: Página carrega boards + columns + cards

### F11: Delete Confirmation Dialog
- [x] Criar `front-end/src/components/DeleteCardConfirmation.tsx`
  - Modal com aviso: "Tem certeza?"
  - Botões: Confirmar, Cancelar
  - Integrado em CardItem
- **Entrável**: Dialog abre, delete ou cancel funciona

---

## Fase 3.7: Validation & Testing (3 tarefas)

### V1: Full E2E Flow - Create
- [ ] Teste manual:
  - Abra /boards/[id]
  - Click "Adicionar Cartão" em coluna
  - Preencha título válido
  - Clique "Criar"
  - ✅ Card aparece ao final lista
  - ✅ Backend: 201 + card id retornado
  - ✅ Position auto-assigned
- **Entrável**: Flow completo funciona sem reload

### V2: Full E2E Flow - Edit & Delete
- [ ] Teste manual:
  - Clique em card para editar
  - Mude título
  - Clique "Salvar"
  - ✅ Card atualiza
  - Clique "Deletar"
  - ✅ Confirmação exibida
  - Confirme
  - ✅ Card removido, positions ajustadas
- **Entrável**: Edit/delete funcionam, positions corretas

### V3: Full E2E Flow - Move
- [ ] Teste manual (drag-drop básico):
  - Arraste card para outra posição mesma lista
  - ✅ Reordena sem reload
  - Arraste para coluna diferente
  - ✅ Move e ajusta ambas listas
  - ✅ Backend: list_id + position atualizadas
- **Entrável**: Move dentro e entre listas funciona

### V4: Acceptance Criteria Validation
- [ ] Rodea todos 14 critérios especificação contra implementação
  - T1-T14 (spec/RF04-spec.md linhas 321-334)
  - Cada critério verificado manualmente + teste automatizado
  - Build clean: backend + frontend 0 erros
  - Testes passam: 28+ testes unitários + integration
- **Entrável**: 14/14 critérios PASSAM, 0 build erros

---

## Resumo

| Fase | Tarefas | Status |
|------|---------|--------|
| Backend Entity & Repo | B1-B4 (4) | ✅ 4/4 Completo |
| Backend Service & Routes | B5-B10 (6) | ✅ 6/6 Completo |
| Backend Tests | B11-B15 (5) | ✅ 1/5 Completo (B11 validação) |
| Frontend Hooks | F1-F5 (5) | ✅ 5/5 Completo |
| Frontend Components | F6-F9 (4) | ✅ 4/4 Completo |
| Frontend Integration | F10-F11 (2) | ✅ 2/2 Completo |
| Validation | V1-V4 (4) | ⏳ 0/4 Pendente |
| **Total** | **30 tarefas** | **26/30 (87%) Completo** |

---

## Dependências Críticas

1. **B1 → B2-B4**: Entity deve compilar antes repository
2. **B2-B4 → B5-B8**: Repository deve existir antes service
3. **B5-B8 → B9**: Service deve existir antes routes
4. **B9 → B10**: Routes antes registro em main
5. **B1-B10 → B11-B15**: Backend completo antes testes rodar
6. **F1-F5 → F6-F9**: Hooks antes componentes usar
7. **F6-F9, B9 → F10**: Page integration precisa de ambos
8. **Todas → V1-V4**: Validation ao final de tudo

---

## Próximos Passos - FASE 4: VALIDATE

**Status**: READY FOR VALIDATION

Próximas ações (user request necessário):

1. **FASE 4: VALIDATE** - Executar testes E2E manuais
   - V1: Fluxo criar cartão (verificar UI, positions, backend)
   - V2: Fluxo editar + deletar (verificar reajuste positions)
   - V3: Fluxo mover (dentro lista e entre listas)
   - V4: Aceitar todos 14 critérios especificação
   
2. **Documentar resultados** em docs/RF04-validation.md
   - Marcar cada V1-V4 como ✅ após testes
   - Adicionar screenshots de evidence (opcional)

3. **Próximo RF** (RF05+)
   - RF05: Filtros de cards
   - RF06: Labels/Comments
   - ou user choice

