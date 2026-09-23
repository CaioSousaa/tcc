# RF08 — Etiquetas coloridas e filtro por etiqueta

**Requisito:** RF08 — Criação de etiquetas coloridas no quadro, aplicação das etiquetas aos cards e filtro dos cards exibidos por etiqueta.
**História de usuário:** HU08 — Como participante de um quadro, eu quero classificar os cards com etiquetas coloridas e filtrar o quadro por elas, para que eu encontre rapidamente os cards de um mesmo tipo.

**Depende de:**
- **RF01:** sessão e sessão expirada;
- **RF02:** quadro, cabeçalho do quadro e "Quadro não encontrado.";
- **RF03:** listas e contagem de cards no cabeçalho da lista;
- **RF04:** cards, janela do card, face do card e "Card não encontrado.";
- **RF05:** exclusão de lista com cards (mover ou excluir em cascata);
- **RF07:** participação, papéis e matriz de permissões (RN05).

As regras desses requisitos valem aqui sem repetição.

Telas de referência no protótipo:
- `prototipo/modais/etiquetas.png`: janela "Etiquetas do quadro";
- `prototipo/paginas/quadro.png`: botão "Etiquetas" no cabeçalho, barra "Filtrar por etiqueta", total "N cards no quadro" e etiquetas na face dos cards;
- `prototipo/modais/detalhe-card.png`: seção "Etiquetas" e ação "Gerenciar etiquetas" na janela do card.

Os elementos "Ordenar por prazo", prazos e comentários que aparecem nessas telas pertencem ao RF09 e ao RF10.

---

## 1. Visão geral

Cada quadro tem um conjunto próprio de **etiquetas**. Cada etiqueta tem um nome e uma cor.

- **Administradores** do quadro criam, editam e excluem as etiquetas.
- **Qualquer participante** aplica e remove etiquetas dos cards e filtra o quadro por etiqueta.

As etiquetas aplicadas a um card aparecem na face do card e na janela do card. O **filtro** mostra, nas listas do quadro, somente os cards que têm pelo menos uma das etiquetas selecionadas.

### Conceitos

| Termo | Definição |
| --- | --- |
| Etiqueta | Nome e cor que pertencem a exatamente um quadro. Só pode ser aplicada a cards desse quadro. |
| Paleta | Conjunto fixo de 6 cores disponíveis, nesta ordem: **Vermelho**, **Azul**, **Verde**, **Âmbar**, **Roxo** e **Cinza**. |
| Etiqueta aplicada | Vínculo entre uma etiqueta e um card. Um card tem de zero até todas as etiquetas do quadro, cada uma no máximo uma vez. |
| Uso da etiqueta | Quantidade de cards do quadro aos quais a etiqueta está aplicada. |
| Ordem das etiquetas | Ordem de criação das etiquetas no quadro. É a ordem usada em todos os lugares onde etiquetas aparecem. |
| Filtro | Seleção de etiquetas feita pelo participante na tela do quadro. Afeta só o que aquela tela exibe. |

### Salvamento imediato

Criar, editar e excluir etiqueta, e também aplicar e remover etiqueta de um card, são **salvos no momento em que são feitos**, independentemente do "Salvar card" do RF04. Por isso:
- fechar a janela do card sem salvar descarta só as alterações pendentes de título, descrição, lista e posição, nunca as etiquetas já aplicadas ou removidas;
- "Salvar card" não envia nem altera etiquetas.

### O filtro não altera dados

Filtrar só muda o que a tela exibe. O filtro:
- não altera cards, listas, posições nem etiquetas;
- não é visto por outros participantes;
- não é guardado: ao abrir ou recarregar o quadro, o filtro começa em "Todas".

### Relação com outros requisitos

- **RF03:** com o filtro ativo, a contagem no cabeçalho de cada lista passa a indicar os cards exibidos (2.8).
- **RF04:** mover um card entre listas ou posições preserva as suas etiquetas. Excluir o card remove as etiquetas aplicadas a ele, sem excluir as etiquetas do quadro.
- **RF05:** mover os cards de uma lista excluída preserva as etiquetas; excluir em cascata remove as aplicações junto com os cards.
- **RF07:** "Criar, editar e excluir etiquetas" é ação de Administrador; "aplicar e remover etiquetas de um card" é ação de qualquer participante (RN05). Filtrar é visualização e está disponível a qualquer participante.

