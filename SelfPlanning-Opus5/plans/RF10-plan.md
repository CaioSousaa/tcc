# RF10 - Prazos nos cards e cards atrasados

Intenção: Quero que o usuário consiga definir prazos nos cards e identificar quais estão atrasados

Plano:

1 Manter no card o prazo como data, aceitando card sem prazo

2 Aceitar o prazo na criação e na edição do card, validando o formato da data

3 Permitir limpar o prazo de um card já existente

4 Expor no card se o prazo está atrasado, vence hoje ou ainda está no futuro

5 Calcular a situação do prazo comparando com a data atual, sem considerar hora

6 Aceitar na listagem de cards a ordenação por prazo como parâmetro opcional

7 Ordenar os cards de cada lista pelo prazo mais próximo, deixando os sem prazo no fim

8 Manter a ordenação por posição quando a ordenação por prazo não for pedida

9 Aceitar na listagem de cards o filtro que traz apenas os cards atrasados

10 Expor na listagem de quadros o total de listas, de cards e de cards atrasados

11 Proteger todos os endpoints com o middleware de autenticação existente

12 Exibir o prazo no card da coluna com o dia e o mês

13 Destacar em vermelho o card com prazo vencido e indicar há quantos dias está atrasado

14 Destacar o card que vence hoje como aviso, separado do atrasado

15 Exibir o campo de prazo no modal de detalhe do card com a opção de limpar

16 Exibir no modal a situação do prazo do card aberto

17 Criar o controle de ordenar por prazo no topo do quadro, seguindo o protótipo

18 Criar o filtro que mostra apenas os cards atrasados no topo do quadro

19 Exibir no card de cada quadro o resumo de listas, cards e cards atrasados

20 Atualizar as colunas após cada mudança de prazo, ordenação ou filtro sem recarregar a página

21 Tratar e exibir os erros retornados pela API em cada operação
