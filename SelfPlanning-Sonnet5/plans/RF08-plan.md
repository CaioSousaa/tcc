Intenção: Quero que o usuário consiga criar etiquetas coloridas e filtrar os cards por elas
Plano:
1. Criar um modelo de etiqueta vinculada a um quadro, com nome e cor.
2. Criar uma associação entre cards e etiquetas, permitindo que um card tenha várias etiquetas e uma etiqueta seja usada em vários cards.
3. Verificar se o quadro pertence ao usuário autenticado antes de criar, listar, editar ou excluir etiquetas.
4. Criar um endpoint para criar uma etiqueta em um quadro, recebendo nome e cor.
5. Criar um endpoint para listar as etiquetas de um quadro.
6. Criar um endpoint para editar o nome e/ou a cor de uma etiqueta.
7. Criar um endpoint para excluir uma etiqueta, removendo também suas associações com os cards.
8. Criar um endpoint para associar e remover etiquetas de um card, validando que a etiqueta pertence ao mesmo quadro do card.
9. Criar um endpoint para listar os cards de uma lista filtrados por uma ou mais etiquetas.
10. Se o quadro, a etiqueta, o card ou a lista não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado.
11. Proteger todos os endpoints com o middleware de autenticação existente.
