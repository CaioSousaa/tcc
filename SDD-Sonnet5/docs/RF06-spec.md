# RF06 — Checklists em Cards, com Itens Marcáveis e Progresso Automático

## 1. Visão Geral

Um usuário autenticado, dono do quadro de um card (RF02–RF04), deve conseguir adicionar checklists a esse card para quebrar a tarefa que ele representa em itens menores, marcar cada item como concluído à medida que avança, e acompanhar o progresso da tarefa através de um percentual calculado automaticamente e exibido no próprio card. Um card pode ter mais de um checklist. Cada checklist pertence a exatamente um card; cada item pertence a exatamente um checklist. Como checklists e itens vivem dentro de um card, que vive dentro de uma lista, que vive dentro de um quadro, o direito de operar sobre eles deriva do direito sobre o quadro, transitivamente através da lista e do card (RF02 RN-01/RN-06; RF03 RN-04/RN-05/RN-06; RF04 RN-05/RN-06/RN-07/RN-08).

## 2. Comportamento Esperado

### 2.1 Criar checklist
- O dono do quadro de um card pode criar um novo checklist nesse card informando um nome (obrigatório).
- O checklist criado pertence exclusivamente a esse card e começa sem nenhum item.
- Um card pode ter vários checklists; não há um limite de quantidade nem a exigência de ter só um.

### 2.2 Adicionar item a um checklist
- O dono do quadro de um checklist pode adicionar um item a ele informando um texto (obrigatório).
- O item criado pertence exclusivamente a esse checklist e começa como não concluído.

### 2.3 Marcar e desmarcar itens
- O dono do quadro de um item pode marcá-lo como concluído, e pode desmarcar um item já concluído, voltando-o a não concluído.
- Essas duas operações são a mesma ação em direções opostas: alternar o estado de conclusão do item.

### 2.4 Progresso do card
- Cada card exibe um percentual de progresso, calculado automaticamente a partir de todos os itens de todos os seus checklists somados: quantos, dentre o total de itens do card, estão marcados como concluídos.
- Quando um card não tem nenhum item de checklist — seja porque não tem nenhum checklist, seja porque todos os seus checklists estão vazios — nenhum percentual é exibido, porque não há o que medir.
- O percentual é recalculado a cada vez que um item é adicionado, marcado, desmarcado ou excluído, ou que um checklist inteiro é excluído.

### 2.5 Excluir item
- O dono do quadro de um item pode excluí-lo. A exclusão é permanente.

### 2.6 Excluir checklist
- O dono do quadro de um checklist pode excluí-lo. A exclusão é permanente e remove, junto, todos os itens desse checklist.

### 2.7 Privacidade e isolamento
- Uma tentativa de operar sobre checklists ou itens envolvendo um quadro, lista ou card que não existe, ou que não pertence ao usuário, é tratada com a mesma resposta de "não encontrado" já definida nos níveis correspondentes (RF02, RF03, RF04) — sem chegar a mencionar checklist ou item.
- Uma tentativa de ver, marcar/desmarcar ou excluir um checklist que não existe, ou que pertence a um card diferente do informado na operação, é tratada como "checklist não encontrado", sem distinguir os dois casos.
- Uma tentativa de ver, marcar/desmarcar ou excluir um item que não existe, ou que pertence a um checklist diferente do informado na operação, é tratada como "item não encontrado", sem distinguir os dois casos.

## 3. Critérios de Aceite (Given/When/Then)

**Criar checklist**

1. Given um usuário autenticado dono do quadro de um card, When ele cria um checklist nesse card informando um nome válido, Then o checklist é criado, pertence a esse card, sem nenhum item, e aparece na listagem de checklists do card.
2. Given um usuário autenticado dono do quadro de um card, When ele tenta criar um checklist sem informar nome (ausente ou vazio), Then a criação é rejeitada e o sistema indica que o nome é obrigatório.
3. Given um usuário autenticado dono do quadro de um card, When ele informa um nome de checklist que excede o tamanho máximo permitido (RN-02), Then a criação é rejeitada e o sistema informa que o limite foi excedido.
4. Given um usuário autenticado dono do quadro de um card que já tem um checklist, When ele cria um segundo checklist nesse card, Then ambos os checklists passam a existir no card, cada um com seus próprios itens.
5. Given um usuário autenticado, When ele tenta criar um checklist em um card que não existe, que pertence a uma lista/quadro diferente do informado, ou cujo quadro não é dele, Then recebe a mesma indicação de "não encontrado" já definida no nível correspondente (RF04).
6. Given um usuário não autenticado, When ele tenta criar um checklist, Then a operação é rejeitada e ele é tratado como não autenticado.

