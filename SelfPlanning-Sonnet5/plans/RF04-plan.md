Intenção: Quero que o usuário consiga criar, editar, excluir e mover cards entre as listas de um quadro
Plano:
1. Criar um modelo de card vinculado a uma lista, com um campo de posição para ordenação dentro da lista.
2. Verificar se a lista pertence a um quadro do usuário autenticado antes de criar, ver, listar, editar, mover ou excluir seus cards.
3. Criar um endpoint para criar um card em uma lista, recebendo título e atribuindo a próxima posição disponível.
4. Criar um endpoint para listar os cards de uma lista, ordenados pela posição.
5. Criar um endpoint para obter um card específico pelo id.
6. Criar um endpoint para editar um card, permitindo atualizar título e descrição.
7. Criar um endpoint para mover um card, recebendo a lista de destino e a nova posição, e atualizando a posição dos demais cards afetados na lista de origem e na de destino.
8. Criar um endpoint para excluir um card.
9. Se o quadro, a lista ou o card não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado.
10. Proteger todos os endpoints com o middleware de autenticação existente.
