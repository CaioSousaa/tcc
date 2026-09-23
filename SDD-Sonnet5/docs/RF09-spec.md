# RF09 — Comentários em Cards, com Histórico Cronológico

## 1. Visão Geral

Qualquer membro de um quadro pode adicionar comentários de texto a um card desse quadro, para registrar decisões e discussões relacionadas à tarefa. Todo card passa a ter um histórico de comentários, visível a qualquer membro do quadro, ordenado do mais antigo para o mais novo, em que cada comentário mostra quem o escreveu.

Esta funcionalidade cobre apenas a criação de comentários e a visualização do histórico. Não há, nesta especificação, edição nem exclusão de um comentário já criado — uma vez escrito, ele passa a fazer parte permanente do histórico do card, da mesma forma que um registro de decisão ou discussão não costuma ser apagado depois de anotado. Assim como em RF06 e RF08, comentar não é uma ação restrita a administrador: qualquer membro do quadro pode fazê-lo, independentemente do papel definido em RF07.

## 2. Comportamento Esperado

### 2.1 Comentar em um card
- Qualquer membro do quadro pode adicionar um comentário de texto a qualquer card desse quadro.
- O comentário criado registra, além do texto, quem o escreveu e quando foi escrito.
- Um card pode receber comentários de vários membros diferentes, e o mesmo membro pode comentar mais de uma vez no mesmo card.

### 2.2 Ver o histórico de comentários de um card
- Qualquer membro do quadro, ao visualizar um card, vê o histórico completo de comentários desse card.
- Os comentários aparecem ordenados cronologicamente, do mais antigo para o mais novo.
- Um card sem nenhum comentário tem um histórico vazio — isso não é um erro.

### 2.3 Autoria
- Cada comentário mostra claramente quem o escreveu.
- O autor de um comentário é sempre o próprio usuário que o está criando — não é possível criar um comentário em nome de outro usuário.
- Se o autor de um comentário deixar de ser membro do quadro depois (por remoção ou por sair, RF07), o comentário continua no histórico, com a identificação do autor original preservada.

### 2.4 Sem edição ou exclusão
- Esta especificação não prevê alterar o texto de um comentário nem removê-lo depois de criado. O histórico de comentários de um card é, nesta especificação, somente de acréscimo.

## 3. Critérios de Aceite (Given/When/Then)

**Comentar em um card**

1. Given um membro de um quadro, When ele adiciona um comentário com texto válido a um card desse quadro, Then o comentário passa a constar no histórico do card, com o texto, o autor e o momento em que foi escrito.
2. Given um membro de um quadro, When ele tenta adicionar um comentário sem texto ou com texto vazio, Then a operação é rejeitada.
3. Given um membro de um quadro, When ele tenta adicionar um comentário com texto acima do tamanho máximo permitido, Then a operação é rejeitada.
4. Given um usuário não autenticado, When ele tenta comentar em um card, Then a operação é rejeitada e ele é tratado como não autenticado.
5. Given um usuário autenticado que não é membro de um quadro, When ele tenta comentar em um card desse quadro, Then recebe indicação de que o quadro não foi encontrado.
6. Given um membro de um quadro, When ele tenta comentar em um card que não existe ou não pertence à lista/quadro informados, Then recebe indicação de que o card não foi encontrado.

**Ver o histórico de comentários**

7. Given um card com vários comentários de autores diferentes, When um membro do quadro visualiza esse card, Then vê todos os comentários, ordenados do mais antigo para o mais novo, cada um com seu autor.
8. Given um card sem nenhum comentário, When um membro do quadro visualiza esse card, Then vê um histórico vazio, sem nenhum erro.
9. Given um mesmo membro que comentou mais de uma vez no mesmo card, When o histórico desse card é visualizado, Then todos os comentários desse membro aparecem, na ordem em que foram escritos, sem se fundir em um só.
10. Given um usuário autenticado que não é membro de um quadro, When ele tenta ver o histórico de comentários de um card desse quadro, Then recebe indicação de que o quadro não foi encontrado.

**Autoria**