---

## 2. Comportamento esperado

### 2.1 Etiquetas no cabeçalho do quadro

O cabeçalho do quadro exibe, à direita e antes do botão "Membros" (RF07), o botão **"Etiquetas"**, **somente para Administradores**. Ele abre a janela "Etiquetas do quadro" no **modo gerenciamento** (2.2).

Abaixo do cabeçalho, para qualquer participante, aparece a **barra de filtro** (2.7).

### 2.2 Janela "Etiquetas do quadro" no modo gerenciamento

Aberta pelo botão "Etiquetas" do cabeçalho. Exibe:
- o título "Etiquetas do quadro" e o texto "Crie, edite e exclua as etiquetas usadas nos cards deste quadro.";
- a lista de etiquetas, na ordem das etiquetas. Cada linha tem a cor, o nome, o uso da etiqueta e as ações "Editar" e "Excluir";
- o formulário "Nova etiqueta" (2.4);
- o botão "Concluído", que fecha a janela.

Sem etiquetas, a lista exibe "Nenhuma etiqueta neste quadro." e o formulário continua disponível.

### 2.3 Janela "Etiquetas do quadro" no modo card

Aberta pela ação **"Gerenciar etiquetas"** da janela do card (2.6), disponível para qualquer participante. Exibe:
- o título "Etiquetas do quadro" e o texto "Marque as etiquetas aplicadas a este card ou crie uma nova.";
- a lista de etiquetas, na ordem das etiquetas. Cada linha tem uma caixa de marcação indicando se a etiqueta está aplicada ao card, a cor, o nome e o uso da etiqueta;
- **somente para Administradores**, o formulário "Nova etiqueta" (2.4);
- o botão "Concluído", que fecha a janela e volta para a janela do card.

Marcar uma caixa aplica a etiqueta ao card, e desmarcar remove. Cada mudança é salva imediatamente, e o uso da etiqueta é atualizado na linha. Não há edição nem exclusão de etiquetas neste modo.

Sem etiquetas no quadro, a lista exibe "Nenhuma etiqueta neste quadro.". Para Membros, o texto passa a ser "Nenhuma etiqueta neste quadro. Peça a um administrador para criar etiquetas.".

### 2.4 Criar etiqueta

O formulário "Nova etiqueta" tem:
- o campo "Nome";
- a paleta de 6 cores, com **Vermelho** pré-selecionado;
- o botão "Criar".

**Se o formulário for válido:** a etiqueta é criada com o nome normalizado (RN03) e a cor escolhida, e aparece no **final** da lista, com uso 0. O campo "Nome" é limpo e mantém o foco, e a cor volta para Vermelho. No modo card, a etiqueta criada **não** é aplicada automaticamente ao card: ela aparece desmarcada.

**A criação é recusada, com a mensagem junto ao campo, quando:**
- o nome está vazio;
- o nome passa de 30 caracteres;
- já existe etiqueta com o mesmo nome no quadro (RN04);
- o quadro já tem 50 etiquetas (RN06).

Enquanto a criação está em andamento, o botão "Criar" fica desabilitado, e um novo envio não é feito.

### 2.5 Editar e excluir etiqueta (somente modo gerenciamento)

**Editar:** "Editar" transforma a linha em um formulário com o campo "Nome" preenchido, a paleta com a cor atual selecionada e os botões "Salvar" e "Cancelar". Apenas uma linha fica em edição por vez.
- Salvar valida o nome como na criação (RN03, RN04, sem contar a própria etiqueta na comparação de nomes).
- Uma edição salva vale em todos os lugares: face dos cards, janela do card e barra de filtro.
- "Cancelar" e Esc descartam a edição sem fechar a janela.
- Salvar sem alterações é aceito e não produz erro.

**Excluir:** "Excluir" abre a confirmação **"Excluir a etiqueta "{nome}"?"** com os botões "Cancelar" e "Excluir".
- Com uso maior que zero, o texto é "Ela será removida de {N} card(s). Os cards não serão excluídos." ("1 card" no singular, "{N} cards" no plural).
- Com uso zero, o texto é "Nenhum card usa esta etiqueta.".

Ao confirmar:
- a etiqueta deixa de existir e é removida de todos os cards;
- se estava selecionada no filtro, deixa de estar selecionada (2.7).

