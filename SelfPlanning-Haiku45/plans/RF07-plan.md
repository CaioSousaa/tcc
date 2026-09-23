# RF07 - Membros e Papéis em Quadros

Intenção: Administrador do quadro convide/gerencie membros com papéis diferentes e os atribua a cartões

Plano:

1. Criar entidade BoardMember com campos: id, boardId, userId, role, dataCriacao
2. Roles: owner (criador), editor (edita quadro/listas/cartões), viewer (apenas lê), assignee (pode ser atribuído a cards)
3. Criar relacionamento M-N entre Board e User via BoardMember
4. Criar entidade CardAssignee com campos: id, cardId, userId, dataCriacao (relação M-N)
5. Criar endpoint POST /boards/:boardId/members para convidar membro (protegido, só owner)
6. Validar email do membro a convidar
7. Enviar convite por email (ou gerar link de convite)
8. Criar endpoint GET /boards/:boardId/members para listar membros do quadro (protegido)
9. Criar endpoint DELETE /boards/:boardId/members/:userId para remover membro (protegido, só owner)
10. Criar endpoint PATCH /boards/:boardId/members/:userId para alterar role (protegido, só owner)
11. Modificar endpoints de quadro/listas/cartões para checar role do usuário
12. Owner: acesso total (CRUD tudo)
13. Editor: CRUD listas/cartões/checklists, edita quadro (não deleta)
14. Viewer: apenas lê (GET)
15. Assignee: mínimo, apenas para ser atribuído a cards
16. Criar endpoint POST /boards/:boardId/lists/:listId/cards/:cardId/assignees para atribuir membro (protegido)
17. Criar endpoint GET /boards/:boardId/lists/:listId/cards/:cardId/assignees para listar atribuídos (protegido)
18. Criar endpoint DELETE /boards/:boardId/lists/:listId/cards/:cardId/assignees/:userId para remover (protegido)
19. Frontend: página de membros do quadro com convidar/remover/mudar role
20. Frontend: modal para convidar com validação de email
21. Frontend: dropdown de papéis na listagem
22. Frontend: card mostra avatares dos atribuídos
23. Frontend: modal de card tem seção para atribuir membros
24. Frontend: tratamento de erro (não autorizado, member não existe, etc)
