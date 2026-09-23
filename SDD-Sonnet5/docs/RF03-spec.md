# RF03 — Criar, Renomear, Reordenar e Excluir Listas dentro de um Quadro

## 1. Visão Geral

Um usuário autenticado, dono de um quadro (RF02), deve conseguir organizar esse quadro em listas: criar novas listas, renomeá-las, alterar a ordem em que aparecem e excluí-las. Uma lista pertence a exatamente um quadro. Como listas vivem dentro de um quadro, o direito de operar sobre uma lista deriva do direito sobre o quadro que a contém (RF02, RN-01/RN-06): só o dono do quadro pode criar, ver, renomear, reordenar ou excluir as listas desse quadro.

## 2. Comportamento Esperado

### 2.1 Criar lista
- O dono de um quadro pode criar uma nova lista nesse quadro informando um nome (obrigatório).
- A lista criada passa a aparecer entre as listas do quadro, posicionada após todas as listas já existentes no momento da criação.

### 2.2 Ver listas
- O dono de um quadro pode ver todas as listas desse quadro, na ordem de exibição vigente.
- Um quadro sem nenhuma lista é um estado válido, não um erro.

### 2.3 Renomear lista
- O dono do quadro ao qual uma lista pertence pode alterar o nome dessa lista.

### 2.4 Reordenar listas
- O dono de um quadro pode mudar a posição de uma lista entre as demais listas do mesmo quadro. As outras listas do quadro se reorganizam para refletir a nova posição, mantendo entre si a mesma ordem relativa que tinham antes.
- Não é possível, nesta funcionalidade, mover uma lista de um quadro para outro — apenas reordenar listas dentro do mesmo quadro.

### 2.5 Excluir lista
- O dono do quadro ao qual uma lista pertence pode excluí-la.
- A exclusão é permanente: a lista e todo o conteúdo associado a ela deixam de existir e não podem ser recuperados.
- Após a exclusão, a lista some da listagem do quadro; as listas restantes mantêm a ordem relativa que tinham entre si antes da exclusão.

### 2.6 Privacidade e isolamento
- Uma tentativa de criar, ver, renomear, reordenar ou excluir lista em um quadro que não existe ou que pertence a outro usuário é tratada como "quadro não encontrado" — mesmo comportamento já definido em RF02 para quadros.
- Uma tentativa de ver, renomear, reordenar ou excluir uma lista que não existe, que pertence a um quadro diferente do informado na operação, ou cujo quadro pertence a outro usuário, é tratada como "lista não encontrada", sem distinguir esses casos entre si.

## 3. Critérios de Aceite (Given/When/Then)

**Criar**

1. Given um usuário autenticado dono de um quadro, When ele cria uma lista informando um nome válido, Then a lista é criada, pertence a esse quadro, e passa a aparecer entre as listas do quadro.
2. Given um usuário autenticado dono de um quadro, When ele tenta criar uma lista sem informar nome (ausente ou vazio), Then a criação é rejeitada e o sistema indica que o nome é obrigatório.
3. Given um usuário autenticado dono de um quadro, When ele informa um nome que excede o tamanho máximo permitido (RN-02), Then a criação é rejeitada e o sistema informa que o limite foi excedido.
4. Given um usuário autenticado dono de um quadro que já tem listas, When ele cria uma nova lista, Then a nova lista é posicionada depois de todas as listas já existentes desse quadro (RN-08).
5. Given um usuário autenticado, When ele tenta criar uma lista em um quadro que não existe ou que pertence a outro usuário, Then recebe indicação de que o quadro não foi encontrado.
6. Given um usuário não autenticado, When ele tenta criar uma lista, Then a operação é rejeitada e ele é tratado como não autenticado.

**Ver**