### 2.6 Etiquetas na janela e na face do card

**Na janela do card**, na coluna lateral, abaixo de "Lista" e "Posição na lista" (RF04) e acima de "Responsáveis" (RF07), aparece a seção **"Etiquetas"** com:
- as etiquetas aplicadas ao card, na ordem das etiquetas, cada uma exibida com o seu nome sobre a sua cor;
- a ação "Gerenciar etiquetas", que abre a janela do modo card (2.3).

Sem etiquetas aplicadas, a seção exibe "Nenhuma etiqueta.". Ao voltar da janela do modo card, a seção mostra as etiquetas salvas.

**Na face do card**, as etiquetas aplicadas aparecem **acima do título**, na ordem das etiquetas, com nome e cor, quebrando em mais de uma linha quando necessário. Sem etiquetas aplicadas, nada é exibido.

A face e a janela do card refletem cada aplicação, remoção, edição ou exclusão de etiqueta feita na mesma tela, sem recarregar a página.

### 2.7 Barra de filtro

A barra fica abaixo do cabeçalho do quadro e exibe, da esquerda para a direita:
- o texto "Filtrar por etiqueta";
- a opção **"Todas"**;
- uma opção por etiqueta, na ordem das etiquetas, com a cor e o nome;
- à direita, o total de cards (2.8).

Sem etiquetas no quadro, a barra exibe apenas "Filtrar por etiqueta", "Todas" selecionada e o total.

**Seleção:**
- Ao abrir o quadro, "Todas" está selecionada, e todos os cards são exibidos.
- Acionar uma etiqueta não selecionada a **seleciona**; acionar uma etiqueta selecionada a **desseleciona**. Várias etiquetas podem estar selecionadas ao mesmo tempo.
- Quando há pelo menos uma etiqueta selecionada, "Todas" deixa de estar selecionada.
- Acionar "Todas" desseleciona todas as etiquetas.
- Desselecionar a última etiqueta selecionada volta para "Todas".

**Regra do filtro:** com etiquetas selecionadas, um card é exibido **se tiver pelo menos uma** das etiquetas selecionadas (RN08). Cards sem etiquetas só são exibidos com "Todas".

**Durante o filtro:**
- todas as listas continuam exibidas, inclusive as que ficam sem cards visíveis;
- os cards exibidos mantêm a ordem que têm na lista;
- a ação "Adicionar card" continua disponível.

### 2.8 Contagens com filtro

**Total no cabeçalho da barra:**
- sem filtro: "{N} cards no quadro" ("1 card no quadro" no singular);
- com filtro: "{X} de {N} cards", em que X é a quantidade de cards exibidos e N é o total de cards do quadro.

**Contagem no cabeçalho de cada lista (RF03):**
- sem filtro, é a quantidade de cards da lista;
- com filtro, é a quantidade de cards **exibidos** na lista.

As posições oferecidas na janela do card (RF04) continuam considerando **todos** os cards da lista, exibidos ou não.

### 2.9 O filtro depois de mudanças

O filtro é reaplicado a cada mudança exibida na tela. Em particular:
- um card criado com o filtro ativo não tem etiquetas e, por isso, não aparece. Nesse caso, a lista exibe o aviso "Card criado. Ele não aparece por causa do filtro de etiquetas.", que some na próxima ação do usuário;
- se a janela do card está aberta e o usuário remove dela a última etiqueta que atendia ao filtro, a janela **continua aberta**. Ao fechá-la, o card deixa de aparecer;
- aplicar a um card uma etiqueta selecionada faz o card aparecer;
- se uma etiqueta selecionada é excluída, ela sai da seleção; sem outras selecionadas, o filtro volta para "Todas";
- editar o nome ou a cor de uma etiqueta selecionada mantém a seleção.

---

## 3. Critérios de aceite (Given/When/Then)

Salvo indicação contrária, existe o quadro "Sprint" com os participantes Caio (**Administrador**) e João (**Membro**). O quadro tem estas etiquetas, nesta ordem:
- "Bug", Vermelho;
- "Frontend", Azul;
- "Urgente", Âmbar.

As listas e os cards, em ordem, são:
- **"A fazer":**
  - "Refatorar filtros", com as etiquetas Frontend e Urgente;
  - "Corrigir login", com a etiqueta Bug;
  - "Escrever docs", sem etiquetas;
