# RF07 — Membros do quadro, papéis e responsáveis por cards

**Requisito:** RF07 — Convite e gerenciamento de membros do quadro em dois papéis (administrador e membro), restringindo as ações permitidas a cada papel, e atribuição de membros a cards específicos.
**História de usuário:** HU07 — Como administrador de um quadro, eu quero convidar membros, definir seus papéis e atribuí-los a cards, para que eu controle quem pode editar o quê e quem é responsável por cada tarefa.

**Depende de:** RF01 (contas, sessão, e-mail), RF02 (quadros, "Meus quadros", "Quadro não encontrado."), RF03 (listas), RF04 (cards e janela do card), RF05 (exclusão de lista e bloqueio de exclusão) e RF06 (checklist). As regras desses requisitos valem aqui sem repetição.

**Substitui:** em todos os requisitos anteriores, a expressão "dono do quadro" como única pessoa com acesso. A partir deste requisito, o acesso a um quadro é dado pela participação como membro (RN02), e as permissões dependem do papel (RN05).

Telas de referência no protótipo: `prototipo/modais/membros.png` (janela "Membros do quadro"), `prototipo/paginas/meus-quadros.png` (selo de papel e avatares nos cartões), `prototipo/paginas/quadro.png` (botão "Membros" e avatares no cabeçalho, avatares na face dos cards), `prototipo/modais/detalhe-card.png` (seção "Responsáveis").

---

## 1. Visão geral

Um quadro passa a ser compartilhado por várias contas. Cada conta participa de um quadro com um papel:

| Papel | Resumo |
| --- | --- |
| **Administrador** | Gerencia o quadro, as listas e os membros, e também trabalha nos cards. |
| **Membro** | Vê o quadro e trabalha nos cards, sem gerenciar quadro, listas ou membros. |

A entrada no quadro é feita por **convite**:
1. um administrador convida um e-mail com um papel;
2. a conta com aquele e-mail vê o convite em "Meus quadros";
3. se aceitar, passa a ser membro do quadro com o papel convidado.

Qualquer participante do quadro, independentemente do papel, pode atribuir participantes como **responsáveis** por um card.

### Conceitos

| Termo | Definição |
| --- | --- |
| Participante | Conta que participa de um quadro com o papel "Administrador" ou "Membro". Nesta especificação, "membro do quadro" (minúsculo) significa qualquer participante; "Membro" (maiúsculo) é o papel. |
| Convite pendente | Convite enviado a um e-mail que ainda não foi aceito, recusado nem cancelado. Não dá acesso ao quadro. |
| Responsável | Participante atribuído a um card. |
| Avatar | Círculo com as iniciais do nome da conta (primeira letra do primeiro e do último nome, como no RF01), usado para identificar participantes. |

### Relação com os requisitos anteriores

- **RF02:** quem cria um quadro passa a ser o seu primeiro **Administrador**. Os quadros existentes antes deste requisito passam a ter o seu dono como Administrador e nenhum outro participante.
- **RF02, RF03, RF04, RF05 e RF06:** toda regra que dizia "só o dono pode" passa a seguir a matriz de permissões de RN05. O comportamento de "Quadro não encontrado." para quem não participa do quadro continua igual.
- **RF08, RF09 e RF10:** já nascem sujeitos à matriz de RN05.

---

## 2. Comportamento esperado

### 2.1 "Meus quadros"

A listagem passa a mostrar todos os quadros em que a conta é participante, com qualquer papel, na mesma ordem do RF02.

**Subtítulo:** "{N} quadros · você é administrador em {M}" ("1 quadro" no singular).

**Cada cartão de quadro exibe, além do que o RF02 define:**
- os avatares dos participantes, até 4, na ordem de entrada no quadro, seguidos de "+{K}" quando houver mais;
- o selo "ADMIN" ou "MEMBRO", conforme o papel da conta naquele quadro;
- as ações de editar e excluir **somente** quando a conta é Administradora do quadro.

**Convites pendentes:** quando a conta tem convites pendentes, aparece acima da grade uma seção "Convites" com um item por convite. Cada item mostra:
- o nome do quadro;
- o nome de quem convidou;
- o papel oferecido;
- os botões "Aceitar" e "Recusar".

