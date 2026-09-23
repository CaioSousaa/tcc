# RF05 — Exclusão de lista que contém cards

**Requisito:** RF05 — Exclusão de uma lista contendo cards associados, com definição explícita da regra de cascata (exclusão dos cards, bloqueio da ação ou migração para outra lista).
**História de usuário:** HU05 — Como usuário de um quadro, eu quero excluir uma lista que contém cards, para que o sistema me informe claramente o que acontece com os cards associados.

**Depende de:**
- **RF01:** sessão e sessão expirada;
- **RF02:** acesso ao quadro, "Quadro não encontrado." e edição do quadro;
- **RF03:** exclusão de lista, posições das listas, janela de confirmação de lista vazia;
- **RF04:** cards, posições dos cards e conteúdo do card.

As regras desses requisitos valem aqui sem repetição.

**Substitui:** a regra RN11 do RF03, que recusava sempre a exclusão de lista com cards, e o critério CA33 do RF03. As demais regras de exclusão de lista do RF03 continuam valendo.

Tela de referência no protótipo: `prototipo/modais/excluir-lista.png`.

---

## 1. Visão geral

Excluir uma lista vazia continua como no RF03: uma confirmação simples.

Ao pedir a exclusão de uma lista **que contém cards**, o sistema abre uma janela que informa quantos cards serão afetados e exige uma decisão explícita sobre o destino deles. As três regras possíveis são:

| Regra | O que acontece |
| --- | --- |
| **Mover** | Os cards são transferidos para outra lista do mesmo quadro, escolhida pelo usuário, e depois a lista é excluída. Nenhum card é perdido. |
| **Excluir em cascata** | A lista e todos os seus cards, com todo o conteúdo de cada card, são excluídos permanentemente. |
| **Bloquear** | A exclusão é impedida enquanto a lista tiver cards. Essa regra não é escolhida na hora: é uma configuração do quadro, definida por quem pode editar o quadro. |

Nenhum card é movido ou excluído sem que o usuário tenha visto, na janela, quantos cards serão afetados e confirmado a regra.

### Conceitos

| Termo | Definição |
| --- | --- |
| Lista com cards | Lista que contém ao menos um card no momento em que a exclusão é processada. |
| Lista de destino | Lista do mesmo quadro, diferente da lista excluída, que recebe os cards na regra "Mover". |
| Conteúdo do card | Título, descrição e todos os itens que os requisitos seguintes associarem ao card (checklists, responsáveis, etiquetas, comentários, prazo). |
| Bloqueio de exclusão | Configuração do quadro, ligada ou desligada, que impede excluir listas com cards. |

### Relação com outros requisitos

- **RF03:** a exclusão de lista vazia, a remoção da lista, o recuo das posições das listas à direita e a exclusão idempotente (RF03, RN15) continuam iguais.
- **RF04:** mover cards para a lista de destino preserva identidade e conteúdo de cada card, como uma movimentação do RF04.
- **RF06 a RF10:** quando existirem, o conteúdo que eles associam ao card segue o card na regra "Mover" e é excluído junto na regra "Excluir em cascata".
- **RF07:** até existirem papéis, quem pode alterar o bloqueio de exclusão é o dono do quadro. O RF07 definirá quais papéis podem fazê-lo e quais podem excluir listas.

---

## 2. Comportamento esperado

### 2.1 Configuração "bloqueio de exclusão" do quadro

A janela "Editar quadro" (RF02) passa a exibir, abaixo da seleção de cor, a opção **"Bloquear exclusão de listas que contêm cards"**.

- Quadros novos e quadros já existentes começam com a opção **desligada**.
- A janela "Novo quadro" não exibe a opção.
- A opção é salva junto com nome e cor, pelo botão "Salvar", e segue as regras da edição de quadro do RF02: cancelar descarta, e salvar sem mudanças é aceito.
- Ligar ou desligar a opção não altera nenhuma lista nem card existente; só muda o que acontece nas próximas exclusões.

### 2.2 Excluir lista vazia

Sem mudança em relação ao RF03 (CA28–CA32 do RF03), independentemente do bloqueio de exclusão estar ligado ou desligado.