- **"Concluído":**
  - "Ajustar layout", com a etiqueta Frontend.

### Exibição

**CA01 — Etiquetas na face**
- **Quando** Caio abre "Sprint"
- **Então** a face de "Refatorar filtros" exibe "Frontend" e "Urgente", nessa ordem, acima do título, e a face de "Escrever docs" não exibe etiquetas.

**CA02 — Etiquetas na janela do card**
- **Quando** Caio abre "Refatorar filtros"
- **Então** a seção "Etiquetas" exibe "Frontend" e "Urgente" e a ação "Gerenciar etiquetas".

**CA03 — Barra de filtro e total**
- **Quando** João abre "Sprint"
- **Então** a barra exibe "Filtrar por etiqueta", "Todas" selecionada, "Bug", "Frontend" e "Urgente", nessa ordem, e "4 cards no quadro".

**CA04 — Botão "Etiquetas" por papel**
- **Quando** Caio e João abrem "Sprint"
- **Então** Caio vê o botão "Etiquetas" no cabeçalho e João não o vê.

**CA05 — Uso das etiquetas**
- **Quando** Caio abre "Etiquetas" no cabeçalho
- **Então** a lista exibe "Bug" com uso 1, "Frontend" com uso 2 e "Urgente" com uso 1.

### Criar

**CA06 — Criar etiqueta**
- **Quando** Caio informa "  UX  " na "Nova etiqueta", escolhe Roxo e aciona "Criar"
- **Então** "UX", Roxo, com uso 0, aparece no final da lista e da barra de filtro; o campo fica vazio e com foco; e a cor volta para Vermelho.

**CA07 — Nome vazio**
- **Quando** Caio aciona "Criar" com o nome vazio ou só com espaços
- **Então** nenhuma etiqueta é criada e ele vê "Campo obrigatório.".

**CA08 — Nome longo**
- **Quando** Caio cria uma etiqueta com 31 caracteres
- **Então** nenhuma etiqueta é criada e ele vê "O nome da etiqueta deve ter no máximo 30 caracteres."; com 30 caracteres, a etiqueta é criada.

**CA09 — Nome repetido**
- **Quando** Caio cria "bug" ou " BUG "
- **Então** nenhuma etiqueta é criada e ele vê "Já existe uma etiqueta com esse nome neste quadro.".

**CA10 — Mesmo nome em outro quadro e mesma cor**
- **Dado** que Caio administra também o quadro "Infra", sem etiquetas
- **Quando** ele cria "Bug", Vermelho, em "Infra", e depois "Hotfix", Vermelho, em "Sprint"
- **Então** as duas etiquetas são criadas.

**CA11 — Criar no modo card**
- **Dado** que Caio abriu "Gerenciar etiquetas" em "Escrever docs"
- **Quando** cria "Docs", Verde
- **Então** "Docs" aparece desmarcada no final da lista, e "Escrever docs" continua sem etiquetas.

**CA12 — Membro não cria**
- **Quando** João abre "Gerenciar etiquetas" em um card
- **Então** não vê o formulário "Nova etiqueta"; **e quando** tenta criar etiqueta por qualquer meio, recebe "Você não tem permissão para esta ação." e nada muda.

### Editar e excluir

**CA13 — Editar nome e cor**
- **Quando** Caio edita "Frontend" para "Front", Verde, e salva
- **Então** a linha exibe "Front", Verde; e as faces de "Refatorar filtros" e "Ajustar layout" e a barra de filtro passam a exibir "Front" em Verde.

**CA14 — Editar para nome existente**
- **Quando** Caio edita "Frontend" para "urgente"
- **Então** a edição é recusada com "Já existe uma etiqueta com esse nome neste quadro." e "Frontend" não muda.

**CA15 — Mudar só a caixa do próprio nome**
- **Quando** Caio edita "Bug" para "BUG" e salva
- **Então** a etiqueta passa a se chamar "BUG".

**CA16 — Cancelar edição**
- **Quando** Caio altera o nome de "Bug" e aciona "Cancelar" ou pressiona Esc
- **Então** a linha volta a exibir "Bug" e a janela continua aberta.

