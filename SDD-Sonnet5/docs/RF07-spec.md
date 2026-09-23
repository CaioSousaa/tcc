# RF07 — Membros do Quadro com Papéis e Atribuição a Cards

## 1. Visão Geral

Até aqui (RF02–RF06), um quadro tinha exatamente um usuário com acesso a ele: quem o criou. RF07 generaliza isso: um quadro passa a ter uma lista de **membros**, cada um com um **papel** — administrador ou membro — e todo usuário que consta nessa lista tem acesso ao quadro, não só quem o criou. O usuário que cria um quadro passa a constar automaticamente como seu primeiro administrador. Um administrador pode convidar outros usuários já cadastrados no sistema para o quadro, definir o papel de cada membro, remover membros, e atribuir membros específicos a cards para indicar quem é responsável por cada tarefa. As operações já definidas em RF02–RF06 (criar/editar/excluir quadros, listas, cards, checklists) passam a ser permitidas a qualquer membro do quadro — não mais exclusivas de quem o criou — com uma exceção: excluir o próprio quadro passa a ser uma ação exclusiva de administrador, assim como toda a gestão de membros e as atribuições de card.

Como o sistema não possui, até esta especificação, nenhum mecanismo de notificação ou envio de e-mail, "convidar" nesta especificação significa adicionar diretamente: um administrador informa o e-mail de um usuário já cadastrado, e esse usuário passa a ser membro do quadro imediatamente, sem um estado de "convite pendente" nem necessidade de aceite.

## 2. Comportamento Esperado

### 2.1 Criação do quadro e papel inicial
- Ao criar um quadro (RF02), o usuário que o cria passa a constar automaticamente como membro desse quadro, com o papel de administrador.

### 2.2 Convidar (adicionar) um membro
- Um administrador do quadro pode adicionar um novo membro informando o e-mail de um usuário já cadastrado no sistema e o papel que esse membro terá (administrador ou membro).
- O usuário adicionado passa a ter acesso ao quadro imediatamente.

### 2.3 Ver os membros de um quadro
- Qualquer membro do quadro (administrador ou membro) pode ver a lista completa de membros do quadro e o papel de cada um.

### 2.4 Alterar o papel de um membro
- Um administrador pode alterar o papel de qualquer membro do quadro, incluindo rebaixar um administrador para membro ou promover um membro para administrador.

### 2.5 Remover um membro
- Um administrador pode remover qualquer outro membro do quadro. O usuário removido perde o acesso ao quadro imediatamente.
- Um membro (de qualquer papel) pode remover a si mesmo do quadro (sair do quadro), sem precisar de permissão de administrador para isso.

### 2.6 Garantia de administrador
- Um quadro deve sempre ter pelo menos um administrador. Nenhuma operação — remover um membro, um membro sair por conta própria, ou rebaixar um papel — pode resultar em um quadro sem nenhum administrador.

### 2.7 Atribuir membros a cards
- Um administrador pode atribuir um membro do quadro a um card desse quadro, marcando-o como um dos responsáveis pelo card.
- Um card pode ter vários membros atribuídos, ou nenhum.
- Um administrador pode desatribuir um membro de um card.
- Qualquer membro do quadro pode ver quais membros estão atribuídos a um card.

### 2.8 Acesso generalizado às funcionalidades já existentes
- Toda operação sobre um quadro, suas listas, cards e checklists (RF02–RF06) passa a ser permitida a qualquer membro desse quadro, e não somente a quem o criou.
- Exceção: excluir o próprio quadro passa a ser uma ação exclusiva de administrador.
- Quando um usuário deixa de ser membro de um quadro (removido ou por sair voluntariamente), ele também deixa de constar como responsável em qualquer card desse quadro ao qual estivesse atribuído.
- A listagem dos quadros de um usuário (RF02) passa a incluir todo quadro do qual ele é membro — administrador ou membro — e não somente os que ele criou.

