# RF04 - Gerenciamento de Cartões

Intenção: O usuário consiga criar, editar, excluir e mover cartões entre as listas de um quadro

Plano:

1. Criar entidade Card com campos: id, listaId, titulo, descricao, ordem, dataCriacao, dataAtualizacao
2. Criar relacionamento 1-N entre List e Card (uma lista tem muitos cartões)
3. Criar endpoint POST /boards/:boardId/lists/:listId/cards para criar novo cartão (protegido, validar propriedade)
4. Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5. Atribuir ordem automaticamente (próximo número sequencial na lista)
6. Criar endpoint GET /boards/:boardId/lists/:listId/cards para listar cartões da lista (protegido)
7. Ordenar cartões por campo ordem (ASC)
8. Criar endpoint GET /boards/:boardId/lists/:listId/cards/:cardId para obter detalhes do cartão (protegido)
9. Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId para editar cartão (protegido, validar propriedade)
10. Permitir editar titulo e descricao do cartão
11. Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId/move para mover cartão (protegido)
12. Suportar mover cartão para outra lista e/ou reordenar dentro da lista
13. Ajustar ordem dos cartões afetados na lista origem e destino
14. Criar endpoint DELETE /boards/:boardId/lists/:listId/cards/:cardId para deletar cartão (protegido)
15. Ao deletar cartão, reordenar os demais cartões da lista
16. Frontend: renderizar cartões dentro de cada ListColumn
17. Frontend: modal/formulário para criar novo cartão na lista
18. Frontend: modal para editar cartão (titulo, descrição)
19. Frontend: botão de delete cartão com confirmação
20. Frontend: drag-and-drop para mover cartão entre listas
21. Frontend: tratamento de erros (lista não existe, não autorizado, etc)