**CA17 — Excluir etiqueta em uso**
- **Quando** Caio aciona "Excluir" em "Frontend"
- **Então** vê "Excluir a etiqueta "Frontend"?" e "Ela será removida de 2 cards. Os cards não serão excluídos."; **e quando** confirma, "Frontend" some da lista, da barra de filtro e das faces de "Refatorar filtros" e "Ajustar layout", e os dois cards continuam existindo.

**CA18 — Cancelar exclusão**
- **Quando** Caio aciona "Excluir" em "Bug" e cancela
- **Então** "Bug" continua existindo e aplicada a "Corrigir login".

**CA19 — Membro não edita nem exclui**
- **Quando** João tenta editar ou excluir uma etiqueta por qualquer meio
- **Então** recebe "Você não tem permissão para esta ação." e nada muda.

### Aplicar e remover

**CA20 — Aplicar etiqueta**
- **Dado** que João abriu "Gerenciar etiquetas" em "Escrever docs"
- **Quando** marca "Bug"
- **Então** a caixa fica marcada, o uso de "Bug" passa a 2, e, ao voltar com "Concluído", a seção "Etiquetas" e a face de "Escrever docs" exibem "Bug", sem salvar o card.

**CA21 — Remover etiqueta**
- **Dado** que Caio abriu "Gerenciar etiquetas" em "Refatorar filtros"
- **Quando** desmarca "Urgente"
- **Então** o uso de "Urgente" passa a 0, e a face de "Refatorar filtros" passa a exibir só "Frontend".

**CA22 — Ordem das etiquetas no card**
- **Dado** que "Escrever docs" não tem etiquetas
- **Quando** alguém aplica "Urgente" e depois "Bug"
- **Então** a face e a janela exibem "Bug" antes de "Urgente".

**CA23 — Fechar sem salvar mantém etiquetas**
- **Dado** que Caio alterou o título de "Escrever docs" sem salvar e aplicou "Bug"
- **Quando** fecha a janela do card
- **Então** o título volta ao original e "Escrever docs" continua com "Bug".

**CA24 — Mover e excluir card**
- **Quando** Caio move "Refatorar filtros" para "Concluído" (RF04), ou exclui "A fazer" movendo os cards para "Concluído" (RF05)
- **Então** "Refatorar filtros" continua com "Frontend" e "Urgente"; **e quando** exclui o card, o uso de "Frontend" passa a 1 e o de "Urgente" a 0.

### Filtrar

**CA25 — Filtrar por uma etiqueta**
- **Quando** João aciona "Frontend" na barra
- **Então** "Frontend" fica selecionada, "Todas" deixa de estar; "A fazer" exibe só "Refatorar filtros" com contagem 1; "Concluído" exibe "Ajustar layout" com contagem 1; e o total exibe "2 de 4 cards".

**CA26 — Várias etiquetas**
- **Quando** João seleciona "Bug" e "Urgente"
- **Então** "A fazer" exibe "Refatorar filtros" e "Corrigir login", nessa ordem; "Concluído" é exibida sem cards e com contagem 0; e o total exibe "2 de 4 cards".

**CA27 — Card com várias etiquetas selecionadas aparece uma vez**
- **Quando** João seleciona "Frontend" e "Urgente"
- **Então** "Refatorar filtros" aparece uma única vez, e o total exibe "2 de 4 cards".

**CA28 — Desselecionar e "Todas"**
- **Dado** que "Bug" e "Urgente" estão selecionadas
- **Quando** João desseleciona "Bug"
- **Então** o filtro fica só com "Urgente"; **e quando** desseleciona "Urgente" ou aciona "Todas", "Todas" fica selecionada e os 4 cards voltam a aparecer, com "4 cards no quadro".

**CA29 — Filtro sem resultados**
- **Dado** que Caio criou "UX", sem uso
- **Quando** João recarrega o quadro e seleciona "UX"
- **Então** todas as listas são exibidas sem cards, com contagem 0, e o total exibe "0 de 4 cards".

**CA30 — Filtro é pessoal e não é guardado**
- **Dado** que João filtrou por "Bug"
- **Quando** Caio abre "Sprint" em outra conta, ou João recarrega a página
- **Então** a tela de Caio exibe "Todas" e todos os cards; e, após recarregar, a tela de João também.

