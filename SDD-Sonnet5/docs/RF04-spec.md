# RF04 — Criar, Editar, Excluir e Mover Cards entre Listas de um Quadro

## 1. Visão Geral

Um usuário autenticado, dono de um quadro (RF02), deve conseguir preencher as listas desse quadro (RF03) com cards: criar cards dentro de uma lista, editar suas informações, excluí-los e movê-los de uma lista para outra do mesmo quadro. Um card pertence, a qualquer momento, a exatamente uma lista. Como cards vivem dentro de uma lista, que vive dentro de um quadro, o direito de operar sobre um card deriva do direito sobre o quadro que o contém, transitivamente através da lista (RF02 RN-01/RN-06; RF03 RN-04/RN-05/RN-06): só o dono do quadro pode criar, ver, editar, excluir ou mover os cards de suas listas.

## 2. Comportamento Esperado

### 2.1 Criar card
- O dono do quadro de uma lista pode criar um novo card nessa lista informando um título (obrigatório) e, opcionalmente, uma descrição.
- O card criado pertence exclusivamente a essa lista.
- O card criado passa a aparecer entre os cards da lista, posicionado após todos os cards já existentes nela no momento da criação.

### 2.2 Ver cards
- O dono do quadro de uma lista pode ver todos os cards dessa lista, na ordem de exibição vigente.
- Uma lista sem nenhum card é um estado válido, não um erro.

### 2.3 Editar card
- O dono do quadro de um card pode atualizar o título e/ou a descrição desse card.

### 2.4 Excluir card
- O dono do quadro de um card pode excluí-lo.
- A exclusão é permanente: o card deixa de existir e não pode ser recuperado.
- Após a exclusão, o card some da listagem da lista à qual pertencia; os demais cards dessa lista mantêm a ordem relativa que tinham entre si antes da exclusão.

### 2.5 Mover card entre listas
- O dono de um quadro pode mover um card de uma lista para outra, desde que ambas as listas pertençam ao mesmo quadro.
- Não é possível, nesta funcionalidade, mover um card para uma lista de um quadro diferente.
- Ao ser movido, o card passa a pertencer exclusivamente à lista de destino e deixa de pertencer à lista de origem; ele é posicionado após todos os cards já existentes na lista de destino no momento do movimento.
- Mover um card para a lista em que ele já está não é tratado como erro: o card permanece nessa lista.

### 2.6 Privacidade e isolamento
- Uma tentativa de criar, ver, editar, excluir ou mover um card envolvendo um quadro que não existe ou que pertence a outro usuário é tratada como "quadro não encontrado" — mesmo comportamento já definido em RF02.
- Uma tentativa de criar ou ver cards em uma lista que não existe, que pertence a um quadro diferente do informado, ou cujo quadro pertence a outro usuário, é tratada como "lista não encontrada" — mesmo comportamento já definido em RF03.
- Uma tentativa de ver, editar, excluir ou mover um card que não existe, que pertence a uma lista diferente da informada na operação, ou cuja lista/quadro não pertence ao usuário, é tratada como "card não encontrado", sem distinguir esses casos entre si.
- Ao mover um card, a mesma regra de isolamento se aplica à lista de destino: se ela não existir, não pertencer ao quadro informado, ou esse quadro não pertencer ao usuário, a operação é tratada como "lista não encontrada".

## 3. Critérios de Aceite (Given/When/Then)

**Criar**

1. Given um usuário autenticado dono do quadro de uma lista, When ele cria um card nessa lista informando um título válido, Then o card é criado, pertence a essa lista, e passa a aparecer entre os cards dela.
2. Given um usuário autenticado dono do quadro de uma lista, When ele tenta criar um card sem informar título (ausente ou vazio), Then a criação é rejeitada e o sistema indica que o título é obrigatório.
3. Given um usuário autenticado dono do quadro de uma lista, When ele informa um título que excede o tamanho máximo permitido (RN-02), Then a criação é rejeitada e o sistema informa que o limite foi excedido.
4. Given um usuário autenticado dono do quadro de uma lista que já tem cards, When ele cria um novo card nessa lista, Then o novo card é posicionado depois de todos os cards já existentes nela (RN-09).
5. Given um usuário autenticado dono do quadro de uma lista, When ele cria um card informando apenas o título, sem descrição, Then o card é criado com sucesso, sem descrição.
6. Given um usuário autenticado, When ele tenta criar um card em uma lista que não existe ou que pertence a um quadro que não é dele, Then recebe indicação de que a lista (ou o quadro, conforme o caso) não foi encontrado.
7. Given um usuário não autenticado, When ele tenta criar um card, Then a operação é rejeitada e ele é tratado como não autenticado.