**Adicionar item**

7. Given um usuário autenticado dono do quadro de um checklist, When ele adiciona um item a esse checklist informando um texto válido, Then o item é criado, pertence a esse checklist, começa como não concluído, e aparece na listagem de itens do checklist.
8. Given um usuário autenticado dono do quadro de um checklist, When ele tenta adicionar um item sem informar texto (ausente ou vazio), Then a operação é rejeitada e o sistema indica que o texto é obrigatório.
9. Given um usuário autenticado dono do quadro de um checklist, When ele informa um texto de item que excede o tamanho máximo permitido (RN-04), Then a operação é rejeitada e o sistema informa que o limite foi excedido.
10. Given um usuário autenticado, When ele tenta adicionar um item a um checklist que não existe, ou que pertence a um card diferente do informado, Then recebe indicação de que o checklist não foi encontrado.
11. Given um usuário não autenticado, When ele tenta adicionar um item a um checklist, Then a operação é rejeitada e ele é tratado como não autenticado.

**Marcar e desmarcar itens**

12. Given um item não concluído, When o dono do quadro o marca como concluído, Then o item passa a constar como concluído, e o percentual de progresso do card é recalculado para refletir isso.
13. Given um item concluído, When o dono do quadro o desmarca, Then o item volta a constar como não concluído, e o percentual de progresso do card é recalculado para refletir isso.
14. Given um usuário autenticado, When ele tenta marcar ou desmarcar um item que não existe, ou que pertence a um checklist diferente do informado, Then recebe indicação de que o item não foi encontrado.
15. Given um usuário não autenticado, When ele tenta marcar ou desmarcar um item, Then a operação é rejeitada e ele é tratado como não autenticado.

**Progresso do card**

16. Given um card com um ou mais checklists somando ao menos um item, When o usuário vê o card, Then o percentual exibido é exatamente a proporção de itens concluídos sobre o total de itens do card, somando todos os seus checklists.
17. Given um card sem nenhum checklist, ou cujos checklists estão todos vazios, When o usuário vê o card, Then nenhum percentual de progresso é exibido.
18. Given um card com múltiplos checklists, cada um com itens concluídos e não concluídos, When o usuário vê o card, Then o percentual exibido reflete a soma de todos os checklists do card, não de um checklist isolado.
19. Given um card em que todos os itens de todos os checklists estão concluídos, When o usuário vê o card, Then o percentual exibido é 100%.
20. Given um card com ao menos um item, em que nenhum item está concluído, When o usuário vê o card, Then o percentual exibido é 0%.

**Excluir item**

21. Given um usuário autenticado dono do quadro de um item, When ele exclui esse item, Then o item deixa de existir permanentemente, some da listagem do checklist, e o percentual de progresso do card é recalculado sem ele.
22. Given um usuário autenticado, When ele tenta excluir um item que não existe, ou que pertence a um checklist diferente do informado, Then recebe indicação de que o item não foi encontrado.

**Excluir checklist**

23. Given um usuário autenticado dono do quadro de um checklist com itens, When ele exclui esse checklist, Then o checklist e todos os seus itens deixam de existir permanentemente, e o percentual de progresso do card é recalculado considerando só os checklists restantes.
24. Given um usuário autenticado, When ele tenta excluir um checklist que não existe, ou que pertence a um card diferente do informado, Then recebe indicação de que o checklist não foi encontrado.

## 4. Regras de Negócio e Restrições