Enquanto o convite não é aceito, o quadro não aparece na grade e não pode ser aberto.

### 2.2 Cabeçalho do quadro

O cabeçalho do quadro (RF02) passa a exibir, à direita:
- o botão "Membros";
- os avatares dos participantes, até 4, seguidos de "+{K}" quando houver mais.

A ação de editar o quadro no cabeçalho aparece somente para Administradores.

### 2.3 Janela "Membros do quadro"

O botão "Membros" abre a janela **"Membros do quadro"**, disponível para qualquer participante. Ela exibe:
- o texto "Administradores gerenciam o quadro, as listas, as etiquetas e os membros. Membros trabalham nos cards.";
- **para Administradores:** o formulário de convite, com o campo "E-mail do convidado", o seletor de papel ("Membro" pré-selecionado) e o botão "Convidar";
- a lista de pessoas, com participantes e convites pendentes.

**A lista de pessoas** vem ordenada assim: primeiro os participantes, por ordem de entrada no quadro; depois os convites pendentes, por ordem de envio. Cada linha exibe:
- **participante:** avatar, nome, e-mail e a indicação "você" na própria linha ou "ativo" nas demais;
- **convite pendente:** avatar com a inicial do e-mail, o e-mail e a indicação "convite pendente".

**O que cada papel vê em cada linha:**

| Quem abre a janela | Linha de participante | Linha de convite pendente |
| --- | --- | --- |
| **Administrador** | seletor de papel (Administrador ou Membro) e ação de remover | seletor de papel e ação de cancelar o convite |
| **Membro** | apenas o papel, como texto | apenas o papel, como texto |

Na própria linha, **qualquer participante** tem a ação "Sair do quadro".

Todas as ações da janela são salvas imediatamente, sem botão de salvar, e a lista é atualizada.

### 2.4 Convidar

O Administrador informa um e-mail, escolhe o papel e aciona "Convidar". O e-mail é normalizado como no RF01 (sem espaços nas extremidades, em minúsculas).

**Se o convite for válido:** um convite pendente é criado com o papel escolhido e aparece no final da lista. O campo de e-mail é limpo, o seletor volta para "Membro" e o campo mantém o foco.

**O convite é recusado, com a mensagem junto ao campo, quando:**
- o e-mail tem formato inválido;
- o e-mail já pertence a um participante do quadro, inclusive o de quem convida;
- já existe um convite pendente para aquele e-mail no mesmo quadro;
- o quadro já atingiu o limite de pessoas (RN12).

**Convite para e-mail sem conta:** o e-mail não precisa ter conta no sistema. Quando alguém criar uma conta com aquele e-mail (RF01), verá o convite em "Meus quadros".

O sistema não envia e-mails. O convidado toma conhecimento do convite ao acessar "Meus quadros".

### 2.5 Aceitar, recusar e cancelar convite

**Aceitar:** a conta passa a ser participante com o papel **atual** do convite, que pode ter sido alterado depois do envio. O convite some da seção "Convites", e o quadro aparece na grade como o **primeiro** cartão, com o selo correspondente.

**Recusar:** o convite deixa de existir, some da seção "Convites" e da lista de pessoas do quadro, e nada mais muda.

**Cancelar:** o Administrador aciona "Cancelar convite" na linha do convite pendente. O convite deixa de existir e some da seção "Convites" do convidado.

Recusar e cancelar não pedem confirmação. Um mesmo e-mail pode ser convidado de novo depois que o convite anterior for recusado ou cancelado.

### 2.6 Alterar papel

O Administrador troca o papel no seletor da linha, e a alteração é salva imediatamente. Isso vale para participantes, inclusive a própria linha, e para convites pendentes.

A nova permissão vale a partir da próxima ação daquele participante. Telas já abertas por ele podem continuar exibindo controles do papel anterior até serem recarregadas; qualquer ação não permitida é recusada (RN06).

**O quadro nunca pode ficar sem Administrador.** Tornar Membro o último Administrador é recusado com "O quadro precisa ter pelo menos um administrador.", e o seletor volta ao valor anterior.

