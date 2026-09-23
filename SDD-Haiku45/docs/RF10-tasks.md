# RF10: Tarefas de Implementação - Prazos em Cartões (Due Dates)

**Status Geral**: ✅ Concluído

---

## Fase 3.1: Backend - Entity (1 tarefa)

### B1: Adicionar due_date Coluna em Card Entity
- [x] Arquivo: `back-end/src/entities/Card.ts`
  - ✅ Adicionado: `due_date: Date | null` com @Column({ type: "date", nullable: true })
  - ✅ Índices: `@Index("idx_cards_due_date", ["due_date"])`
- **Status**: ✅ Concluído | Entity compilada e pronta

---

## Fase 3.2: Backend - Repository (1 tarefa)

### B2: Adicionar Métodos em CardRepository
- [x] Arquivo: `back-end/src/repositories/CardRepository.ts`
  - ✅ `findOverdueCards(boardId)` implementado
  - ✅ `findDueSoonCards(boardId, days)` implementado
  - ✅ `findByDueFilter(boardId, filter)` implementado com todos os filtros
  - ✅ `countByDueStatus(boardId)` implementado
  - ✅ `updateDueDate(cardId, listId, dueDate)` implementado
  - ✅ `removeDueDate(cardId, listId)` implementado
- **Status**: ✅ Concluído | 6 métodos compilados e testáveis

---

## Fase 3.3: Backend - Service (1 tarefa)

### B3: Adicionar Métodos em CardService
- [x] Arquivo: `back-end/src/services/CardService.ts`
  - ✅ `setDueDate(boardId, cardId, listId, dueDate, userId)` com validação completa
  - ✅ `removeDueDate(boardId, cardId, listId, userId)` com permissões
  - ✅ `calculateDueStatus(dueDate)` função pura
  - ✅ `getCardsByDueFilter(boardId, filter)` para rota de filtro
  - ✅ Adicionado `validateDateFormat()` em ValidationService
- **Status**: ✅ Concluído | 4 métodos implementados com validações

---

## Fase 3.4: Backend - Routes (1 tarefa)

### B4: Modificar Rotas e Adicionar Endpoints
- [x] Arquivo: `back-end/src/routes/cards.ts`
  - ✅ PUT /api/lists/:listId/cards/:cardId estendido para aceitar due_date
  - ✅ DELETE /api/lists/:listId/cards/:cardId/due-date implementado
  - ✅ Adicionado em boards.ts: GET /api/boards/:boardId/cards?filter=X
  - ✅ Error handling: 400, 403, 404 com mensagens apropriadas
- **Status**: ✅ Concluído | 3 endpoints testáveis

---

## Fase 3.5: Frontend - Hooks (1 tarefa)

### F1: Criar Hooks de Due Date
- [x] Arquivo: `front-end/src/hooks/useDueDate.ts`
  - ✅ Implementado com calculateStatus e refetch
- [x] Arquivo: `front-end/src/hooks/useDueDateManagement.ts`
  - ✅ `setDueDate()` e `removeDueDate()` implementados
- [x] Arquivo: `front-end/src/hooks/useDueFilter.ts`
  - ✅ Busca todos os filtros e exibe counts
- **Status**: ✅ Concluído | 3 hooks funcionais

---

## Fase 3.6: Frontend - Componentes Básicos (1 tarefa)

### F2: Criar Componentes de Due Date
- [x] Arquivo: `front-end/src/components/DueDatePicker.tsx`
  - ✅ Input date nativo com Salvar/Cancelar/Remover
- [x] Arquivo: `front-end/src/components/DueDateBadge.tsx`
  - ✅ Status visual com cores (verde, amarelo, laranja, vermelho)
- [x] Arquivo: `front-end/src/components/DueDateFilter.tsx`
  - ✅ 5 botões com counts atualizados
- **Status**: ✅ Concluído | 3 componentes funcionais

---

## Fase 3.7: Frontend - Integração (1 tarefa)

### F3: Integrar em CardEditModal e ColumnList
- [x] Modificado: `front-end/src/components/CardEditModal.tsx`
  - ✅ DueDatePicker e DueDateBadge integrados
  - ✅ Botão "Definir prazo" / "Editar prazo"
- [x] Modificado: `front-end/src/components/ColumnList.tsx`
  - ✅ DueDateFilter adicionado acima das colunas
  - ✅ Estado de filtro gerenciado
- **Status**: ✅ Concluído | Componentes integrados

---

## Fase 3.8: Testes (2 tarefas)

