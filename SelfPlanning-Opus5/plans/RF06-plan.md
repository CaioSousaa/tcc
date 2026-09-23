# RF06 - Checklists nos cards

Intenção: Quero que o usuário consiga adicionar checklists nos cards e acompanhar o progresso da tarefa

Plano:

1 Criar um modelo de item de checklist com texto, situação de concluído, posição e vínculo com o card

2 Criar um endpoint para adicionar um item de checklist a um card

3 Validar o texto informado e colocar o novo item no fim do checklist

4 Verificar se o card pertence a um quadro do usuário autenticado antes de qualquer operação de item

5 Criar um endpoint para listar os itens de checklist de um card em ordem de posição

6 Criar um endpoint para editar o texto de um item

7 Criar um endpoint para marcar e desmarcar um item como concluído

8 Criar um endpoint para excluir um item

9 Ao excluir um item, fechar a numeração das posições restantes

10 Retornar erro de não encontrado quando o item não existir ou não for do card informado

11 Ao excluir um card, excluir também os itens de checklist vinculados a ele

12 Expor no card o total de itens e quantos já estão concluídos

13 Proteger todos os endpoints com o middleware de autenticação existente

14 Criar a seção de checklist no modal de detalhe do card, seguindo o protótipo

15 Exibir o total de itens concluídos e uma barra de progresso no topo da seção

16 Listar os itens com caixa de marcação e riscar o texto dos já concluídos

17 Marcar e desmarcar um item direto na lista, salvando na API

18 Criar o campo de adicionar item ao final da seção

19 Permitir editar o texto de um item existente

20 Permitir excluir um item da lista

21 Avisar que o checklist fica disponível depois que o card for salvo

22 Exibir a barra de progresso e a contagem do checklist no card dentro da coluna

23 Atualizar a seção e o card após cada operação sem recarregar a página

24 Tratar e exibir os erros retornados pela API em cada operação
