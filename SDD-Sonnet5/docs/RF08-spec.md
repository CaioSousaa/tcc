# RF08 — Etiquetas Coloridas em Cards, com Filtro por Etiqueta

## 1. Visão Geral

Um quadro passa a ter uma coleção de **etiquetas** — cada uma com um nome e uma cor —, que qualquer membro do quadro pode criar, ver, editar e excluir. Uma etiqueta pode ser associada a qualquer card do mesmo quadro, e um card pode ter várias etiquetas ao mesmo tempo. As etiquetas servem para marcar categorias ou prioridades e, a partir delas, o usuário pode filtrar quais cards do quadro estão visíveis, mostrando só os que têm alguma das etiquetas escolhidas.

Diferente de RF07, esta funcionalidade não introduz nenhuma ação restrita a administrador: criar, editar, excluir e (des)associar etiquetas é permitido a qualquer membro do quadro, do mesmo jeito que já é para listas, cards e checklists (RF02–RF06).

## 2. Comportamento Esperado

### 2.1 Criar etiqueta
- Qualquer membro do quadro pode criar uma etiqueta nova, informando um nome e uma cor.
- A etiqueta criada passa a valer só para aquele quadro — não existe etiqueta compartilhada entre quadros diferentes.

### 2.2 Ver as etiquetas de um quadro
- Qualquer membro do quadro pode ver a lista completa de etiquetas do quadro, com nome e cor de cada uma.

### 2.3 Editar uma etiqueta
- Qualquer membro do quadro pode alterar o nome e/ou a cor de uma etiqueta existente.
- A alteração se reflete imediatamente em todos os cards que já têm essa etiqueta associada — não é preciso reassociar nada.

### 2.4 Excluir uma etiqueta
- Qualquer membro do quadro pode excluir uma etiqueta.
- Excluir uma etiqueta a remove de todos os cards aos quais estava associada. Os cards em si não são afetados.

### 2.5 Associar uma etiqueta a um card
- Qualquer membro do quadro pode associar uma etiqueta do quadro a qualquer card desse mesmo quadro.
- Um card pode ter várias etiquetas associadas ao mesmo tempo, ou nenhuma.
- A mesma etiqueta pode estar associada a vários cards ao mesmo tempo.

### 2.6 Desassociar uma etiqueta de um card
- Qualquer membro do quadro pode remover a associação entre uma etiqueta e um card, sem excluir a etiqueta nem o card.

### 2.7 Ver as etiquetas de um card
- Qualquer membro do quadro, ao visualizar um card, vê quais etiquetas estão associadas a ele.

### 2.8 Filtrar cards por etiqueta
- Qualquer membro do quadro pode escolher uma ou mais etiquetas e visualizar só os cards do quadro que têm ao menos uma das etiquetas escolhidas.
- Não escolher nenhuma etiqueta equivale a não aplicar filtro nenhum: todos os cards voltam a aparecer.
- Filtrar é uma forma de visualização — não exclui, move ou altera nenhum card; só muda quais cards são exibidos no momento.

## 3. Critérios de Aceite (Given/When/Then)

**Criar etiqueta**

1. Given um membro de um quadro, When ele cria uma etiqueta informando nome e cor válidos, Then a etiqueta passa a constar na lista de etiquetas do quadro com esse nome e essa cor.
2. Given um membro de um quadro, When ele tenta criar uma etiqueta sem nome ou com nome vazio, Then a operação é rejeitada.
3. Given um membro de um quadro, When ele tenta criar uma etiqueta com um nome acima do tamanho máximo permitido, Then a operação é rejeitada.
4. Given um membro de um quadro, When ele tenta criar uma etiqueta sem cor ou com uma cor fora do conjunto de cores que o sistema oferece, Then a operação é rejeitada.
5. Given um quadro que já tem uma etiqueta com um certo nome e cor, When um membro cria uma nova etiqueta com o mesmo nome e/ou a mesma cor, Then a nova etiqueta é criada normalmente, coexistindo com a anterior.
6. Given um usuário não autenticado, When ele tenta criar uma etiqueta, Then a operação é rejeitada e ele é tratado como não autenticado.
7. Given um usuário autenticado que não é membro de um quadro, When ele tenta criar uma etiqueta nesse quadro, Then recebe indicação de que o quadro não foi encontrado.

**Ver etiquetas do quadro**

8. Given um membro de um quadro, When ele solicita a lista de etiquetas do quadro, Then recebe todas as etiquetas, cada uma com nome e cor.
9. Given um quadro sem nenhuma etiqueta, When um membro solicita a lista de etiquetas, Then recebe uma lista vazia.
10. Given um usuário autenticado que não é membro de um quadro, When ele solicita a lista de etiquetas desse quadro, Then recebe indicação de que o quadro não foi encontrado.

**Editar etiqueta**

