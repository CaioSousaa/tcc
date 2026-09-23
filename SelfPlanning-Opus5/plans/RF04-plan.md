# RF04 - Cards nas listas de um quadro

Intenção: Quero que o usuário consiga criar, editar, excluir e mover cards entre as listas de um quadro

Plano:

1 Criar um modelo de card com título, descrição, prazo, posição e vínculo com a lista

2 Criar um endpoint para criar um card dentro de uma lista

3 Validar o título informado e colocar o novo card no fim da lista

4 Verificar se a lista pertence a um quadro do usuário autenticado antes de qualquer operação de card

5 Criar um endpoint para listar os cards de um quadro agrupados por lista e em ordem de posição

6 Criar um endpoint para editar o título, a descrição e o prazo de um card

7 Criar um endpoint para mover um card para outra lista e para uma nova posição

8 Recalcular a posição dos cards da lista de origem e da lista de destino após a mudança

9 Criar um endpoint para excluir um card

10 Ao excluir um card, fechar a numeração das posições restantes da lista

11 Retornar erro de não encontrado quando o card não existir ou não for da lista informada

12 Ao excluir uma lista, excluir também os cards vinculados a ela

13 Proteger todos os endpoints com o middleware de autenticação existente

14 Exibir os cards dentro de cada coluna da tela do quadro, seguindo o protótipo

15 Exibir o prazo no card e destacar quando ele estiver atrasado

16 Exibir a contagem de cards no cabeçalho de cada lista

17 Criar o botão de adicionar card ao final de cada coluna

18 Criar o modal de detalhe do card com título, descrição, lista e prazo

19 Reaproveitar o mesmo modal para criar um card e para editar um card existente

20 Permitir mover o card para outra lista pelo seletor de lista do modal

21 Permitir mover cards entre colunas por arraste, salvando a lista e a posição na API

22 Pedir confirmação antes de excluir um card e avisar que a ação é definitiva

23 Atualizar as colunas após cada operação sem recarregar a página

24 Tratar e exibir os erros retornados pela API em cada operação
