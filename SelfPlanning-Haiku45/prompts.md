### Prompt 1

Esta seção deve ser executada com base no arquivo @context.md

---

### Prompt 2

Abaixo estão exemplos de intenções e seus respectivos planos de implementação

Intenção: O usuário deve conseguir recuperar a senha por e-mail
Plano:
1 Criar um endpoint para receber o pedido de recuperação de senha
2 Verificar se o e-mail informado existe na base
3 Se não existir, retornar uma resposta genérica sem revelar a ausência
4 Gerar um token temporário com prazo de expiração e persistir
5 Enviar o e-mail com o link de redefinição
6 Criar um endpoint para validar o token e atualizar a senha

Intenção: O usuário deve conseguir adicionar e remover produtos do carrinho
Plano:

1 Criar um modelo de carrinho vinculado ao usuário
2 Criar um endpoint para adicionar um produto ao carrinho
3 Se o produto já estiver no carrinho, incrementar a quantidade
4 Criar um endpoint para remover um produto do carrinho
5 Criar um endpoint para listar os itens do carrinho com o total

Intenção: O usuário deve conseguir finalizar o pedido com cálculo de frete
Plano:

1 Criar um endpoint para finalizar o pedido a partir do carrinho
2 Validar se o carrinho possui itens
3 Calcular o valor do frete com base no endereço informado
4 Somar o valor dos itens e o frete para obter o total
5 Criar o registro do pedido e esvaziar o carrinho
6 Retornar o pedido criado com o resumo dos valores

Intenção: O usuário deve conseguir ver o histórico de pedidos filtrado por período
Plano:

1 Criar um endpoint para listar os pedidos do usuário autenticado
2 Receber o período inicial e final como parâmetros opcionais
3 Se o período for informado, filtrar os pedidos por data de criação
4 Ordenar os pedidos do mais recente para o mais antigo
5 Retornar a lista com os dados resumidos de cada pedido

Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões
Plano:

Salve o plano gerado em plans/RF01-plan.md

---

### Prompt 3

Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões

Plano: @plans/RF01-plan.md

Gere o código seguindo o plano acima, passo a passo

---

### Prompt 4

Abaixo estão exemplos de intenções e seus respectivos planos de implementação

Intenção: O usuário deve conseguir se cadastrar, fazer login e continuar autenticado entre sessões

Plano:

1 Criar entidade User com campos: id, email, senha (hash), nome, dataInclusão
2 Criar endpoint POST /auth/register para cadastro com validação de email único
3 Hash da senha com bcrypt antes de persistir no banco
4 Criar endpoint POST /auth/login que valida email/senha e gera token JWT
5 Armazenar token JWT no localStorage do frontend
6 Criar middleware de autenticação para validar token nas requisições protegidas
7 Criar endpoint GET /auth/me para retornar dados do usuário autenticado
8 Implementar refresh token com expiração maior para renovar sessão
9 Frontend: interceptor HTTP para incluir token em todas as requisições
10 Frontend: verificar autenticação ao carregar app e redirecionar se inválido
11 Criar endpoint POST /auth/logout que invalida o token (opcional em JWT, blacklist se necessário)
12 Frontend: rota protegida que redireciona para login se não autenticado

Intenção: O usuário deve conseguir adicionar e remover produtos do carrinho
Plano:

1 Criar um modelo de carrinho vinculado ao usuário
2 Criar um endpoint para adicionar um produto ao carrinho
3 Se o produto já estiver no carrinho, incrementar a quantidade
4 Criar um endpoint para remover um produto do carrinho
5 Criar um endpoint para listar os itens do carrinho com o total

Intenção: O usuário deve conseguir finalizar o pedido com cálculo de frete
Plano:

1 Criar um endpoint para finalizar o pedido a partir do carrinho
2 Validar se o carrinho possui itens
3 Calcular o valor do frete com base no endereço informado
4 Somar o valor dos itens e o frete para obter o total
5 Criar o registro do pedido e esvaziar o carrinho
6 Retornar o pedido criado com o resumo dos valores

Intenção: O usuário deve conseguir ver o histórico de pedidos filtrado por período
Plano:

1 Criar um endpoint para listar os pedidos do usuário autenticado
2 Receber o período inicial e final como parâmetros opcionais
3 Se o período for informado, filtrar os pedidos por data de criação
4 Ordenar os pedidos do mais recente para o mais antigo
5 Retornar a lista com os dados resumidos de cada pedido

Intenção: Quero que o usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros
Plano:

Salve o plano gerado em plans/RF02-plan.md

---

### Prompt 5

Intenção: Quero que o usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros

Plano: @plans/RF02-plan.md

Gere o código seguindo o plano acima, passo a passo

---

### Prompt 6

Abaixo estão exemplos de intenções e seus respectivos planos de implementação

Intenção: O usuário deve conseguir se cadastrar, fazer login e continuar autenticado entre sessões

Plano:

1 Criar entidade User com campos: id, email, senha (hash), nome, dataInclusão
2 Criar endpoint POST /auth/register para cadastro com validação de email único
3 Hash da senha com bcrypt antes de persistir no banco
4 Criar endpoint POST /auth/login que valida email/senha e gera token JWT
5 Armazenar token JWT no localStorage do frontend
6 Criar middleware de autenticação para validar token nas requisições protegidas
7 Criar endpoint GET /auth/me para retornar dados do usuário autenticado
8 Implementar refresh token com expiração maior para renovar sessão
9 Frontend: interceptor HTTP para incluir token em todas as requisições
10 Frontend: verificar autenticação ao carregar app e redirecionar se inválido
11 Criar endpoint POST /auth/logout que invalida o token (opcional em JWT, blacklist se necessário)
12 Frontend: rota protegida que redireciona para login se não autenticado

Intenção: O usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros

Plano:

