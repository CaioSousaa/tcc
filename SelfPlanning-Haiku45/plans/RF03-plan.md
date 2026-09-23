# RF03 - Gerenciamento de Listas

Intenção: O usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro

Plano:

1. Criar entidade List com campos: id, quadroId, titulo, ordem, dataCriacao, dataAtualizacao
2. Criar relacionamento 1-N entre Board e List (um quadro tem muitas listas)
3. Criar endpoint POST /boards/:boardId/lists para criar nova lista (protegido, validar propriedade do quadro)
4. Validar titulo não vazio e tamanho máximo (ex: 50 caracteres)
5. Atribuir ordem automaticamente (próximo número sequencial)
6. Criar endpoint GET /boards/:boardId/lists para listar listas do quadro (protegido, validar propriedade)
7. Ordenar listas por campo ordem (ASC)
8. Criar endpoint PATCH /boards/:boardId/lists/:id para renomear lista (protegido, validar propriedades)
9. Validar que só pode renomear listas do quadro que pertence ao usuário
10. Criar endpoint PATCH /boards/:boardId/lists/:id/reorder para reordenar listas (protegido)
11. Receber novo índice/ordem e reordenar todas as listas afetadas
12. Criar endpoint DELETE /boards/:boardId/lists/:id para deletar lista (protegido)
13. Validar que lista só pode ser deletada se quadro pertence ao usuário
14. Ao deletar lista, reordenar as demais listas
15. Frontend: página de quadro com listagem de listas em colunas
16. Frontend: modal/formulário para criar nova lista no quadro
17. Frontend: opção de renomear lista (inline edit ou modal)
18. Frontend: drag-and-drop ou botões para reordenar listas
19. Frontend: botão de delete lista com confirmação
20. Frontend: tratamento de erros (quadro não existe, não autorizado, etc)