### 2.9 Privacidade e isolamento
- Um usuário que não é membro de um quadro é tratado, para qualquer operação desta funcionalidade e das já existentes (RF02–RF06) sobre esse quadro, como se o quadro não existisse — mesmo comportamento de isolamento já definido em RF02.
- Uma tentativa de alterar o papel de, remover, ou atribuir a um card alguém que não é membro do quadro é tratada como "membro não encontrado", distinta de "quadro não encontrado".

## 3. Critérios de Aceite (Given/When/Then)

**Convidar (adicionar) membro**

1. Given um administrador de um quadro, When ele adiciona ao quadro o e-mail de um usuário cadastrado, informando o papel administrador, Then esse usuário passa a constar na lista de membros do quadro como administrador.
2. Given um administrador de um quadro, When ele adiciona ao quadro o e-mail de um usuário cadastrado, informando o papel membro, Then esse usuário passa a constar na lista de membros do quadro como membro.
3. Given um administrador de um quadro, When ele tenta adicionar um e-mail que não corresponde a nenhum usuário cadastrado, Then a operação é rejeitada e o sistema indica que o usuário não foi encontrado.
4. Given um administrador de um quadro, When ele tenta adicionar um usuário que já é membro do quadro, Then a operação é rejeitada e o sistema indica que esse usuário já é membro.
5. Given um membro de um quadro que não é administrador, When ele tenta adicionar um novo membro, Then a operação é rejeitada por falta de permissão.
6. Given um usuário não autenticado, When ele tenta adicionar um membro a um quadro, Then a operação é rejeitada e ele é tratado como não autenticado.
7. Given um usuário autenticado que não é membro de um quadro, When ele tenta adicionar um membro a esse quadro, Then recebe indicação de que o quadro não foi encontrado.

**Ver membros**

8. Given um membro de um quadro (administrador ou não), When ele solicita a lista de membros do quadro, Then recebe todos os membros e o papel de cada um.
9. Given um usuário autenticado que não é membro de um quadro, When ele solicita a lista de membros desse quadro, Then recebe indicação de que o quadro não foi encontrado.

**Alterar papel**

10. Given um administrador de um quadro, When ele promove um membro para administrador, Then esse membro passa a constar como administrador.
11. Given um administrador de um quadro com mais de um administrador, When ele rebaixa um dos administradores para membro, Then esse usuário passa a constar como membro.
12. Given um administrador de um quadro com um único administrador, When ele tenta rebaixar esse administrador para membro, Then a operação é rejeitada e o sistema indica que o quadro precisa de ao menos um administrador.
13. Given um membro de um quadro que não é administrador, When ele tenta alterar o papel de outro membro, Then a operação é rejeitada por falta de permissão.
14. Given um administrador de um quadro, When ele tenta alterar o papel de um usuário que não é membro desse quadro, Then recebe indicação de que o membro não foi encontrado.

**Remover membro**

15. Given um administrador de um quadro, When ele remove outro membro do quadro, Then esse usuário deixa de constar na lista de membros e perde o acesso ao quadro.
16. Given um administrador de um quadro com um único administrador, When ele tenta remover a si mesmo ou tenta remover esse único administrador, Then a operação é rejeitada e o sistema indica que o quadro precisa de ao menos um administrador.
17. Given um membro de um quadro que não é administrador, When ele tenta remover outro membro, Then a operação é rejeitada por falta de permissão.
18. Given um administrador de um quadro, When ele tenta remover um usuário que não é membro desse quadro, Then recebe indicação de que o membro não foi encontrado.

**Sair do quadro**

19. Given um membro de um quadro que não é o único administrador, When ele sai do quadro por conta própria, Then ele deixa de constar na lista de membros e perde o acesso ao quadro.
20. Given o único administrador de um quadro, When ele tenta sair do quadro, Then a operação é rejeitada pelo mesmo motivo do critério 16.