7. Given um usuário autenticado dono de um quadro com uma ou mais listas, When ele solicita as listas desse quadro, Then recebe todas as listas do quadro, na ordem de exibição vigente.
8. Given um usuário autenticado dono de um quadro sem nenhuma lista, When ele solicita as listas desse quadro, Then recebe uma lista vazia, não um erro.
9. Given um usuário autenticado, When ele solicita as listas de um quadro que não existe ou que pertence a outro usuário, Then recebe indicação de que o quadro não foi encontrado.

**Renomear**

10. Given um usuário autenticado dono do quadro de uma lista, When ele renomeia essa lista para um nome válido, Then a lista passa a refletir o novo nome.
11. Given um usuário autenticado dono do quadro de uma lista, When ele tenta renomear essa lista para um nome vazio, Then a operação é rejeitada e o sistema indica que o nome é obrigatório.
12. Given um usuário autenticado, When ele tenta renomear uma lista que não existe, que pertence a um quadro diferente do informado, ou cujo quadro pertence a outro usuário, Then recebe indicação de que a lista não foi encontrada.

**Reordenar**

13. Given um usuário autenticado dono de um quadro com múltiplas listas, When ele move uma lista para uma posição válida diferente da atual, Then a ordem de exibição das listas do quadro passa a refletir a nova posição, preservando a ordem relativa das demais.
14. Given um usuário autenticado dono de um quadro com múltiplas listas, When ele move uma lista para a primeira posição, Then essa lista passa a ser exibida antes de todas as outras listas do quadro.
15. Given um usuário autenticado dono de um quadro com múltiplas listas, When ele move uma lista para a última posição, Then essa lista passa a ser exibida depois de todas as outras listas do quadro.
16. Given um usuário autenticado dono de um quadro, When ele tenta mover uma lista para uma posição fora do intervalo válido de posições do quadro, Then a operação é rejeitada e o sistema informa que a posição é inválida.
17. Given um usuário autenticado, When ele tenta reordenar uma lista que não existe, que pertence a um quadro diferente do informado, ou cujo quadro pertence a outro usuário, Then recebe indicação de que a lista não foi encontrada.

**Excluir**

18. Given um usuário autenticado dono do quadro de uma lista, When ele exclui essa lista, Then a lista deixa de existir, some da listagem do quadro, e as demais listas do quadro mantêm a ordem relativa que tinham entre si.
19. Given um usuário autenticado dono de um quadro com uma única lista, When ele exclui essa lista, Then o quadro passa a não ter nenhuma lista, sem que isso seja tratado como erro.
20. Given um usuário autenticado, When ele tenta excluir uma lista que não existe, que pertence a um quadro diferente do informado, ou cujo quadro pertence a outro usuário, Then recebe indicação de que a lista não foi encontrada.
21. Given um usuário autenticado, When ele tenta excluir novamente uma lista que ele mesmo já havia excluído anteriormente, Then recebe a mesma indicação de "não encontrada" do critério 20.

## 4. Regras de Negócio e Restrições

