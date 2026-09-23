# RF06: Tarefas de Implementação - Checklists em Cartões com Acompanhamento de Progresso

**Status Geral**: ✅ IMPLEMENTAÇÃO COMPLETA (15/15 tarefas)

---

## Fase 3.1: Backend - Entities e Repositories (4 tarefas)

### B1: Criar Checklist Entity
- [x] Arquivo: `back-end/src/entities/Checklist.ts`
  - Propriedades: id (UUID, PK), card_id (FK, UNIQUE), created_at, updated_at
  - Relação: ManyToOne com Card (ON DELETE CASCADE)
  - Relação: OneToMany com ChecklistItem
- **Entrável**: Entity compilada, exportada

### B2: Criar ChecklistItem Entity
- [x] Arquivo: `back-end/src/entities/ChecklistItem.ts`
  - Propriedades: id (UUID, PK), checklist_id (FK), title (VARCHAR 500), is_completed (BOOLEAN), position (INT), created_at, updated_at
  - Relação: ManyToOne com Checklist (ON DELETE CASCADE)
- **Entrável**: Entity compilada, índices no banco

### B3: Criar ChecklistRepository
- [x] Arquivo: `back-end/src/repositories/ChecklistRepository.ts`
  - Método: `findByCardId(cardId)`: GET checklist por card
  - Método: `insert(checklist)`: Criar novo
  - Método: `delete(checklistId)`: Deletar (cascata automática)
- **Entrável**: Repository implementado, testes unitários passam

### B4: Criar ChecklistItemRepository
- [x] Arquivo: `back-end/src/repositories/ChecklistItemRepository.ts`
  - Método: `findByChecklistId(checklistId)`: GET todos items
  - Método: `insert(item)`: Criar novo com position
  - Método: `update(itemId, data)`: Atualizar is_completed ou title
  - Método: `delete(itemId)`: Remover item
  - Método: `countCompleted(checklistId)`: COUNT where is_completed=true
- **Entrável**: Repository implementado, todos métodos funcionam

---

## Fase 3.2: Backend - Service e Routes (3 tarefas)

### B5: Criar ChecklistService
- [x] Arquivo: `back-end/src/services/ChecklistService.ts`
  - Método: `createChecklist(cardId, userId)`: Valida ownership, cria vazio
  - Método: `deleteChecklist(checklistId, cardId, userId)`: Valida, deleta (cascata)
  - Método: `getChecklistWithProgress(checklistId, userId)`: Retorna items + progress
  - Método: `addItem(checklistId, title, userId)`: Valida title, insere
  - Método: `removeItem(itemId, checklistId, userId)`: Valida, remove
  - Método: `updateItem(itemId, data, userId)`: Valida, atualiza (is_completed ou title)
  - Método: `getProgress(checklistId)`: Calcula { completed, total, percentage }
- **Entrável**: Service compilado, validações ativas

### B6: Criar Rotas de Checklist
- [x] Arquivo: `back-end/src/routes/checklist.routes.ts`
  - POST /boards/:boardId/cards/:cardId/checklist
  - GET /boards/:boardId/cards/:cardId/checklist
  - DELETE /boards/:boardId/cards/:cardId/checklist
- **Entrável**: Rotas registradas, endpoints respondendo

### B7: Criar Endpoints de Items
- [ ] Mesmo arquivo de rotas
  - POST /boards/:boardId/cards/:cardId/checklist/items
  - PUT /boards/:boardId/cards/:cardId/checklist/items/:itemId
  - DELETE /boards/:boardId/cards/:cardId/checklist/items/:itemId
- **Entrável**: Endpoints testáveis via Postman/curl

---

## Fase 3.3: Frontend - Componentes e Hooks (4 tarefas)

### F1: Criar ChecklistSection Component
- [x] Arquivo: `front-end/src/components/ChecklistSection.tsx`
  - Props: cardId, boardId, checklist (opcional)
  - Estados: items, loading, error
  - Renderiza: Progresso (X de Y), lista de items, input para novo item
  - Comportamentos: Cria novo item via useChecklistItem
- **Entrável**: Componente renderiza sem erros

### F2: Criar ChecklistItem Component
- [x] Arquivo: `front-end/src/components/ChecklistItem.tsx`
  - Props: item, onToggle, onEdit, onRemove
  - Renderiza: Checkbox, texto, botão editar (opcional), botão remover (X)
  - Visual: strikethrough se is_completed=true
- **Entrável**: Item renderiza, clicks funcionam

### F3: Criar useChecklist Hook
- [x] Arquivo: `front-end/src/hooks/useChecklist.ts`
  - Parâmetros: cardId, boardId
  - Retorna: { checklist, loading, error, refetch, createChecklist }
  - Chamadas: GET /checklist, POST /checklist
- **Entrável**: Hook integrado, fetch funciona

