# RF02 - CRUD de Quadros

Intenção: O usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros

Plano:

1. Criar entidade Board com campos: id, usuarioId, titulo, descricao, corFundo, dataCriacao, dataAtualizacao
2. Criar relacionamento 1-N entre User e Board (um usuário tem muitos quadros)
3. Criar endpoint POST /boards para criar novo quadro (protegido)
4. Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5. Criar endpoint GET /boards para listar todos os quadros do usuário autenticado (protegido)
6. Criar endpoint GET /boards/:id para obter detalhes de um quadro específico (protegido, validar propriedade)
7. Criar endpoint PATCH /boards/:id para editar quadro (protegido, validar propriedade)
8. Validar que só o dono pode editar/deletar seu quadro
9. Criar endpoint DELETE /boards/:id para deletar quadro (protegido, validar propriedade)
10. Frontend: página de listagem de quadros do usuário
11. Frontend: modal/formulário para criar novo quadro
12. Frontend: página de detalhes do quadro (editar titulo/descricao/cor)
13. Frontend: botão de delete com confirmação
14. Frontend: redirecionamento automático ao criar/editar/deletar
15. Frontend: tratamento de erros (não autorizado, quadro não existe, etc)
