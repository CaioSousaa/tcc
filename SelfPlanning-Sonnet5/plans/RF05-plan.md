Intenção: Quero que o sistema trate adequadamente o que acontece com os cards quando o usuário exclui uma lista que contém cards
Plano:
1. Ao solicitar a exclusão de uma lista, verificar se ela contém cards.
2. Se a lista estiver vazia, excluí-la diretamente, sem exigir nenhuma escolha adicional.
3. Se a lista contiver cards, exigir que o cliente informe uma estratégia: mover os cards para outra lista do mesmo quadro ou excluir a lista junto com os cards.
4. Se nenhuma estratégia for informada e a lista tiver cards, retornar erro pedindo que o cliente escolha uma opção antes de confirmar.
5. Se a estratégia for mover os cards, exigir o id de uma lista de destino no mesmo quadro, diferente da lista sendo excluída.
6. Transferir os cards para o fim da lista de destino, reordenando as posições, e só então excluir a lista de origem.
7. Se a estratégia for excluir os cards, remover todos os cards da lista junto com a lista.
8. Validar que a lista de destino informada existe, pertence ao mesmo quadro e ao usuário autenticado.
9. Se o quadro ou a lista não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado.
10. Proteger o endpoint com o middleware de autenticação existente.
