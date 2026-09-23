# RF05 — Exclusão de Lista com Cards Associados (Regra de Cascata Explícita)

## 1. Visão Geral

Quando o dono de um quadro exclui uma lista (RF03) que contém cards (RF04), o sistema precisa de uma regra clara e testável sobre o que acontece com esses cards — não pode ser um comportamento acidental ou implícito. A regra adotada por esta especificação é a **exclusão em cascata**: excluir uma lista exclui, junto, todos os cards que pertencem a ela. Não há bloqueio da exclusão por a lista conter cards, e não há migração automática desses cards para outra lista. Como a exclusão em cascata é permanente e pode surpreender o usuário caso ele não perceba que a lista tem cards, o sistema deve informá-lo da quantidade de cards que serão perdidos antes de a exclusão se efetivar.

## 2. Comportamento Esperado

### 2.1 Excluir lista sem cards
- Comportamento inalterado em relação a RF03: a lista é excluída normalmente, sem necessidade de qualquer aviso adicional (não há nada a avisar).

### 2.2 Excluir lista com um ou mais cards
- O dono do quadro pode excluir uma lista mesmo que ela contenha cards.
- Antes de a exclusão se efetivar, o usuário é informado de quantos cards serão excluídos junto com a lista.
- Se o usuário decidir não prosseguir depois de ver essa informação, a operação é cancelada e nada muda: a lista e todos os seus cards continuam existindo exatamente como estavam.
- Se o usuário confirmar, a lista e todos os cards que pertenciam a ela são excluídos permanentemente, na mesma operação.

### 2.3 Estado após a exclusão em cascata
- Nenhum card que pertencia à lista excluída continua acessível por qualquer operação, sob nenhuma circunstância — passam a ser tratados como inexistentes, o mesmo tratamento já dado a um card que nunca existiu (RF04, RN-08).
- As demais listas do quadro, e os cards que pertencem a elas, não são afetados pela exclusão.

## 3. Critérios de Aceite (Given/When/Then)

1. Given um usuário autenticado dono do quadro de uma lista sem nenhum card, When ele exclui essa lista, Then a lista é excluída sem que nenhum aviso sobre cards seja necessário.
2. Given um usuário autenticado dono do quadro de uma lista com um ou mais cards, When ele solicita a exclusão dessa lista, Then, antes de a exclusão se efetivar, ele é informado da quantidade exata de cards que serão excluídos junto com ela.
3. Given um usuário autenticado que solicitou excluir uma lista com cards e foi informado da quantidade, When ele confirma a exclusão, Then a lista e todos os cards que pertenciam a ela deixam de existir permanentemente, na mesma operação.
4. Given um usuário autenticado que solicitou excluir uma lista com cards e foi informado da quantidade, When ele decide não prosseguir, Then a lista e todos os seus cards permanecem exatamente como estavam antes — nenhuma alteração ocorre.
5. Given uma lista que continha cards e foi excluída, When qualquer operação subsequente tenta acessar um desses cards pelo id (ver, editar, excluir ou mover), Then recebe a mesma indicação de "card não encontrado" usada para um card que nunca existiu.
6. Given um quadro cuja última lista continha cards, When essa lista é excluída, Then o quadro passa a não ter nenhuma lista nem nenhum card, o que é um estado válido, não um erro.
7. Given um usuário autenticado, When ele tenta excluir uma lista com cards que não existe ou que pertence a um quadro que não é dele, Then recebe a mesma indicação de "não encontrado" já definida em RF03, independentemente de a lista conter cards.
8. Given um usuário não autenticado, When ele tenta excluir uma lista que contém cards, Then a operação é rejeitada e ele é tratado como não autenticado.
9. Given um usuário autenticado dono do quadro de uma lista com exatamente um card, When ele solicita a exclusão dessa lista, Then é informado de que exatamente 1 card será excluído junto com ela.

## 4. Regras de Negócio e Restrições

- **RN-01 (Cascata, não bloqueio, não migração):** excluir uma lista sempre exclui, junto, todos os cards que pertencem a ela. A existência de cards numa lista nunca impede sua exclusão, e nenhum card é movido automaticamente para outra lista como efeito colateral de uma exclusão de lista.
- **RN-02 (Exclusão em cascata é permanente):** os cards excluídos junto com a lista não podem ser recuperados — mesma garantia de irreversibilidade já definida para a exclusão individual de um card (RF04, RN-14), aplicada a todos os cards da lista na mesma operação.
- **RN-03 (Aviso prévio de impacto):** quando a lista a ser excluída contém pelo menos um card, o usuário deve ser informado da quantidade de cards que serão excluídos antes de a exclusão se efetivar. Quando a lista não contém nenhum card, nenhum aviso é necessário.
- **RN-04 (Cancelamento é um no-op real):** se o usuário, após ser informado da quantidade de cards, decidir não prosseguir, nem a lista nem nenhum dos seus cards sofrem qualquer alteração.
- **RN-05 (Contagem precisa):** a quantidade de cards informada ao usuário reflete exatamente os cards que pertencem à lista no momento da solicitação de exclusão.
- **RN-06 (Posse inalterada):** a regra de quem pode excluir uma lista não muda em função de ela conter cards ou não — continua sendo exclusivamente o dono do quadro ao qual a lista pertence (RF03, RN-04/RN-05/RN-06).
- **RN-07 (Isolamento inalterado):** tentar excluir uma lista com cards que não existe, ou que pertence a um quadro que não é do usuário, produz exatamente a mesma resposta de "não encontrado" já definida em RF03 — a presença de cards na lista não altera esse comportamento nem vaza informação adicional.

## 5. Casos de Borda e Condições de Erro

- Excluir lista sem nenhum card → comportamento idêntico ao já definido em RF03; nenhum aviso é exibido (critério 1, RN-03).
- Excluir lista com exatamente um card → o aviso deve refletir a quantidade correta, 1 (critério 9, RN-05).
- Excluir a única lista restante de um quadro, sendo que ela contém cards → quadro fica sem listas e sem cards, estado válido, já coberto individualmente por RF03 (quadro sem listas) e por esta especificação (cards excluídos em cascata) (critério 6).
- Excluir lista com cards que não existe, ou que pertence a um quadro de outro usuário → mesma resposta de "não encontrado" de RF03, sem menção a cards (critério 7, RN-07).
- Excluir lista com cards sem sessão autenticada válida → rejeitado, tratado como não autenticado (critério 8).
- Cancelar a exclusão depois de ver a quantidade de cards → nenhuma alteração; tentar novamente a exclusão depois disso deve se comportar exatamente como uma primeira tentativa (critério 4, RN-04).
- Tentar acessar, editar, excluir ou mover, após a exclusão da lista, um card que pertencia a ela → tratado como card inexistente, mesmo comportamento já definido em RF04 para qualquer card que nunca existiu (critério 5).
- Excluir uma lista com cards já excluída anteriormente (segunda tentativa) → tratado como "lista não encontrada", igual ao comportamento já definido em RF03 para exclusão repetida, independentemente de a lista ter tido cards.