1 Criar entidade Board com campos: id, usuarioId, titulo, descricao, corFundo, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre User e Board (um usuário tem muitos quadros)
3 Criar endpoint POST /boards para criar novo quadro (protegido)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Criar endpoint GET /boards para listar todos os quadros do usuário autenticado (protegido)
6 Criar endpoint GET /boards/:id para obter detalhes de um quadro específico (protegido, validar propriedade)
7 Criar endpoint PATCH /boards/:id para editar quadro (protegido, validar propriedade)
8 Validar que só o dono pode editar/deletar seu quadro
9 Criar endpoint DELETE /boards/:id para deletar quadro (protegido, validar propriedade)
10 Frontend: página de listagem de quadros do usuário
11 Frontend: modal/formulário para criar novo quadro
12 Frontend: página de detalhes do quadro (editar titulo/descricao/cor)
13 Frontend: botão de delete com confirmação
14 Frontend: redirecionamento automático ao criar/editar/deletar
15 Frontend: tratamento de erros (não autorizado, quadro não existe, etc)

Intenção: O usuário deve conseguir finalizar o pedido com cálculo de frete
Plano:

1 Criar um endpoint para finalizar o pedido a partir do carrinho
2 Validar se o carrinho possui itens
3 Calcular o valor do frete com base no endereço informado
4 Somar o valor dos itens e o frete para obter o total
5 Criar o registro do pedido e esvaziar o carrinho
6 Retornar o pedido criado com o resumo dos valores

Intenção: O usuário deve conseguir ver o histórico de pedidos filtrado por período
Plano:

1 Criar um endpoint para listar os pedidos do usuário autenticado
2 Receber o período inicial e final como parâmetros opcionais
3 Se o período for informado, filtrar os pedidos por data de criação
4 Ordenar os pedidos do mais recente para o mais antigo
5 Retornar a lista com os dados resumidos de cada pedido

Intenção: Quero que o usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro
Plano:

Salve o plano gerado em plans/RF03-plan.md

---

### Prompt 7

Intenção: Quero que o usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro

Plano: @plans/RF03-plan.md

Gere o código seguindo o plano acima, passo a passo

---

### Prompt 8

Abaixo estão exemplos de intenções e seus respectivos planos de implementação

Intenção: O usuário deve conseguir se cadastrar, fazer login e continuar autenticado entre sessões

Plano:

1 Criar entidade User com campos: id, email, senha (hash), nome, dataInclusão
2 Criar endpoint POST /auth/register para cadastro com validação de email único
3 Hash da senha com bcrypt antes de persistir no banco
4 Criar endpoint POST /auth/login que valida email/senha e gera token JWT
5 Armazenar token JWT no localStorage do frontend
6 Criar middleware de autenticação para validar token nas requisições protegidas
7 Criar endpoint GET /auth/me para retornar dados do usuário autenticado
8 Implementar refresh token com expiração maior para renovar sessão
9 Frontend: interceptor HTTP para incluir token em todas as requisições
10 Frontend: verificar autenticação ao carregar app e redirecionar se inválido
11 Criar endpoint POST /auth/logout que invalida o token (opcional em JWT, blacklist se necessário)
12 Frontend: rota protegida que redireciona para login se não autenticado

Intenção: O usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros

Plano:

1 Criar entidade Board com campos: id, usuarioId, titulo, descricao, corFundo, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre User e Board (um usuário tem muitos quadros)
3 Criar endpoint POST /boards para criar novo quadro (protegido)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Criar endpoint GET /boards para listar todos os quadros do usuário autenticado (protegido)
6 Criar endpoint GET /boards/:id para obter detalhes de um quadro específico (protegido, validar propriedade)
7 Criar endpoint PATCH /boards/:id para editar quadro (protegido, validar propriedade)
8 Validar que só o dono pode editar/deletar seu quadro
9 Criar endpoint DELETE /boards/:id para deletar quadro (protegido, validar propriedade)
10 Frontend: página de listagem de quadros do usuário
11 Frontend: modal/formulário para criar novo quadro
12 Frontend: página de detalhes do quadro (editar titulo/descricao/cor)
13 Frontend: botão de delete com confirmação
14 Frontend: redirecionamento automático ao criar/editar/deletar
15 Frontend: tratamento de erros (não autorizado, quadro não existe, etc)

Intenção: O usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro

Plano:

1 Criar entidade List com campos: id, quadroId, titulo, ordem, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre Board e List (um quadro tem muitas listas)
3 Criar endpoint POST /boards/:boardId/lists para criar nova lista (protegido, validar propriedade do quadro)
4 Validar titulo não vazio e tamanho máximo (ex: 50 caracteres)
5 Atribuir ordem automaticamente (próximo número sequencial)
6 Criar endpoint GET /boards/:boardId/lists para listar listas do quadro (protegido, validar propriedade)
7 Ordenar listas por campo ordem (ASC)
8 Criar endpoint PATCH /boards/:boardId/lists/:id para renomear lista (protegido, validar propriedades)
9 Validar que só pode renomear listas do quadro que pertence ao usuário
10 Criar endpoint PATCH /boards/:boardId/lists/:id/reorder para reordenar listas (protegido)
11 Receber novo índice/ordem e reordenar todas as listas afetadas
12 Criar endpoint DELETE /boards/:boardId/lists/:id para deletar lista (protegido)
13 Validar que lista só pode ser deletada se quadro pertence ao usuário
14 Ao deletar lista, reordenar as demais listas
15 Frontend: página de quadro com listagem de listas em colunas
16 Frontend: modal/formulário para criar nova lista no quadro
17 Frontend: opção de renomear lista (inline edit ou modal)
18 Frontend: drag-and-drop ou botões para reordenar listas
19 Frontend: botão de delete lista com confirmação
20 Frontend: tratamento de erros (quadro não existe, não autorizado, etc)

Intenção: O usuário deve conseguir ver o histórico de pedidos filtrado por período
Plano:

1 Criar um endpoint para listar os pedidos do usuário autenticado
2 Receber o período inicial e final como parâmetros opcionais
3 Se o período for informado, filtrar os pedidos por data de criação
4 Ordenar os pedidos do mais recente para o mais antigo
5 Retornar a lista com os dados resumidos de cada pedido

Intenção: Quero que o usuário consiga criar, editar, excluir e mover cards entre as listas de um quadro
Plano:

Salve o plano gerado em plans/RF04-plan.md

---

### Prompt 9

Intenção: Quero que o usuário consiga criar, editar, excluir e mover cards entre as listas de um quadro

Plano: @plans/RF04-plan.md

Gere o código seguindo o plano acima, passo a passo

---

### Prompt 10

Abaixo estão exemplos de intenções e seus respectivos planos de implementação

Intenção: O usuário deve conseguir se cadastrar, fazer login e continuar autenticado entre sessões

Plano:

1 Criar entidade User com campos: id, email, senha (hash), nome, dataInclusão
2 Criar endpoint POST /auth/register para cadastro com validação de email único
3 Hash da senha com bcrypt antes de persistir no banco
4 Criar endpoint POST /auth/login que valida email/senha e gera token JWT
5 Armazenar token JWT no localStorage do frontend
6 Criar middleware de autenticação para validar token nas requisições protegidas
7 Criar endpoint GET /auth/me para retornar dados do usuário autenticado
8 Implementar refresh token com expiração maior para renovar sessão
9 Frontend: interceptor HTTP para incluir token em todas as requisições
10 Frontend: verificar autenticação ao carregar app e redirecionar se inválido
11 Criar endpoint POST /auth/logout que invalida o token (opcional em JWT, blacklist se necessário)
12 Frontend: rota protegida que redireciona para login se não autenticado

Intenção: O usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros

Plano:

1 Criar entidade Board com campos: id, usuarioId, titulo, descricao, corFundo, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre User e Board (um usuário tem muitos quadros)
3 Criar endpoint POST /boards para criar novo quadro (protegido)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Criar endpoint GET /boards para listar todos os quadros do usuário autenticado (protegido)
6 Criar endpoint GET /boards/:id para obter detalhes de um quadro específico (protegido, validar propriedade)
7 Criar endpoint PATCH /boards/:id para editar quadro (protegido, validar propriedade)
8 Validar que só o dono pode editar/deletar seu quadro
9 Criar endpoint DELETE /boards/:id para deletar quadro (protegido, validar propriedade)
10 Frontend: página de listagem de quadros do usuário
11 Frontend: modal/formulário para criar novo quadro
12 Frontend: página de detalhes do quadro (editar titulo/descricao/cor)
13 Frontend: botão de delete com confirmação
14 Frontend: redirecionamento automático ao criar/editar/deletar
15 Frontend: tratamento de erros (não autorizado, quadro não existe, etc)

Intenção: O usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro

Plano:

1 Criar entidade List com campos: id, quadroId, titulo, ordem, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre Board e List (um quadro tem muitas listas)
3 Criar endpoint POST /boards/:boardId/lists para criar nova lista (protegido, validar propriedade do quadro)
4 Validar titulo não vazio e tamanho máximo (ex: 50 caracteres)
5 Atribuir ordem automaticamente (próximo número sequencial)
6 Criar endpoint GET /boards/:boardId/lists para listar listas do quadro (protegido, validar propriedade)
7 Ordenar listas por campo ordem (ASC)
8 Criar endpoint PATCH /boards/:boardId/lists/:id para renomear lista (protegido, validar propriedades)
9 Validar que só pode renomear listas do quadro que pertence ao usuário
10 Criar endpoint PATCH /boards/:boardId/lists/:id/reorder para reordenar listas (protegido)
11 Receber novo índice/ordem e reordenar todas as listas afetadas
12 Criar endpoint DELETE /boards/:boardId/lists/:id para deletar lista (protegido)
13 Validar que lista só pode ser deletada se quadro pertence ao usuário
14 Ao deletar lista, reordenar as demais listas
15 Frontend: página de quadro com listagem de listas em colunas
16 Frontend: modal/formulário para criar nova lista no quadro
17 Frontend: opção de renomear lista (inline edit ou modal)
18 Frontend: drag-and-drop ou botões para reordenar listas
19 Frontend: botão de delete lista com confirmação
20 Frontend: tratamento de erros (quadro não existe, não autorizado, etc)

Intenção: O usuário consiga criar, editar, excluir e mover cartões entre as listas de um quadro

Plano:

1 Criar entidade Card com campos: id, listaId, titulo, descricao, ordem, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre List e Card (uma lista tem muitos cartões)
3 Criar endpoint POST /boards/:boardId/lists/:listId/cards para criar novo cartão (protegido, validar propriedade)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Atribuir ordem automaticamente (próximo número sequencial na lista)
6 Criar endpoint GET /boards/:boardId/lists/:listId/cards para listar cartões da lista (protegido)
7 Ordenar cartões por campo ordem (ASC)
8 Criar endpoint GET /boards/:boardId/lists/:listId/cards/:cardId para obter detalhes do cartão (protegido)
9 Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId para editar cartão (protegido, validar propriedade)
10 Permitir editar titulo e descricao do cartão
11 Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId/move para mover cartão (protegido)
12 Suportar mover cartão para outra lista e/ou reordenar dentro da lista
13 Ajustar ordem dos cartões afetados na lista origem e destino
14 Criar endpoint DELETE /boards/:boardId/lists/:listId/cards/:cardId para deletar cartão (protegido)
15 Ao deletar cartão, reordenar os demais cartões da lista
16 Frontend: renderizar cartões dentro de cada ListColumn
17 Frontend: modal/formulário para criar novo cartão na lista
18 Frontend: modal para editar cartão (titulo, descrição)
19 Frontend: botão de delete cartão com confirmação
20 Frontend: drag-and-drop para mover cartão entre listas
21 Frontend: tratamento de erros (lista não existe, não autorizado, etc)