### 2.7 Remover participante e sair do quadro

**Remover:** o Administrador aciona remover na linha de outro participante. Abre-se a confirmação "Remover {nome} do quadro?", com o texto "Essa pessoa perderá o acesso ao quadro e deixará de ser responsável pelos cards dele." e os botões "Cancelar" e "Remover". Ao confirmar:
- a pessoa deixa de ser participante;
- deixa de ser responsável por todos os cards do quadro;
- o quadro some da sua listagem.

**Sair do quadro:** qualquer participante pode acionar "Sair do quadro" na própria linha. Abre-se a confirmação "Sair do quadro "{nome do quadro}"?", com o texto "Você perderá o acesso a este quadro e deixará de ser responsável pelos cards dele." e os botões "Cancelar" e "Sair". Ao confirmar, a conta deixa de ser participante, deixa de ser responsável pelos cards do quadro e é levada para "Meus quadros", onde o quadro não aparece mais.

**Último Administrador:** não pode remover a si mesmo nem sair do quadro. A ação é recusada com "O quadro precisa ter pelo menos um administrador.". Para sair, ele deve primeiro tornar outro participante Administrador, ou excluir o quadro (RF02).

Remover ou sair não altera cards, listas, checklists nem o conteúdo criado por aquela pessoa.

### 2.8 Permissões na interface

A interface mostra a um participante somente as ações que o seu papel permite (RN05):
- **Membro não vê:**
  - editar e excluir quadro, na listagem e no cabeçalho;
  - "Adicionar lista";
  - editar e excluir lista;
  - o formulário de convite e os controles de papel, remover e cancelar da janela "Membros do quadro".
- **Membro continua vendo:** todas as ações de cards (RF04), de checklist (RF06) e de responsáveis (2.9).

Mesmo que uma ação não permitida seja solicitada por qualquer meio, ela é recusada (RN06).

### 2.9 Responsáveis pelo card

**Na janela do card (RF04)**, na coluna lateral, abaixo de "Lista" e "Posição na lista", aparece a seção **"Responsáveis"** com:
- os avatares dos responsáveis atuais, cada um com a ação de removê-lo;
- a ação "+", que abre a lista de participantes **ativos** do quadro, cada um com uma caixa de marcação indicando se já é responsável.

Marcar um participante o atribui ao card, e desmarcar remove a atribuição. Cada mudança é salva imediatamente, independentemente de "Salvar card", como a checklist do RF06. Convites pendentes não aparecem na lista.

**Na face do card**, os avatares dos responsáveis aparecem no canto inferior direito, até 3, seguidos de "+{K}" quando houver mais. Sem responsáveis, nada é exibido.

Um card pode ter de zero até todos os participantes do quadro como responsáveis. A ordem de exibição é a ordem em que foram atribuídos.

### 2.10 Perda de acesso durante o uso

Se a conta deixa de ser participante enquanto está com o quadro aberto (foi removida, saiu em outra aba, ou o quadro foi excluído), a próxima ação ou recarga naquele quadro recebe "Quadro não encontrado." com caminho para "Meus quadros" (RF02).

---

## 3. Critérios de aceite (Given/When/Then)

Salvo indicação contrária, existe o quadro "Sprint" com os participantes, nesta ordem de entrada:
- Caio (caio@empresa.com), **Administrador**, que criou o quadro;
- Marina (marina@empresa.com), **Administrador**;
- João (joao@empresa.com), **Membro**.

Existe também um convite pendente para ana@empresa.com como **Membro**. O quadro tem as listas "A fazer" e "Concluído", e "A fazer" tem o card "Refatorar filtros".

### Listagem e acesso

**CA01 — Quadro criado torna o criador Administrador**
- **Quando** Caio cria o quadro "Novo" (RF02)
- **Então** a janela "Membros do quadro" de "Novo" lista apenas Caio, como Administrador, com "você".

**CA02 — Listagem com selo e avatares**
- **Quando** João acessa "Meus quadros"
- **Então** o cartão de "Sprint" exibe o selo "MEMBRO", os avatares de Caio, Marina e João e nenhuma ação de editar ou excluir; e o subtítulo informa "você é administrador em 0" se ele não administra outros quadros.

