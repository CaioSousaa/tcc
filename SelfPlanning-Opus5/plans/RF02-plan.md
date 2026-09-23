# RF02 - CRUD de quadros do usuário autenticado

Intenção: Quero que o usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros

Plano:

1 Criar um modelo de quadro com nome, cor e vínculo com o usuário dono

2 Criar um endpoint para criar um quadro a partir do usuário autenticado

3 Validar o nome informado e aceitar apenas as cores previstas no protótipo

4 Criar um endpoint para listar os quadros do usuário autenticado

5 Ordenar a listagem do quadro mais recente para o mais antigo

6 Criar um endpoint para buscar um quadro pelo identificador

7 Recusar o acesso a um quadro que não pertence ao usuário autenticado

8 Criar um endpoint para editar o nome e a cor de um quadro existente

9 Criar um endpoint para excluir um quadro do usuário autenticado

10 Retornar erro de não encontrado quando o quadro não existir

11 Proteger todas as rotas de quadro com o middleware de autenticação

12 Criar a tela de quadros listando os quadros do usuário em cards, seguindo o protótipo

13 Exibir um estado vazio com o convite para criar o primeiro quadro

14 Criar o modal de novo quadro com o campo de nome e a escolha de cor

15 Atualizar a listagem após a criação sem recarregar a página

16 Criar o modal de edição reaproveitando o formulário do novo quadro

17 Pedir confirmação antes de excluir um quadro e avisar que a ação é definitiva

18 Tratar e exibir os erros retornados pela API em cada operação