Intenção: Quero que o sistema trate adequadamente o que acontece com os cards quando o usuário exclui uma lista que contém cards
Plano:

Salve o plano gerado em plans/RF05-plan.md

---

### Prompt 11

Intenção: Quero que o sistema trate adequadamente o que acontece com os cards quando o usuário exclui uma lista que contém cards

Plano: @plans/RF05-plan.md

Gere o código seguindo o plano acima, passo a passo

---

### Prompt 12

Abaixo estão exemplos de intenções e seus respectivos planos de implementação

Intenção: O usuário deve conseguir se cadastrar, fazer login e continuar autenticado entre sessões

Plano:

1 Criar entidade User com campos: id, email, senha (hash), nome, dataInclusão
2 Criar endpoint POST /auth/register para cadastro com validação de email único
3 Hash da senha com bcrypt antes de persistir no banco
4 Criar endpoint POST /auth/login que valida email/senha e gera token JWT
5 Armazenar token JWT no localStorage do frontend
6 Criar middleware de autenticação para validar token nas requisições protegidas
7 Criar endpoint GET /auth/me para retornar dados do usuário autenticado
8 Implementar refresh token com expiração maior para renovar sessão
9 Frontend: interceptor HTTP para incluir token em todas as requisições
10 Frontend: verificar autenticação ao carregar app e redirecionar se inválido
11 Criar endpoint POST /auth/logout que invalida o token (opcional em JWT, blacklist se necessário)
12 Frontend: rota protegida que redireciona para login se não autenticado

Intenção: O usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros

Plano:

1 Criar entidade Board com campos: id, usuarioId, titulo, descricao, corFundo, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre User e Board (um usuário tem muitos quadros)
3 Criar endpoint POST /boards para criar novo quadro (protegido)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Criar endpoint GET /boards para listar todos os quadros do usuário autenticado (protegido)
6 Criar endpoint GET /boards/:id para obter detalhes de um quadro específico (protegido, validar propriedade)
7 Criar endpoint PATCH /boards/:id para editar quadro (protegido, validar propriedade)
8 Validar que só o dono pode editar/deletar seu quadro
9 Criar endpoint DELETE /boards/:id para deletar quadro (protegido, validar propriedade)
10 Frontend: página de listagem de quadros do usuário
11 Frontend: modal/formulário para criar novo quadro
12 Frontend: página de detalhes do quadro (editar titulo/descricao/cor)
13 Frontend: botão de delete com confirmação
14 Frontend: redirecionamento automático ao criar/editar/deletar
15 Frontend: tratamento de erros (não autorizado, quadro não existe, etc)

Intenção: O usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro

Plano:

1 Criar entidade List com campos: id, quadroId, titulo, ordem, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre Board e List (um quadro tem muitas listas)
3 Criar endpoint POST /boards/:boardId/lists para criar nova lista (protegido, validar propriedade do quadro)
4 Validar titulo não vazio e tamanho máximo (ex: 50 caracteres)
5 Atribuir ordem automaticamente (próximo número sequencial)
6 Criar endpoint GET /boards/:boardId/lists para listar listas do quadro (protegido, validar propriedade)
7 Ordenar listas por campo ordem (ASC)
8 Criar endpoint PATCH /boards/:boardId/lists/:id para renomear lista (protegido, validar propriedades)
9 Validar que só pode renomear listas do quadro que pertence ao usuário
10 Criar endpoint PATCH /boards/:boardId/lists/:id/reorder para reordenar listas (protegido)
11 Receber novo índice/ordem e reordenar todas as listas afetadas
12 Criar endpoint DELETE /boards/:boardId/lists/:id para deletar lista (protegido)
13 Validar que lista só pode ser deletada se quadro pertence ao usuário
14 Ao deletar lista, reordenar as demais listas
15 Frontend: página de quadro com listagem de listas em colunas
16 Frontend: modal/formulário para criar nova lista no quadro
17 Frontend: opção de renomear lista (inline edit ou modal)
18 Frontend: drag-and-drop ou botões para reordenar listas
19 Frontend: botão de delete lista com confirmação
20 Frontend: tratamento de erros (quadro não existe, não autorizado, etc)

Intenção: O usuário consiga criar, editar, excluir e mover cartões entre as listas de um quadro

Plano:

1 Criar entidade Card com campos: id, listaId, titulo, descricao, ordem, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre List e Card (uma lista tem muitos cartões)
3 Criar endpoint POST /boards/:boardId/lists/:listId/cards para criar novo cartão (protegido, validar propriedade)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Atribuir ordem automaticamente (próximo número sequencial na lista)
6 Criar endpoint GET /boards/:boardId/lists/:listId/cards para listar cartões da lista (protegido)
7 Ordenar cartões por campo ordem (ASC)
8 Criar endpoint GET /boards/:boardId/lists/:listId/cards/:cardId para obter detalhes do cartão (protegido)
9 Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId para editar cartão (protegido, validar propriedade)
10 Permitir editar titulo e descricao do cartão
11 Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId/move para mover cartão (protegido)
12 Suportar mover cartão para outra lista e/ou reordenar dentro da lista
13 Ajustar ordem dos cartões afetados na lista origem e destino
14 Criar endpoint DELETE /boards/:boardId/lists/:listId/cards/:cardId para deletar cartão (protegido)
15 Ao deletar cartão, reordenar os demais cartões da lista
16 Frontend: renderizar cartões dentro de cada ListColumn
17 Frontend: modal/formulário para criar novo cartão na lista
18 Frontend: modal para editar cartão (titulo, descrição)
19 Frontend: botão de delete cartão com confirmação
20 Frontend: drag-and-drop para mover cartão entre listas
21 Frontend: tratamento de erros (lista não existe, não autorizado, etc)