**CA03 — Convite pendente não dá acesso**
- **Dado** que Ana tem conta e não aceitou o convite
- **Quando** Ana tenta abrir o endereço de "Sprint"
- **Então** recebe "Quadro não encontrado." e "Sprint" não aparece na sua grade.

**CA04 — Não participante**
- **Dado** que Bruno não participa de "Sprint" e não tem convite
- **Quando** tenta ler ou alterar "Sprint", suas listas, cards, checklists ou membros por qualquer meio
- **Então** recebe "Quadro não encontrado." e nada muda.

### Convidar

**CA05 — Convidar com papel**
- **Quando** Caio informa "Pedro@Empresa.com " com o papel "Administrador" e aciona "Convidar"
- **Então** aparece no final da lista a linha "pedro@empresa.com", "convite pendente", com o papel "Administrador"; o campo de e-mail fica vazio e o seletor volta para "Membro".

**CA06 — E-mail inválido**
- **Quando** Caio convida "pedro@"
- **Então** nenhum convite é criado e ele vê "Informe um e-mail válido.".

**CA07 — E-mail de participante**
- **Quando** Caio convida "joao@empresa.com" ou "caio@empresa.com"
- **Então** nenhum convite é criado e ele vê "Essa pessoa já participa do quadro.".

**CA08 — Convite pendente duplicado**
- **Quando** Caio convida "ANA@empresa.com"
- **Então** nenhum convite é criado e ele vê "Já existe um convite pendente para esse e-mail.".

**CA09 — E-mail sem conta**
- **Dado** que não existe conta para pedro@empresa.com e Caio o convidou
- **Quando** Pedro cria a conta com pedro@empresa.com (RF01) e acessa "Meus quadros"
- **Então** vê o convite para "Sprint".

**CA10 — Membro não convida**
- **Quando** João abre "Membros do quadro"
- **Então** não vê o formulário de convite; **e quando** tenta convidar por qualquer meio, recebe "Você não tem permissão para esta ação." e nenhum convite é criado.

### Aceitar, recusar e cancelar

**CA11 — Ver convite**
- **Quando** Ana, com conta, acessa "Meus quadros"
- **Então** vê a seção "Convites" com "Sprint", "Convidado por Caio", o papel "Membro" e os botões "Aceitar" e "Recusar".

**CA12 — Aceitar**
- **Quando** Ana aceita o convite
- **Então** a seção "Convites" deixa de mostrá-lo, "Sprint" aparece como primeiro cartão da grade com o selo "MEMBRO", e a janela "Membros do quadro" passa a mostrar Ana como participante "ativo" depois de João.

**CA13 — Aceitar com papel alterado**
- **Dado** que Caio alterou o papel do convite de Ana para "Administrador"
- **Quando** Ana aceita
- **Então** Ana participa de "Sprint" como Administrador.

**CA14 — Recusar**
- **Quando** Ana recusa o convite
- **Então** o convite some da seção "Convites" e da lista de pessoas de "Sprint", e Ana continua sem acesso.

**CA15 — Cancelar**
- **Quando** Caio cancela o convite de Ana
- **Então** a linha de Ana some da lista e, ao recarregar "Meus quadros", Ana não vê mais o convite.

**CA16 — Aceitar convite cancelado**
- **Dado** que Ana está com "Meus quadros" aberto mostrando o convite e Caio o cancelou em seguida
- **Quando** Ana aciona "Aceitar"
- **Então** vê "Convite não encontrado.", o convite some da seção e Ana continua sem acesso.

**CA17 — Convidar de novo após recusa**
- **Dado** que Ana recusou o convite
- **Quando** Caio convida ana@empresa.com novamente
- **Então** um novo convite pendente é criado.

### Papéis

**CA18 — Alterar papel de participante**
- **Quando** Caio altera o papel de João para "Administrador"
- **Então** a linha de João exibe "Administrador" e, na próxima vez que João abrir "Sprint", ele vê "Adicionar lista" e as ações de lista.

**CA19 — Rebaixar a si mesmo com outro Administrador**
- **Quando** Caio altera o próprio papel para "Membro"
- **Então** a alteração é salva, e a janela passa a mostrar a Caio a lista sem controles de administração.