**Ver**

8. Given um usuário autenticado dono do quadro de uma lista com um ou mais cards, When ele solicita os cards dessa lista, Then recebe todos os cards da lista, na ordem de exibição vigente.
9. Given um usuário autenticado dono do quadro de uma lista sem nenhum card, When ele solicita os cards dessa lista, Then recebe uma lista vazia, não um erro.
10. Given um usuário autenticado, When ele solicita os cards de uma lista que não existe ou que pertence a um quadro que não é dele, Then recebe indicação de que a lista (ou o quadro) não foi encontrado.

**Editar**

11. Given um usuário autenticado dono do quadro de um card, When ele atualiza o título desse card para um valor válido, Then o card passa a refletir o novo título.
12. Given um usuário autenticado dono do quadro de um card, When ele atualiza a descrição desse card, Then o card passa a refletir a nova descrição.
13. Given um usuário autenticado dono do quadro de um card, When ele tenta atualizar o título desse card para um valor vazio, Then a operação é rejeitada e o sistema indica que o título é obrigatório.
14. Given um usuário autenticado, When ele tenta editar um card que não existe, que pertence a uma lista diferente da informada, ou cuja lista/quadro não pertence a ele, Then recebe indicação de que o card não foi encontrado.

**Excluir**

15. Given um usuário autenticado dono do quadro de um card, When ele exclui esse card, Then o card deixa de existir, some da listagem da sua lista, e os demais cards dessa lista mantêm a ordem relativa que tinham entre si.
16. Given um usuário autenticado dono do quadro de uma lista com um único card, When ele exclui esse card, Then a lista passa a não ter nenhum card, sem que isso seja tratado como erro.
17. Given um usuário autenticado, When ele tenta excluir um card que não existe, que pertence a uma lista diferente da informada, ou cuja lista/quadro não pertence a ele, Then recebe indicação de que o card não foi encontrado.
18. Given um usuário autenticado, When ele tenta excluir novamente um card que ele mesmo já havia excluído anteriormente, Then recebe a mesma indicação de "não encontrado" do critério 17.

**Mover entre listas**

19. Given um usuário autenticado dono de um quadro com um card em uma lista e outra lista vazia, ambas do mesmo quadro, When ele move o card para a segunda lista, Then o card passa a pertencer à segunda lista e aparece nela, e deixa de aparecer na lista de origem.
20. Given um usuário autenticado dono de um quadro, When ele move um card para uma lista de destino que já tem outros cards, Then o card movido é posicionado depois de todos os cards já existentes na lista de destino.
21. Given um usuário autenticado dono de um quadro, When ele move um card para a lista em que ele já está, Then a operação é aceita e o card permanece nessa lista, sem erro.
22. Given um usuário autenticado, When ele tenta mover um card para uma lista que não existe, que pertence a um quadro diferente do quadro do card, ou cujo quadro não pertence a ele, Then recebe indicação de que a lista de destino não foi encontrada.
23. Given um usuário autenticado, When ele tenta mover um card que não existe, ou cuja lista/quadro não pertence a ele, Then recebe indicação de que o card não foi encontrado.
24. Given um usuário não autenticado, When ele tenta mover um card, Then a operação é rejeitada e ele é tratado como não autenticado.

## 4. Regras de Negócio e Restrições