11. Given um comentário criado por um membro, When o histórico do card é visualizado, Then esse comentário mostra esse membro como autor.
12. Given um membro que comentou em um card e depois deixou de ser membro do quadro, When o histórico desse card é visualizado por um membro atual, Then o comentário continua aparecendo, com a identificação do autor original preservada.

**Integração com card e quadro**

13. Given um card com comentários, When esse card é excluído, Then todos os seus comentários são removidos permanentemente junto com ele.
14. Given um quadro com cards comentados, When esse quadro é excluído, Then todos os comentários de todos os seus cards são removidos permanentemente junto com ele.

## 4. Regras de Negócio e Restrições

- **RN-01 (Comentário pertence a um único card):** todo comentário existe dentro do contexto de exatamente um card; não há comentários compartilhados entre cards.
- **RN-02 (Texto obrigatório, com tamanho máximo):** o texto de um comentário é obrigatório, não pode ser vazio, e tem um tamanho máximo, na mesma ordem de grandeza usada para outros campos de texto livre deste sistema (a descrição de um card).
- **RN-03 (Sem ação restrita a administrador):** comentar e ver o histórico de comentários é permitido a qualquer membro do quadro, independentemente do papel definido em RF07.
- **RN-04 (Cardinalidade livre):** um card pode ter zero ou vários comentários; um mesmo membro pode comentar no mesmo card mais de uma vez. Não há limite máximo definido por esta especificação.
- **RN-05 (Autor é sempre quem escreveu):** o autor de um comentário é determinado exclusivamente pelo usuário autenticado que o cria — nunca informado explicitamente por quem comenta, e nunca alterável depois.
- **RN-06 (Autoria preservada após saída do quadro):** deixar de ser membro do quadro (remoção ou saída, RF07) não afeta os comentários já escritos por esse usuário — eles permanecem no histórico, com a identificação do autor original.
- **RN-07 (Histórico ordenado cronologicamente):** os comentários de um card são sempre exibidos em ordem cronológica de criação, do mais antigo para o mais novo.
- **RN-08 (Sem edição ou exclusão):** esta especificação não define nenhuma operação para alterar o texto de um comentário nem para removê-lo — uma vez criado, permanece no histórico como está, exceto pelas cascatas de RN-09 e RN-10.
- **RN-09 (Exclusão de card cascade para comentários):** excluir um card remove permanentemente todos os seus comentários.
- **RN-10 (Exclusão de quadro cascade para comentários):** excluir um quadro remove permanentemente todos os comentários de todos os seus cards.
- **RN-11 (Isolamento por associação de membro):** um usuário que não é membro de um quadro é tratado, para qualquer operação desta funcionalidade sobre esse quadro, como se o quadro não existisse — mesmo comportamento de isolamento já definido em RF02/RF07/RF08.

## 5. Casos de Borda e Condições de Erro

- Comentar sem texto, com texto vazio, ou acima do tamanho máximo → rejeitado (RN-02, critérios 2, 3).
- Comentar em um card inexistente, ou que não pertence à lista/quadro informados → rejeitado, "card não encontrado", reaproveitando o comportamento já definido em RF04/RF06/RF08 (critério 6).
- Usuário não autenticado tentando comentar → tratado como não autenticado (critério 4).
- Usuário que não é membro do quadro tentando comentar ou ver o histórico → tratado como "quadro não encontrado", mesmo conhecendo o id exato do quadro ou do card (RN-11, critérios 5, 10).
- Card sem nenhum comentário → histórico vazio, não um erro (critério 8).
- Mesmo membro comentando várias vezes no mesmo card → todos os comentários preservados individualmente, nunca fundidos ou substituídos (RN-04, critério 9).
- Autor de um comentário que depois deixa de ser membro do quadro (removido ou saiu, RF07) → o comentário permanece no histórico com o autor original identificado, não é removido nem anonimizado (RN-06, critério 12).
- Excluir um card com comentários → todos os comentários desse card são removidos junto (RN-09, critério 13).
- Excluir um quadro com cards comentados → todos os comentários de todos os cards são removidos em cascata junto com o quadro (RN-10, critério 14).
- Não há, nesta especificação, nenhuma operação de editar ou excluir um comentário individual — uma tentativa de fazê-lo está fora do escopo de RF09 (RN-08).