**CA20 — Último Administrador**
- **Dado** que Marina já é Membro e Caio é o único Administrador
- **Quando** Caio altera o próprio papel para "Membro", remove a si mesmo ou aciona "Sair do quadro"
- **Então** a ação é recusada com "O quadro precisa ter pelo menos um administrador." e Caio continua Administrador.

**CA21 — Rebaixamentos simultâneos**
- **Dado** que Caio e Marina são os únicos Administradores
- **Quando**, ao mesmo tempo, Caio rebaixa Marina e Marina rebaixa Caio
- **Então** uma das alterações é aplicada, a outra é recusada com "O quadro precisa ter pelo menos um administrador.", e o quadro termina com exatamente um Administrador.

### Remover e sair

**CA22 — Remover participante**
- **Dado** que João é responsável por "Refatorar filtros"
- **Quando** Caio remove João e confirma
- **Então** João some da lista, deixa de ser responsável por "Refatorar filtros", "Sprint" some da grade de João e, se João tentar abrir "Sprint", recebe "Quadro não encontrado.".

**CA23 — Cancelar remoção**
- **Quando** Caio aciona remover em João e cancela a confirmação
- **Então** João continua participante.

**CA24 — Sair do quadro**
- **Quando** João aciona "Sair do quadro" na própria linha e confirma
- **Então** João é levado para "Meus quadros", "Sprint" não aparece mais e a lista de pessoas do quadro não o mostra.

**CA25 — Membro não remove outros**
- **Quando** João tenta remover Marina ou alterar papéis por qualquer meio
- **Então** recebe "Você não tem permissão para esta ação." e nada muda.

**CA26 — Remoção preserva conteúdo**
- **Dado** que João criou cards e itens de checklist
- **Quando** João é removido
- **Então** esses cards e itens continuam existindo, inalterados.

### Permissões por papel

**CA27 — Membro trabalha nos cards**
- **Quando** João cria, edita, move e exclui cards (RF04) e adiciona, marca e exclui itens de checklist (RF06)
- **Então** todas as ações são permitidas.

**CA28 — Membro não gerencia listas nem quadro**
- **Quando** João tenta, por qualquer meio:
  - criar, renomear, mover ou excluir listas (RF03, RF05);
  - editar ou excluir o quadro (RF02);
  - alterar o bloqueio de exclusão (RF05)
- **Então** recebe "Você não tem permissão para esta ação." e nada muda.

**CA29 — Interface do Membro**
- **Quando** João abre "Sprint"
- **Então** não vê "Adicionar lista", editar ou excluir lista, nem editar o quadro no cabeçalho; e vê "Adicionar card", as ações do card e o botão "Membros".

**CA30 — Administrador convidado gerencia**
- **Dado** que Marina é Administradora
- **Quando** Marina cria listas, edita o quadro e convida pessoas
- **Então** todas as ações são permitidas.

### Responsáveis

**CA31 — Atribuir responsável**
- **Dado** que a janela de "Refatorar filtros" está aberta
- **Quando** aciono "+" em "Responsáveis" e marco João
- **Então** o avatar de João aparece em "Responsáveis" e na face de "Refatorar filtros", sem salvar o card.

**CA32 — Lista de atribuição só com participantes ativos**
- **Quando** aciono "+" em "Responsáveis"
- **Então** vejo Caio, Marina e João, nessa ordem, e não vejo Ana, que só tem convite pendente.

**CA33 — Remover responsável**
- **Dado** que João é responsável por "Refatorar filtros"
- **Quando** removo João em "Responsáveis"
- **Então** o avatar de João some da seção e da face do card.

**CA34 — Membro atribui**
- **Quando** João atribui Marina a "Refatorar filtros"
- **Então** a atribuição é salva.

**CA35 — Vários responsáveis na face**
- **Dado** que o card tem 5 responsáveis
- **Então** a face exibe 3 avatares e "+2".

**CA36 — Responsável que não participa**
- **Quando** alguém tenta, por qualquer meio, atribuir a "Refatorar filtros" uma conta que não é participante ativa de "Sprint"
- **Então** recebe "Essa pessoa não participa do quadro." e nada muda.

