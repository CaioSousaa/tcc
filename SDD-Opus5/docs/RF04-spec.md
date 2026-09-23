# RF04 — Gerenciamento de cards

**Requisito:** RF04 — Criação, edição, exclusão e movimentação de cards entre listas de um mesmo quadro.
**História de usuário:** HU04 — Como usuário de um quadro, eu quero criar, editar, excluir e mover cards entre listas, para que eu acompanhe o progresso de cada tarefa.

**Depende de:**
- **RF01:** sessão e sessão expirada;
- **RF02:** acesso ao quadro e "Quadro não encontrado.";
- **RF03:** listas, ordem das listas, quantidade de cards por lista e bloqueio de exclusão de lista com cards.

As regras desses requisitos valem aqui sem repetição.

Telas de referência no protótipo: `prototipo/paginas/quadro.png` (cards nas listas e "Adicionar card") e `prototipo/modais/detalhe-card.png` (janela do card).

---

## 1. Visão geral

Cada lista de um quadro contém cards, e cada card representa uma tarefa. O sistema deve permitir que o usuário com acesso ao quadro:

- veja os cards de cada lista, na ordem definida;
- adicione cards ao final de uma lista informando apenas o título;
- abra um card para ver e editar título e descrição;
- mova um card para outra lista do mesmo quadro, ou para outra posição na mesma lista;
- exclua um card após confirmação.

### Conceitos

| Termo | Definição |
| --- | --- |
| Card | Tarefa pertencente a exatamente uma lista de um quadro. Tem título, descrição opcional e posição na lista. |
| Posição do card | Número de ordem do card na sua lista, contado a partir de 1 de cima para baixo. As posições dos N cards de uma lista são sempre exatamente 1, 2, …, N. |
| Face do card | Representação resumida do card dentro da coluna da lista. |
| Janela do card | Janela aberta ao clicar em um card, onde ele é visto, editado, movido e excluído. |
| Mover | Mudar a lista e/ou a posição de um card, sem alterar sua identidade nem seu conteúdo. |

### Relação com outros requisitos

- **RF03:** a quantidade de cards exibida no topo de cada lista passa a refletir os cards deste requisito. Uma lista com cards continua não podendo ser excluída (RF03, RN11) até o RF05.
- **RF05:** definirá o que acontece com os cards ao excluir uma lista que os contém.
- **RF06, RF07, RF08, RF09 e RF10:** acrescentarão à janela e à face do card, respectivamente, checklist e progresso, responsáveis, etiquetas, comentários e prazo. Esses elementos aparecem no protótipo, mas **não** fazem parte deste requisito. Quando existirem, mover um card os preserva, e excluir um card os exclui.
- **RF07:** até existirem membros e papéis, "usuário com acesso ao quadro" significa o dono do quadro.

---

## 2. Comportamento esperado

### 2.1 Cards nas listas

Dentro de cada coluna, abaixo do cabeçalho da lista, o usuário vê:

- os cards da lista, empilhados da posição 1 (topo) até a última;
- em cada card, a face com o título completo, quebrado em quantas linhas forem necessárias;
- ao final da coluna, a ação "Adicionar card".

Uma lista sem cards mostra apenas "Adicionar card".

A quantidade exibida no topo da lista (RF03) é sempre igual ao número de cards mostrados nela.

A ordem exibida é sempre a ordem salva: recarregar a página ou abrir o quadro em outra aba mostra os mesmos cards nas mesmas listas e posições.

Depois de qualquer operação feita pelo próprio usuário, o quadro reflete o resultado imediatamente, sem recarregar a página.

### 2.2 Adicionar card

Ao acionar "Adicionar card" em uma lista, aparece, no lugar da ação e dentro da própria coluna, um campo "Título do card" já focado, com os botões "Adicionar" e "Cancelar".

- Confirmar com dados válidos, pelo botão "Adicionar" ou pela tecla Enter, cria o card **no final** daquela lista. O campo continua aberto e vazio, pronto para o próximo card.
- Confirmar com título inválido não cria nada; o texto digitado permanece e a mensagem aparece junto ao campo.
- "Cancelar", a tecla Esc ou abrir o campo de adição em outra lista fecham o campo e descartam o texto digitado. Só um campo de adição fica aberto por vez no quadro.

