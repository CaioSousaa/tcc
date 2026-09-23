# RF10 — Prazos em Cards, com Destaque de Atraso e Ordenação por Prazo

## 1. Visão Geral

Todo card pode receber um prazo (data de vencimento), opcional. Qualquer membro do quadro pode definir, alterar ou remover o prazo de um card, sem restrição pelo papel definido em RF07 — mesmo padrão já adotado para etiquetas (RF08) e comentários (RF09). A partir do prazo, o sistema identifica automaticamente cards atrasados (cujo prazo já passou) e cards com vencimento próximo (cujo prazo é hoje ou amanhã), para que o usuário perceba rapidamente o que precisa de atenção imediata. Dentro de uma lista, o usuário também pode visualizar os cards ordenados pelo prazo, do mais próximo ao mais distante, em vez da ordem manual em que já podem ser organizados (RF03).

Esta especificação trata o prazo como uma data — não uma data e hora —, da mesma forma que "data de vencimento" é normalmente entendido em uso cotidiano: o usuário escolhe um dia, não um horário específico. O status de atraso de um card é sempre calculado a partir da data atual no momento em que é consultado — nunca um valor fixo gravado no momento em que o prazo foi definido —, e independe de em qual lista o card está: esta especificação não define nenhum conceito de "card concluído", então um card com prazo vencido é tratado como atrasado mesmo que, na prática, o trabalho já tenha terminado.

## 2. Comportamento Esperado

### 2.1 Definir um prazo em um card
- Qualquer membro do quadro pode definir um prazo em qualquer card desse quadro, escolhendo uma data.
- É permitido definir um prazo no passado — o card passa a aparecer como atrasado imediatamente, sem nenhuma validação impedindo isso.

### 2.2 Alterar ou remover o prazo de um card
- Qualquer membro do quadro pode alterar o prazo de um card para outra data, a qualquer momento.
- Qualquer membro do quadro pode remover o prazo de um card, fazendo-o voltar ao estado "sem prazo".

### 2.3 Identificação de cards atrasados e com vencimento próximo
- Um card com prazo definido é considerado **atrasado** quando o prazo já passou (é anterior à data atual).
- Um card com prazo definido é considerado **com vencimento próximo** quando o prazo é hoje ou amanhã, e ainda não passou.
- Um card sem prazo definido não é considerado nem atrasado nem com vencimento próximo.
- Um card atrasado e um card com vencimento próximo são visualmente diferenciados dos demais cards do quadro, de forma que o usuário identifique cada um desses dois estados à primeira vista.
- Esses estados não são armazenados: são sempre recalculados a partir da data atual sempre que o card é visualizado, então um card que hoje está "com vencimento próximo" passa a "atrasado" no dia seguinte automaticamente, sem que ninguém precise alterá-lo.

### 2.4 Ordenar cards por prazo
- Dentro de uma lista, o usuário pode optar por ver os cards ordenados pelo prazo, do mais próximo ao mais distante, em vez da ordem manual já estabelecida (RF03).
- Cards sem prazo aparecem depois de todos os cards com prazo definido, quando essa ordenação está ativa.
- Essa ordenação é só uma forma de visualização: não altera a posição manual dos cards nem qualquer outro dado — voltar à visualização padrão mostra os cards na mesma ordem manual de sempre.

## 3. Critérios de Aceite (Given/When/Then)

**Definir prazo**

1. Given um membro de um quadro, When ele define um prazo válido em um card sem prazo, Then esse prazo passa a constar no card.
2. Given um membro de um quadro, When ele define, em um card, um prazo cuja data já passou, Then o prazo é aceito normalmente, e o card já aparece como atrasado.
3. Given um membro de um quadro, When ele tenta definir um prazo com uma data inválida ou malformada, Then a operação é rejeitada.
4. Given um usuário não autenticado, When ele tenta definir um prazo em um card, Then a operação é rejeitada e ele é tratado como não autenticado.
5. Given um usuário autenticado que não é membro de um quadro, When ele tenta definir um prazo em um card desse quadro, Then recebe indicação de que o quadro não foi encontrado.
6. Given um membro de um quadro, When ele tenta definir um prazo em um card que não existe ou não pertence à lista/quadro informados, Then recebe indicação de que o card não foi encontrado.

**Alterar ou remover prazo**

7. Given um card com um prazo já definido, When um membro do quadro define uma nova data para esse prazo, Then o card passa a mostrar o novo prazo, não mais o anterior.
8. Given um card com um prazo definido, When um membro do quadro remove esse prazo, Then o card volta ao estado "sem prazo" e deixa de ser considerado atrasado ou com vencimento próximo.
9. Given um card que já está sem nenhum prazo, When um membro do quadro tenta remover o prazo desse card, Then a operação é aceita sem nenhum efeito, e não é tratada como erro.

**Identificação de atraso e vencimento próximo**

10. Given um card cujo prazo é anterior à data atual, When o quadro é visualizado, Then esse card aparece destacado como atrasado.
11. Given um card cujo prazo é hoje, When o quadro é visualizado, Then esse card aparece destacado como vencimento próximo, e não como atrasado.
12. Given um card cujo prazo é amanhã, When o quadro é visualizado, Then esse card aparece destacado como vencimento próximo.
13. Given um card cujo prazo é depois de amanhã, When o quadro é visualizado, Then esse card aparece sem nenhum desses destaques.
14. Given um card sem nenhum prazo definido, When o quadro é visualizado, Then esse card aparece sem nenhum desses destaques.
15. Given um card cujo prazo era "hoje" no dia anterior, When o quadro é visualizado no dia seguinte, sem que ninguém tenha alterado o card, Then esse card aparece destacado como atrasado.
16. Given um usuário autenticado que não é membro de um quadro, When ele tenta visualizar os prazos ou os destaques de atraso de um card desse quadro, Then recebe indicação de que o quadro não foi encontrado.