### 2.3 Excluir lista com cards: janela de decisão

Ao acionar excluir em uma lista com cards, abre-se a janela de decisão contendo:

- o título **"Excluir a lista "{nome}"?"**;
- o texto **"Ela contém {N} cards. Escolha o que deve acontecer com eles."**, com "1 card" no singular;
- três opções, exibidas nesta ordem;
- os botões **"Cancelar"** e **"Confirmar"**, este último destacado como ação destrutiva.

As três opções:

1. **"Mover os cards para outra lista"**
   - Complemento: "Recomendado. Nenhum card é perdido."
   - Contém o seletor da lista de destino, com todas as listas do quadro exceto a que será excluída, na ordem do quadro.
2. **"Excluir a lista e todos os cards"**
   - Complemento: "Ação irreversível: {N} cards e todo o seu conteúdo serão apagados."
3. **"Bloquear exclusão enquanto houver cards"**
   - Complemento: "Regra definida nas configurações do quadro."
   - Nunca é selecionável nesta janela; só indica o estado da configuração do quadro.

Só uma das opções 1 e 2 pode estar selecionada por vez.

**Com o bloqueio de exclusão desligado:**

- Se o quadro tiver outra lista além da que será excluída:
  - a opção 1 vem selecionada;
  - o destino sugerido é a lista imediatamente à direita da excluída ou, se ela for a última, a imediatamente à esquerda.
- Se a lista for a única do quadro:
  - a opção 1 aparece desabilitada, com o complemento "Não há outra lista neste quadro para receber os cards.";
  - nenhuma opção vem selecionada, e "Confirmar" fica desabilitado até o usuário selecionar a opção 2.
- A opção 3 aparece desabilitada.

**Com o bloqueio de exclusão ligado:**

- As opções 1 e 2 aparecem desabilitadas, e a opção 3 aparece em destaque como a regra em vigor.
- A janela exibe o aviso "A exclusão de listas com cards está bloqueada neste quadro. Mova ou exclua os cards antes, ou desative o bloqueio em Editar quadro."
- "Confirmar" fica desabilitado. Só é possível fechar a janela.

"Cancelar", o botão de fechar, a tecla Esc e o clique fora da janela fecham sem alterar nada.

### 2.4 Confirmar "Mover"

Ao confirmar com a opção 1 e uma lista de destino selecionada:

- todos os cards da lista excluída são transferidos para o **final** da lista de destino, mantendo entre si a mesma ordem que tinham;
- a lista é excluída, e as listas à direita dela recuam uma posição (RF03);
- a janela fecha, e o quadro exibe a lista de destino com os cards transferidos e a quantidade atualizada.

Os cards transferidos mantêm identidade e conteúdo. Abrir um deles mostra "CARD · {lista de destino}", com título e descrição inalterados.

### 2.5 Confirmar "Excluir em cascata"

Ao confirmar com a opção 2:

- a lista e todos os seus cards, com todo o conteúdo, são excluídos permanentemente;
- as listas à direita recuam uma posição;
- a janela fecha e a coluna desaparece do quadro.

Não existe lixeira nem recuperação.

### 2.6 A lista mudou enquanto a janela estava aberta

A decisão do usuário vale para os cards que ele viu. Ao confirmar, a quantidade de cards da lista é conferida:

- **Continua igual:** a operação é executada.
- **Mudou, mas continua com cards:** nada é alterado. A janela permanece aberta com a quantidade atualizada e o aviso "A lista foi alterada enquanto esta janela estava aberta. Revise e confirme novamente."
- **Ficou vazia:** a lista é excluída como uma lista vazia, e a janela fecha.

### 2.7 Feedback durante a operação

Enquanto a operação é processada, "Confirmar" indica andamento e impede novo envio, e a janela não pode ser fechada. Um duplo clique não executa a operação duas vezes.

---

## 3. Critérios de aceite (Given/When/Then)

Salvo indicação contrária, estou autenticado e sou o dono do quadro "Sprint", com o bloqueio de exclusão **desligado** e as listas, nesta ordem:
- "Backlog": sem cards;
- "A fazer": cards "C1", "C2" e "C3";
- "Revisão": cards "R1", "R2", "R3" e "R4";
- "Concluído": card "D1".