- **RN-01 (Pertencimento exclusivo a uma lista):** um card pertence, a qualquer momento, a exatamente uma lista. A lista à qual pertence determina, indiretamente, a qual quadro ele pertence.
- **RN-02 (Título obrigatório e limitado):** o título do card é obrigatório, não pode ser vazio (nem composto apenas por espaços) e deve ter no máximo 200 caracteres.
- **RN-03 (Descrição opcional e limitada):** a descrição do card é opcional; quando informada, tem no máximo 2000 caracteres.
- **RN-04 (Títulos não precisam ser únicos):** uma lista pode ter mais de um card com o mesmo título; o sistema não impõe unicidade de título entre os cards de uma lista, nem entre listas.
- **RN-05 (Autorização derivada do dono do quadro):** toda operação sobre um card (criar, ver, editar, excluir, mover) exige que o usuário autenticado seja o dono do quadro ao qual a lista do card pertence. Não existe permissão específica de card independente da posse do quadro.
- **RN-06 (Isolamento de quadro):** operar envolvendo um quadro que não existe ou que pertence a outro usuário produz a resposta de "quadro não encontrado" já definida em RF02.
- **RN-07 (Isolamento de lista):** criar ou ver cards em uma lista que não existe, que pertence a um quadro diferente do informado, ou cujo quadro pertence a outro usuário, produz a resposta de "lista não encontrada" já definida em RF03.
- **RN-08 (Isolamento de card):** ver, editar, excluir ou mover um card que não existe, que pertence a uma lista diferente da informada na operação, ou cuja lista/quadro não pertence ao usuário, produz sempre a mesma resposta de "card não encontrado" — sem distinguir esses casos entre si.
- **RN-09 (Posição de criação):** um card recém-criado é posicionado depois de todos os cards já existentes na lista no momento da criação (ao final).
- **RN-10 (Ordem contínua e determinística):** a qualquer momento, os cards de uma lista têm uma ordem de exibição total e determinística entre si — sem posições ambíguas ou empatadas.
- **RN-11 (Movimentação restrita ao mesmo quadro):** um card só pode ser movido entre listas que pertençam ao mesmo quadro ao qual ele já pertence. Mover um card para uma lista de outro quadro está fora do escopo de RF04.
- **RN-12 (Posição após movimentação):** ao ser movido para outra lista, um card é posicionado depois de todos os cards já existentes na lista de destino no momento do movimento.
- **RN-13 (Mover para a lista atual é permitido):** mover um card para a lista à qual ele já pertence é uma operação válida, não um erro; o card permanece nessa lista.
- **RN-14 (Exclusão permanente):** excluir um card é uma ação irreversível. A exclusão de um card não altera a ordem relativa dos demais cards da lista.
- **RN-15 (Lista sem cards é um estado válido):** uma lista pode não ter nenhum card — seja por nunca ter tido, seja por todos terem sido excluídos ou movidos para outra lista. Isso não é tratado como erro em nenhuma operação de leitura.
- **RN-16 (Edição parcial):** a edição de um card pode alterar título, descrição, ou ambos em uma única operação; campos não enviados permanecem com o valor atual. Quando o título é enviado, segue RN-02 (não pode ser vazio). A descrição pode ser explicitamente definida como vazia, já que é opcional.

## 5. Casos de Borda e Condições de Erro

- Criar card sem título, ou com título vazio/composto só de espaços → rejeitado (RN-02, critério 2).
- Criar card com título acima de 200 caracteres → rejeitado (RN-02, critério 3).
- Criar card com descrição acima de 2000 caracteres → rejeitado (RN-03), mesma natureza do critério 3.
- Criar, ver, editar, excluir ou mover card sem sessão autenticada válida → rejeitado, tratado como não autenticado (critérios 7, 24).
- Criar ou ver cards em lista inexistente, de outro quadro do mesmo usuário indevidamente referenciado, ou de quadro de outro usuário → "lista não encontrada" ou "quadro não encontrado", conforme o que efetivamente falhar primeiro (RN-06, RN-07, critérios 6, 10).
- Editar, excluir ou mover um card cujo id não corresponde a nenhum card existente → "card não encontrado" (RN-08, critérios 14, 17, 23).
- Editar, excluir ou mover um card que existe, mas pertence a uma lista diferente da informada na operação → mesma resposta de "card não encontrado", nunca uma mensagem que revele a qual lista o card realmente pertence (RN-08).
- Editar, excluir ou mover um card cuja lista pertence a um quadro de outro usuário → mesma resposta de "card não encontrado" (RN-08) — nunca a resposta de "quadro não encontrado" ou "lista não encontrada", que se aplicariam apenas se o próprio quadro/lista informados na URL da operação fossem inacessíveis.
- Editar título de um card para valor vazio → rejeitado, mesmo comportamento da criação (RN-02, critério 13).
- Editar um card sem enviar nenhum campo → não altera nada; não é tratado como erro (RN-16).
- Mover um card para uma lista que não existe, ou que pertence a um quadro diferente do quadro do card → rejeitado, "lista não encontrada" (RN-11, critério 22).
- Mover um card para a lista em que ele já está → aceito, sem efeito de erro (RN-13, critério 21).
- Excluir o único card restante de uma lista → permitido; a lista fica sem cards, o que é um estado válido (RN-15, critério 16).
- Excluir um card já excluído anteriormente (segunda tentativa) → tratado como "card não encontrado", igual a excluir um card que nunca existiu (critério 18).
- Listar os cards de uma lista que nunca teve nenhum criado, ou que teve todos excluídos/movidos para outra lista → lista vazia, não um erro (critério 9, RN-15).
- Um usuário não pode, por meio de nenhuma operação desta funcionalidade, ver, criar, editar, excluir ou mover um card de uma lista ou quadro que não é seu — mesmo conhecendo o id exato do card, da lista ou do quadro.