**Ordenar por prazo**

17. Given uma lista com cards de prazos variados, When um membro do quadro opta por ordenar por prazo, Then os cards aparecem do prazo mais próximo para o mais distante.
18. Given uma lista com alguns cards com prazo e outros sem prazo, When um membro do quadro opta por ordenar por prazo, Then os cards sem prazo aparecem depois de todos os cards com prazo.
19. Given dois cards com exatamente o mesmo prazo, When um membro do quadro opta por ordenar por prazo, Then a ordem relativa entre esses dois cards é a mesma que já tinham antes de ordenar por prazo.
20. Given uma lista ordenada por prazo, When o membro volta à visualização padrão, Then os cards voltam a aparecer na ordem manual de sempre, sem nenhuma alteração de posição causada pela ordenação por prazo.
21. Given um usuário autenticado que não é membro de um quadro, When ele tenta ordenar por prazo os cards de uma lista desse quadro, Then recebe indicação de que o quadro não foi encontrado.

## 4. Regras de Negócio e Restrições

- **RN-01 (Prazo é uma data, opcional, um por card):** um card tem no máximo um prazo, representado como uma data (sem horário); um card pode não ter prazo nenhum.
- **RN-02 (Sem ação restrita a administrador):** definir, alterar e remover o prazo de um card é permitido a qualquer membro do quadro, independentemente do papel definido em RF07.
- **RN-03 (Datas no passado são permitidas):** não há restrição de data mínima ao definir um prazo — uma data já passada é aceita e o card é imediatamente considerado atrasado.
- **RN-04 (Remover prazo é idempotente):** remover o prazo de um card que já não tem prazo não é um erro — a operação é aceita sem efeito adicional.
- **RN-05 (Definição de atrasado):** um card é atrasado quando tem um prazo definido e esse prazo é anterior à data atual.
- **RN-06 (Definição de vencimento próximo):** um card tem vencimento próximo quando tem um prazo definido, esse prazo é hoje ou amanhã, e o prazo ainda não passou. Um card não pode ser, ao mesmo tempo, atrasado e com vencimento próximo.
- **RN-07 (Sem prazo não tem destaque):** um card sem prazo definido nunca é considerado atrasado nem com vencimento próximo.
- **RN-08 (Status recalculado, não armazenado):** se um card está atrasado ou tem vencimento próximo é sempre calculado com base na data atual no momento da consulta — nunca um valor gravado quando o prazo foi definido. A passagem do tempo muda esse status sozinha, sem que o card seja alterado.
- **RN-09 (Status independe da lista ou de conclusão):** esta especificação não define nenhum conceito de card "concluído"; o status de atraso de um card depende só do seu prazo, não da lista em que está.
- **RN-10 (Ordenação por prazo é só visualização):** ordenar os cards de uma lista por prazo nunca altera a posição manual armazenada de nenhum card — é possível alternar entre a ordem manual e a ordem por prazo livremente, sem perder a ordem manual original.
- **RN-11 (Cards sem prazo vão para o final ao ordenar por prazo):** ao ordenar por prazo, todo card sem prazo aparece depois de todos os cards que têm prazo definido.
- **RN-12 (Empate na ordenação por prazo preserva a ordem relativa anterior):** cards com o mesmo prazo, ao serem ordenados por prazo, mantêm entre si a mesma ordem relativa que já tinham na ordem manual.
- **RN-13 (Isolamento por associação de membro):** um usuário que não é membro de um quadro é tratado, para qualquer operação desta funcionalidade sobre esse quadro, como se o quadro não existisse — mesmo comportamento de isolamento já definido em RF02/RF07/RF08/RF09.

## 5. Casos de Borda e Condições de Erro

- Definir um prazo com uma data inválida ou malformada → rejeitado (RN-01, critério 3).
- Definir um prazo no passado → aceito, card já atrasado imediatamente (RN-03, critério 2).
- Remover o prazo de um card que já não tem prazo → aceito, sem erro (RN-04, critério 9).
- Prazo igual a hoje → vencimento próximo, nunca atrasado (RN-06, critério 11).
- Prazo igual a amanhã → vencimento próximo (RN-06, critério 12).
- Prazo a partir de depois de amanhã, ou card sem prazo → sem destaque nenhum (RN-07, critérios 13, 14).
- Passagem de um dia sem nenhuma ação do usuário → status de "vencimento próximo" que virou "atrasado" é refletido automaticamente na próxima visualização (RN-08, critério 15).
- Definir, alterar, remover ou visualizar prazo em um quadro do qual não se é membro → tratado como "quadro não encontrado", mesmo conhecendo o id exato do quadro ou do card (RN-13, critérios 5, 16, 21).
- Definir ou alterar prazo em um card inexistente, ou que não pertence à lista/quadro informados → rejeitado, "card não encontrado", reaproveitando o comportamento já definido em RF04/RF06/RF08/RF09 (critério 6).
- Ordenar por prazo uma lista em que nenhum card tem prazo → todos os cards aparecem, na mesma ordem manual que já tinham (RN-11, RN-12).
- Ordenar por prazo não é uma ação que modifica dados: alternar de volta para a ordem manual sempre restaura a posição original de cada card (RN-10, critério 20).