### Configuração do quadro

**CA01 — Opção no editar quadro**
- **Quando** abro "Editar quadro" de "Sprint"
- **Então** vejo a opção "Bloquear exclusão de listas que contêm cards" desligada.

**CA02 — Opção ausente no novo quadro**
- **Quando** abro "Novo quadro"
- **Então** a opção de bloqueio de exclusão não é exibida e, depois de criado, o quadro tem o bloqueio desligado.

**CA03 — Ligar o bloqueio**
- **Dado** que a janela "Editar quadro" de "Sprint" está aberta
- **Quando** ligo a opção e salvo
- **Então**, ao reabrir "Editar quadro", a opção aparece ligada, e nenhuma lista ou card de "Sprint" foi alterado.

**CA04 — Cancelar não altera o bloqueio**
- **Dado** que a janela "Editar quadro" está aberta
- **Quando** ligo a opção e cancelo
- **Então**, ao reabrir, a opção continua desligada.

### Lista vazia

**CA05 — Lista vazia usa a confirmação simples**
- **Quando** aciono excluir em "Backlog"
- **Então** vejo a confirmação do RF03 ("Excluir a lista "Backlog"?", "Esta ação não pode ser desfeita.", "Cancelar", "Excluir lista"), sem opções sobre cards.

**CA06 — Lista vazia com bloqueio ligado**
- **Dado** que o bloqueio de exclusão está ligado
- **Quando** excluo "Backlog" pela confirmação simples
- **Então** "Backlog" é excluída normalmente.

### Janela de decisão

**CA07 — Conteúdo da janela**
- **Quando** aciono excluir em "Revisão"
- **Então** vejo:
  - o título "Excluir a lista "Revisão"?";
  - o texto "Ela contém 4 cards. Escolha o que deve acontecer com eles.";
  - a opção "Mover os cards para outra lista" selecionada, com o seletor de destino oferecendo "Backlog", "A fazer" e "Concluído", nessa ordem, e "Concluído" selecionada;
  - a opção "Excluir a lista e todos os cards" com o texto "Ação irreversível: 4 cards e todo o seu conteúdo serão apagados.";
  - a opção "Bloquear exclusão enquanto houver cards" desabilitada;
  - os botões "Cancelar" e "Confirmar".

**CA08 — Destino sugerido para a última lista**
- **Quando** aciono excluir em "Concluído"
- **Então** o texto é "Ela contém 1 card. Escolha o que deve acontecer com eles." e o destino sugerido é "Revisão".

**CA09 — Destino sugerido para lista do meio**
- **Quando** aciono excluir em "A fazer"
- **Então** o destino sugerido é "Revisão".

**CA10 — Única lista do quadro**
- **Dado** que o quadro "Solo" tem apenas a lista "Única", com 2 cards
- **Quando** aciono excluir em "Única"
- **Então** a opção "Mover os cards para outra lista" aparece desabilitada com "Não há outra lista neste quadro para receber os cards.", nenhuma opção está selecionada e "Confirmar" está desabilitado. **Quando** seleciono "Excluir a lista e todos os cards", "Confirmar" é habilitado.

**CA11 — Cancelar**
- **Dado** que a janela de decisão de "Revisão" está aberta e selecionei "Excluir a lista e todos os cards"
- **Quando** aciono "Cancelar", o botão de fechar, a tecla Esc ou clico fora da janela
- **Então** a janela fecha e "Revisão" continua com "R1", "R2", "R3" e "R4".

### Mover

**CA12 — Mover para a lista sugerida**
- **Dado** que a janela de decisão de "Revisão" está aberta com os valores sugeridos
- **Quando** confirmo
- **Então** a janela fecha, "Revisão" deixa de existir, e "Concluído" exibe "D1", "R1", "R2", "R3" e "R4", nessa ordem, com a quantidade "5".

**CA13 — Mover para outra lista escolhida**
- **Dado** que a janela de decisão de "Revisão" está aberta
- **Quando** escolho o destino "Backlog" e confirmo
- **Então** "Backlog" exibe "R1", "R2", "R3" e "R4", nessa ordem, e as listas do quadro passam a ser "Backlog", "A fazer" e "Concluído", nas posições 1, 2 e 3.