**CA37 — Fechar a janela mantém atribuições**
- **Dado** que atribuí João e alterei o título sem salvar
- **Quando** fecho a janela do card
- **Então** o título volta ao original e João continua responsável.

**CA38 — Mover e excluir card**
- **Dado** que João é responsável por "Refatorar filtros"
- **Quando** movo o card para "Concluído" (RF04), ou excluo a lista "A fazer" movendo os cards (RF05)
- **Então** João continua responsável; **e quando** excluo o card, as atribuições deixam de existir junto com ele.

### Concorrência e sessão

**CA39 — Perda de acesso com o quadro aberto**
- **Dado** que João está com "Sprint" aberto e Caio o removeu
- **Quando** João tenta criar um card ou recarregar a página
- **Então** recebe "Quadro não encontrado." com caminho para "Meus quadros".

**CA40 — Rebaixado com a tela aberta**
- **Dado** que Marina está com "Sprint" aberto como Administradora e Caio a rebaixou a Membro
- **Quando** Marina tenta renomear uma lista
- **Então** recebe "Você não tem permissão para esta ação.", nada muda e, ao recarregar, não vê mais as ações de lista.

**CA41 — Sessão expirada**
- **Dado** que minha sessão expirou com a janela "Membros do quadro" ou a janela do card aberta
- **Quando** executo qualquer ação deste requisito
- **Então** nada é alterado e o sistema segue o comportamento de sessão expirada do RF01.

---

## 4. Regras de negócio e restrições

**RN01 — Criador e quadros existentes.** Quem cria um quadro é o seu primeiro Administrador. Todo quadro existente antes deste requisito tem o seu dono como único participante, com papel Administrador.

**RN02 — Acesso.** Só participantes, com qualquer papel, veem e abrem um quadro e seu conteúdo. Convite pendente não dá acesso. Para quem não é participante, o quadro é indistinguível de inexistente ("Quadro não encontrado."), como no RF02.

**RN03 — Papéis.** Todo participante tem exatamente um papel: Administrador ou Membro. Não existem outros papéis.

**RN04 — Pelo menos um Administrador.** Todo quadro tem, em qualquer momento, ao menos um Administrador. Nenhuma operação que deixaria o quadro sem Administrador é aplicada, nem quando várias chegam ao mesmo tempo.

**RN05 — Matriz de permissões.**

| Ação | Administrador | Membro |
| --- | --- | --- |
| Ver o quadro, as listas, os cards, as checklists, os responsáveis e a lista de pessoas | sim | sim |
| Editar nome e cor do quadro e o bloqueio de exclusão (RF02, RF05) | sim | não |
| Excluir o quadro (RF02) | sim | não |
| Criar, renomear, mover e excluir listas, inclusive com cards (RF03, RF05) | sim | não |
| Criar, editar, mover e excluir cards (RF04) | sim | sim |
| Adicionar, marcar, editar e excluir itens de checklist (RF06) | sim | sim |
| Atribuir e remover responsáveis (2.9) | sim | sim |
| Convidar, alterar papéis, cancelar convites e remover participantes | sim | não |
| Sair do quadro | sim, se não for o último Administrador | sim |
| Criar, editar e excluir etiquetas do quadro (RF08) | sim | não |
| Aplicar e remover etiquetas de um card, comentar e definir prazo (RF08–RF10) | sim | sim |

**RN06 — Recusa de ação não permitida.** Uma ação não permitida ao papel de um participante é recusada com "Você não tem permissão para esta ação.", sem alterar nada, qualquer que seja o meio usado. A verificação usa o papel **no momento do processamento**.

**RN07 — Convite.**
- Pertence a um quadro e é identificado pelo e-mail normalizado (RF01, RN02) e pelo papel oferecido.
- O e-mail precisa ter formato válido (RF01, RN03).
- Não pode pertencer a um participante do quadro, nem ter outro convite pendente no mesmo quadro.
- Não expira.
- Deixa de existir ao ser aceito, recusado ou cancelado.

