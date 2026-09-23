# RF07 - Membros do quadro e responsáveis pelos cards

Intenção: Quero que o administrador do quadro consiga convidar e gerenciar membros com papéis diferentes, e atribuí-los a cards

Plano:

1 Criar um modelo de membro do quadro com o papel, a situação do convite, o e-mail convidado e o vínculo com o quadro

2 Registrar o proprietário do quadro como membro administrador ativo na criação do quadro

3 Criar um endpoint para convidar um membro por e-mail, recebendo também o papel

4 Vincular o convite ao usuário já cadastrado com aquele e-mail e deixá-lo ativo

5 Manter o convite pendente quando o e-mail ainda não tiver cadastro

6 Ativar os convites pendentes do e-mail assim que o usuário se cadastrar

7 Recusar o convite quando o e-mail já for membro do quadro

8 Criar um endpoint para listar os membros do quadro com nome, e-mail, papel e situação

9 Criar um endpoint para alterar o papel de um membro

10 Criar um endpoint para remover um membro do quadro

11 Impedir alterar o papel ou remover o proprietário do quadro

12 Permitir convidar, alterar papel e remover apenas para administradores do quadro

13 Substituir a verificação de proprietário pelo acesso de membro nas operações de leitura do quadro

14 Exigir papel de administrador para criar, editar e excluir listas e para editar e excluir o quadro

15 Permitir que membros criem, editem, movam e excluam cards do quadro

16 Criar um modelo de responsável ligando um membro do quadro a um card

17 Criar um endpoint para atribuir um membro do quadro como responsável por um card

18 Criar um endpoint para remover um responsável de um card

19 Recusar como responsável quem não for membro do quadro

20 Expor os responsáveis junto dos cards do quadro

21 Ao remover um membro, remover também as atribuições dele nos cards

22 Proteger todos os endpoints com o middleware de autenticação existente

23 Exibir os avatares dos membros no topo da tela do quadro, seguindo o protótipo

24 Criar o modal de membros do quadro com o formulário de convite por e-mail e papel

25 Listar os membros com avatar, nome, e-mail, marcação de você, situação do convite e seletor de papel

26 Permitir remover um membro pela lixeira, pedindo confirmação

27 Ocultar as ações de gerenciamento para quem não for administrador do quadro

28 Exibir os responsáveis no modal de detalhe do card e permitir adicionar e remover

29 Exibir os avatares dos responsáveis no card dentro da coluna

30 Atualizar a tela após cada operação sem recarregar a página

31 Tratar e exibir os erros retornados pela API em cada operação