**CA14 — Cards movidos preservam o conteúdo**
- **Dado** que "R2" tem a descrição "Detalhes"
- **Quando** excluo "Revisão" movendo os cards para "A fazer"
- **Então** "A fazer" exibe "C1", "C2", "C3", "R1", "R2", "R3" e "R4", e abrir "R2" mostra "CARD · A fazer", o título "R2" e a descrição "Detalhes".

**CA15 — Posições contíguas após mover**
- **Dado** que excluí "Revisão" movendo os cards para "Concluído"
- **Quando** abro "R4"
- **Então** a janela do card mostra a posição 5 selecionada entre as opções 1 a 5.

### Excluir em cascata

**CA16 — Excluir a lista e os cards**
- **Dado** que a janela de decisão de "Revisão" está aberta
- **Quando** seleciono "Excluir a lista e todos os cards" e confirmo
- **Então** a janela fecha, "Revisão" e seus 4 cards deixam de existir, e as listas passam a ser "Backlog", "A fazer" e "Concluído", com os cards das outras listas inalterados.

**CA17 — Contagem na listagem de quadros**
- **Dado** que excluí "Revisão" em cascata
- **Quando** volto para "Meus quadros"
- **Então** o cartão de "Sprint" informa "3 listas · 4 cards".

**CA18 — Cards excluídos não são acessíveis**
- **Dado** que excluí "Revisão" em cascata
- **Quando** tento abrir, salvar ou excluir "R1" por qualquer meio
- **Então** recebo "Card não encontrado." (RF04).

### Bloqueio

**CA19 — Janela com bloqueio ligado**
- **Dado** que o bloqueio de exclusão de "Sprint" está ligado
- **Quando** aciono excluir em "Revisão"
- **Então** a janela de decisão abre com as opções 1 e 2 desabilitadas, a opção 3 em destaque, o aviso "A exclusão de listas com cards está bloqueada neste quadro. Mova ou exclua os cards antes, ou desative o bloqueio em Editar quadro." e "Confirmar" desabilitado.

**CA20 — Bloqueio impede exclusão por qualquer meio**
- **Dado** que o bloqueio de exclusão está ligado
- **Quando** tento excluir "Revisão" com a regra "Mover" ou "Excluir em cascata" por qualquer meio
- **Então** a operação é recusada com "A exclusão de listas com cards está bloqueada neste quadro.", e "Revisão" e seus cards permanecem.

**CA21 — Lista esvaziada com bloqueio ligado**
- **Dado** que o bloqueio de exclusão está ligado
- **Quando** movo os 4 cards de "Revisão" para outras listas (RF04) e aciono excluir em "Revisão"
- **Então** a confirmação simples do RF03 é aberta e a exclusão é permitida.

**CA22 — Desligar o bloqueio libera a janela**
- **Dado** que o bloqueio estava ligado e eu o desliguei em "Editar quadro"
- **Quando** aciono excluir em "Revisão"
- **Então** a janela de decisão abre com a opção "Mover" selecionada e "Confirmar" habilitado.

### Mudanças durante a decisão

**CA23 — Quantidade mudou**
- **Dado** que a janela de decisão de "Revisão" está aberta mostrando 4 cards e, em outra aba, adicionei o card "R5" a "Revisão"
- **Quando** confirmo "Excluir a lista e todos os cards"
- **Então** nada é excluído, a janela permanece aberta com "Ela contém 5 cards…" e o aviso "A lista foi alterada enquanto esta janela estava aberta. Revise e confirme novamente.". **Quando** confirmo de novo, a lista e os 5 cards são excluídos.

**CA24 — Lista esvaziada em outra aba**
- **Dado** que a janela de decisão de "Concluído" está aberta mostrando 1 card e, em outra aba, movi "D1" para "A fazer"
- **Quando** confirmo
- **Então** "Concluído" é excluída como lista vazia, a janela fecha e "D1" continua em "A fazer".