O card criado tem descrição vazia.

### 2.3 Abrir um card

Clicar na face de um card abre a janela do card, contendo:

- no topo, a indicação "CARD · {nome da lista}", com o nome da lista onde o card está salvo;
- o campo "Título", preenchido;
- o campo "Descrição", com o texto salvo ou vazio, e a indicação "Adicione uma descrição mais detalhada…" quando vazio;
- o seletor "Lista", com todas as listas do quadro na ordem do quadro e a lista atual selecionada;
- o seletor "Posição na lista", com a posição atual selecionada;
- os botões "Salvar card" e "Excluir card", além do botão de fechar.

O seletor "Posição na lista" oferece:
- as posições 1 a N quando a lista selecionada é a lista atual do card, onde N é a quantidade de cards dessa lista;
- as posições 1 a M+1 quando outra lista está selecionada, onde M é a quantidade de cards dela.

Ao trocar a lista selecionada, a posição passa automaticamente para o final (M+1) da nova lista. Ao voltar para a lista original, ela volta para a posição atual do card.

### 2.4 Editar e mover

Na janela do card, o usuário pode alterar título, descrição, lista e posição, em qualquer combinação, e salvar tudo de uma vez com "Salvar card".

Ao salvar com dados válidos:

- título e descrição passam a ser os novos;
- se a lista mudou, o card sai da lista de origem, cujos cards abaixo dele sobem uma posição, e entra na lista de destino na posição escolhida, cujos cards a partir dessa posição descem uma posição;
- se só a posição mudou, o card é reposicionado na mesma lista, e os cards entre a posição antiga e a nova se deslocam uma posição para preencher o espaço;
- a janela fecha e o quadro exibe o resultado.

Salvar sem alterações é aceito, fecha a janela e não altera nada.

Ao salvar com título ou descrição inválidos, nada é alterado (nem conteúdo, nem lista, nem posição), a janela permanece aberta e a mensagem aparece junto ao campo correspondente.

Fechar a janela pelo botão de fechar, pela tecla Esc ou clicando fora dela descarta as alterações não salvas, sem pedir confirmação.

Mover um card não altera seu título, sua descrição, sua data de criação nem sua identidade.

### 2.5 Excluir card

Ao acionar "Excluir card" na janela do card, abre-se uma confirmação com:
- o título "Excluir o card "{título}"?", usando o título salvo;
- o texto "Esta ação não pode ser desfeita.";
- os botões "Cancelar" e "Excluir card", este último destacado como ação destrutiva.

Ao confirmar, o card é excluído, as duas janelas fecham, o card desaparece da lista e os cards abaixo dele sobem uma posição. Ao cancelar, só a confirmação fecha e a janela do card continua aberta, com as alterações não salvas preservadas.

Não existe lixeira nem recuperação de card excluído.

### 2.6 Feedback durante as operações

Durante adicionar, salvar ou excluir, o botão acionado indica que a operação está em andamento e impede novo envio. Um duplo clique ou um Enter repetido não cria dois cards nem aplica duas vezes a mesma movimentação ou exclusão.

---

## 3. Critérios de aceite (Given/When/Then)

Salvo indicação contrária, estou autenticado e sou o dono do quadro "Sprint", com as listas:
- "A fazer": cards "C1" (1), "C2" (2) e "C3" (3);
- "Em progresso": card "P1" (1);
- "Concluído": sem cards.

### Exibição

**CA01 — Cards na ordem**
- **Quando** abro o quadro "Sprint"
- **Então** vejo "C1", "C2" e "C3" de cima para baixo em "A fazer", "P1" em "Em progresso", nenhum card em "Concluído", e "Adicionar card" ao final de cada lista.

**CA02 — Quantidade no topo da lista**
- **Quando** abro o quadro "Sprint"
- **Então** o topo de "A fazer" exibe "3", o de "Em progresso" exibe "1" e o de "Concluído" exibe "0".

**CA03 — Título longo na face**
- **Dado** que "C1" tem um título de 200 caracteres
- **Quando** abro o quadro
- **Então** a face de "C1" exibe o título completo, quebrado em linhas, sem cortar texto e sem aumentar a largura da coluna.