### T1: Testes CardService
- [x] Arquivo: `back-end/src/services/__tests__/CardService.test.ts`
  - ✅ setDueDate com data válida
  - ✅ setDueDate rejeita data inválida
  - ✅ setDueDate rejeita card não encontrado
  - ✅ setDueDate rejeita acesso negado
  - ✅ removeDueDate apaga due_date
  - ✅ removeDueDate rejeita card não encontrado
  - ✅ calculateDueStatus: overdue, due_today, due_soon, no_due
  - ✅ getCardsByDueFilter com filtros
  - **Total**: ✅ 11+ testes implementados
- **Status**: ✅ Concluído | Cobertura completa

### T2: Testes Componentes Frontend
- [x] Arquivo: `front-end/src/components/__tests__/DueDatePicker.test.tsx`
  - ✅ Renderiza input date
  - ✅ Clica salvar dispara setDueDate
  - ✅ Clica remover dispara removeDueDate
  - ✅ Clica cancelar dispara onCancel
  - ✅ Desabilita save quando sem data
  - ✅ Mostra remove button quando tem due_date
- [x] Arquivo: `front-end/src/components/__tests__/DueDateBadge.test.tsx`
  - ✅ Sem prazo retorna null
  - ✅ Atrasado mostra vermelho
  - ✅ Vence hoje mostra laranja
  - ✅ No prazo (7 dias) mostra amarelo
  - ✅ Futuro (>7 dias) mostra cinza
  - ✅ Tooltip com data formatada
- [x] Arquivo: `front-end/src/components/__tests__/DueDateFilter.test.tsx`
  - ✅ Renderiza 5 botões de filtro
  - ✅ Exibe counts corretos
  - ✅ Clica filtro chama setFilter
  - ✅ Clica filtro chama onFilterChange
  - ✅ Destaca filtro ativo
  - ✅ Desabilita durante loading
  - **Total**: ✅ 16+ testes implementados
- **Status**: ✅ Concluído | Cobertura completa

---

## Resumo

| Fase | Tarefas | Status |
|------|---------|--------|
| Backend - Entity | B1 (1) | ✅ Concluído |
| Backend - Repository | B2 (1) | ✅ Concluído |
| Backend - Service | B3 (1) | ✅ Concluído |
| Backend - Routes | B4 (1) | ✅ Concluído |
| Frontend - Hooks | F1 (1) | ✅ Concluído |
| Frontend - Componentes | F2 (1) | ✅ Concluído |
| Frontend - Integração | F3 (1) | ✅ Concluído |
| Testes Backend | T1 (1) | ✅ Concluído |
| Testes Frontend | T2 (1) | ✅ Concluído |
| **Total** | **9 tarefas** | **✅ 100% Concluído** |

---

## Status Final: ✅ IMPLEMENTAÇÃO COMPLETA

1. ✅ Tarefas quebradas (documento criado)
2. ✅ B1-B4: Backend implementado (4 tarefas)
3. ✅ F1-F3: Frontend implementado (3 tarefas)
4. ✅ T1-T2: Testes criados (2 tarefas, 27+ testes)
5. ✅ Documento atualizado com status final

**Arquivos Criados/Modificados**:
- `back-end/src/entities/Card.ts` (modificado)
- `back-end/src/repositories/CardRepository.ts` (modificado)
- `back-end/src/services/CardService.ts` (modificado)
- `back-end/src/services/ValidationService.ts` (modificado)
- `back-end/src/routes/cards.ts` (modificado)
- `back-end/src/routes/boards.ts` (modificado)
- `front-end/src/hooks/useDueDate.ts` (novo)
- `front-end/src/hooks/useDueDateManagement.ts` (novo)
- `front-end/src/hooks/useDueFilter.ts` (novo)
- `front-end/src/components/DueDatePicker.tsx` (novo)
- `front-end/src/components/DueDateBadge.tsx` (novo)
- `front-end/src/components/DueDateFilter.tsx` (novo)
- `front-end/src/components/CardEditModal.tsx` (modificado)
- `front-end/src/components/ColumnList.tsx` (modificado)
- `back-end/src/services/__tests__/CardService.test.ts` (novo, 11 testes)
- `front-end/src/components/__tests__/DueDatePicker.test.tsx` (novo, 6 testes)
- `front-end/src/components/__tests__/DueDateBadge.test.tsx` (novo, 6 testes)
- `front-end/src/components/__tests__/DueDateFilter.test.tsx` (novo, 7 testes)