**CA25 — Bloqueio ligado em outra aba**
- **Dado** que a janela de decisão de "Revisão" está aberta com o bloqueio desligado e, em outra aba, liguei o bloqueio
- **Quando** confirmo
- **Então** nada é alterado, e a janela passa a exibir o estado bloqueado do CA19.

**CA26 — Destino excluído em outra aba**
- **Dado** que a janela de decisão de "Revisão" está aberta com destino "Concluído" e, em outra aba, excluí "Concluído"
- **Quando** confirmo
- **Então** nada é alterado, a janela permanece aberta com a mensagem "A lista de destino não existe mais. Escolha outra lista." e o seletor passa a oferecer só as listas existentes.

**CA27 — Lista excluída em outra aba**
- **Dado** que a janela de decisão de "Revisão" está aberta e, em outra aba, excluí "Revisão"
- **Quando** confirmo
- **Então** a janela fecha sem erro, e "Revisão" some da tela (RF03, RN15).

### Duplo envio e proteção

**CA28 — Duplo envio**
- **Dado** que a janela de decisão de "Revisão" está aberta com "Mover" para "Concluído"
- **Quando** aciono "Confirmar" duas vezes seguidas
- **Então** os cards são movidos uma única vez, "Concluído" termina com 5 cards e nenhum erro é exibido.

**CA29 — Quadro de outra conta**
- **Dado** que a conta B possui o quadro "Beta" com listas com cards
- **Quando**, autenticado como A, tento excluir uma lista de "Beta" com qualquer regra, ou alterar o bloqueio de "Beta"
- **Então** a operação é recusada com "Quadro não encontrado." e nada em "Beta" muda.

**CA30 — Destino de outro quadro**
- **Dado** que possuo os quadros "Sprint" e "Outro", e "Outro" tem a lista "Z"
- **Quando** tento excluir "Revisão" movendo os cards para "Z"
- **Então** a operação é recusada com "A lista de destino não existe mais. Escolha outra lista." e nada muda nos dois quadros.

**CA31 — Destino igual à lista excluída**
- **Quando** tento, por manipulação da requisição, excluir "Revisão" movendo os cards para a própria "Revisão"
- **Então** a operação é recusada com "Selecione outra lista de destino." e nada é alterado.

**CA32 — Sessão expirada**
- **Dado** que a janela de decisão está aberta e minha sessão expirou
- **Quando** confirmo
- **Então** nada é alterado e o sistema segue o comportamento de sessão expirada do RF01.

---

## 4. Regras de negócio e restrições

**RN01 — Decisão explícita.** Uma lista com cards só é excluída com uma regra explicitamente confirmada, "Mover" ou "Excluir em cascata". Não existe regra padrão aplicada sem confirmação, e nenhum pedido de exclusão sem regra exclui ou move cards.

**RN02 — Lista vazia.** A exclusão de lista sem cards segue o RF03 e dispensa regra. Se uma regra for informada para uma lista que está vazia no momento do processamento, ela é ignorada e a lista é excluída (CA24).

**RN03 — Bloqueio de exclusão.**
- Configuração por quadro, ligada ou desligada, desligada por padrão, inclusive para quadros já existentes.
- Com o bloqueio ligado, nenhuma lista com cards pode ser excluída, com qualquer regra e por qualquer meio.
- O bloqueio não impede excluir listas vazias, mover cards, excluir cards nem excluir o quadro inteiro (RF02).
- A configuração é verificada no momento do processamento, e não com base no que a janela mostrava.

**RN04 — Quem altera o bloqueio.** Quem pode editar o quadro (RF02; até o RF07, o dono).

**RN05 — Lista de destino.**
- Deve pertencer ao mesmo quadro e ser diferente da lista excluída.
- É verificada no momento do processamento.
- Se não existir mais ou pertencer a outro quadro, a operação é recusada sem alterar nada.

**RN06 — Mover.**
- Os K cards da lista excluída passam a ocupar as posições M+1 a M+K da lista de destino, onde M é a quantidade de cards do destino antes da operação.
- A ordem relativa entre eles é mantida.
- Nenhum card do destino muda de posição.
- Cada card mantém identidade e todo o seu conteúdo (RF04, RN13).