**CA04 — Ordem persistida**
- **Dado** que movi e reordenei cards
- **Quando** recarrego a página ou abro o quadro em outra aba
- **Então** os cards aparecem nas mesmas listas e posições salvas.

### Adicionar card

**CA05 — Abrir o campo de adição**
- **Quando** aciono "Adicionar card" em "Concluído"
- **Então** aparece o campo "Título do card" focado, com "Adicionar" e "Cancelar", dentro da coluna "Concluído".

**CA06 — Adicionar ao final**
- **Dado** que o campo de adição de "A fazer" está aberto
- **Quando** digito "C4" e aciono "Adicionar"
- **Então** "A fazer" passa a exibir "C1", "C2", "C3" e "C4", nessa ordem, e o topo da lista exibe "4".

**CA07 — Adicionar com Enter e em sequência**
- **Dado** que o campo de adição de "Concluído" está aberto
- **Quando** digito "D1" e pressiono Enter, depois digito "D2" e pressiono Enter
- **Então** "Concluído" exibe "D1" e "D2", nessa ordem, e o campo continua aberto e vazio.

**CA08 — Título obrigatório**
- **Dado** que o campo de adição está aberto
- **Quando** confirmo com o título vazio ou só com espaços
- **Então** nenhum card é criado e vejo "Campo obrigatório." junto ao campo.

**CA09 — Título longo demais**
- **Dado** que o campo de adição está aberto
- **Quando** confirmo com um título de 201 caracteres
- **Então** nenhum card é criado, o texto permanece no campo e vejo "O título do card deve ter no máximo 200 caracteres.".

**CA10 — Normalização do título**
- **Quando** adiciono um card com o título "  Revisar   PR  "
- **Então** o card é criado com o título "Revisar   PR", sem os espaços das extremidades e com os espaços internos preservados.

**CA11 — Quebras de linha no título**
- **Quando** colo no campo o texto "Linha 1", uma quebra de linha e "Linha 2", e confirmo
- **Então** o card é criado com o título "Linha 1 Linha 2".

**CA12 — Cancelar adição**
- **Dado** que o campo de adição de "A fazer" está aberto com o texto "Rascunho"
- **Quando** aciono "Cancelar" ou pressiono Esc
- **Então** o campo fecha, nenhum card é criado e, ao reabrir, o campo está vazio.

**CA13 — Apenas um campo de adição aberto**
- **Dado** que o campo de adição de "A fazer" está aberto com o texto "Rascunho"
- **Quando** aciono "Adicionar card" em "Concluído"
- **Então** o campo de "A fazer" fecha sem criar card e o campo de "Concluído" abre vazio.

**CA14 — Duplo envio na adição**
- **Dado** que o campo de adição contém "C4"
- **Quando** aciono "Adicionar" duas vezes seguidas, ou pressiono Enter duas vezes seguidas
- **Então** exatamente um card "C4" é criado.

**CA15 — Títulos repetidos**
- **Quando** adiciono outro card chamado "C1" em "A fazer"
- **Então** o card é criado, e a lista passa a ter dois cards distintos com esse título.

**CA16 — Contagem na listagem de quadros**
- **Dado** que adicionei um card ao quadro "Sprint"
- **Quando** volto para "Meus quadros"
- **Então** o cartão de "Sprint" informa "5 cards".

### Abrir e editar

**CA17 — Janela do card**
- **Dado** que "C2" tem a descrição "Detalhes"
- **Quando** clico em "C2"
- **Então** a janela abre com "CARD · A fazer", o título "C2", a descrição "Detalhes", a lista "A fazer" selecionada, a posição 2 selecionada entre as opções 1, 2 e 3, e os botões "Salvar card" e "Excluir card".

**CA18 — Descrição vazia**
- **Quando** abro "C1", que não tem descrição
- **Então** o campo "Descrição" está vazio e exibe a indicação "Adicione uma descrição mais detalhada…".

**CA19 — Editar título e descrição**
- **Dado** que a janela de "C1" está aberta
- **Quando** altero o título para "Tarefa 1", a descrição para "Passo a passo" e salvo
- **Então** a janela fecha, a face exibe "Tarefa 1" na posição 1 de "A fazer" e, ao reabrir, a descrição é "Passo a passo".