**Atribuir membros a cards**

21. Given um administrador de um quadro, When ele atribui um membro do quadro a um card desse quadro, Then esse membro passa a constar entre os responsáveis pelo card.
22. Given um card já com um membro atribuído, When um administrador atribui um segundo membro ao mesmo card, Then ambos passam a constar como responsáveis.
23. Given um card com um membro atribuído, When um administrador desatribui esse membro, Then ele deixa de constar entre os responsáveis pelo card.
24. Given um administrador de um quadro, When ele tenta atribuir a um card alguém que não é membro do quadro, Then a operação é rejeitada e o sistema indica que o membro não foi encontrado.
25. Given um membro de um quadro que não é administrador, When ele tenta atribuir ou desatribuir alguém de um card, Then a operação é rejeitada por falta de permissão.
26. Given qualquer membro de um quadro, When ele vê um card desse quadro, Then consegue ver quais membros estão atribuídos a ele.

**Acesso generalizado e criação do quadro**

27. Given um usuário autenticado, When ele cria um quadro, Then ele passa a constar automaticamente como administrador desse quadro, sem precisar de nenhum convite.
28. Given um membro de um quadro que não é quem o criou e não é administrador, When ele cria uma lista, cria ou move um card, ou adiciona um checklist nesse quadro, Then a operação é aceita da mesma forma que já seria para quem criou o quadro.
29. Given um membro de um quadro que não é administrador, When ele tenta excluir o próprio quadro, Then a operação é rejeitada por falta de permissão.
30. Given um usuário que é membro de vários quadros, incluindo quadros que não criou, When ele solicita a lista dos seus quadros, Then recebe todos eles — os que criou e os que foi adicionado como membro.
31. Given um membro removido de um quadro ao qual estava atribuído em algum card, When qualquer membro do quadro vê esse card depois da remoção, Then esse usuário não consta mais entre os responsáveis.

## 4. Regras de Negócio e Restrições

- **RN-01 (Dois papéis exatamente):** um membro de um quadro tem exatamente um papel: administrador ou membro. Não existem outros papéis nesta especificação.
- **RN-02 (Criador vira administrador automaticamente):** ao criar um quadro, o usuário criador passa a ser automaticamente membro desse quadro com o papel administrador, sem nenhuma ação adicional.
- **RN-03 (Adição é imediata, sem convite pendente):** adicionar um membro não envolve um estado intermediário de convite aguardando aceite — o usuário informado passa a ser membro imediatamente, já que o sistema não possui mecanismo de notificação para um fluxo de aceite.
- **RN-04 (Membro requer usuário já cadastrado):** só é possível adicionar como membro um e-mail que corresponda a um usuário já registrado no sistema (RF01). Não existe suporte a convidar alguém que ainda não tem conta.
- **RN-05 (Sem membros duplicados):** um usuário não pode constar mais de uma vez como membro do mesmo quadro.
- **RN-06 (Gestão de membros é exclusiva de administrador):** adicionar um membro, alterar o papel de um membro, e remover outro membro são ações que só um administrador do quadro pode realizar.
- **RN-07 (Sair é permitido a qualquer membro):** remover a si mesmo do quadro (sair) não exige o papel de administrador — qualquer membro pode fazer isso, sujeito a RN-08.
- **RN-08 (Sempre ao menos um administrador):** nenhuma operação — remoção de membro, saída voluntária, ou alteração de papel — pode deixar um quadro sem nenhum administrador. A operação que resultaria nisso é rejeitada.
- **RN-09 (Atribuição de card é exclusiva de administrador):** atribuir ou desatribuir um membro de um card é uma ação que só um administrador do quadro pode realizar.
- **RN-10 (Atribuição restrita a membros do quadro):** só é possível atribuir a um card um usuário que já é membro do quadro ao qual esse card pertence.
- **RN-11 (Cardinalidade livre de atribuições):** um card pode ter zero, um ou vários membros atribuídos; não há um limite máximo nem uma exigência mínima definida por esta especificação.
- **RN-12 (Exclusão do quadro é exclusiva de administrador):** a partir de RF07, apenas um administrador do quadro pode excluí-lo — deixa de ser suficiente ter sido quem o criou, se esse usuário não for mais administrador.
- **RN-13 (Demais operações abertas a qualquer membro):** todas as demais operações sobre o quadro e seu conteúdo já definidas em RF02–RF06 (criar/editar listas e cards, mover cards, criar checklists, marcar itens, etc.) são permitidas a qualquer membro do quadro, independentemente do papel.
- **RN-14 (Listagem "meus quadros" inclui todos os quadros de que se é membro):** a listagem de quadros de um usuário (RF02) passa a incluir todo quadro do qual ele é membro, não somente os que ele criou.
- **RN-15 (Remover membro cascade para atribuições):** remover um membro do quadro (seja por remoção por um administrador, seja por saída voluntária) também remove qualquer atribuição desse usuário a cards desse quadro.
- **RN-16 (Isolamento por associação de membro):** um usuário que não é membro de um quadro é tratado, para qualquer operação sobre esse quadro ou seu conteúdo, como se o quadro não existisse — mesmo comportamento de "quadro não encontrado" já definido em RF02, agora baseado em ser membro, não em ter criado o quadro.
- **RN-17 (Isolamento de membro):** tentar alterar o papel de, remover, ou atribuir a um card um usuário que não é membro do quadro produz a resposta "membro não encontrado" — distinta de "quadro não encontrado", e sem revelar se esse e-mail corresponde a um usuário cadastrado em outro contexto.

