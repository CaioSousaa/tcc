# RF03 - Listas dentro de um quadro

Intenção: Quero que o usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro

Plano:

1 Criar um modelo de lista com nome, posição e vínculo com o quadro

2 Criar um endpoint para criar uma lista dentro de um quadro

3 Validar o nome informado e colocar a nova lista no fim do quadro

4 Verificar se o quadro pertence ao usuário autenticado antes de qualquer operação de lista

5 Criar um endpoint para listar as listas de um quadro em ordem de posição

6 Criar um endpoint para renomear uma lista existente

7 Criar um endpoint para mover uma lista para uma nova posição no quadro

8 Recalcular a posição das demais listas do quadro após a mudança

9 Criar um endpoint para excluir uma lista

10 Ao excluir uma lista, fechar a numeração das posições restantes

11 Retornar erro de não encontrado quando a lista não existir ou não for do quadro informado

12 Proteger todos os endpoints com o middleware de autenticação existente

13 Criar a tela do quadro exibindo as listas em colunas horizontais, seguindo o protótipo

14 Exibir o nome do quadro e o caminho de volta para os quadros no topo da tela

15 Criar a coluna de adicionar lista ao final das colunas existentes

16 Criar o modal de lista com o campo de nome e a escolha de posição no quadro

17 Reaproveitar o mesmo modal para renomear e reposicionar uma lista existente

18 Permitir reordenar as listas por arraste, salvando a nova posição na API

19 Pedir confirmação antes de excluir uma lista e avisar que a ação é definitiva

20 Atualizar as colunas após cada operação sem recarregar a página

21 Tratar e exibir os erros retornados pela API em cada operação