**CA20 — Descrição com várias linhas**
- **Dado** que a janela de "C1" está aberta
- **Quando** informo a descrição "Linha 1", quebra de linha, "Linha 2" e salvo
- **Então**, ao reabrir, a descrição exibe as duas linhas separadas.

**CA21 — Apagar a descrição**
- **Dado** que "C2" tem a descrição "Detalhes"
- **Quando** apago toda a descrição e salvo
- **Então**, ao reabrir, a descrição está vazia.

**CA22 — Título inválido na edição não altera nada**
- **Dado** que a janela de "C1" está aberta
- **Quando** apago o título, escolho a lista "Concluído" e salvo
- **Então** vejo "Campo obrigatório." junto ao título, a janela continua aberta e, ao fechá-la, "C1" continua em "A fazer" na posição 1 com o título original.

**CA23 — Descrição longa demais**
- **Dado** que a janela de "C1" está aberta
- **Quando** informo uma descrição de 5.001 caracteres e salvo
- **Então** nada é alterado e vejo "A descrição deve ter no máximo 5000 caracteres." junto à descrição.

**CA24 — Fechar descarta alterações**
- **Dado** que a janela de "C1" está aberta e alterei título, descrição, lista e posição
- **Quando** fecho pelo botão de fechar, pressiono Esc ou clico fora da janela
- **Então** a janela fecha sem confirmação e "C1" continua com o título, a descrição, a lista e a posição originais.

**CA25 — Salvar sem alterações**
- **Dado** que a janela de "C2" está aberta
- **Quando** salvo sem alterar nada
- **Então** a janela fecha sem erro e o quadro continua igual.

### Mover

**CA26 — Mover para outra lista, no final**
- **Dado** que a janela de "C2" está aberta
- **Quando** seleciono a lista "Em progresso", mantenho a posição sugerida e salvo
- **Então** "A fazer" passa a exibir "C1" e "C3" (com "C3" na posição 2), "Em progresso" exibe "P1" e "C2", e os topos exibem "2" e "2".

**CA27 — Posição sugerida ao trocar de lista**
- **Dado** que a janela de "C2" está aberta
- **Quando** seleciono "Em progresso"
- **Então** o seletor de posição passa a oferecer 1 e 2, com 2 selecionado. **Quando** volto a selecionar "A fazer", o seletor oferece 1, 2 e 3, com 2 selecionado.

**CA28 — Mover para outra lista, em posição escolhida**
- **Dado** que a janela de "C3" está aberta
- **Quando** seleciono "Em progresso", escolho a posição 1 e salvo
- **Então** "Em progresso" exibe "C3" e "P1", nessa ordem, e "A fazer" exibe "C1" e "C2".

**CA29 — Mover para uma lista vazia**
- **Dado** que a janela de "C1" está aberta
- **Quando** seleciono "Concluído", que oferece apenas a posição 1, e salvo
- **Então** "Concluído" exibe "C1", e "A fazer" exibe "C2" e "C3", nas posições 1 e 2.

**CA30 — Reordenar na mesma lista, para baixo**
- **Dado** que a janela de "C1" está aberta
- **Quando** escolho a posição 3 e salvo
- **Então** "A fazer" exibe "C2", "C3" e "C1", nessa ordem.

**CA31 — Reordenar na mesma lista, para cima**
- **Dado** que a janela de "C3" está aberta
- **Quando** escolho a posição 1 e salvo
- **Então** "A fazer" exibe "C3", "C1" e "C2", nessa ordem.

**CA32 — Editar e mover de uma vez**
- **Dado** que a janela de "C1" está aberta
- **Quando** altero o título para "Iniciado", seleciono "Em progresso", escolho a posição 1 e salvo
- **Então** "Em progresso" exibe "Iniciado" e "P1", e "A fazer" exibe "C2" e "C3".

**CA33 — Mover preserva o conteúdo**
- **Dado** que "C2" tem a descrição "Detalhes"
- **Quando** movo "C2" para "Concluído"
- **Então**, ao abrir "C2" em "Concluído", a janela exibe "CARD · Concluído", o mesmo título e a descrição "Detalhes".

**CA34 — Mover o último card libera a exclusão da lista**
- **Dado** que "Em progresso" contém apenas "P1"
- **Quando** movo "P1" para "Concluído" e depois aciono excluir em "Em progresso"
- **Então** a confirmação de exclusão de lista do RF03 é aberta, em vez da mensagem de lista com cards.