Intenção: Quero que o usuário consiga adicionar checklists nos cards e acompanhar o progresso da tarefa
Plano:

Salve o plano gerado em plans/RF06-plan.md

---

### Prompt 13

Intenção: Quero que o usuário consiga adicionar checklists nos cards e acompanhar o progresso da tarefa

Plano: @plans/RF06-plan.md

Gere o código seguindo o plano acima, passo a passo

---

### Prompt 14

Abaixo estão exemplos de intenções e seus respectivos planos de implementação

Intenção: O usuário deve conseguir se cadastrar, fazer login e continuar autenticado entre sessões

Plano:

1 Criar entidade User com campos: id, email, senha (hash), nome, dataInclusão
2 Criar endpoint POST /auth/register para cadastro com validação de email único
3 Hash da senha com bcrypt antes de persistir no banco
4 Criar endpoint POST /auth/login que valida email/senha e gera token JWT
5 Armazenar token JWT no localStorage do frontend
6 Criar middleware de autenticação para validar token nas requisições protegidas
7 Criar endpoint GET /auth/me para retornar dados do usuário autenticado
8 Implementar refresh token com expiração maior para renovar sessão
9 Frontend: interceptor HTTP para incluir token em todas as requisições
10 Frontend: verificar autenticação ao carregar app e redirecionar se inválido
11 Criar endpoint POST /auth/logout que invalida o token (opcional em JWT, blacklist se necessário)
12 Frontend: rota protegida que redireciona para login se não autenticado

Intenção: O usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros

Plano:

1 Criar entidade Board com campos: id, usuarioId, titulo, descricao, corFundo, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre User e Board (um usuário tem muitos quadros)
3 Criar endpoint POST /boards para criar novo quadro (protegido)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Criar endpoint GET /boards para listar todos os quadros do usuário autenticado (protegido)
6 Criar endpoint GET /boards/:id para obter detalhes de um quadro específico (protegido, validar propriedade)
7 Criar endpoint PATCH /boards/:id para editar quadro (protegido, validar propriedade)
8 Validar que só o dono pode editar/deletar seu quadro
9 Criar endpoint DELETE /boards/:id para deletar quadro (protegido, validar propriedade)
10 Frontend: página de listagem de quadros do usuário
11 Frontend: modal/formulário para criar novo quadro
12 Frontend: página de detalhes do quadro (editar titulo/descricao/cor)
13 Frontend: botão de delete com confirmação
14 Frontend: redirecionamento automático ao criar/editar/deletar
15 Frontend: tratamento de erros (não autorizado, quadro não existe, etc)

Intenção: O usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro

Plano:

1 Criar entidade List com campos: id, quadroId, titulo, ordem, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre Board e List (um quadro tem muitas listas)
3 Criar endpoint POST /boards/:boardId/lists para criar nova lista (protegido, validar propriedade do quadro)
4 Validar titulo não vazio e tamanho máximo (ex: 50 caracteres)
5 Atribuir ordem automaticamente (próximo número sequencial)
6 Criar endpoint GET /boards/:boardId/lists para listar listas do quadro (protegido, validar propriedade)
7 Ordenar listas por campo ordem (ASC)
8 Criar endpoint PATCH /boards/:boardId/lists/:id para renomear lista (protegido, validar propriedades)
9 Validar que só pode renomear listas do quadro que pertence ao usuário
10 Criar endpoint PATCH /boards/:boardId/lists/:id/reorder para reordenar listas (protegido)
11 Receber novo índice/ordem e reordenar todas as listas afetadas
12 Criar endpoint DELETE /boards/:boardId/lists/:id para deletar lista (protegido)
13 Validar que lista só pode ser deletada se quadro pertence ao usuário
14 Ao deletar lista, reordenar as demais listas
15 Frontend: página de quadro com listagem de listas em colunas
16 Frontend: modal/formulário para criar nova lista no quadro
17 Frontend: opção de renomear lista (inline edit ou modal)
18 Frontend: drag-and-drop ou botões para reordenar listas
19 Frontend: botão de delete lista com confirmação
20 Frontend: tratamento de erros (quadro não existe, não autorizado, etc)

Intenção: O usuário consiga criar, editar, excluir e mover cartões entre as listas de um quadro

Plano:

1 Criar entidade Card com campos: id, listaId, titulo, descricao, ordem, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre List e Card (uma lista tem muitos cartões)
3 Criar endpoint POST /boards/:boardId/lists/:listId/cards para criar novo cartão (protegido, validar propriedade)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Atribuir ordem automaticamente (próximo número sequencial na lista)
6 Criar endpoint GET /boards/:boardId/lists/:listId/cards para listar cartões da lista (protegido)
7 Ordenar cartões por campo ordem (ASC)
8 Criar endpoint GET /boards/:boardId/lists/:listId/cards/:cardId para obter detalhes do cartão (protegido)
9 Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId para editar cartão (protegido, validar propriedade)
10 Permitir editar titulo e descricao do cartão
11 Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId/move para mover cartão (protegido)
12 Suportar mover cartão para outra lista e/ou reordenar dentro da lista
13 Ajustar ordem dos cartões afetados na lista origem e destino
14 Criar endpoint DELETE /boards/:boardId/lists/:listId/cards/:cardId para deletar cartão (protegido)
15 Ao deletar cartão, reordenar os demais cartões da lista
16 Frontend: renderizar cartões dentro de cada ListColumn
17 Frontend: modal/formulário para criar novo cartão na lista
18 Frontend: modal para editar cartão (titulo, descrição)
19 Frontend: botão de delete cartão com confirmação
20 Frontend: drag-and-drop para mover cartão entre listas
21 Frontend: tratamento de erros (lista não existe, não autorizado, etc)

Intenção: Quero que o administrador do quadro consiga convidar e gerenciar membros com papéis diferentes, e atribuí-los a cards
Plano:

Salve o plano gerado em plans/RF07-plan.md

---

### Prompt 15

Intenção: Quero que o administrador do quadro consiga convidar e gerenciar membros com papéis diferentes, e atribuí-los a cards

Plano: @plans/RF07-plan.md

Gere o código seguindo o plano acima, passo a passo

---

### Prompt 16

Abaixo estão exemplos de intenções e seus respectivos planos de implementação

Intenção: O usuário deve conseguir se cadastrar, fazer login e continuar autenticado entre sessões

Plano:

1 Criar entidade User com campos: id, email, senha (hash), nome, dataInclusão
2 Criar endpoint POST /auth/register para cadastro com validação de email único
3 Hash da senha com bcrypt antes de persistir no banco
4 Criar endpoint POST /auth/login que valida email/senha e gera token JWT
5 Armazenar token JWT no localStorage do frontend
6 Criar middleware de autenticação para validar token nas requisições protegidas
7 Criar endpoint GET /auth/me para retornar dados do usuário autenticado
8 Implementar refresh token com expiração maior para renovar sessão
9 Frontend: interceptor HTTP para incluir token em todas as requisições
10 Frontend: verificar autenticação ao carregar app e redirecionar se inválido
11 Criar endpoint POST /auth/logout que invalida o token (opcional em JWT, blacklist se necessário)
12 Frontend: rota protegida que redireciona para login se não autenticado

Intenção: O usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros

Plano:

1 Criar entidade Board com campos: id, usuarioId, titulo, descricao, corFundo, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre User e Board (um usuário tem muitos quadros)
3 Criar endpoint POST /boards para criar novo quadro (protegido)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Criar endpoint GET /boards para listar todos os quadros do usuário autenticado (protegido)
6 Criar endpoint GET /boards/:id para obter detalhes de um quadro específico (protegido, validar propriedade)
7 Criar endpoint PATCH /boards/:id para editar quadro (protegido, validar propriedade)
8 Validar que só o dono pode editar/deletar seu quadro
9 Criar endpoint DELETE /boards/:id para deletar quadro (protegido, validar propriedade)
10 Frontend: página de listagem de quadros do usuário
11 Frontend: modal/formulário para criar novo quadro
12 Frontend: página de detalhes do quadro (editar titulo/descricao/cor)
13 Frontend: botão de delete com confirmação
14 Frontend: redirecionamento automático ao criar/editar/deletar
15 Frontend: tratamento de erros (não autorizado, quadro não existe, etc)

Intenção: O usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro

Plano:

1 Criar entidade List com campos: id, quadroId, titulo, ordem, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre Board e List (um quadro tem muitas listas)
3 Criar endpoint POST /boards/:boardId/lists para criar nova lista (protegido, validar propriedade do quadro)
4 Validar titulo não vazio e tamanho máximo (ex: 50 caracteres)
5 Atribuir ordem automaticamente (próximo número sequencial)
6 Criar endpoint GET /boards/:boardId/lists para listar listas do quadro (protegido, validar propriedade)
7 Ordenar listas por campo ordem (ASC)
8 Criar endpoint PATCH /boards/:boardId/lists/:id para renomear lista (protegido, validar propriedades)
9 Validar que só pode renomear listas do quadro que pertence ao usuário
10 Criar endpoint PATCH /boards/:boardId/lists/:id/reorder para reordenar listas (protegido)
11 Receber novo índice/ordem e reordenar todas as listas afetadas
12 Criar endpoint DELETE /boards/:boardId/lists/:id para deletar lista (protegido)
13 Validar que lista só pode ser deletada se quadro pertence ao usuário
14 Ao deletar lista, reordenar as demais listas
15 Frontend: página de quadro com listagem de listas em colunas
16 Frontend: modal/formulário para criar nova lista no quadro
17 Frontend: opção de renomear lista (inline edit ou modal)
18 Frontend: drag-and-drop ou botões para reordenar listas
19 Frontend: botão de delete lista com confirmação
20 Frontend: tratamento de erros (quadro não existe, não autorizado, etc)

Intenção: O usuário consiga criar, editar, excluir e mover cartões entre as listas de um quadro

Plano:

1 Criar entidade Card com campos: id, listaId, titulo, descricao, ordem, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre List e Card (uma lista tem muitos cartões)
3 Criar endpoint POST /boards/:boardId/lists/:listId/cards para criar novo cartão (protegido, validar propriedade)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Atribuir ordem automaticamente (próximo número sequencial na lista)
6 Criar endpoint GET /boards/:boardId/lists/:listId/cards para listar cartões da lista (protegido)
7 Ordenar cartões por campo ordem (ASC)
8 Criar endpoint GET /boards/:boardId/lists/:listId/cards/:cardId para obter detalhes do cartão (protegido)
9 Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId para editar cartão (protegido, validar propriedade)
10 Permitir editar titulo e descricao do cartão
11 Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId/move para mover cartão (protegido)
12 Suportar mover cartão para outra lista e/ou reordenar dentro da lista
13 Ajustar ordem dos cartões afetados na lista origem e destino
14 Criar endpoint DELETE /boards/:boardId/lists/:listId/cards/:cardId para deletar cartão (protegido)
15 Ao deletar cartão, reordenar os demais cartões da lista
16 Frontend: renderizar cartões dentro de cada ListColumn
17 Frontend: modal/formulário para criar novo cartão na lista
18 Frontend: modal para editar cartão (titulo, descrição)
19 Frontend: botão de delete cartão com confirmação
20 Frontend: drag-and-drop para mover cartão entre listas
21 Frontend: tratamento de erros (lista não existe, não autorizado, etc)

Intenção: Quero que o usuário consiga criar etiquetas coloridas e filtrar os cards por elas
Plano:

Salve o plano gerado em plans/RF08-plan.md

### Prompt 17

