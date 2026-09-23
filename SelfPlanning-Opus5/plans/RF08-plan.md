# RF08 - Etiquetas coloridas e filtro de cards

Intenção: Quero que o usuário consiga criar etiquetas coloridas e filtrar os cards por elas

Plano:

1 Criar um modelo de etiqueta com nome, cor e vínculo com o quadro

2 Criar um modelo que ligue uma etiqueta a um card

3 Criar um endpoint para criar uma etiqueta em um quadro

4 Validar o nome informado e aceitar apenas as cores previstas no protótipo

5 Recusar a criação quando o quadro já tiver uma etiqueta com o mesmo nome

6 Criar um endpoint para listar as etiquetas de um quadro com a contagem de cards de cada uma

7 Criar um endpoint para renomear uma etiqueta e trocar a cor dela

8 Criar um endpoint para excluir uma etiqueta

9 Ao excluir uma etiqueta, removê-la dos cards em que estava aplicada

10 Exigir papel de administrador para criar, editar e excluir etiquetas do quadro

11 Criar um endpoint para aplicar uma etiqueta a um card

12 Criar um endpoint para remover uma etiqueta de um card

13 Recusar a etiqueta que não for do mesmo quadro do card

14 Permitir que qualquer membro do quadro aplique e remova etiquetas nos cards

15 Expor as etiquetas junto dos cards do quadro

16 Aceitar na listagem de cards o filtro por etiquetas como parâmetro opcional

17 Retornar apenas os cards que tiverem pelo menos uma das etiquetas informadas

18 Retornar erro de não encontrado quando a etiqueta não existir ou não for do quadro informado

19 Proteger todos os endpoints com o middleware de autenticação existente

20 Criar a barra de filtro por etiqueta no topo do quadro, seguindo o protótipo

21 Exibir a opção Todas junto das etiquetas do quadro na barra de filtro

22 Filtrar os cards das colunas pela etiqueta escolhida

23 Exibir a contagem de cards visíveis no quadro ao lado do filtro

24 Criar o modal de etiquetas do quadro com a lista de etiquetas e a contagem de cada uma

25 Criar no modal o formulário de nova etiqueta com nome e escolha de cor

26 Permitir renomear, trocar a cor e excluir uma etiqueta pelo modal

27 Ocultar as ações de criar, editar e excluir etiquetas para quem não for administrador

28 Marcar no modal as etiquetas aplicadas ao card aberto e permitir aplicar ou remover

29 Exibir as etiquetas aplicadas como chips coloridos no card dentro da coluna

30 Atualizar a tela após cada operação sem recarregar a página

31 Tratar e exibir os erros retornados pela API em cada operação
