# RF09 - Comentários nos cards

Intenção: Quero que o usuário consiga comentar nos cards e ver o histórico dos comentários

Plano:

1 Criar um modelo de comentário com texto, autor e vínculo com o card

2 Verificar se o card pertence a um quadro do usuário autenticado antes de qualquer operação de comentário

3 Criar um endpoint para comentar em um card, recebendo o texto

4 Validar o texto informado e recusar comentário vazio

5 Registrar o autor do comentário a partir do usuário autenticado

6 Criar um endpoint para listar o histórico de comentários de um card

7 Ordenar o histórico do comentário mais antigo para o mais recente

8 Retornar em cada comentário o nome do autor e a data de criação

9 Criar um endpoint para editar o texto de um comentário

10 Permitir editar apenas os comentários escritos pelo próprio usuário

11 Marcar o comentário como editado quando o texto for alterado

12 Criar um endpoint para excluir um comentário

13 Permitir excluir o próprio comentário ou qualquer comentário para o administrador do quadro

14 Ao excluir um card, excluir também os comentários vinculados a ele

15 Expor no card a contagem de comentários

16 Retornar erro de não encontrado quando o comentário não existir ou não for do card informado

17 Proteger todos os endpoints com o middleware de autenticação existente

18 Criar a seção de comentários no modal de detalhe do card, seguindo o protótipo

19 Exibir cada comentário com avatar, nome do autor, data e texto

20 Indicar no histórico quando um comentário foi editado

21 Criar a caixa de escrever comentário com o botão de comentar ao final da seção

22 Permitir editar e excluir os comentários direto no histórico, conforme a permissão

23 Exibir a contagem de comentários no card dentro da coluna

24 Atualizar o histórico e a contagem após cada operação sem recarregar a página

25 Tratar e exibir os erros retornados pela API em cada operação