## 5. Casos de Borda e Condições de Erro

- Adicionar membro informando e-mail sem usuário cadastrado correspondente → rejeitado, "usuário não encontrado" (RN-04, critério 3).
- Adicionar um usuário que já é membro do quadro → rejeitado, indicando que já é membro (RN-05, critério 4).
- Um membro sem papel administrador tentando adicionar, remover ou alterar papel de outro membro → rejeitado por falta de permissão (RN-06, critérios 5, 13, 17).
- Rebaixar ou remover o único administrador restante de um quadro → rejeitado (RN-08, critérios 12, 16).
- Único administrador tentando sair do quadro → rejeitado, mesmo motivo (RN-08, critério 20).
- Atribuir a um card alguém que não é membro do quadro desse card → rejeitado, "membro não encontrado" (RN-10, critério 24).
- Um membro sem papel administrador tentando atribuir ou desatribuir alguém de um card → rejeitado por falta de permissão (RN-09, critério 25).
- Um membro sem papel administrador tentando excluir o quadro → rejeitado por falta de permissão (RN-12, critério 29).
- Operar (adicionar/ver membros, atribuir a card) sobre um quadro do qual não se é membro → tratado como "quadro não encontrado" (RN-16, critérios 7, 9).
- Alterar papel, remover, ou atribuir a um card um usuário que não é membro do quadro (mas que existe no sistema) → "membro não encontrado", nunca confundido com "quadro não encontrado" (RN-17, critérios 14, 18, 24).
- Remover (ou sair) um membro que está atribuído a um ou mais cards do quadro → as atribuições dele nesses cards são removidas junto (RN-15, critério 31).
- Criar um quadro → o criador já aparece como administrador, sem necessidade de se autoadicionar (RN-02, critério 27).
- Desatribuir um membro de um card ao qual ele não está atribuído → tratado como "atribuição não encontrada", mesma família de erro de uma operação sobre algo que não existe.
- Um usuário não pode, por meio de nenhuma operação desta funcionalidade, ver membros, alterar papéis, remover membros ou atribuir/desatribuir cards de um quadro do qual não é membro — mesmo conhecendo o id exato do quadro, do membro ou do card.
