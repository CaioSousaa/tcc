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

Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões
Plano:

1 Criar um endpoint para cadastro de usuário, recebendo nome, e-mail e senha
2 Validar se o e-mail já está cadastrado na base
3 Criptografar a senha antes de persistir o usuário
4 Criar um endpoint para login, recebendo e-mail e senha
5 Verificar as credenciais informadas contra a base de usuários
6 Gerar um token de acesso (JWT) e um token de renovação (refresh token) ao autenticar com sucesso
7 Persistir o refresh token vinculado ao usuário para permitir revogação
8 Criar um endpoint para renovar o token de acesso a partir do refresh token válido
9 Criar um middleware de autenticação que valide o token de acesso nas rotas protegidas
10 Retornar erro de não autorizado quando o token estiver ausente, inválido ou expirado
11 Criar um endpoint de logout que invalide o refresh token do usuário

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

Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões
Plano:

1 Criar um endpoint para cadastro de usuário, recebendo nome, e-mail e senha
2 Validar se o e-mail já está cadastrado na base
3 Criptografar a senha antes de persistir o usuário
4 Criar um endpoint para login, recebendo e-mail e senha
5 Verificar as credenciais informadas contra a base de usuários
6 Gerar um token de acesso (JWT) e um token de renovação (refresh token) ao autenticar com sucesso
7 Persistir o refresh token vinculado ao usuário para permitir revogação
8 Criar um endpoint para renovar o token de acesso a partir do refresh token válido
9 Criar um middleware de autenticação que valide o token de acesso nas rotas protegidas
10 Retornar erro de não autorizado quando o token estiver ausente, inválido ou expirado
11 Criar um endpoint de logout que invalide o refresh token do usuário

Intenção: Quero que o usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros
Plano:

1 Criar um modelo de quadro vinculado ao usuário autenticado como proprietário
2 Criar um endpoint para criar um quadro, recebendo nome e cor/identificação visual
3 Criar um endpoint para listar os quadros do usuário autenticado
4 Criar um endpoint para obter um quadro específico pelo id
5 Verificar se o quadro pertence ao usuário autenticado antes de retornar, editar ou excluir
6 Se o quadro não existir ou não pertencer ao usuário, retornar erro de não encontrado
7 Criar um endpoint para editar um quadro, permitindo atualizar nome e cor/identificação visual
8 Criar um endpoint para excluir um quadro
9 Ao excluir um quadro, excluir também os dados vinculados a ele (listas e cards)
10 Proteger todos os endpoints com o middleware de autenticação existente

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

Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões
Plano:

1 Criar um endpoint para cadastro de usuário, recebendo nome, e-mail e senha
2 Validar se o e-mail já está cadastrado na base
3 Criptografar a senha antes de persistir o usuário
4 Criar um endpoint para login, recebendo e-mail e senha
5 Verificar as credenciais informadas contra a base de usuários
6 Gerar um token de acesso (JWT) e um token de renovação (refresh token) ao autenticar com sucesso
7 Persistir o refresh token vinculado ao usuário para permitir revogação
8 Criar um endpoint para renovar o token de acesso a partir do refresh token válido
9 Criar um middleware de autenticação que valide o token de acesso nas rotas protegidas
10 Retornar erro de não autorizado quando o token estiver ausente, inválido ou expirado
11 Criar um endpoint de logout que invalide o refresh token do usuário

Intenção: Quero que o usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros
Plano:

1 Criar um modelo de quadro vinculado ao usuário autenticado como proprietário
2 Criar um endpoint para criar um quadro, recebendo nome e cor/identificação visual
3 Criar um endpoint para listar os quadros do usuário autenticado
4 Criar um endpoint para obter um quadro específico pelo id
5 Verificar se o quadro pertence ao usuário autenticado antes de retornar, editar ou excluir
6 Se o quadro não existir ou não pertencer ao usuário, retornar erro de não encontrado
7 Criar um endpoint para editar um quadro, permitindo atualizar nome e cor/identificação visual
8 Criar um endpoint para excluir um quadro
9 Ao excluir um quadro, excluir também os dados vinculados a ele (listas e cards)
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro
Plano:

1 Criar um modelo de lista vinculado a um quadro, com um campo de posição para ordenação
2 Verificar se o quadro pertence ao usuário autenticado antes de criar, listar, renomear, reordenar ou excluir suas listas
3 Criar um endpoint para criar uma lista em um quadro, recebendo o nome e atribuindo a próxima posição disponível
4 Criar um endpoint para listar as listas de um quadro, ordenadas pela posição
5 Criar um endpoint para renomear uma lista
6 Criar um endpoint para reordenar as listas de um quadro, recebendo a nova ordem dos ids e atualizando a posição de cada uma
7 Criar um endpoint para excluir uma lista
8 Ao excluir uma lista, excluir também os cards vinculados a ela
9 Se o quadro ou a lista não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado
10 Proteger todos os endpoints com o middleware de autenticação existente

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

Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões
Plano:

1 Criar um endpoint para cadastro de usuário, recebendo nome, e-mail e senha
2 Validar se o e-mail já está cadastrado na base
3 Criptografar a senha antes de persistir o usuário
4 Criar um endpoint para login, recebendo e-mail e senha
5 Verificar as credenciais informadas contra a base de usuários
6 Gerar um token de acesso (JWT) e um token de renovação (refresh token) ao autenticar com sucesso
7 Persistir o refresh token vinculado ao usuário para permitir revogação
8 Criar um endpoint para renovar o token de acesso a partir do refresh token válido
9 Criar um middleware de autenticação que valide o token de acesso nas rotas protegidas
10 Retornar erro de não autorizado quando o token estiver ausente, inválido ou expirado
11 Criar um endpoint de logout que invalide o refresh token do usuário

Intenção: Quero que o usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros
Plano:

1 Criar um modelo de quadro vinculado ao usuário autenticado como proprietário
2 Criar um endpoint para criar um quadro, recebendo nome e cor/identificação visual
3 Criar um endpoint para listar os quadros do usuário autenticado
4 Criar um endpoint para obter um quadro específico pelo id
5 Verificar se o quadro pertence ao usuário autenticado antes de retornar, editar ou excluir
6 Se o quadro não existir ou não pertencer ao usuário, retornar erro de não encontrado
7 Criar um endpoint para editar um quadro, permitindo atualizar nome e cor/identificação visual
8 Criar um endpoint para excluir um quadro
9 Ao excluir um quadro, excluir também os dados vinculados a ele (listas e cards)
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro
Plano:

1 Criar um modelo de lista vinculado a um quadro, com um campo de posição para ordenação
2 Verificar se o quadro pertence ao usuário autenticado antes de criar, listar, renomear, reordenar ou excluir suas listas
3 Criar um endpoint para criar uma lista em um quadro, recebendo o nome e atribuindo a próxima posição disponível
4 Criar um endpoint para listar as listas de um quadro, ordenadas pela posição
5 Criar um endpoint para renomear uma lista
6 Criar um endpoint para reordenar as listas de um quadro, recebendo a nova ordem dos ids e atualizando a posição de cada uma
7 Criar um endpoint para excluir uma lista
8 Ao excluir uma lista, excluir também os cards vinculados a ela
9 Se o quadro ou a lista não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar, editar, excluir e mover cards entre as listas de um quadro
Plano:

1 Criar um modelo de card vinculado a uma lista, com um campo de posição para ordenação dentro da lista
2 Verificar se a lista pertence a um quadro do usuário autenticado antes de criar, ver, listar, editar, mover ou excluir seus cards
3 Criar um endpoint para criar um card em uma lista, recebendo título e atribuindo a próxima posição disponível
4 Criar um endpoint para listar os cards de uma lista, ordenados pela posição
5 Criar um endpoint para obter um card específico pelo id
6 Criar um endpoint para editar um card, permitindo atualizar título e descrição
7 Criar um endpoint para mover um card, recebendo a lista de destino e a nova posição, e atualizando a posição dos demais cards afetados na lista de origem e na de destino
8 Criar um endpoint para excluir um card
9 Se o quadro, a lista ou o card não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado
10 Proteger todos os endpoints com o middleware de autenticação existente

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

Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões
Plano:

1 Criar um endpoint para cadastro de usuário, recebendo nome, e-mail e senha
2 Validar se o e-mail já está cadastrado na base
3 Criptografar a senha antes de persistir o usuário
4 Criar um endpoint para login, recebendo e-mail e senha
5 Verificar as credenciais informadas contra a base de usuários
6 Gerar um token de acesso (JWT) e um token de renovação (refresh token) ao autenticar com sucesso
7 Persistir o refresh token vinculado ao usuário para permitir revogação
8 Criar um endpoint para renovar o token de acesso a partir do refresh token válido
9 Criar um middleware de autenticação que valide o token de acesso nas rotas protegidas
10 Retornar erro de não autorizado quando o token estiver ausente, inválido ou expirado
11 Criar um endpoint de logout que invalide o refresh token do usuário

Intenção: Quero que o usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros
Plano:

1 Criar um modelo de quadro vinculado ao usuário autenticado como proprietário
2 Criar um endpoint para criar um quadro, recebendo nome e cor/identificação visual
3 Criar um endpoint para listar os quadros do usuário autenticado
4 Criar um endpoint para obter um quadro específico pelo id
5 Verificar se o quadro pertence ao usuário autenticado antes de retornar, editar ou excluir
6 Se o quadro não existir ou não pertencer ao usuário, retornar erro de não encontrado
7 Criar um endpoint para editar um quadro, permitindo atualizar nome e cor/identificação visual
8 Criar um endpoint para excluir um quadro
9 Ao excluir um quadro, excluir também os dados vinculados a ele (listas e cards)
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro
Plano:

1 Criar um modelo de lista vinculado a um quadro, com um campo de posição para ordenação
2 Verificar se o quadro pertence ao usuário autenticado antes de criar, listar, renomear, reordenar ou excluir suas listas
3 Criar um endpoint para criar uma lista em um quadro, recebendo o nome e atribuindo a próxima posição disponível
4 Criar um endpoint para listar as listas de um quadro, ordenadas pela posição
5 Criar um endpoint para renomear uma lista
6 Criar um endpoint para reordenar as listas de um quadro, recebendo a nova ordem dos ids e atualizando a posição de cada uma
7 Criar um endpoint para excluir uma lista
8 Ao excluir uma lista, excluir também os cards vinculados a ela
9 Se o quadro ou a lista não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar, editar, excluir e mover cards entre as listas de um quadro
Plano:

1 Criar um modelo de card vinculado a uma lista, com um campo de posição para ordenação dentro da lista
2 Verificar se a lista pertence a um quadro do usuário autenticado antes de criar, ver, listar, editar, mover ou excluir seus cards
3 Criar um endpoint para criar um card em uma lista, recebendo título e atribuindo a próxima posição disponível
4 Criar um endpoint para listar os cards de uma lista, ordenados pela posição
5 Criar um endpoint para obter um card específico pelo id
6 Criar um endpoint para editar um card, permitindo atualizar título e descrição
7 Criar um endpoint para mover um card, recebendo a lista de destino e a nova posição, e atualizando a posição dos demais cards afetados na lista de origem e na de destino
8 Criar um endpoint para excluir um card
9 Se o quadro, a lista ou o card não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado
10 Proteger todos os endpoints com o middleware de autenticação existente

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

Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões
Plano:

1 Criar um endpoint para cadastro de usuário, recebendo nome, e-mail e senha
2 Validar se o e-mail já está cadastrado na base
3 Criptografar a senha antes de persistir o usuário
4 Criar um endpoint para login, recebendo e-mail e senha
5 Verificar as credenciais informadas contra a base de usuários
6 Gerar um token de acesso (JWT) e um token de renovação (refresh token) ao autenticar com sucesso
7 Persistir o refresh token vinculado ao usuário para permitir revogação
8 Criar um endpoint para renovar o token de acesso a partir do refresh token válido
9 Criar um middleware de autenticação que valide o token de acesso nas rotas protegidas
10 Retornar erro de não autorizado quando o token estiver ausente, inválido ou expirado
11 Criar um endpoint de logout que invalide o refresh token do usuário

Intenção: Quero que o usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros
Plano:

1 Criar um modelo de quadro vinculado ao usuário autenticado como proprietário
2 Criar um endpoint para criar um quadro, recebendo nome e cor/identificação visual
3 Criar um endpoint para listar os quadros do usuário autenticado
4 Criar um endpoint para obter um quadro específico pelo id
5 Verificar se o quadro pertence ao usuário autenticado antes de retornar, editar ou excluir
6 Se o quadro não existir ou não pertencer ao usuário, retornar erro de não encontrado
7 Criar um endpoint para editar um quadro, permitindo atualizar nome e cor/identificação visual
8 Criar um endpoint para excluir um quadro
9 Ao excluir um quadro, excluir também os dados vinculados a ele (listas e cards)
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro
Plano:

1 Criar um modelo de lista vinculado a um quadro, com um campo de posição para ordenação
2 Verificar se o quadro pertence ao usuário autenticado antes de criar, listar, renomear, reordenar ou excluir suas listas
3 Criar um endpoint para criar uma lista em um quadro, recebendo o nome e atribuindo a próxima posição disponível
4 Criar um endpoint para listar as listas de um quadro, ordenadas pela posição
5 Criar um endpoint para renomear uma lista
6 Criar um endpoint para reordenar as listas de um quadro, recebendo a nova ordem dos ids e atualizando a posição de cada uma
7 Criar um endpoint para excluir uma lista
8 Ao excluir uma lista, excluir também os cards vinculados a ela
9 Se o quadro ou a lista não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar, editar, excluir e mover cards entre as listas de um quadro
Plano:

1 Criar um modelo de card vinculado a uma lista, com um campo de posição para ordenação dentro da lista
2 Verificar se a lista pertence a um quadro do usuário autenticado antes de criar, ver, listar, editar, mover ou excluir seus cards
3 Criar um endpoint para criar um card em uma lista, recebendo título e atribuindo a próxima posição disponível
4 Criar um endpoint para listar os cards de uma lista, ordenados pela posição
5 Criar um endpoint para obter um card específico pelo id
6 Criar um endpoint para editar um card, permitindo atualizar título e descrição
7 Criar um endpoint para mover um card, recebendo a lista de destino e a nova posição, e atualizando a posição dos demais cards afetados na lista de origem e na de destino
8 Criar um endpoint para excluir um card
9 Se o quadro, a lista ou o card não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado
10 Proteger todos os endpoints com o middleware de autenticação existente

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

Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões
Plano:

1 Criar um endpoint para cadastro de usuário, recebendo nome, e-mail e senha
2 Validar se o e-mail já está cadastrado na base
3 Criptografar a senha antes de persistir o usuário
4 Criar um endpoint para login, recebendo e-mail e senha
5 Verificar as credenciais informadas contra a base de usuários
6 Gerar um token de acesso (JWT) e um token de renovação (refresh token) ao autenticar com sucesso
7 Persistir o refresh token vinculado ao usuário para permitir revogação
8 Criar um endpoint para renovar o token de acesso a partir do refresh token válido
9 Criar um middleware de autenticação que valide o token de acesso nas rotas protegidas
10 Retornar erro de não autorizado quando o token estiver ausente, inválido ou expirado
11 Criar um endpoint de logout que invalide o refresh token do usuário

Intenção: Quero que o usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros
Plano:

1 Criar um modelo de quadro vinculado ao usuário autenticado como proprietário
2 Criar um endpoint para criar um quadro, recebendo nome e cor/identificação visual
3 Criar um endpoint para listar os quadros do usuário autenticado
4 Criar um endpoint para obter um quadro específico pelo id
5 Verificar se o quadro pertence ao usuário autenticado antes de retornar, editar ou excluir
6 Se o quadro não existir ou não pertencer ao usuário, retornar erro de não encontrado
7 Criar um endpoint para editar um quadro, permitindo atualizar nome e cor/identificação visual
8 Criar um endpoint para excluir um quadro
9 Ao excluir um quadro, excluir também os dados vinculados a ele (listas e cards)
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro
Plano:

1 Criar um modelo de lista vinculado a um quadro, com um campo de posição para ordenação
2 Verificar se o quadro pertence ao usuário autenticado antes de criar, listar, renomear, reordenar ou excluir suas listas
3 Criar um endpoint para criar uma lista em um quadro, recebendo o nome e atribuindo a próxima posição disponível
4 Criar um endpoint para listar as listas de um quadro, ordenadas pela posição
5 Criar um endpoint para renomear uma lista
6 Criar um endpoint para reordenar as listas de um quadro, recebendo a nova ordem dos ids e atualizando a posição de cada uma
7 Criar um endpoint para excluir uma lista
8 Ao excluir uma lista, excluir também os cards vinculados a ela
9 Se o quadro ou a lista não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar, editar, excluir e mover cards entre as listas de um quadro
Plano:

1 Criar um modelo de card vinculado a uma lista, com um campo de posição para ordenação dentro da lista
2 Verificar se a lista pertence a um quadro do usuário autenticado antes de criar, ver, listar, editar, mover ou excluir seus cards
3 Criar um endpoint para criar um card em uma lista, recebendo título e atribuindo a próxima posição disponível
4 Criar um endpoint para listar os cards de uma lista, ordenados pela posição
5 Criar um endpoint para obter um card específico pelo id
6 Criar um endpoint para editar um card, permitindo atualizar título e descrição
7 Criar um endpoint para mover um card, recebendo a lista de destino e a nova posição, e atualizando a posição dos demais cards afetados na lista de origem e na de destino
8 Criar um endpoint para excluir um card
9 Se o quadro, a lista ou o card não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar etiquetas coloridas e filtrar os cards por elas
Plano:

Salve o plano gerado em plans/RF08-plan.md

---

### Prompt 17

Intenção: Quero que o usuário consiga criar etiquetas coloridas e filtrar os cards por elas

Plano: @plans/RF08-plan.md

Gere o código seguindo o plano acima, passo a passo

---

### Prompt 18

Abaixo estão exemplos de intenções e seus respectivos planos de implementação

Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões
Plano:

1 Criar um endpoint para cadastro de usuário, recebendo nome, e-mail e senha
2 Validar se o e-mail já está cadastrado na base
3 Criptografar a senha antes de persistir o usuário
4 Criar um endpoint para login, recebendo e-mail e senha
5 Verificar as credenciais informadas contra a base de usuários
6 Gerar um token de acesso (JWT) e um token de renovação (refresh token) ao autenticar com sucesso
7 Persistir o refresh token vinculado ao usuário para permitir revogação
8 Criar um endpoint para renovar o token de acesso a partir do refresh token válido
9 Criar um middleware de autenticação que valide o token de acesso nas rotas protegidas
10 Retornar erro de não autorizado quando o token estiver ausente, inválido ou expirado
11 Criar um endpoint de logout que invalide o refresh token do usuário

Intenção: Quero que o usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros
Plano:

1 Criar um modelo de quadro vinculado ao usuário autenticado como proprietário
2 Criar um endpoint para criar um quadro, recebendo nome e cor/identificação visual
3 Criar um endpoint para listar os quadros do usuário autenticado
4 Criar um endpoint para obter um quadro específico pelo id
5 Verificar se o quadro pertence ao usuário autenticado antes de retornar, editar ou excluir
6 Se o quadro não existir ou não pertencer ao usuário, retornar erro de não encontrado
7 Criar um endpoint para editar um quadro, permitindo atualizar nome e cor/identificação visual
8 Criar um endpoint para excluir um quadro
9 Ao excluir um quadro, excluir também os dados vinculados a ele (listas e cards)
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro
Plano:

1 Criar um modelo de lista vinculado a um quadro, com um campo de posição para ordenação
2 Verificar se o quadro pertence ao usuário autenticado antes de criar, listar, renomear, reordenar ou excluir suas listas
3 Criar um endpoint para criar uma lista em um quadro, recebendo o nome e atribuindo a próxima posição disponível
4 Criar um endpoint para listar as listas de um quadro, ordenadas pela posição
5 Criar um endpoint para renomear uma lista
6 Criar um endpoint para reordenar as listas de um quadro, recebendo a nova ordem dos ids e atualizando a posição de cada uma
7 Criar um endpoint para excluir uma lista
8 Ao excluir uma lista, excluir também os cards vinculados a ela
9 Se o quadro ou a lista não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar, editar, excluir e mover cards entre as listas de um quadro
Plano:

1 Criar um modelo de card vinculado a uma lista, com um campo de posição para ordenação dentro da lista
2 Verificar se a lista pertence a um quadro do usuário autenticado antes de criar, ver, listar, editar, mover ou excluir seus cards
3 Criar um endpoint para criar um card em uma lista, recebendo título e atribuindo a próxima posição disponível
4 Criar um endpoint para listar os cards de uma lista, ordenados pela posição
5 Criar um endpoint para obter um card específico pelo id
6 Criar um endpoint para editar um card, permitindo atualizar título e descrição
7 Criar um endpoint para mover um card, recebendo a lista de destino e a nova posição, e atualizando a posição dos demais cards afetados na lista de origem e na de destino
8 Criar um endpoint para excluir um card
9 Se o quadro, a lista ou o card não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado
10 Proteger todos os endpoints com o middleware de autenticação existente

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

Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões
Plano:

1 Criar um endpoint para cadastro de usuário, recebendo nome, e-mail e senha
2 Validar se o e-mail já está cadastrado na base
3 Criptografar a senha antes de persistir o usuário
4 Criar um endpoint para login, recebendo e-mail e senha
5 Verificar as credenciais informadas contra a base de usuários
6 Gerar um token de acesso (JWT) e um token de renovação (refresh token) ao autenticar com sucesso
7 Persistir o refresh token vinculado ao usuário para permitir revogação
8 Criar um endpoint para renovar o token de acesso a partir do refresh token válido
9 Criar um middleware de autenticação que valide o token de acesso nas rotas protegidas
10 Retornar erro de não autorizado quando o token estiver ausente, inválido ou expirado
11 Criar um endpoint de logout que invalide o refresh token do usuário

Intenção: Quero que o usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros
Plano:

1 Criar um modelo de quadro vinculado ao usuário autenticado como proprietário
2 Criar um endpoint para criar um quadro, recebendo nome e cor/identificação visual
3 Criar um endpoint para listar os quadros do usuário autenticado
4 Criar um endpoint para obter um quadro específico pelo id
5 Verificar se o quadro pertence ao usuário autenticado antes de retornar, editar ou excluir
6 Se o quadro não existir ou não pertencer ao usuário, retornar erro de não encontrado
7 Criar um endpoint para editar um quadro, permitindo atualizar nome e cor/identificação visual
8 Criar um endpoint para excluir um quadro
9 Ao excluir um quadro, excluir também os dados vinculados a ele (listas e cards)
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro
Plano:

1 Criar um modelo de lista vinculado a um quadro, com um campo de posição para ordenação
2 Verificar se o quadro pertence ao usuário autenticado antes de criar, listar, renomear, reordenar ou excluir suas listas
3 Criar um endpoint para criar uma lista em um quadro, recebendo o nome e atribuindo a próxima posição disponível
4 Criar um endpoint para listar as listas de um quadro, ordenadas pela posição
5 Criar um endpoint para renomear uma lista
6 Criar um endpoint para reordenar as listas de um quadro, recebendo a nova ordem dos ids e atualizando a posição de cada uma
7 Criar um endpoint para excluir uma lista
8 Ao excluir uma lista, excluir também os cards vinculados a ela
9 Se o quadro ou a lista não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga criar, editar, excluir e mover cards entre as listas de um quadro
Plano:

1 Criar um modelo de card vinculado a uma lista, com um campo de posição para ordenação dentro da lista
2 Verificar se a lista pertence a um quadro do usuário autenticado antes de criar, ver, listar, editar, mover ou excluir seus cards
3 Criar um endpoint para criar um card em uma lista, recebendo título e atribuindo a próxima posição disponível
4 Criar um endpoint para listar os cards de uma lista, ordenados pela posição
5 Criar um endpoint para obter um card específico pelo id
6 Criar um endpoint para editar um card, permitindo atualizar título e descrição
7 Criar um endpoint para mover um card, recebendo a lista de destino e a nova posição, e atualizando a posição dos demais cards afetados na lista de origem e na de destino
8 Criar um endpoint para excluir um card
9 Se o quadro, a lista ou o card não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado
10 Proteger todos os endpoints com o middleware de autenticação existente

Intenção: Quero que o usuário consiga definir prazos nos cards e identificar quais estão atrasados
Plano:

Salve o plano gerado em plans/RF10-plan.md

---

### Prompt 21

Intenção: Quero que o usuário consiga definir prazos nos cards e identificar quais estão atrasados

Plano: @plans/RF10-plan.md

Gere o código seguindo o plano acima, passo a passo