### Excluir

**CA35 — Confirmação de exclusão**
- **Dado** que a janela de "C2" está aberta
- **Quando** aciono "Excluir card"
- **Então** vejo a confirmação com o título "Excluir o card "C2"?", o texto "Esta ação não pode ser desfeita." e os botões "Cancelar" e "Excluir card".

**CA36 — Excluir card**
- **Dado** que a confirmação de exclusão de "C2" está aberta
- **Quando** confirmo
- **Então** as janelas fecham, "A fazer" exibe "C1" e "C3" (com "C3" na posição 2) e o topo da lista exibe "2".

**CA37 — Cancelar exclusão**
- **Dado** que alterei o título de "C2" na janela e abri a confirmação de exclusão
- **Quando** cancelo a confirmação
- **Então** "C2" continua existindo, a janela do card continua aberta e o título alterado, ainda não salvo, permanece no campo.

**CA38 — Duplo envio na exclusão**
- **Dado** que a confirmação de exclusão de "C2" está aberta
- **Quando** aciono "Excluir card" duas vezes seguidas
- **Então** "C2" é excluído uma única vez, nenhum outro card é afetado e nenhuma mensagem de erro é exibida.

### Proteção

**CA39 — Quadro de outra conta**
- **Dado** que a conta B possui o quadro "Beta", com a lista "X" e o card "K"
- **Quando**, autenticado como A, tento criar cards em "X", ou editar, mover ou excluir "K", por qualquer meio
- **Então** a operação é recusada com "Quadro não encontrado." e nada em "Beta" muda.

**CA40 — Card de outro quadro**
- **Dado** que possuo os quadros "Sprint" e "Outro", e "Outro" tem o card "Y"
- **Quando** tento editar, mover ou excluir "Y" como se ele pertencesse a "Sprint"
- **Então** a operação é recusada com "Card não encontrado." e nada muda nos dois quadros.

**CA41 — Lista de destino de outro quadro**
- **Dado** que possuo os quadros "Sprint" e "Outro", e "Outro" tem a lista "Z"
- **Quando** tento criar um card em "Z", ou mover "C1" para "Z", como se "Z" pertencesse a "Sprint"
- **Então** a operação é recusada com "Lista não encontrada." e nada muda nos dois quadros.

**CA42 — Sessão expirada**
- **Dado** que o campo de adição, a janela do card ou a confirmação de exclusão está aberta e minha sessão expirou
- **Quando** confirmo a operação
- **Então** a operação não é executada e o sistema segue o comportamento de sessão expirada do RF01.

---

## 4. Regras de negócio e restrições

**RN01 — Pertencimento.** Todo card pertence, em qualquer momento, a exatamente uma lista, e essa lista pertence ao mesmo quadro durante toda a vida do card. Um card pode mudar de lista, mas nunca de quadro.

**RN02 — Acesso.** Só quem tem acesso ao quadro pode ver, criar, editar, mover e excluir seus cards. Para quem não tem acesso, o quadro, suas listas e seus cards são indistinguíveis de inexistentes.

**RN03 — Título.**
- Obrigatório.
- Quebras de linha são substituídas por um espaço.
- Espaços nas extremidades são removidos; espaços internos são preservados.
- Depois disso, deve ter entre 1 e 200 caracteres, contados pela mesma regra adotada para nomes no RF02 e no RF03.
- Qualquer outro caractere é aceito e exibido como texto literal.

**RN04 — Descrição.**
- Opcional.
- Espaços e quebras de linha nas extremidades são removidos; quebras de linha internas são preservadas.
- Depois disso, deve ter no máximo 5.000 caracteres.
- Descrição vazia ou só com espaços equivale a "sem descrição".
- É exibida como texto literal, nunca interpretado como formatação ou marcação.

**RN05 — Títulos não são únicos.** Vários cards podem ter o mesmo título, na mesma lista ou em listas diferentes.

**RN06 — Posições contíguas por lista.** Em qualquer momento, as posições dos N cards de cada lista são exatamente 1, 2, …, N. Nenhuma operação pode deixar lacuna, repetição ou posição fora desse intervalo, inclusive com operações simultâneas no mesmo quadro.