**CA31 — Criar card com filtro ativo**
- **Dado** que o filtro está em "Bug"
- **Quando** João adiciona o card "Novo" em "A fazer"
- **Então** o card é criado; "Novo" não aparece; "A fazer" exibe "Card criado. Ele não aparece por causa do filtro de etiquetas."; e o total exibe "1 de 5 cards".

**CA32 — Remover a etiqueta filtrada com a janela aberta**
- **Dado** que o filtro está em "Bug" e João abriu "Corrigir login"
- **Quando** remove "Bug" do card
- **Então** a janela continua aberta; e, ao fechá-la, "Corrigir login" deixa de aparecer, e o total exibe "0 de 4 cards".

**CA33 — Excluir etiqueta selecionada**
- **Dado** que Caio está com o filtro em "Frontend"
- **Quando** exclui "Frontend" na janela "Etiquetas do quadro"
- **Então** o filtro volta para "Todas" e exibe os 4 cards.

**CA34 — Posições com filtro**
- **Dado** que o filtro está em "Bug"
- **Quando** João abre "Corrigir login"
- **Então** "Posição na lista" oferece as posições 1 a 3 de "A fazer", como sem filtro.

### Acesso, concorrência e sessão

**CA35 — Não participante**
- **Dado** que Bruno não participa de "Sprint"
- **Quando** tenta ler, criar, editar, excluir, aplicar ou remover etiquetas de "Sprint" por qualquer meio
- **Então** recebe "Quadro não encontrado." e nada muda.

**CA36 — Etiqueta de outro quadro**
- **Quando** alguém tenta, por qualquer meio, aplicar a "Refatorar filtros" uma etiqueta do quadro "Infra"
- **Então** recebe "Etiqueta não encontrada." e nada muda.

**CA37 — Etiqueta excluída em outra aba**
- **Dado** que João está com "Gerenciar etiquetas" aberta em "Escrever docs" e Caio excluiu "Bug" em outra aba
- **Quando** João marca "Bug"
- **Então** vê "Etiqueta não encontrada.", e a lista da janela é recarregada sem "Bug".

**CA38 — Limite de etiquetas**
- **Dado** que "Sprint" tem 50 etiquetas
- **Quando** Caio tenta criar outra
- **Então** nenhuma etiqueta é criada e ele vê "O quadro pode ter no máximo 50 etiquetas.".

**CA39 — Sessão expirada**
- **Dado** que a sessão de Caio expirou com a janela "Etiquetas do quadro" aberta
- **Quando** ele executa qualquer ação deste requisito
- **Então** nada é alterado e o sistema segue o comportamento de sessão expirada do RF01.

---

## 4. Regras de negócio e restrições

**RN01 — Pertencimento.** Toda etiqueta pertence a exatamente um quadro e só pode ser aplicada a cards desse quadro. Etiquetas nunca são compartilhadas entre quadros.

**RN02 — Cor.** A cor de uma etiqueta é sempre uma das 6 cores da paleta. Toda etiqueta tem exatamente uma cor, e várias etiquetas podem ter a mesma cor.

**RN03 — Nome.**
- Espaços nas extremidades são removidos antes de validar, comparar e salvar.
- Quebras de linha, se enviadas por manipulação, são convertidas em espaço antes da remoção das extremidades.
- Espaços internos são mantidos.
- Depois da normalização, o nome tem de 1 a 30 caracteres. Emoji e letras acentuadas contam como um caractere cada.

**RN04 — Nome único no quadro.** Duas etiquetas do mesmo quadro não podem ter nomes iguais após a normalização, **sem diferenciar maiúsculas de minúsculas**. A comparação diferencia acentos ("Revisão" e "Revisao" são nomes diferentes). Uma etiqueta pode ser renomeada para outra grafia de maiúsculas e minúsculas do próprio nome.

**RN05 — Permissões.** Aplica-se a matriz do RF07 (RN05):

| Ação | Administrador | Membro |
| --- | --- | --- |
| Ver etiquetas, uso, etiquetas dos cards e filtrar | sim | sim |
| Criar, editar e excluir etiquetas | sim | não |
| Aplicar e remover etiquetas de um card | sim | sim |

Ações não permitidas são recusadas com "Você não tem permissão para esta ação.", conforme o papel no momento do processamento (RF07 RN06). Para quem não participa do quadro, vale "Quadro não encontrado." (RF07 RN02).

