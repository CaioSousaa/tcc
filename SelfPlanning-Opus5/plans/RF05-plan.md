# RF05 - Destino dos cards ao excluir uma lista

Intenção: Quero que o sistema trate adequadamente o que acontece com os cards quando o usuário exclui uma lista que contém cards

Plano:

1 Adicionar ao quadro a regra que bloqueia a exclusão de listas que ainda tenham cards

2 Permitir ligar e desligar essa regra na edição do quadro

3 Receber no endpoint de exclusão de lista a estratégia escolhida para os cards

4 Aceitar apenas as estratégias previstas: mover os cards ou excluir a lista com os cards

5 Excluir a lista direto quando ela não tiver nenhum card, sem exigir estratégia

6 Recusar a exclusão quando a lista tiver cards e a regra de bloqueio estiver ligada no quadro

7 Validar a lista de destino quando a estratégia for mover os cards

8 Recusar a lista de destino quando ela for a própria lista excluída ou não for do mesmo quadro

9 Mover os cards para o fim da lista de destino preservando a ordem que eles tinham

10 Renumerar as posições da lista de destino após receber os cards

11 Excluir a lista junto com os cards quando a estratégia for a exclusão total

12 Executar a movimentação e a exclusão em uma única transação

13 Retornar as listas e os cards atualizados após a exclusão

14 Expor a contagem de cards de cada lista na listagem de listas

15 Exibir no modal de exclusão o nome da lista e quantos cards ela contém

16 Oferecer a opção de mover os cards para outra lista, marcada como recomendada

17 Listar no seletor apenas as outras listas do mesmo quadro

18 Oferecer a opção de excluir a lista e todos os cards, avisando que a ação é irreversível

19 Exibir a opção de bloquear a exclusão como indisponível quando a regra estiver desligada no quadro

20 Pular a escolha de estratégia quando a lista não tiver nenhum card

21 Atualizar as colunas com a resposta da exclusão sem recarregar a página

22 Tratar e exibir os erros retornados pela API dentro do próprio modal