**RN07 — Criação.** Um card novo entra sempre na posição N+1 da lista escolhida, e nenhum outro card muda de posição.

**RN08 — Movimentação na mesma lista.** Mover um card da posição A para a posição B da mesma lista (1 ≤ B ≤ N) segue a mesma regra de deslocamento de listas do RF03 (RN07 do RF03).

**RN09 — Movimentação entre listas.** Mover um card da posição A da lista L1 para a posição B da lista L2 (1 ≤ B ≤ M+1, onde M é a quantidade de cards de L2 antes da operação):
- os cards de L1 nas posições A+1 a N recuam uma posição;
- os cards de L2 nas posições B a M avançam uma posição;
- o card passa a ocupar a posição B de L2.

**RN10 — Posição fora do intervalo.**
- Se a posição solicitada for maior que o máximo válido no momento do processamento (N na mesma lista, M+1 em outra), o card vai para a última posição válida.
- Posição menor que 1 ou não inteira é recusada sem alterar nada.
- Na criação, nenhuma posição é aceita do usuário: vale RN07.

**RN11 — Remoção.** Excluir o card da posição P de uma lista faz os cards das posições P+1 a N recuarem uma posição.

**RN12 — Atomicidade.** Cada criação, edição, movimentação ou exclusão, com todos os deslocamentos envolvidos nas listas de origem e de destino, acontece por completo ou não acontece. Salvar a janela do card aplica título, descrição, lista e posição juntos: ou tudo é salvo, ou nada é.

**RN13 — Campos editáveis.** Só título, descrição, lista e posição podem ser alterados. Quadro, data de criação e identidade do card são imutáveis.

**RN14 — Exclusão exige confirmação.** Nenhum card é excluído sem confirmação explícita.

**RN15 — Exclusão idempotente para o usuário.** Pedir a exclusão de um card que não existe mais, por exemplo por ter sido excluído em outra aba, não gera erro visível: o card some da tela.

**RN16 — Sem limites de quantidade.** Não há quantidade máxima de cards por lista nem por quadro neste requisito.

**RN17 — Coerência das contagens.**
- A quantidade de cards no topo de cada lista (RF03) é igual à quantidade de cards salvos nela.
- A quantidade de cards no cartão do quadro em "Meus quadros" (RF02, RN10) reflete os cards salvos na próxima vez que a listagem for carregada.
- Uma lista passa a poder ser excluída (RF03, RN11) assim que deixa de ter cards.

---

## 5. Casos de borda e condições de erro

### 5.1 Entrada de dados

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB01 | Título com 1 caractere | Aceito. |
| CB02 | Título com exatamente 200 caracteres após normalização | Aceito. |
| CB03 | Título com 201 caracteres ou mais após normalização | Recusado com a mensagem de limite; o texto não é cortado. |
| CB04 | Título só com quebras de linha e espaços | Tratado como vazio: "Campo obrigatório.". |
| CB05 | Título ou descrição com acentos, emojis ou símbolos | Aceitos e exibidos como digitados. |
| CB06 | Título ou descrição com marcação HTML, Markdown ou trecho de script | Salvos e exibidos como texto literal, nunca interpretados. |
| CB07 | Descrição com exatamente 5.000 caracteres após remover espaços das extremidades | Aceita. |
| CB08 | Descrição só com espaços e quebras de linha | Salva como sem descrição. |
| CB09 | Posição 0, negativa, fracionária ou não numérica, enviada por manipulação | Operação recusada; nada é alterado. |
| CB10 | Posição enviada na criação, por manipulação | Ignorada; o card entra no final (RN07). |
| CB11 | Tentativa de mudar o card de quadro, ou sua data de criação, por manipulação | Recusada ou ignorada; nada fora de RN13 é alterado. |
| CB12 | Movimentação sem informar posição, por manipulação | Mesma lista: posição atual mantida. Outra lista: final da lista de destino. |

