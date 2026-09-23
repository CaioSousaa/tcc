Intenção: Quero que o usuário consiga adicionar checklists nos cards e acompanhar o progresso da tarefa
Plano:
1. Criar um modelo de item de checklist vinculado a um card, com um campo de posição e um estado de concluído/pendente.
2. Verificar se o card pertence a uma lista de um quadro do usuário autenticado antes de criar, listar, atualizar ou excluir itens do checklist.
3. Criar um endpoint para adicionar um item de checklist a um card, recebendo o texto e atribuindo a próxima posição disponível.
4. Criar um endpoint para listar os itens do checklist de um card, ordenados pela posição.
5. Criar um endpoint para editar o texto de um item do checklist.
6. Criar um endpoint para marcar ou desmarcar um item como concluído.
7. Criar um endpoint para excluir um item do checklist.
8. Calcular o progresso do checklist de um card com base na proporção de itens concluídos em relação ao total.
9. Se o quadro, a lista, o card ou o item não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado.
10. Proteger todos os endpoints com o middleware de autenticação existente.