**RN06 — Limite.** Um quadro tem no máximo **50** etiquetas. Não há limite de etiquetas por card além da quantidade de etiquetas do quadro.

**RN07 — Aplicação.**
- Uma etiqueta está aplicada a um card no máximo uma vez.
- Aplicar uma etiqueta já aplicada, ou remover uma não aplicada, é aceito e não produz erro nem mudança.
- Aplicar e remover não alteram título, descrição, lista, posição, checklist nem responsáveis do card.

**RN08 — Regra do filtro.** Com nenhuma etiqueta selecionada ("Todas"), todos os cards são exibidos. Com uma ou mais selecionadas, um card é exibido se, e somente se, tiver ao menos uma das etiquetas selecionadas. O filtro não muda a ordem dos cards e nunca oculta listas.

**RN09 — Filtro local.** O filtro pertence à tela aberta. Não é salvo, não é compartilhado e não altera dados. Ao abrir ou recarregar o quadro, começa em "Todas".

**RN10 — Exclusão de etiqueta.** Excluir uma etiqueta a remove de todos os cards na mesma operação. Nenhum card é excluído ou alterado de outra forma.

**RN11 — Ordens.** As etiquetas aparecem na ordem de criação no quadro em todos os lugares: lista da janela, barra de filtro, face e janela do card. Editar uma etiqueta não muda a sua posição nessa ordem.

**RN12 — Ciclo de vida.**
- Mover um card entre listas ou posições preserva as etiquetas aplicadas.
- Excluir um card remove as etiquetas aplicadas a ele.
- Excluir uma lista em cascata remove as aplicações dos cards excluídos.
- Excluir o quadro exclui as suas etiquetas e todas as aplicações.

**RN13 — Contagens.** O uso da etiqueta, o total de cards do quadro e a contagem das listas sempre correspondem aos cards salvos na última atualização da tela. Com filtro, "{X} de {N} cards" usa X = cards exibidos e N = todos os cards do quadro.

---

## 5. Casos de borda e condições de erro

### 5.1 Entrada de dados e manipulação

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB01 | Nome com espaços nas extremidades ou quebras de linha | Normalizado conforme RN03. |
| CB02 | Nome com 30 caracteres, incluindo emoji ou acentos | Aceito. |
| CB03 | Cor fora da paleta ou ausente, por manipulação | Recusado com "Selecione uma cor válida."; nada muda. |
| CB04 | Nome com marcação HTML | Aceito e exibido como texto literal em todos os lugares. |
| CB05 | Identificador de etiqueta malformado, inexistente ou de outro quadro | "Etiqueta não encontrada."; nada muda. |
| CB06 | Aplicar ou remover etiqueta em card inexistente ou de outro quadro | "Card não encontrado."; nada muda. |
| CB07 | Campos extras enviados por manipulação, como o quadro, o uso ou a data de criação | Ignorados. |
| CB08 | Editar sem alterar nome nem cor | Aceito, sem erro. |

### 5.2 Concorrência e estado desatualizado

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB09 | Dois Administradores criam etiquetas com o mesmo nome ao mesmo tempo | Uma é criada; a outra recebe "Já existe uma etiqueta com esse nome neste quadro.". |
| CB10 | Duas criações simultâneas com o quadro em 49 etiquetas | Uma é criada; a outra recebe "O quadro pode ter no máximo 50 etiquetas.". |
| CB11 | Duas abas aplicam a mesma etiqueta ao mesmo card | Uma aplicação é registrada, sem duplicidade e sem erro. |
| CB12 | Etiqueta excluída enquanto outra aba tenta aplicá-la, editá-la ou excluí-la | Aplicar ou editar recebe "Etiqueta não encontrada." e a lista da janela é recarregada. Excluir de novo é tratado como sucesso: a linha some. |
| CB13 | Card excluído enquanto a janela do modo card está aberta em outra aba | A próxima ação recebe "Card não encontrado.", as janelas do card fecham e o quadro é recarregado (RF04). |
| CB14 | Administrador rebaixado a Membro com a janela do modo gerenciamento aberta | A próxima ação de gerenciamento recebe "Você não tem permissão para esta ação."; a janela fecha e o quadro é recarregado sem o botão "Etiquetas" (RF07). |
| CB15 | Etiquetas criadas, editadas ou excluídas por outro participante enquanto o quadro está aberto | A tela só as reflete após recarregar o quadro ou após uma ação que retorne as etiquetas atuais. Não há atualização em tempo real. |
| CB16 | Etiqueta selecionada no filtro deixa de existir após uma recarga do quadro | Sai da seleção; sem outras selecionadas, o filtro volta para "Todas". |
| CB17 | Edição simultânea da mesma etiqueta em duas abas | Prevalece a última edição salva, desde que não viole RN04. |