### 5.2 Concorrência e estado desatualizado

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB13 | Duas abas adicionam cards na mesma lista ao mesmo tempo | Ambos são criados no final, com posições contíguas e sem repetição (RN06). |
| CB14 | Duas abas movem cards para a mesma lista ao mesmo tempo | Ambas as operações são aplicadas; as posições das listas envolvidas permanecem contíguas. |
| CB15 | O card foi excluído em outra aba e o usuário salva a janela desse card | Mensagem "Card não encontrado.", a janela fecha e o card some da tela. |
| CB16 | O card foi excluído em outra aba e o usuário confirma a exclusão dele | Tratado como sucesso (RN15); as janelas fecham e o card some da tela. |
| CB17 | A lista de destino foi excluída em outra aba e o usuário salva a movimentação | Mensagem "Lista não encontrada." na janela; nada é alterado; a janela permanece aberta, e o seletor de lista passa a refletir as listas atuais do quadro. |
| CB18 | O card foi movido ou editado em outra aba e o usuário salva a janela desatualizada | A última gravação prevalece para título e descrição. A lista e a posição escolhidas são aplicadas sobre o estado salvo atual, com RN10. Nenhum erro é exibido. |
| CB19 | A lista onde o usuário quer adicionar um card foi excluída em outra aba | Mensagem "Lista não encontrada."; o campo de adição fecha e a lista some da tela. |
| CB20 | O quadro foi excluído em outra aba e o usuário executa qualquer operação de card | Mensagem "Quadro não encontrado." com caminho para voltar a "Meus quadros" (RF02). |
| CB21 | Após qualquer operação, o estado salvo difere do que a tela mostrava por causa de outra aba | A tela passa a exibir o estado salvo das listas afetadas pela operação. |
| CB22 | O usuário tenta excluir, em outra aba, uma lista que acabou de receber um card | A exclusão da lista é recusada pela regra do RF03 (RN11), mesmo que a tela daquela aba mostrasse a lista vazia. |

### 5.3 Falhas

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CE01 | Falha de comunicação ao adicionar | O texto permanece no campo com a mensagem genérica; nenhum card aparece. |
| CE02 | Falha de comunicação ao salvar a janela do card | A janela permanece aberta com as alterações e a mensagem genérica; o quadro não muda. |
| CE03 | Falha de comunicação ao excluir | A confirmação permanece aberta com a mensagem genérica; o card continua no quadro. |
| CE04 | Falha no meio de uma movimentação entre listas | Nada é alterado em nenhuma das listas (RN12) e a mensagem genérica é exibida. |
| CE05 | Erro inesperado em qualquer operação | A mensagem não revela detalhes internos. |

### 5.4 Mensagens ao usuário

A redação pode variar desde que o significado seja preservado e a mesma situação produza sempre a mesma mensagem. Mensagens de sessão seguem o RF01; de quadro, o RF02; de lista, o RF03.

| Situação | Mensagem |
| --- | --- |
| Título vazio | "Campo obrigatório." |
| Título acima de 200 caracteres | "O título do card deve ter no máximo 200 caracteres." |
| Descrição acima de 5.000 caracteres | "A descrição deve ter no máximo 5000 caracteres." |
| Posição inválida | "Selecione uma posição válida." |
| Card inexistente ou de outro quadro | "Card não encontrado." |
| Lista inexistente ou de outro quadro | "Lista não encontrada." |
| Indicação de descrição vazia | "Adicione uma descrição mais detalhada…" |
| Título da confirmação de exclusão | "Excluir o card "{título}"?" |
| Corpo da confirmação de exclusão | "Esta ação não pode ser desfeita." |
| Falha de comunicação ou erro inesperado | "Não foi possível concluir a operação. Tente novamente." |

---

## 6. Fora de escopo

- arrastar e soltar cards entre listas ou dentro de uma lista;
- mover ou copiar cards para outro quadro, duplicar, arquivar ou restaurar cards;
- endereço próprio para o card: a janela do card não tem URL, e recarregar a página a fecha;
- confirmação ao fechar a janela com alterações não salvas;
- checklist e progresso (RF06), responsáveis (RF07), etiquetas e filtro (RF08), comentários (RF09) e prazo e ordenação por prazo (RF10), inclusive os elementos correspondentes da janela e da face do card no protótipo;
- o total "N cards no quadro" exibido no cabeçalho do protótipo (RF08);
- o que acontece com os cards ao excluir uma lista que os contém (RF05);
- formatação rica na descrição (negrito, links clicáveis, Markdown) e anexos;
- restrições por papel de membro (RF07);
- atualização em tempo real entre abas ou dispositivos.