**RN08 — Quem responde ao convite.** Só a conta cujo e-mail é igual ao e-mail do convite pode vê-lo, aceitá-lo ou recusá-lo. Para qualquer outra conta, o convite é indistinguível de inexistente ("Convite não encontrado.").

**RN09 — Aceite.** Aceitar torna a conta participante com o papel atual do convite, na mesma operação em que o convite deixa de existir. Aceitar um convite que não existe mais é recusado com "Convite não encontrado.".

**RN10 — Remoção e saída.**
- Quem deixa de ser participante, por remoção ou saída, perde o acesso ao quadro e deixa de ser responsável por todos os cards do quadro, na mesma operação.
- O conteúdo criado por essa pessoa não é alterado.
- A pessoa pode ser convidada de novo.

**RN11 — Responsáveis.**
- Só participantes do quadro podem ser responsáveis por cards daquele quadro.
- Atribuir alguém que já é responsável, ou remover quem não é, é aceito e não produz erro nem mudança.
- Mover o card preserva os responsáveis; excluir o card exclui as atribuições.

**RN12 — Limite de pessoas.** Um quadro tem no máximo 50 pessoas, somando participantes e convites pendentes. Um convite que ultrapassaria o limite é recusado com "O quadro atingiu o limite de 50 pessoas.".

**RN13 — Ordens de exibição.**
- Participantes: por ordem de entrada no quadro. O criador é o primeiro; quem aceita um convite entra no momento do aceite.
- Convites pendentes: por ordem de envio.
- Responsáveis de um card: por ordem de atribuição.

**RN14 — Contagens de "Meus quadros".** O total de quadros e a quantidade de quadros em que a conta é Administradora consideram só quadros em que a conta é participante.

**RN15 — Exclusão do quadro.** Excluir o quadro (RF02, somente Administrador) exclui também participantes, convites pendentes e atribuições. Todas as contas perdem o acesso.

---

## 5. Casos de borda e condições de erro

### 5.1 Entrada de dados e manipulação

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB01 | E-mail do convite com espaços nas extremidades ou letras maiúsculas | Normalizado antes de validar, comparar e salvar. |
| CB02 | E-mail vazio | "Campo obrigatório."; nenhum convite. |
| CB03 | Papel diferente de Administrador ou Membro, por manipulação | Recusado com "Valor inválido."; nada muda. |
| CB04 | Convite enviado sem papel, por manipulação | Tratado como "Membro". |
| CB05 | Tentativa de alterar papel, remover ou cancelar informando pessoa ou convite de outro quadro | "Participante não encontrado." ou "Convite não encontrado."; nada muda. |
| CB06 | Identificadores de participante, convite ou conta malformados | "Participante não encontrado.", "Convite não encontrado." ou "Essa pessoa não participa do quadro.", conforme a operação. |
| CB07 | Alterar o papel para o valor que já tem | Aceito, sem mudança e sem erro. |
| CB08 | Quadro com 49 pessoas e dois convites enviados ao mesmo tempo | Um é criado e o outro é recusado pelo limite (RN12). |
| CB09 | Conta cujo e-mail tem convite pendente em vários quadros | Todos aparecem na seção "Convites", do mais recente para o mais antigo. |
| CB10 | Nomes, e-mails ou nome do quadro com marcação HTML | Exibidos como texto literal. |

### 5.2 Concorrência e estado desatualizado

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB11 | Dois Administradores convidam o mesmo e-mail ao mesmo tempo | Um convite é criado; o outro recebe "Já existe um convite pendente para esse e-mail.". |
| CB12 | O convidado aceita enquanto o Administrador cancela | Prevalece o que for processado primeiro: ou o convidado vira participante e o cancelamento recebe "Convite não encontrado.", ou o convite é cancelado e o aceite recebe "Convite não encontrado.". |
| CB13 | Participante removido em outra aba enquanto está com a janela "Membros do quadro" aberta | A próxima ação recebe "Quadro não encontrado." (2.10). |
| CB14 | Participante rebaixado a Membro enquanto a janela de um card está aberta | As ações de card, checklist e responsáveis continuam permitidas (RN05). |
| CB15 | Responsável removido do quadro com a janela do card aberta em outra aba | Na próxima ação de responsáveis, a janela passa a exibir a lista atual de responsáveis e de participantes. |
| CB16 | Duas abas atribuem a mesma pessoa ao mesmo card | Uma atribuição é registrada, sem duplicidade e sem erro. |
| CB17 | Remover alguém que já foi removido, ou cancelar um convite que já não existe | Tratado como sucesso: a linha some da lista. |
| CB18 | A janela "Membros do quadro" está desatualizada por ações em outra aba | Após qualquer ação, a lista passa a exibir o estado salvo completo de participantes e convites. |
| CB19 | Quadro excluído com convite pendente não respondido | O convite some da seção "Convites"; aceitar recebe "Convite não encontrado.". |

