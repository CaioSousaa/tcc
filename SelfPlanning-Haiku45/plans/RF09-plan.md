# RF09 - Comentários nos Cartões

Intenção: Usuário consiga comentar nos cards e ver o histórico de comentários

Plano:

1. Criar entidade Comment com campos: id, cardId, usuarioId, texto, dataCriacao, dataAtualizacao
2. Criar relacionamento M-N: um card tem muitos comentários, um usuário tem muitos comentários
3. ManyToOne Comment -> Card com cascade delete
4. ManyToOne Comment -> User sem cascade (manter autor mesmo se deletar user)
5. Criar endpoint GET /boards/:boardId/lists/:listId/cards/:cardId/comments para listar comentários (protegido)
6. Retornar lista de comentários ordenados por data criação (mais recentes primeiro)
7. Incluir dados do autor (id, email, nome) em cada comentário
8. Criar endpoint POST /boards/:boardId/lists/:listId/cards/:cardId/comments para criar comentário (protegido)
9. Validar texto não vazio e tamanho máximo (ex: 1000 caracteres)
10. Validar que usuário é membro do board ou proprietário antes de permitir comentário
11. Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId/comments/:commentId para editar comentário (protegido)
12. Permitir editar apenas se comentário pertence ao usuário autenticado
13. Criar endpoint DELETE /boards/:boardId/lists/:listId/cards/:cardId/comments/:commentId para deletar comentário (protegido)
14. Permitir deletar apenas se comentário pertence ao usuário autenticado ou usuário é dono do board
15. Frontend: componente CommentList para exibir lista de comentários
16. Frontend: componente CommentForm para criar novo comentário
17. Frontend: adicionar seção de comentários no CardModal
18. Frontend: exibir autor e data de cada comentário
19. Frontend: botões de editar/deletar para próprios comentários
20. Frontend: modal/inline edit para editar comentário existente
21. Frontend: carregamento assíncrono de comentários ao abrir card
22. Frontend: atualizar lista de comentários após criar/editar/deletar
23. Frontend: tratamento de erros (card não existe, não autorizado, etc)
24. Frontend: ícone/contador de número de comentários no card preview (opcional)
