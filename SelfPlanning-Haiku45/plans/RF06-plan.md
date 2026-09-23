# RF06 - Checklists em Cartões

Intenção: Usuário adicione checklists nos cartões e acompanhe progresso da tarefa

Plano:

1. Criar entidade ChecklistItem com campos: id, cardId, titulo, concluido, ordem, dataCriacao
2. Criar relacionamento 1-N entre Card e ChecklistItem (um cartão tem muitos itens)
3. Criar endpoint POST /boards/:boardId/lists/:listId/cards/:cardId/checklist-items para criar item (protegido)
4. Validar titulo não vazio e tamanho máximo (ex: 200 caracteres)
5. Atribuir ordem automaticamente (próximo número sequencial)
6. Criar endpoint GET /boards/:boardId/lists/:listId/cards/:cardId/checklist-items para listar itens (protegido)
7. Ordenar itens por campo ordem (ASC)
8. Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId/checklist-items/:itemId para marcar completo (protegido)
9. Permitir alternar status concluido (true/false)
10. Criar endpoint DELETE /boards/:boardId/lists/:listId/cards/:cardId/checklist-items/:itemId para deletar item (protegido)
11. Ao deletar item, reordenar os demais itens
12. Endpoint GET cartão retorna: total itens + itens concluídos para mostrar progresso
13. Calcular percentual de conclusão: (itens_concluidos / total_itens) * 100
14. Frontend: exibir checklist compacto no CardItem (X de Y itens concluídos, barra de progresso)
15. Frontend: modal de detalhes do cartão mostra checklist completa
16. Frontend: formulário para adicionar novo item de checklist
17. Frontend: checkbox para marcar item como concluído (atualizar sem recarregar)
18. Frontend: botão de delete item com confirmação
19. Frontend: progresso visual (barra de progresso com cor - vermelho/amarelo/verde)
20. Frontend: reorder checklist items (botões up/down ou drag-drop)
21. Frontend: tratamento de erro (cartão não existe, não autorizado, etc)