**RN07 — Excluir em cascata.** A lista e todos os cards que ela contém no momento do processamento, com todo o conteúdo de cada card, são excluídos permanentemente.

**RN08 — Conferência da quantidade.**
- A operação só é executada se a quantidade de cards da lista no momento do processamento for igual à quantidade exibida ao usuário na janela.
- Se for diferente e maior que zero, nada é alterado, e o usuário recebe a quantidade atual.
- Se for zero, vale RN02.

**RN09 — Atomicidade.** Transferência ou exclusão dos cards, exclusão da lista e recuo das posições das listas acontecem por completo ou não acontecem. Nunca fica visível um estado em que a lista foi excluída e os cards não foram tratados, ou em que parte dos cards foi transferida.

**RN10 — Posições.** Depois de qualquer operação, as listas do quadro ocupam as posições 1..N (RF03, RN05), e os cards de cada lista ocupam as posições 1..N (RF04, RN06).

**RN11 — Concorrência.** A exclusão de lista com cards é serializada com as demais alterações de listas e cards do mesmo quadro. Um card criado ou movido para a lista ao mesmo tempo que ela é excluída é tratado pela verificação de RN08, e nunca fica perdido nem é excluído sem confirmação.

**RN12 — Exclusão idempotente.** Pedir a exclusão de uma lista que não existe mais não gera erro visível, com qualquer regra (RF03, RN15).

**RN13 — Contagens.** A quantidade de cards das listas envolvidas e as contagens do quadro em "Meus quadros" refletem o resultado (RF02, RN10; RF04, RN17).

**RN14 — Sem desfazer.** Nenhuma das regras oferece desfazer. A regra "Mover" é reversível manualmente, movendo os cards de volta pelo RF04 para uma lista recriada.

---

## 5. Casos de borda e condições de erro

### 5.1 Entrada de dados e manipulação

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB01 | Pedido de exclusão de lista com cards sem regra, por manipulação | Recusado com "Escolha o que deve acontecer com os cards da lista."; nada é alterado. |
| CB02 | Regra desconhecida (diferente de "Mover" e "Excluir em cascata"), por manipulação | Recusado com "Escolha o que deve acontecer com os cards da lista."; nada é alterado. |
| CB03 | Regra "Mover" sem lista de destino, por manipulação | Recusado com "Selecione outra lista de destino."; nada é alterado. |
| CB04 | Lista de destino com identificador malformado | Recusado com "A lista de destino não existe mais. Escolha outra lista."; nada é alterado. |
| CB05 | Lista de destino igual à lista excluída | Recusado com "Selecione outra lista de destino." (CA31). |
| CB06 | Quantidade de cards exibida ausente ou inválida no pedido, por manipulação | Recusado com "Escolha o que deve acontecer com os cards da lista."; nada é alterado. |
| CB07 | Regra enviada para lista vazia | Ignorada; a lista é excluída (RN02). |
| CB08 | Bloqueio de exclusão enviado com valor que não seja ligado ou desligado, ao editar o quadro | Recusado com "Valor inválido."; nada é alterado. |
| CB09 | Edição de quadro sem informar o bloqueio, por manipulação | O bloqueio mantém o valor atual; nome e cor seguem o RF02. |

### 5.2 Volume

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB10 | Lista com muitos cards (por exemplo, 500) | Mover ou excluir em cascata trata todos na mesma operação, sem falha parcial e sem exigir confirmação por card. |
| CB11 | Lista de destino que já tem muitos cards | Os cards transferidos ficam depois de todos os existentes, com posições contíguas. |
| CB12 | Card com título, descrição e demais conteúdos no limite máximo | Transferido ou excluído como qualquer outro. |