- **RN-01 (Checklist pertence a um único card):** todo checklist pertence a exatamente um card, definido no momento da criação.
- **RN-02 (Nome do checklist obrigatório e limitado):** o nome do checklist é obrigatório, não pode ser vazio (nem composto apenas por espaços) e deve ter no máximo 100 caracteres.
- **RN-03 (Item pertence a um único checklist):** todo item pertence a exatamente um checklist, definido no momento da criação. Mover um item para outro checklist está fora do escopo de RF06.
- **RN-04 (Texto do item obrigatório e limitado):** o texto de um item é obrigatório, não pode ser vazio (nem composto apenas por espaços) e deve ter no máximo 500 caracteres.
- **RN-05 (Item nasce não concluído):** todo item recém-criado começa como não concluído; marcar como concluído é sempre uma ação explícita posterior.
- **RN-06 (Múltiplos checklists por card):** um card pode ter zero, um ou vários checklists; não existe um limite máximo definido por esta especificação, nem a exigência de ter exatamente um.
- **RN-07 (Nomes de checklist não precisam ser únicos):** um card pode ter mais de um checklist com o mesmo nome.
- **RN-08 (Textos de item não precisam ser únicos):** um checklist pode ter mais de um item com o mesmo texto.
- **RN-09 (Autorização derivada do dono do quadro):** toda operação sobre um checklist ou item exige que o usuário autenticado seja o dono do quadro ao qual o card correspondente pertence, transitivamente através da lista e do card. Não existe permissão específica de checklist ou item independente da posse do quadro.
- **RN-10 (Isolamento de quadro/lista/card inalterado):** operar envolvendo um quadro, lista ou card inacessível produz exatamente as respostas de "não encontrado" já definidas em RF02/RF03/RF04 — a existência de checklists ou itens não altera esse comportamento.
- **RN-11 (Isolamento de checklist):** ver, adicionar item a, ou excluir um checklist que não existe, ou que pertence a um card diferente do informado na operação, produz sempre a mesma resposta de "checklist não encontrado" — sem distinguir os casos entre si.
- **RN-12 (Isolamento de item):** ver, marcar/desmarcar ou excluir um item que não existe, ou que pertence a um checklist diferente do informado na operação, produz sempre a mesma resposta de "item não encontrado" — sem distinguir os casos entre si.
- **RN-13 (Cálculo do percentual de progresso):** o percentual de progresso de um card é a proporção entre o número de itens concluídos e o número total de itens, somando todos os checklists do card. Quando o total de itens do card for zero, nenhum percentual é exibido (não é exibido como 0%, é simplesmente omitido).
- **RN-14 (Ordem de exibição):** checklists de um card, e itens de um checklist, são exibidos na ordem em que foram criados. Esta funcionalidade não inclui reordenação manual de checklists nem de itens.
- **RN-15 (Exclusão de checklist é em cascata para seus itens):** excluir um checklist exclui, junto, todos os itens que pertencem a ele, na mesma operação.
- **RN-16 (Exclusões são permanentes):** excluir um item, ou um checklist com todos os seus itens, é uma ação irreversível.

## 5. Casos de Borda e Condições de Erro

- Criar checklist sem nome, ou com nome vazio/composto só de espaços → rejeitado (RN-02, critério 2).
- Criar checklist com nome acima de 100 caracteres → rejeitado (RN-02, critério 3).
- Adicionar item sem texto, ou com texto vazio/composto só de espaços → rejeitado (RN-04, critério 8).
- Adicionar item com texto acima de 500 caracteres → rejeitado (RN-04, critério 9).
- Criar checklist, adicionar item, marcar/desmarcar item, ou excluir checklist/item sem sessão autenticada válida → rejeitado, tratado como não autenticado (critérios 6, 11, 15).
- Operar sobre checklist/item envolvendo quadro, lista ou card inexistente ou de outro usuário → mesma resposta de "não encontrado" já definida no nível correspondente (RF02/RF03/RF04), sem chegar a mencionar checklist ou item (RN-10, critério 5).
- Adicionar item, marcar/desmarcar item, ou excluir checklist referenciando um checklist inexistente ou de outro card → "checklist não encontrado" (RN-11, critérios 10, 24).
- Marcar/desmarcar ou excluir um item referenciando um item inexistente ou de outro checklist → "item não encontrado" (RN-12, critérios 14, 22).
- Card sem nenhum checklist → nenhum percentual de progresso exibido (RN-13, critério 17).
- Card com checklist(s), mas nenhum item em nenhum deles → mesmo tratamento de "card sem nenhum item", nenhum percentual exibido (RN-13, critério 17).
- Todos os itens de todos os checklists de um card concluídos → percentual exibido é 100% (critério 19).
- Nenhum item concluído, havendo ao menos um item → percentual exibido é 0%, não omitido (critério 20) — diferente do caso de zero itens, em que nada é exibido.
- Excluir o único checklist restante de um card, que tinha itens → o card volta ao estado de "sem nenhum item", e nenhum percentual passa a ser exibido (RN-13, RN-15).
- Excluir um item já excluído anteriormente (segunda tentativa) → tratado como "item não encontrado", igual a excluir um item que nunca existiu.
- Excluir um checklist já excluído anteriormente (segunda tentativa) → tratado como "checklist não encontrado", igual a excluir um checklist que nunca existiu.
- Um usuário não pode, por meio de nenhuma operação desta funcionalidade, ver, criar, marcar, desmarcar ou excluir um checklist ou item de um card que não é seu — mesmo conhecendo o id exato do checklist, do item, do card, da lista ou do quadro.