### 5.3 Falhas

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CE01 | Falha de comunicação ao convidar | O e-mail e o papel permanecem no formulário com a mensagem genérica; nenhum convite aparece. |
| CE02 | Falha ao alterar papel | O seletor volta ao valor anterior e a mensagem genérica aparece na janela. |
| CE03 | Falha ao remover, sair, cancelar, aceitar ou recusar | A confirmação ou a linha permanece, com a mensagem genérica; nada muda. |
| CE04 | Falha ao atribuir ou remover responsável | A seleção volta ao estado anterior e a mensagem genérica aparece na seção "Responsáveis". |
| CE05 | Falha no meio de remoção ou saída | Nada é alterado: nem participação, nem atribuições. |
| CE06 | Erro inesperado | A mensagem não revela detalhes internos. |

### 5.4 Mensagens ao usuário

A redação pode variar desde que o significado seja preservado e a mesma situação produza sempre a mesma mensagem. Mensagens de sessão seguem o RF01; de quadro, o RF02; de lista, o RF03; de card, o RF04.

| Situação | Mensagem |
| --- | --- |
| Título da janela | "Membros do quadro" |
| Texto da janela | "Administradores gerenciam o quadro, as listas, as etiquetas e os membros. Membros trabalham nos cards." |
| Campo de convite | "E-mail do convidado" |
| Papéis | "Administrador" / "Membro" |
| Selos na listagem | "ADMIN" / "MEMBRO" |
| Subtítulo da listagem | "{N} quadros · você é administrador em {M}" |
| Estados na lista de pessoas | "você" / "ativo" / "convite pendente" |
| Seção de convites | "Convites" / "Convidado por {nome}" / "Aceitar" / "Recusar" |
| E-mail vazio | "Campo obrigatório." |
| E-mail inválido | "Informe um e-mail válido." |
| Já participa | "Essa pessoa já participa do quadro." |
| Convite duplicado | "Já existe um convite pendente para esse e-mail." |
| Limite de pessoas | "O quadro atingiu o limite de 50 pessoas." |
| Último Administrador | "O quadro precisa ter pelo menos um administrador." |
| Sem permissão | "Você não tem permissão para esta ação." |
| Convite inexistente | "Convite não encontrado." |
| Participante inexistente | "Participante não encontrado." |
| Responsável que não participa | "Essa pessoa não participa do quadro." |
| Papel inválido | "Valor inválido." |
| Confirmar remoção | "Remover {nome} do quadro?" / "Essa pessoa perderá o acesso ao quadro e deixará de ser responsável pelos cards dele." |
| Confirmar saída | "Sair do quadro "{nome do quadro}"?" / "Você perderá o acesso a este quadro e deixará de ser responsável pelos cards dele." |
| Seção do card | "Responsáveis" |
| Falha de comunicação ou erro inesperado | "Não foi possível concluir a operação. Tente novamente." |

---

## 6. Fora de escopo

- envio de e-mails de convite ou notificações de qualquer tipo;
- links de convite compartilháveis e expiração de convites;
- papéis além de Administrador e Membro, ou permissões configuráveis por quadro;
- transferência de "propriedade" do quadro (todos os Administradores têm os mesmos poderes);
- perfis públicos, fotos de perfil e busca de contas;
- filtrar ou ordenar cards por responsável;
- histórico de quem entrou, saiu ou mudou de papel;
- atualização em tempo real entre abas ou dispositivos.
