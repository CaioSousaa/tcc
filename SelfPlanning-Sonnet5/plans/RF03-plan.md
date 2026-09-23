Intenção: Quero que o usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro
Plano:
1. Criar um modelo de lista vinculado a um quadro, com um campo de posição para ordenação.
2. Verificar se o quadro pertence ao usuário autenticado antes de criar, listar, renomear, reordenar ou excluir suas listas.
3. Criar um endpoint para criar uma lista em um quadro, recebendo o nome e atribuindo a próxima posição disponível.
4. Criar um endpoint para listar as listas de um quadro, ordenadas pela posição.
5. Criar um endpoint para renomear uma lista.
6. Criar um endpoint para reordenar as listas de um quadro, recebendo a nova ordem dos ids e atualizando a posição de cada uma.
7. Criar um endpoint para excluir uma lista.
8. Ao excluir uma lista, excluir também os cards vinculados a ela.
9. Se o quadro ou a lista não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado.
10. Proteger todos os endpoints com o middleware de autenticação existente.
