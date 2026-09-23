# RF08 - Etiquetas Coloridas nos Cartões

Intenção: Usuário crie etiquetas coloridas e filtre cartões por elas

Plano:

1. Criar entidade Label com campos: id, boardId, nome, cor, dataCriacao
2. Labels são específicas por quadro (não compartilhadas entre boards)
3. Cores: predefinidas (vermelho, azul, verde, amarelo, roxo, rosa, laranja, cinza)
4. Criar relacionamento M-N entre Card e Label via CardLabel
5. Criar endpoint POST /boards/:boardId/labels para criar etiqueta (protegido)
6. Validar nome não vazio e tamanho máximo (ex: 30 caracteres)
7. Validar cor válida (uma das predefinidas)
8. Criar endpoint GET /boards/:boardId/labels para listar etiquetas do quadro (protegido)
9. Ordenar por data criação (mais recentes primeiro)
10. Criar endpoint PATCH /boards/:boardId/labels/:labelId para editar etiqueta (protegido)
11. Permitir editar nome e cor
12. Criar endpoint DELETE /boards/:boardId/labels/:labelId para deletar etiqueta (protegido)
13. Ao deletar, remover de todos os cartões (cascade)
14. Criar endpoint POST /boards/:boardId/lists/:listId/cards/:cardId/labels para adicionar etiqueta ao cartão (protegido)
15. Validar que label pertence ao quadro
16. Criar relacionamento M-N - evitar duplicatas (unique constraint)
17. Criar endpoint DELETE /boards/:boardId/lists/:listId/cards/:cardId/labels/:labelId para remover (protegido)
18. Endpoint GET cards retorna array de labels do cartão
19. Implementar filtro por label no GET /boards/:boardId/lists/:listId/cards?labels=id1,id2
20. Frontend: lista de etiquetas do quadro com edit/delete
21. Frontend: modal para criar/editar etiquetas com color picker
22. Frontend: card mostra etiquetas como badges coloridas
23. Frontend: modal de card tem seção para adicionar/remover etiquetas
24. Frontend: filtro de etiquetas na listagem (checkboxes ou dropdown)
25. Frontend: tratamento de erro (label não existe, board não pertence, etc)