Intenção: Quero que o usuário consiga criar etiquetas coloridas e filtrar os cards por elas

Plano: @plans/RF08-plan.md

Gere o código seguindo o plano acima, passo a passo

---

### Prompt 18

Abaixo estão exemplos de intenções e seus respectivos planos de implementação

Intenção: O usuário deve conseguir se cadastrar, fazer login e continuar autenticado entre sessões

Plano:

1 Criar entidade User com campos: id, email, senha (hash), nome, dataInclusão
2 Criar endpoint POST /auth/register para cadastro com validação de email único
3 Hash da senha com bcrypt antes de persistir no banco
4 Criar endpoint POST /auth/login que valida email/senha e gera token JWT
5 Armazenar token JWT no localStorage do frontend
6 Criar middleware de autenticação para validar token nas requisições protegidas
7 Criar endpoint GET /auth/me para retornar dados do usuário autenticado
8 Implementar refresh token com expiração maior para renovar sessão
9 Frontend: interceptor HTTP para incluir token em todas as requisições
10 Frontend: verificar autenticação ao carregar app e redirecionar se inválido
11 Criar endpoint POST /auth/logout que invalida o token (opcional em JWT, blacklist se necessário)
12 Frontend: rota protegida que redireciona para login se não autenticado

Intenção: O usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros

Plano:

1 Criar entidade Board com campos: id, usuarioId, titulo, descricao, corFundo, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre User e Board (um usuário tem muitos quadros)
3 Criar endpoint POST /boards para criar novo quadro (protegido)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Criar endpoint GET /boards para listar todos os quadros do usuário autenticado (protegido)
6 Criar endpoint GET /boards/:id para obter detalhes de um quadro específico (protegido, validar propriedade)
7 Criar endpoint PATCH /boards/:id para editar quadro (protegido, validar propriedade)
8 Validar que só o dono pode editar/deletar seu quadro
9 Criar endpoint DELETE /boards/:id para deletar quadro (protegido, validar propriedade)
10 Frontend: página de listagem de quadros do usuário
11 Frontend: modal/formulário para criar novo quadro
12 Frontend: página de detalhes do quadro (editar titulo/descricao/cor)
13 Frontend: botão de delete com confirmação
14 Frontend: redirecionamento automático ao criar/editar/deletar
15 Frontend: tratamento de erros (não autorizado, quadro não existe, etc)

Intenção: O usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro

Plano:

1 Criar entidade List com campos: id, quadroId, titulo, ordem, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre Board e List (um quadro tem muitas listas)
3 Criar endpoint POST /boards/:boardId/lists para criar nova lista (protegido, validar propriedade do quadro)
4 Validar titulo não vazio e tamanho máximo (ex: 50 caracteres)
5 Atribuir ordem automaticamente (próximo número sequencial)
6 Criar endpoint GET /boards/:boardId/lists para listar listas do quadro (protegido, validar propriedade)
7 Ordenar listas por campo ordem (ASC)
8 Criar endpoint PATCH /boards/:boardId/lists/:id para renomear lista (protegido, validar propriedades)
9 Validar que só pode renomear listas do quadro que pertence ao usuário
10 Criar endpoint PATCH /boards/:boardId/lists/:id/reorder para reordenar listas (protegido)
11 Receber novo índice/ordem e reordenar todas as listas afetadas
12 Criar endpoint DELETE /boards/:boardId/lists/:id para deletar lista (protegido)
13 Validar que lista só pode ser deletada se quadro pertence ao usuário
14 Ao deletar lista, reordenar as demais listas
15 Frontend: página de quadro com listagem de listas em colunas
16 Frontend: modal/formulário para criar nova lista no quadro
17 Frontend: opção de renomear lista (inline edit ou modal)
18 Frontend: drag-and-drop ou botões para reordenar listas
19 Frontend: botão de delete lista com confirmação
20 Frontend: tratamento de erros (quadro não existe, não autorizado, etc)

Intenção: O usuário consiga criar, editar, excluir e mover cartões entre as listas de um quadro

Plano:

1 Criar entidade Card com campos: id, listaId, titulo, descricao, ordem, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre List e Card (uma lista tem muitos cartões)
3 Criar endpoint POST /boards/:boardId/lists/:listId/cards para criar novo cartão (protegido, validar propriedade)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Atribuir ordem automaticamente (próximo número sequencial na lista)
6 Criar endpoint GET /boards/:boardId/lists/:listId/cards para listar cartões da lista (protegido)
7 Ordenar cartões por campo ordem (ASC)
8 Criar endpoint GET /boards/:boardId/lists/:listId/cards/:cardId para obter detalhes do cartão (protegido)
9 Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId para editar cartão (protegido, validar propriedade)
10 Permitir editar titulo e descricao do cartão
11 Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId/move para mover cartão (protegido)
12 Suportar mover cartão para outra lista e/ou reordenar dentro da lista
13 Ajustar ordem dos cartões afetados na lista origem e destino
14 Criar endpoint DELETE /boards/:boardId/lists/:listId/cards/:cardId para deletar cartão (protegido)
15 Ao deletar cartão, reordenar os demais cartões da lista
16 Frontend: renderizar cartões dentro de cada ListColumn
17 Frontend: modal/formulário para criar novo cartão na lista
18 Frontend: modal para editar cartão (titulo, descrição)
19 Frontend: botão de delete cartão com confirmação
20 Frontend: drag-and-drop para mover cartão entre listas
21 Frontend: tratamento de erros (lista não existe, não autorizado, etc)

Intenção: Quero que o usuário consiga comentar nos cards e ver o histórico dos comentários
Plano:

Salve o plano gerado em plans/RF09-plan.md

---

### Prompt 19

Intenção: Quero que o usuário consiga comentar nos cards e ver o histórico dos comentários

Plano: @plans/RF09-plan.md

Gere o código seguindo o plano acima, passo a passo