11. Given uma etiqueta existente, When um membro do quadro altera seu nome, Then o novo nome passa a ser exibido, inclusive nos cards que já têm essa etiqueta.
12. Given uma etiqueta existente, When um membro do quadro altera sua cor, Then a nova cor passa a ser exibida, inclusive nos cards que já têm essa etiqueta.
13. Given um membro de um quadro, When ele tenta editar uma etiqueta que não existe ou pertence a outro quadro, Then recebe indicação de que a etiqueta não foi encontrada.
14. Given um usuário autenticado que não é membro de um quadro, When ele tenta editar uma etiqueta desse quadro, Then recebe indicação de que o quadro não foi encontrado.

**Excluir etiqueta**

15. Given uma etiqueta associada a um ou mais cards, When um membro do quadro a exclui, Then ela deixa de constar na lista de etiquetas do quadro e deixa de aparecer em todos os cards aos quais estava associada, e os cards continuam existindo normalmente.
16. Given um membro de um quadro, When ele tenta excluir uma etiqueta que não existe, já foi excluída, ou pertence a outro quadro, Then recebe indicação de que a etiqueta não foi encontrada.

**Associar etiqueta a um card**

17. Given um membro de um quadro, When ele associa uma etiqueta do quadro a um card desse mesmo quadro, Then essa etiqueta passa a constar entre as etiquetas do card.
18. Given um card já com uma etiqueta associada, When um membro associa uma segunda etiqueta do mesmo quadro a esse card, Then ambas passam a constar entre as etiquetas do card.
19. Given uma etiqueta associada a um card, When um membro tenta associar a mesma etiqueta a esse mesmo card de novo, Then a operação é aceita sem efeito adicional — a etiqueta não aparece duplicada.
20. Given um membro de um quadro, When ele tenta associar a um card uma etiqueta que pertence a outro quadro, Then recebe indicação de que a etiqueta não foi encontrada.
21. Given um membro de um quadro, When ele tenta associar uma etiqueta a um card que não existe ou não pertence à lista/quadro informados, Then recebe indicação de que o card não foi encontrado.

**Desassociar etiqueta de um card**

22. Given um card com uma etiqueta associada, When um membro do quadro desassocia essa etiqueta do card, Then ela deixa de constar entre as etiquetas do card, mas continua existindo na lista de etiquetas do quadro.
23. Given um card sem uma determinada etiqueta associada, When um membro tenta desassociar essa etiqueta desse card, Then recebe indicação de que essa associação não existe.

**Ver etiquetas de um card**

24. Given um card com etiquetas associadas, When qualquer membro do quadro visualiza esse card, Then vê todas as etiquetas associadas a ele.

**Filtrar cards por etiqueta**

25. Given um quadro com cards de etiquetas variadas, When um membro filtra pela etiqueta X, Then só os cards que têm a etiqueta X aparecem.
26. Given um quadro com cards de etiquetas variadas, When um membro filtra pelas etiquetas X e Y ao mesmo tempo, Then aparecem os cards que têm X, os que têm Y, e os que têm ambas — não somente os que têm as duas.
27. Given um filtro de etiqueta ativo, When o membro remove todas as etiquetas escolhidas do filtro, Then todos os cards do quadro voltam a aparecer.
28. Given uma etiqueta sem nenhum card associado, When um membro filtra por ela, Then nenhum card aparece, sem erro.
29. Given um usuário autenticado que não é membro de um quadro, When ele tenta filtrar os cards desse quadro por etiqueta, Then recebe indicação de que o quadro não foi encontrado.

**Integração com quadro e card**

30. Given um card com etiquetas associadas, When esse card é excluído, Then suas associações de etiqueta são removidas junto, e as etiquetas continuam existindo no quadro, disponíveis para outros cards.
31. Given um quadro com etiquetas e cards etiquetados, When esse quadro é excluído, Then todas as suas etiquetas e todas as associações delas com cards são removidas junto.

## 4. Regras de Negócio e Restrições