### 5.3 Falhas

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CE01 | Falha de comunicação ao criar ou editar | Nome e cor permanecem no formulário, com a mensagem genérica; nada é criado nem alterado. |
| CE02 | Falha ao aplicar ou remover | A caixa volta ao estado anterior e a mensagem genérica aparece na janela; o uso não muda. |
| CE03 | Falha ao excluir | A confirmação permanece aberta, com a mensagem genérica; nada muda. |
| CE04 | Falha no meio da exclusão de uma etiqueta em uso | Nada é alterado: a etiqueta e todas as aplicações continuam existindo. |
| CE05 | Erro inesperado | A mensagem não revela detalhes internos. |

### 5.4 Mensagens ao usuário

A redação pode variar desde que o significado seja preservado e a mesma situação produza sempre a mesma mensagem. Mensagens de sessão seguem o RF01; de quadro, o RF02; de card, o RF04; de permissão, o RF07.

| Situação | Mensagem |
| --- | --- |
| Botão do cabeçalho | "Etiquetas" |
| Título da janela | "Etiquetas do quadro" |
| Texto do modo gerenciamento | "Crie, edite e exclua as etiquetas usadas nos cards deste quadro." |
| Texto do modo card | "Marque as etiquetas aplicadas a este card ou crie uma nova." |
| Formulário | "Nova etiqueta" / "Nome" / "Criar" |
| Fechar a janela | "Concluído" |
| Quadro sem etiquetas | "Nenhuma etiqueta neste quadro." |
| Quadro sem etiquetas, para Membro no modo card | "Nenhuma etiqueta neste quadro. Peça a um administrador para criar etiquetas." |
| Seção da janela do card | "Etiquetas" / "Gerenciar etiquetas" / "Nenhuma etiqueta." |
| Cores | "Vermelho" / "Azul" / "Verde" / "Âmbar" / "Roxo" / "Cinza" |
| Barra de filtro | "Filtrar por etiqueta" / "Todas" |
| Total sem filtro | "{N} cards no quadro" / "1 card no quadro" |
| Total com filtro | "{X} de {N} cards" |
| Card criado e oculto pelo filtro | "Card criado. Ele não aparece por causa do filtro de etiquetas." |
| Nome vazio | "Campo obrigatório." |
| Nome longo | "O nome da etiqueta deve ter no máximo 30 caracteres." |
| Nome repetido | "Já existe uma etiqueta com esse nome neste quadro." |
| Limite | "O quadro pode ter no máximo 50 etiquetas." |
| Cor inválida | "Selecione uma cor válida." |
| Etiqueta inexistente | "Etiqueta não encontrada." |
| Confirmar exclusão | "Excluir a etiqueta "{nome}"?" / "Ela será removida de {N} card(s). Os cards não serão excluídos." / "Nenhum card usa esta etiqueta." |
| Sem permissão | "Você não tem permissão para esta ação." |
| Falha de comunicação ou erro inesperado | "Não foi possível concluir a operação. Tente novamente." |

---

## 6. Fora de escopo

- etiquetas compartilhadas entre quadros ou etiquetas globais da conta;
- cores personalizadas fora da paleta, e etiquetas sem nome (só cor);
- reordenar etiquetas manualmente;
- filtro com todas as etiquetas ao mesmo tempo (regra "e"), filtro por "sem etiquetas" e filtros por responsável, prazo ou texto;
- guardar o filtro entre visitas, compartilhá-lo por link ou aplicá-lo à listagem "Meus quadros";
- aplicar etiquetas a vários cards de uma vez;
- aplicar ou remover etiquetas diretamente pela face do card, sem abrir a janela do card;
- histórico de alterações de etiquetas;
- atualização em tempo real entre abas ou dispositivos;
- ordenação por prazo (RF10) e comentários (RF09).