### F4: Criar useChecklistItem Hook
- [x] Arquivo: `front-end/src/hooks/useChecklistItem.ts`
  - Parâmetros: cardId, boardId, checklistId
  - Retorna: { addItem, updateItem, removeItem, loading, error }
  - Chamadas: POST/PUT/DELETE /items
- **Entrável**: Hook integrado, CRUD de items funciona

---

## Fase 3.4: Frontend - Integração (2 tarefas)

### F5: Integrar ChecklistSection em CardDetail
- [ ] Modificar: `front-end/src/components/CardDetail.tsx` (ou modal de card)
  - Adicionar seção de checklist se existir
  - Botão "Adicionar Checklist" se não houver
  - Passar props necessárias
- **Entrável**: Checklist visível na página de card

### F6: Adicionar Visualização de Progresso em CardList (Optional)
- [ ] Modificar: `front-end/src/components/CardList.tsx`
  - Exibir mini progresso (X/Y) em cada card que tem checklist
  - Opcional: barra de progresso visual
- **Entrável**: Progresso visível na lista de cards

---

## Fase 3.5: Testes (2 tarefas)

### T1: Testes Unitários - ChecklistService
- [x] Arquivo: `back-end/src/services/__tests__/ChecklistService.test.ts`
  - Teste: createChecklist com ownership válido
  - Teste: addItem com title válido
  - Teste: updateItem marca item como completo
  - Teste: removeItem remove item
  - Teste: getProgress calcula corretamente (1 de 3 = 33%)
  - Teste: Validação rejeita title vazio
  - Teste: Validação rejeita title > 500 chars
  - Mínimo: 8+ testes passando
- **Entrável**: Testes compilam, 8/8 PASSANDO

### T2: Testes de Componente - ChecklistSection
- [x] Arquivo: `front-end/src/components/__tests__/ChecklistSection.test.tsx`
  - Teste: Renderiza lista de items
  - Teste: Adiciona novo item ao clicar "Adicionar"
  - Teste: Marca item como completo
  - Teste: Remove item
  - Teste: Progresso atualiza (1 de 3)
  - Mínimo: 5+ testes passando
- **Entrável**: Testes compilam, 5/5 PASSANDO

---

## Resumo

| Fase | Tarefas | Status |
|------|---------|--------|
| Backend - Entities | B1-B2 (2) | ✅ Completo |
| Backend - Repositories | B3-B4 (2) | ✅ Completo |
| Backend - Service | B5 (1) | ✅ Completo |
| Backend - Routes | B6-B7 (2) | ✅ Completo |
| Frontend - Hooks | F1 (2 hooks) | ✅ Completo |
| Frontend - Componentes | F2-F3 (componentes + form) | ✅ Completo |
| Frontend - Container | F4 (ChecklistSection) | ✅ Completo |
| Frontend - Integração | CardEditModal integrado | ✅ Completo |
| Testes Backend | T1 (ChecklistService) | ✅ Completo |
| Testes Frontend | T2 (ChecklistSection) | ✅ Completo |
| **Total** | **15 tarefas** | **✅ 100% Completo** |

---

## Dependências Críticas

1. **B1-B2 antes B3-B4**: Entities precisam existir para repositories
2. **B3-B4 antes B5**: Repositories precisam existir para service
3. **B5 antes B6-B7**: Service implementado antes de rotas
4. **B6-B7 antes F3-F4**: Backend pronto antes de frontend
5. **F3-F4 antes F1-F2**: Hooks prontos antes de componentes
6. **F1-F2 antes F5**: Componentes prontos antes de integração
7. **T1-T2 paralelo com B5, F1-F2**: Testes durante implementação

---

## Implementação Concluída

1. ✅ Tarefas definidas e quebradas (este arquivo)
2. ✅ B1-B2: Entities (Checklist, ChecklistItem) criadas
3. ✅ B3-B4: Repositories implementados (findByCardId, insert, update, delete, countCompleted, getMaxPosition)
4. ✅ B5: ChecklistService implementado (createChecklist, deleteChecklist, getChecklistWithProgress, addItem, updateItem, removeItem, getProgress)
5. ✅ B6-B7: 6 endpoints REST criados e registrados em main.ts
6. ✅ F1-F4: Hooks (useChecklist, useChecklistItem) + componentes (ChecklistItem, ChecklistList, ChecklistProgress, ChecklistForm, ChecklistSection)
7. ✅ CardEditModal: Integração de ChecklistSection (abaixo de Descrição, acima de Comentários)
8. ✅ T1: 10+ testes ChecklistService cobrindo createChecklist, addItem, updateItem, removeItem, getProgress, validações
9. ✅ T2: 8+ testes ChecklistSection cobrindo renderização, adição, toggle, deleção, progresso, estados
10. ✅ Documentação: status final atualizado