- **RN-01 (Lista pertence a um único quadro):** toda lista pertence a exatamente um quadro, definido no momento da criação. Mover uma lista para outro quadro está fora do escopo de RF03.
- **RN-02 (Nome obrigatório e limitado):** o nome da lista é obrigatório, não pode ser vazio (nem composto apenas por espaços) e deve ter no máximo 100 caracteres.
- **RN-03 (Nomes não precisam ser únicos):** um quadro pode ter mais de uma lista com o mesmo nome; o sistema não impõe unicidade de nome entre as listas de um quadro.
- **RN-04 (Autorização derivada do dono do quadro):** toda operação sobre uma lista (criar, ver, renomear, reordenar, excluir) exige que o usuário autenticado seja o dono do quadro ao qual a lista pertence (ou, na criação, do quadro em que a lista será criada). Não existe permissão específica de lista independente da posse do quadro.
- **RN-05 (Isolamento de quadro / não vazamento de existência):** operar sobre listas de um quadro que não existe ou que pertence a outro usuário produz a mesma resposta de "quadro não encontrado" definida em RF02 (RN-06) — sem distinguir "o quadro não existe" de "o quadro existe mas não é seu".
- **RN-06 (Isolamento de lista / não vazamento de existência):** ver, renomear, reordenar ou excluir uma lista que não existe, que pertence a um quadro diferente do informado na operação, ou cujo quadro pertence a outro usuário, produz sempre a mesma resposta de "lista não encontrada" — sem distinguir esses casos entre si.
- **RN-07 (Ordem contínua e determinística):** a qualquer momento, as listas de um quadro têm uma ordem de exibição total e determinística entre si — da primeira à última, sem posições ambíguas ou empatadas.
- **RN-08 (Posição de criação):** uma lista recém-criada é posicionada depois de todas as listas já existentes do quadro no momento da criação (ao final).
- **RN-09 (Reposicionamento válido):** mover uma lista para uma posição fora do intervalo de posições existentes no quadro (antes da primeira ou depois da última) é rejeitado. Mover para uma posição dentro do intervalo válido reorganiza as demais listas do quadro para acomodar a mudança, preservando a ordem relativa das que não foram movidas.
- **RN-10 (Exclusão permanente e em cascata):** excluir uma lista é uma ação irreversível. Excluir uma lista remove também todo o conteúdo associado a ela (definido pelas funcionalidades que serão construídas sobre RF03, como cartões). A exclusão de uma lista não altera a ordem relativa das listas restantes do quadro.
- **RN-11 (Quadro sem listas é um estado válido):** um quadro pode não ter nenhuma lista — seja por nunca ter tido, seja por todas terem sido excluídas. Isso não é tratado como erro em nenhuma operação de leitura.

## 5. Casos de Borda e Condições de Erro

- Criar lista sem nome, ou com nome vazio/composto só de espaços → rejeitado (RN-02, critério 2).
- Criar lista com nome acima de 100 caracteres → rejeitado (RN-02, critério 3).
- Criar, ver, renomear, reordenar ou excluir lista sem sessão autenticada válida → rejeitado, tratado como não autenticado (mesmo comportamento de RF01/RF02).
- Criar, ver, renomear, reordenar ou excluir lista em quadro inexistente ou de outro usuário → "quadro não encontrado" (RN-05, critérios 5, 9).
- Renomear, reordenar ou excluir uma lista cujo id não corresponde a nenhuma lista existente → "lista não encontrada" (RN-06, critérios 12, 17, 20).
- Renomear, reordenar ou excluir uma lista que existe, mas pertence a um quadro diferente do informado na operação (ex.: id de lista válido, mas de outro quadro) → mesma resposta de "lista não encontrada", nunca uma mensagem que revele a qual quadro a lista realmente pertence (RN-06).
- Renomear, reordenar ou excluir uma lista cujo quadro pertence a outro usuário → mesma resposta de "lista não encontrada" (RN-06) — nunca a resposta de "quadro não encontrado", que se aplicaria se o próprio quadro informado fosse inacessível; aqui o quadro informado pode até ser de fato acessível, mas a lista referenciada não pertence a ele.
- Renomear lista para nome vazio → rejeitado, mesmo comportamento da criação (RN-02, critério 11).
- Mover lista para uma posição antes da primeira ou depois da última posição válida do quadro → rejeitado, informando posição inválida (RN-09, critério 16).
- Excluir a única lista restante de um quadro → permitido; o quadro fica sem listas, o que é um estado válido (RN-11, critério 19).
- Excluir uma lista já excluída anteriormente (segunda tentativa) → tratado como "lista não encontrada", igual a excluir uma lista que nunca existiu (critério 21).
- Listar as listas de um quadro que nunca teve nenhuma criada, ou que teve todas excluídas → lista vazia, não um erro (critério 8, RN-11).
- Um usuário não pode, por meio de nenhuma operação desta funcionalidade, ver, criar, renomear, reordenar ou excluir uma lista de um quadro que não é seu — mesmo conhecendo o id exato do quadro ou da lista.
