Intenção: Quero que o usuário consiga definir prazos nos cards e identificar quais estão atrasados
Plano:
1. Adicionar um campo de prazo (data de vencimento), opcional, ao modelo de card.
2. Verificar se o card pertence a uma lista de um quadro do usuário autenticado antes de definir, atualizar ou remover seu prazo.
3. Criar um endpoint para definir, atualizar ou remover o prazo de um card.
4. Calcular se um card está atrasado comparando o prazo definido com a data e hora atuais.
5. Incluir nas respostas de card a informação de atraso, indicando se está atrasado e há quanto tempo.
6. Criar um endpoint para listar os cards de uma lista ordenados por prazo, com os cards sem prazo definido ao final.
7. Se o quadro, a lista ou o card não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado.
8. Proteger todos os endpoints com o middleware de autenticação existente.