- **RN-01 (Etiqueta pertence a um único quadro):** toda etiqueta existe dentro do contexto de exatamente um quadro; não há etiquetas compartilhadas entre quadros diferentes.
- **RN-02 (Nome obrigatório, com tamanho máximo):** o nome de uma etiqueta é obrigatório, não pode ser vazio, e tem um tamanho máximo — os mesmos limites de sobra usados para nomes curtos em outras partes do sistema (name de lista, de checklist).
- **RN-03 (Cor obrigatória, dentro de um conjunto suportado):** toda etiqueta tem uma cor, escolhida entre as opções de cor que o sistema oferece; um valor de cor fora desse conjunto, ou ausente, é rejeitado. As opções específicas de cor não são definidas por esta especificação.
- **RN-04 (Sem exigência de unicidade):** nome e cor de uma etiqueta não precisam ser únicos dentro do quadro — duas etiquetas podem ter o mesmo nome, a mesma cor, ou ambos.
- **RN-05 (Sem ação restrita a administrador):** criar, ver, editar, excluir e (des)associar etiquetas é permitido a qualquer membro do quadro, independentemente do papel definido em RF07.
- **RN-06 (Associação restrita ao mesmo quadro):** uma etiqueta só pode ser associada a cards que pertencem ao mesmo quadro dessa etiqueta.
- **RN-07 (Cardinalidade livre de associações):** um card pode ter zero, uma ou várias etiquetas associadas; uma etiqueta pode estar associada a zero, um ou vários cards. Não há limite máximo definido por esta especificação.
- **RN-08 (Associar é idempotente):** associar a um card uma etiqueta que já está associada a ele não é um erro e não duplica a associação.
- **RN-09 (Desassociar exige associação existente):** desassociar de um card uma etiqueta que não está associada a ele é rejeitado, indicando que essa associação não existe.
- **RN-10 (Exclusão de etiqueta cascade para associações):** excluir uma etiqueta remove permanentemente todas as suas associações com cards; os cards continuam existindo.
- **RN-11 (Exclusão de card cascade para associações de etiqueta):** excluir um card remove suas associações de etiqueta; as etiquetas do quadro não são afetadas.
- **RN-12 (Exclusão de quadro cascade para etiquetas):** excluir um quadro remove todas as suas etiquetas e todas as associações delas com cards.
- **RN-13 (Filtro é só visualização):** filtrar cards por etiqueta nunca cria, exclui, move ou altera um card, uma lista, ou uma etiqueta — afeta somente quais cards são exibidos no momento do filtro.
- **RN-14 (Filtro combina etiquetas com "ou", não "e"):** ao filtrar por mais de uma etiqueta ao mesmo tempo, aparecem os cards que têm pelo menos uma das etiquetas escolhidas — não apenas os que têm todas elas.
- **RN-15 (Filtro vazio equivale a nenhum filtro):** não ter nenhuma etiqueta escolhida no filtro mostra todos os cards do quadro, do mesmo jeito que se nenhum filtro tivesse sido aplicado.
- **RN-16 (Isolamento por associação de membro):** um usuário que não é membro de um quadro é tratado, para qualquer operação desta funcionalidade sobre esse quadro, como se o quadro não existisse — mesmo comportamento de isolamento já definido em RF02/RF07.
- **RN-17 (Isolamento de etiqueta):** uma etiqueta informada que não pertence ao quadro da operação (por exemplo, de outro quadro) é tratada como "etiqueta não encontrada", nunca como se pertencesse ao quadro errado.

## 5. Casos de Borda e Condições de Erro

- Criar etiqueta sem nome, com nome vazio, ou acima do tamanho máximo → rejeitado (RN-02, critérios 2, 3).
- Criar etiqueta sem cor, ou com cor fora do conjunto suportado → rejeitado (RN-03, critério 4).
- Criar etiqueta com nome e/ou cor repetidos de outra já existente no quadro → aceito normalmente (RN-04, critério 5).
- Editar ou excluir uma etiqueta inexistente, já excluída, ou pertencente a outro quadro → rejeitado, "etiqueta não encontrada" (RN-01, RN-17, critérios 13, 16).
- Associar a um card uma etiqueta de outro quadro → rejeitado, "etiqueta não encontrada" (RN-06, RN-17, critério 20).
- Associar a um card uma etiqueta já associada a ele → aceito, sem duplicar (RN-08, critério 19).
- Desassociar de um card uma etiqueta que não está associada a ele → rejeitado, indicando que a associação não existe (RN-09, critério 23).
- Associar/desassociar etiqueta em um card inexistente, ou que não pertence à lista/quadro informados → rejeitado, "card não encontrado", reaproveitando o comportamento já definido em RF04/RF06 (critério 21).
- Excluir uma etiqueta associada a vários cards → desaparece de todos eles; nenhum card é excluído (RN-10, critério 15).
- Excluir um card com etiquetas associadas → as associações somem junto; as etiquetas do quadro permanecem disponíveis para outros cards (RN-11, critério 30).
- Excluir um quadro com etiquetas e cards etiquetados → etiquetas e associações são removidas em cascata junto com o quadro (RN-12, critério 31).
- Filtrar por uma etiqueta sem nenhum card associado → resultado vazio, sem erro (critério 28).
- Filtrar por mais de uma etiqueta → união dos cards que têm ao menos uma delas, nunca só a interseção (RN-14, critério 26).
- Remover a seleção de etiquetas do filtro → volta a mostrar todos os cards, sem necessidade de nenhuma outra ação (RN-15, critério 27).
- Um usuário que não é membro de um quadro não consegue, por meio de nenhuma operação desta funcionalidade, ver, criar, editar, excluir, associar, desassociar ou filtrar etiquetas desse quadro — mesmo conhecendo o id exato do quadro, da etiqueta ou do card (RN-16, critérios 7, 10, 14, 29).