### 5.3 Concorrência e estado desatualizado

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB13 | Cards adicionados, movidos para a lista ou retirados dela enquanto a janela estava aberta | RN08: nada é alterado se a quantidade mudou e não é zero; a janela mostra a quantidade atual (CA23). |
| CB14 | A quantidade é a mesma, mas os cards foram trocados (um saiu e outro entrou) | A operação é executada sobre os cards presentes no momento do processamento. A conferência é pela quantidade, que é o que a janela informa ao usuário. |
| CB15 | Bloqueio ligado ou desligado em outra aba enquanto a janela estava aberta | Vale o estado no momento do processamento. Se ficou ligado, nada é alterado e a janela passa ao estado bloqueado (CA25). Se ficou desligado e a janela mostrava bloqueio, o usuário precisa fechar e reabrir a janela. |
| CB16 | Lista de destino excluída ou renomeada em outra aba | Excluída: CA26. Renomeada: a operação é executada, e o quadro passa a exibir o nome atual. |
| CB17 | A lista a excluir foi excluída em outra aba | CA27. |
| CB18 | O quadro foi excluído em outra aba | "Quadro não encontrado." com caminho para voltar a "Meus quadros" (RF02). |
| CB19 | Um card da lista estava aberto em outra aba e é salvo depois da exclusão em cascata | "Card não encontrado." (RF04, CB15). |
| CB20 | Um card da lista estava aberto em outra aba e é salvo depois da regra "Mover" | O card é salvo normalmente, na lista em que está agora; a lista e a posição escolhidas na aba desatualizada seguem RF04, CB18. |

### 5.4 Falhas

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CE01 | Falha de comunicação ao confirmar | A janela permanece aberta com a seleção feita e a mensagem genérica; nada muda no quadro. |
| CE02 | Falha no meio da transferência ou da exclusão dos cards | Nada é alterado (RN09) e a mensagem genérica é exibida. |
| CE03 | Falha de comunicação ao salvar o bloqueio em "Editar quadro" | Mesmo comportamento de CE02 do RF02. |
| CE04 | Erro inesperado | A mensagem não revela detalhes internos. |

### 5.5 Mensagens ao usuário

A redação pode variar desde que o significado seja preservado e a mesma situação produza sempre a mesma mensagem. Mensagens de sessão seguem o RF01; de quadro, o RF02; de lista, o RF03; de card, o RF04.

| Situação | Mensagem |
| --- | --- |
| Título da janela de decisão | "Excluir a lista "{nome}"?" |
| Texto da janela de decisão | "Ela contém {N} cards. Escolha o que deve acontecer com eles." ("1 card" no singular) |
| Opção 1 | "Mover os cards para outra lista" / "Recomendado. Nenhum card é perdido." |
| Opção 1 sem destino possível | "Não há outra lista neste quadro para receber os cards." |
| Opção 2 | "Excluir a lista e todos os cards" / "Ação irreversível: {N} cards e todo o seu conteúdo serão apagados." ("1 card" no singular) |
| Opção 3 | "Bloquear exclusão enquanto houver cards" / "Regra definida nas configurações do quadro." |
| Opção no editar quadro | "Bloquear exclusão de listas que contêm cards" |
| Aviso de bloqueio na janela | "A exclusão de listas com cards está bloqueada neste quadro. Mova ou exclua os cards antes, ou desative o bloqueio em Editar quadro." |
| Recusa por bloqueio | "A exclusão de listas com cards está bloqueada neste quadro." |
| Quantidade mudou | "A lista foi alterada enquanto esta janela estava aberta. Revise e confirme novamente." |
| Destino inexistente ou de outro quadro | "A lista de destino não existe mais. Escolha outra lista." |
| Destino ausente ou igual à lista excluída | "Selecione outra lista de destino." |
| Regra ausente ou inválida | "Escolha o que deve acontecer com os cards da lista." |
| Bloqueio com valor inválido | "Valor inválido." |
| Falha de comunicação ou erro inesperado | "Não foi possível concluir a operação. Tente novamente." |

---

## 6. Fora de escopo

- escolher a posição dos cards na lista de destino (entram sempre no final);
- distribuir os cards entre várias listas de destino ou escolher card a card;
- mover os cards para lista de outro quadro;
- criar uma lista de destino a partir da janela de decisão;
- desfazer, lixeira e arquivamento de listas ou cards;
- bloqueio de exclusão por lista (a configuração é do quadro inteiro);
- regra padrão pré-configurada no quadro para "Mover" ou "Excluir em cascata";
- restrição por papel de membro para excluir listas ou alterar o bloqueio (RF07);
- notificação a outros membros sobre a exclusão (RF07).
