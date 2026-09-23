# RF09: Tarefas de Implementação - Comentários em Cards com Histórico

**Status Geral**: ⏳ Em Progresso

---

## Fase 3.1: Backend - Entities e Repositories (5 tarefas)

### B1: Criar Comment Entity
- [ ] Arquivo: `back-end/src/entities/Comment.ts`
  - Propriedades: id, card_id, user_id, content (VARCHAR 1000), created_at, updated_at, edited_at
  - Relações: ManyToOne com Card (ON DELETE CASCADE), ManyToOne com User
  - Sem UNIQUE constraints (comentários duplicados permitidos)
- **Entrável**: Entity compilada, migrations rodam

### B2: Criar CommentRepository
- [ ] Arquivo: `back-end/src/repositories/CommentRepository.ts`
  - Métodos: insert, findByCardId (ORDER BY created_at ASC), findById, update, delete, countByCardId, deleteByCardId
- **Entrável**: Repository implementado, queries funcionam

### B3: Criar CommentService
- [ ] Arquivo: `back-end/src/services/CommentService.ts`
  - Método: `createComment(boardId, cardId, content, userId)` - validação content 1-1000 chars, user ACTIVE
  - Método: `updateComment(boardId, cardId, commentId, content, userId)` - validação user é autor
  - Método: `deleteComment(boardId, cardId, commentId, userId)` - validação user é autor OU admin/editor
  - Método: `getCommentsOfCard(cardId)` - retorna ordenado por created_at ASC com author_name
  - Método: `getCommentById(commentId, cardId)` - GET específico
  - Método: `getCommentCount(cardId)` - contar comentários
- **Entrável**: Service compilado, validações ativas

### B4: Criar Rotas e Registrar
- [ ] Arquivo: `back-end/src/routes/comments.ts`
  - POST /api/boards/:boardId/cards/:cardId/comments (criar)
  - GET /api/cards/:cardId/comments (listar)
  - PUT /api/boards/:boardId/cards/:cardId/comments/:commentId (editar)
  - DELETE /api/boards/:boardId/cards/:cardId/comments/:commentId (deletar)
- [ ] Modificar: `back-end/src/main.ts` - registrar rotas
- **Entrável**: Rotas testáveis via Postman/curl, endpoints respondendo

### B5: Criar Middleware requireMemberActive
- [ ] Arquivo ou modificação: `back-end/src/middlewares/index.ts`
  - Adicionar `requireMemberActive(allowedBoard)` se não existir
  - Valida se user_id é membro com status ACTIVE do board
- **Entrável**: Middleware compila, validações ativas

---

## Fase 3.2: Frontend - Hooks (3 tarefas)

### F1: Criar Hooks de Comentários
- [ ] Arquivo: `front-end/src/hooks/useComments.ts`
  - GET /api/cards/:cardId/comments, retorna { comments, loading, error, refetch }
- [ ] Arquivo: `front-end/src/hooks/useCommentManagement.ts`
  - POST/PUT/DELETE comments, retorna { createComment, updateComment, deleteComment, loading, error }
- [ ] Arquivo: `front-end/src/hooks/useCommentForm.ts`
  - Helper para formulário, retorna { content, setContent, submit, loading, error }
- **Entrável**: Hooks compilam, requisições funcionam

---

## Fase 3.3: Frontend - Componentes (4 tarefas)

### F2: Criar Componentes Básicos
- [ ] Arquivo: `front-end/src/components/CommentItem.tsx`
  - Props: comment, isAuthor, canDeleteOther, onEdit, onDelete
  - Renderiza author, timestamp, "editado em X", conteúdo, botões
- [ ] Arquivo: `front-end/src/components/CommentList.tsx`
  - Props: comments, isLoading
  - Ordenação: created_at ASC, estado vazio com mensagem
- **Entrável**: Componentes renderizam sem erros

### F3: Criar Componentes de Formulário
- [ ] Arquivo: `front-end/src/components/CommentForm.tsx`
  - Field textarea com 1000 char limit
  - Props: cardId, boardId, onSuccess
  - Botões: Enviar, Cancelar
- [ ] Arquivo: `front-end/src/components/CommentEditForm.tsx`
  - Modal/inline edit com conteúdo pre-filled
  - Props: comment, onSave, onCancel
- **Entrável**: Componentes renderizam, CRUD funciona

### F4: Criar CommentSection Container
- [ ] Arquivo: `front-end/src/components/CommentSection.tsx`
  - Container que renderiza lista + formulário
  - Props: cardId, boardId
  - Estados: comments[], loading, error, isEditing
- **Entrável**: Component renderiza, integrado

### F5: Integração em CardEditModal/BoardPage
- [ ] Modificar: `front-end/src/components/CardEditModal.tsx` ou page
  - Adicionar <CommentSection cardId={cardId} boardId={boardId} />
  - Posicionar abaixo de descrição, acima de assignees
- **Entrável**: Comentários visíveis e funcionais no modal

---

## Fase 3.4: Testes (2 tarefas)

### T1: Testes CommentService
- [ ] Arquivo: `back-end/src/services/__tests__/CommentService.test.ts`
  - Teste: createComment com content válido
  - Teste: createComment com content vazio (rejeitado)
  - Teste: createComment com content >1000 chars (rejeitado)
  - Teste: createComment com user não-ativo (rejeitado)
  - Teste: updateComment atualiza content, edited_at, created_at inalterado
  - Teste: updateComment rejeita não-autor
  - Teste: deleteComment por autor
  - Teste: deleteComment por admin/editor
  - Teste: deleteComment rejeita viewer
  - Teste: getCommentsOfCard retorna em ordem cronológica
  - Mínimo: ✅ 10+ testes
- **Entrável**: Testes compilam e cobrem casos críticos

### T2: Testes Componentes Frontend
- [ ] Arquivo: `front-end/src/components/__tests__/CommentSection.test.tsx`
  - Teste: Renderiza lista de comentários
  - Teste: Formulário para adicionar comentário
  - Teste: Autor consegue editar seu comentário
  - Teste: Autor consegue deletar seu comentário
  - Teste: Viewer não vê botão de editar/deletar
  - Teste: Admin consegue deletar comentário de outro
  - Mínimo: ✅ 6+ testes
- **Entrável**: Testes compilam e cobrem fluxos principais

---

## Resumo

| Fase | Tarefas | Status |
|------|---------|--------|
| Backend - Entities | B1 | ⏳ |
| Backend - Repos | B2 | ⏳ |
| Backend - Service | B3 | ⏳ |
| Backend - Routes | B4 | ⏳ |
| Backend - Middleware | B5 | ⏳ |
| Frontend - Hooks | F1 | ⏳ |
| Frontend - Componentes Básicos | F2 | ⏳ |
| Frontend - Componentes Formulário | F3 | ⏳ |
| Frontend - CommentSection | F4 | ⏳ |
| Frontend - Integração | F5 | ⏳ |
| Testes Backend | T1 | ⏳ |
| Testes Frontend | T2 | ⏳ |
| **Total** | **12 tarefas** | **Em Progresso** |

---

## Próximos Passos

1. ✅ Tarefas quebradas (este arquivo)
2. ⏳ B1-B5: Implementar backend
3. ⏳ F1-F5: Implementar frontend
4. ⏳ T1-T2: Testes
5. ⏳ Atualizar este arquivo com status final