---

### Prompt 20

Abaixo estão exemplos de intenções e seus respectivos planos de implementação

Intenção: O usuário deve conseguir se cadastrar, fazer login e continuar autenticado entre sessões

Plano:

1 Criar entidade User com campos: id, email, senha (hash), nome, dataInclusão
2 Criar endpoint POST /auth/register para cadastro com validação de email único
3 Hash da senha com bcrypt antes de persistir no banco
4 Criar endpoint POST /auth/login que valida email/senha e gera token JWT
5 Armazenar token JWT no localStorage do frontend
6 Criar middleware de autenticação para validar token nas requisições protegidas
7 Criar endpoint GET /auth/me para retornar dados do usuário autenticado
8 Implementar refresh token com expiração maior para renovar sessão
9 Frontend: interceptor HTTP para incluir token em todas as requisições
10 Frontend: verificar autenticação ao carregar app e redirecionar se inválido
11 Criar endpoint POST /auth/logout que invalida o token (opcional em JWT, blacklist se necessário)
12 Frontend: rota protegida que redireciona para login se não autenticado

Intenção: O usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros

Plano:

1 Criar entidade Board com campos: id, usuarioId, titulo, descricao, corFundo, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre User e Board (um usuário tem muitos quadros)
3 Criar endpoint POST /boards para criar novo quadro (protegido)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Criar endpoint GET /boards para listar todos os quadros do usuário autenticado (protegido)
6 Criar endpoint GET /boards/:id para obter detalhes de um quadro específico (protegido, validar propriedade)
7 Criar endpoint PATCH /boards/:id para editar quadro (protegido, validar propriedade)
8 Validar que só o dono pode editar/deletar seu quadro
9 Criar endpoint DELETE /boards/:id para deletar quadro (protegido, validar propriedade)
10 Frontend: página de listagem de quadros do usuário
11 Frontend: modal/formulário para criar novo quadro
12 Frontend: página de detalhes do quadro (editar titulo/descricao/cor)
13 Frontend: botão de delete com confirmação
14 Frontend: redirecionamento automático ao criar/editar/deletar
15 Frontend: tratamento de erros (não autorizado, quadro não existe, etc)

Intenção: O usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro

Plano:

1 Criar entidade List com campos: id, quadroId, titulo, ordem, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre Board e List (um quadro tem muitas listas)
3 Criar endpoint POST /boards/:boardId/lists para criar nova lista (protegido, validar propriedade do quadro)
4 Validar titulo não vazio e tamanho máximo (ex: 50 caracteres)
5 Atribuir ordem automaticamente (próximo número sequencial)
6 Criar endpoint GET /boards/:boardId/lists para listar listas do quadro (protegido, validar propriedade)
7 Ordenar listas por campo ordem (ASC)
8 Criar endpoint PATCH /boards/:boardId/lists/:id para renomear lista (protegido, validar propriedades)
9 Validar que só pode renomear listas do quadro que pertence ao usuário
10 Criar endpoint PATCH /boards/:boardId/lists/:id/reorder para reordenar listas (protegido)
11 Receber novo índice/ordem e reordenar todas as listas afetadas
12 Criar endpoint DELETE /boards/:boardId/lists/:id para deletar lista (protegido)
13 Validar que lista só pode ser deletada se quadro pertence ao usuário
14 Ao deletar lista, reordenar as demais listas
15 Frontend: página de quadro com listagem de listas em colunas
16 Frontend: modal/formulário para criar nova lista no quadro
17 Frontend: opção de renomear lista (inline edit ou modal)
18 Frontend: drag-and-drop ou botões para reordenar listas
19 Frontend: botão de delete lista com confirmação
20 Frontend: tratamento de erros (quadro não existe, não autorizado, etc)

Intenção: O usuário consiga criar, editar, excluir e mover cartões entre as listas de um quadro

Plano:

1 Criar entidade Card com campos: id, listaId, titulo, descricao, ordem, dataCriacao, dataAtualizacao
2 Criar relacionamento 1-N entre List e Card (uma lista tem muitos cartões)
3 Criar endpoint POST /boards/:boardId/lists/:listId/cards para criar novo cartão (protegido, validar propriedade)
4 Validar titulo não vazio e tamanho máximo (ex: 100 caracteres)
5 Atribuir ordem automaticamente (próximo número sequencial na lista)
6 Criar endpoint GET /boards/:boardId/lists/:listId/cards para listar cartões da lista (protegido)
7 Ordenar cartões por campo ordem (ASC)
8 Criar endpoint GET /boards/:boardId/lists/:listId/cards/:cardId para obter detalhes do cartão (protegido)
9 Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId para editar cartão (protegido, validar propriedade)
10 Permitir editar titulo e descricao do cartão
11 Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId/move para mover cartão (protegido)
12 Suportar mover cartão para outra lista e/ou reordenar dentro da lista
13 Ajustar ordem dos cartões afetados na lista origem e destino
14 Criar endpoint DELETE /boards/:boardId/lists/:listId/cards/:cardId para deletar cartão (protegido)
15 Ao deletar cartão, reordenar os demais cartões da lista
16 Frontend: renderizar cartões dentro de cada ListColumn
17 Frontend: modal/formulário para criar novo cartão na lista
18 Frontend: modal para editar cartão (titulo, descrição)
19 Frontend: botão de delete cartão com confirmação
20 Frontend: drag-and-drop para mover cartão entre listas
21 Frontend: tratamento de erros (lista não existe, não autorizado, etc)

Intenção: Quero que o usuário consiga definir prazos nos cards e identificar quais estão atrasados
Plano:

Salve o plano gerado em plans/RF10-plan.md

---

### Prompt 21

Intenção: Quero que o usuário consiga definir prazos nos cards e identificar quais estão atrasados

Plano: @plans/RF10-plan.md

Gere o código seguindo o plano acima, passo a passo

---
