# RF02 — Gerenciamento de quadros do usuário autenticado

**Requisito:** RF02 — Criação, listagem, edição e exclusão de quadros (boards) pertencentes ao usuário autenticado.
**História de usuário:** HU02 — Como usuário autenticado, eu quero criar, listar, editar e excluir meus quadros, para que eu organize diferentes projetos separadamente.

**Depende de:** RF01 (sessão, identificação do usuário, proteção de acesso). Todo comportamento de sessão expirada, visitante e isolamento por conta definido no RF01 vale aqui sem repetição.

Telas de referência no protótipo: `prototipo/paginas/meus-quadros.png` (listagem), `prototipo/modais/novo-quadro.png` (criação), `prototipo/paginas/quadro.png` (cabeçalho do quadro aberto).

---

## 1. Visão geral

O usuário autenticado mantém uma coleção de quadros. Cada quadro representa um projeto e tem um nome e uma cor. O sistema deve permitir que ele:

- veja todos os seus quadros na página "Meus quadros", que é a área autenticada inicial definida no RF01;
- crie um quadro novo, escolhendo nome, cor e se o quadro já nasce com listas padrão;
- abra um quadro para trabalhar nele;
- altere nome e cor de um quadro;
- exclua um quadro, com todo o seu conteúdo, após confirmação explícita.

### Conceitos

| Termo | Definição |
| --- | --- |
| Quadro | Espaço de trabalho de um projeto. Tem nome, cor, dono e data de criação. Contém listas (RF03), que contêm cards (RF04). |
| Dono do quadro | Usuário que criou o quadro. Neste requisito, é o único usuário com acesso a ele. |
| Conteúdo do quadro | Tudo o que pertence ao quadro: listas, cards e demais itens associados a eles, definidos nos requisitos seguintes. |
| Listas padrão | Três listas vazias criadas junto com o quadro, nesta ordem: "A fazer", "Em progresso", "Concluído". |
| Paleta de cores | Conjunto fechado de 5 cores disponíveis para quadros, apresentadas nesta ordem: azul-marinho, azul, verde, âmbar, roxo. |

### Relação com requisitos futuros

- **RF07** introduz membros e papéis. Até lá, "quadros do usuário" significa "quadros de que ele é dono", e o dono tem todas as permissões sobre o quadro. Quando o RF07 existir, o dono passa a ser o administrador inicial do quadro, e as regras de acesso desta especificação serão ampliadas por ele, não substituídas.
- **RF03 e RF04** definem listas e cards. Esta especificação só trata deles para: criar as listas padrão, exibir contagens e excluir o conteúdo junto com o quadro.
- **RF10** define prazos. A contagem de cards atrasados que o protótipo mostra na listagem pertence ao RF10 e não faz parte deste requisito.

---

## 2. Comportamento esperado

### 2.1 Listagem ("Meus quadros")

Ao acessar a área autenticada inicial, o usuário vê:

- o título "Meus quadros" e, abaixo dele, o total de quadros no formato "N quadros" ("1 quadro" no singular);
- um botão "Novo quadro";
- um cartão para cada quadro seu, contendo: faixa superior na cor do quadro, nome do quadro, quantidade de listas e quantidade de cards (no formato "5 listas · 11 cards", com singular quando a quantidade for 1), e as ações de editar e excluir;
- ao final da grade, um cartão "Criar quadro", que tem o mesmo efeito do botão "Novo quadro".

Os quadros aparecem do mais recentemente criado para o mais antigo. Editar um quadro não altera sua posição.

Clicar no cartão de um quadro, fora das ações de editar e excluir, abre o quadro.

Quando o usuário não possui nenhum quadro, a grade mostra apenas o cartão "Criar quadro", acompanhado de uma mensagem convidando a criar o primeiro quadro, e o total aparece como "0 quadros".

A listagem reflete imediatamente, sem recarregar a página, qualquer criação, edição ou exclusão feita pelo próprio usuário naquela página.

### 2.2 Criação

Ao acionar "Novo quadro" ou "Criar quadro", o sistema abre a janela "Novo quadro" com:

- campo "Nome do quadro", vazio;
- seleção de cor com as 5 cores da paleta, com a primeira (azul-marinho) já selecionada;
- opção "Criar com listas padrão (A fazer, Em progresso, Concluído)", marcada por padrão;
- botões "Cancelar" e "Criar quadro".

Ao confirmar com dados válidos, o sistema cria o quadro, fecha a janela e leva o usuário diretamente para o quadro recém-criado. Se a opção de listas padrão estava marcada, o quadro já contém as três listas padrão, vazias e nessa ordem; caso contrário, não contém nenhuma lista.

Ao confirmar com nome inválido, o quadro não é criado, a janela permanece aberta com os dados preenchidos e a mensagem aparece junto ao campo de nome.

"Cancelar", o botão de fechar da janela, a tecla Esc e o clique fora da janela descartam a criação sem criar nada.

### 2.3 Visualização de um quadro

Ao abrir um quadro, o usuário vê a página do quadro com um cabeçalho contendo:

- um link "Quadros", que volta para a listagem;
- o nome do quadro;
- a ação de editar o quadro.

O corpo da página exibe as listas do quadro, cujo comportamento é definido no RF03. Neste requisito basta que as listas existentes apareçam na ordem em que foram criadas, com seus nomes, e que um quadro sem listas mostre uma área vazia sem erro.

Cada quadro tem um endereço próprio, que pode ser recarregado ou aberto diretamente enquanto a sessão for válida.

Os demais elementos do cabeçalho do protótipo (etiquetas, membros, filtros e ordenação) pertencem a outros requisitos.

### 2.4 Edição

A edição pode ser iniciada pela ação de editar no cartão da listagem ou no cabeçalho do quadro. Ela abre uma janela "Editar quadro" com:

- campo "Nome do quadro", preenchido com o nome atual;
- seleção de cor, com a cor atual selecionada;
- botões "Cancelar" e "Salvar".

A opção de listas padrão não aparece na edição.

Ao salvar com dados válidos, o sistema atualiza o quadro, fecha a janela e exibe o nome e a cor novos no lugar de onde a edição foi iniciada, sem sair dele. Salvar sem ter alterado nada é aceito e não produz erro.

Ao salvar com nome inválido, nada é alterado, a janela permanece aberta e a mensagem aparece junto ao campo.

Cancelar, fechar, Esc ou clique fora descartam as alterações; o quadro continua com os valores anteriores.

Editar nome e cor não altera o conteúdo do quadro.

### 2.5 Exclusão

A exclusão é iniciada pela ação de excluir no cartão da listagem. Ela abre uma janela de confirmação que:

- identifica o quadro pelo nome;
- informa que o quadro e todo o seu conteúdo (listas e cards) serão excluídos permanentemente e que a ação não pode ser desfeita;
- informa a quantidade de listas e de cards que serão excluídos;
- oferece "Cancelar" e "Excluir quadro", este último destacado como ação destrutiva.

Ao confirmar, o sistema exclui o quadro e todo o seu conteúdo, fecha a janela, remove o cartão da listagem e atualiza o total. Ao cancelar, nada é alterado.

Não existe lixeira, arquivamento ou recuperação de quadro excluído.

### 2.6 Feedback durante as operações

Durante criação, edição ou exclusão, o botão de confirmação indica que a operação está em andamento e impede novo envio, de modo que um duplo clique não crie dois quadros nem dispare duas edições ou exclusões. Enquanto a listagem ou um quadro está sendo carregado, o sistema exibe um estado de carregamento em vez de uma lista vazia.

---

## 3. Critérios de aceite (Given/When/Then)

Em todos os critérios, "estou autenticado" significa sessão válida conforme o RF01.

### Listagem

**CA01 — Listagem dos próprios quadros**
- **Dado** que estou autenticado e possuo os quadros "Alfa" e "Beta"
- **Quando** acesso "Meus quadros"
- **Então** vejo exatamente dois cartões, "Alfa" e "Beta", e o total "2 quadros".

**CA02 — Ordem da listagem**
- **Dado** que criei "Alfa" e depois "Beta"
- **Quando** acesso "Meus quadros"
- **Então** "Beta" aparece antes de "Alfa".

**CA03 — Edição não altera a ordem**
- **Dado** que criei "Alfa" e depois "Beta"
- **Quando** renomeio "Alfa" para "Alfa 2" e volto à listagem
- **Então** "Beta" continua aparecendo antes de "Alfa 2".

**CA04 — Conteúdo do cartão**
- **Dado** que possuo o quadro "Alfa", na cor verde, com 3 listas e 1 card
- **Quando** acesso "Meus quadros"
- **Então** o cartão de "Alfa" exibe a faixa verde, o nome "Alfa", o texto "3 listas · 1 card" e as ações de editar e excluir.

**CA05 — Nenhum quadro**
- **Dado** que estou autenticado e não possuo quadros
- **Quando** acesso "Meus quadros"
- **Então** vejo o total "0 quadros", a mensagem convidando a criar o primeiro quadro e o cartão "Criar quadro", e nenhum erro é exibido.

**CA06 — Isolamento entre contas**
- **Dado** que a conta A possui o quadro "Alfa" e a conta B possui o quadro "Beta"
- **Quando** estou autenticado como A e acesso "Meus quadros"
- **Então** vejo "Alfa" e não vejo "Beta".

### Criação

**CA07 — Janela de criação com valores padrão**
- **Dado** que estou em "Meus quadros"
- **Quando** aciono "Novo quadro"
- **Então** a janela "Novo quadro" abre com o nome vazio, a cor azul-marinho selecionada e a opção de listas padrão marcada.

**CA08 — Cartão "Criar quadro"**
- **Dado** que estou em "Meus quadros"
- **Quando** aciono o cartão "Criar quadro"
- **Então** a mesma janela do CA07 é aberta.

**CA09 — Criação com listas padrão**
- **Dado** que a janela "Novo quadro" está aberta
- **Quando** informo o nome "Sprint 13", escolho a cor roxa, mantenho a opção de listas padrão marcada e confirmo
- **Então** o quadro "Sprint 13" é criado na cor roxa, sou levado para ele e vejo as listas "A fazer", "Em progresso" e "Concluído", vazias e nessa ordem.

**CA10 — Criação sem listas padrão**
- **Dado** que a janela "Novo quadro" está aberta
- **Quando** informo o nome "Sprint 13", desmarco a opção de listas padrão e confirmo
- **Então** o quadro é criado sem nenhuma lista e sou levado para ele.

**CA11 — Quadro criado aparece na listagem**
- **Dado** que criei o quadro "Sprint 13"
- **Quando** volto para "Meus quadros"
- **Então** "Sprint 13" é o primeiro cartão e o total aumentou em 1.

**CA12 — Nome obrigatório**
- **Dado** que a janela "Novo quadro" está aberta
- **Quando** confirmo com o nome vazio ou só com espaços
- **Então** nenhum quadro é criado, a janela continua aberta e vejo "Campo obrigatório." junto ao nome.

**CA13 — Nome longo demais**
- **Dado** que a janela "Novo quadro" está aberta
- **Quando** confirmo com um nome de 61 caracteres
- **Então** nenhum quadro é criado e vejo "O nome do quadro deve ter no máximo 60 caracteres." junto ao nome.

**CA14 — Espaços nas extremidades do nome**
- **Dado** que a janela "Novo quadro" está aberta
- **Quando** confirmo com o nome "  Sprint 13  "
- **Então** o quadro é criado com o nome "Sprint 13".

**CA15 — Nomes repetidos são permitidos**
- **Dado** que já possuo um quadro chamado "Sprint 13"
- **Quando** crio outro quadro chamado "Sprint 13"
- **Então** o segundo quadro é criado e passo a ter dois quadros distintos com esse nome.

**CA16 — Cancelar criação**
- **Dado** que a janela "Novo quadro" está aberta e preenchida
- **Quando** aciono "Cancelar", o botão de fechar, a tecla Esc ou clico fora da janela
- **Então** a janela fecha, nenhum quadro é criado e, ao reabri-la, ela volta aos valores padrão do CA07.

**CA17 — Duplo envio na criação**
- **Dado** que a janela "Novo quadro" está preenchida com dados válidos
- **Quando** aciono "Criar quadro" duas vezes seguidas
- **Então** exatamente um quadro é criado.

### Visualização

**CA18 — Abrir um quadro**
- **Dado** que possuo o quadro "Alfa", com as listas "X" e "Y" criadas nessa ordem
- **Quando** clico no cartão de "Alfa"
- **Então** sou levado para a página do quadro, vejo "Alfa" no cabeçalho e as listas "X" e "Y" nessa ordem.

**CA19 — Voltar para a listagem**
- **Dado** que estou na página de um quadro
- **Quando** aciono o link "Quadros"
- **Então** sou levado para "Meus quadros".

**CA20 — Acesso direto e recarregamento**
- **Dado** que estou autenticado e possuo o quadro "Alfa"
- **Quando** abro o endereço do quadro diretamente ou recarrego a página do quadro
- **Então** vejo o quadro "Alfa", sem passar pela listagem.

**CA21 — Quadro de outra conta**
- **Dado** que a conta B possui o quadro "Beta"
- **Quando** estou autenticado como A e abro o endereço de "Beta"
- **Então** não vejo nenhum dado de "Beta" e recebo a mensagem "Quadro não encontrado.", com um caminho para voltar a "Meus quadros".

**CA22 — Quadro inexistente**
- **Dado** que estou autenticado
- **Quando** abro o endereço de um quadro que não existe, ou com um identificador malformado
- **Então** recebo exatamente o mesmo resultado do CA21.

### Edição

**CA23 — Janela de edição preenchida**
- **Dado** que possuo o quadro "Alfa", na cor verde
- **Quando** aciono editar no cartão de "Alfa"
- **Então** a janela "Editar quadro" abre com o nome "Alfa", a cor verde selecionada e sem a opção de listas padrão.

**CA24 — Editar pela listagem**
- **Dado** que a janela "Editar quadro" de "Alfa" está aberta na listagem
- **Quando** altero o nome para "Ômega", escolho a cor âmbar e salvo
- **Então** a janela fecha, continuo na listagem e o cartão passa a exibir "Ômega" com a faixa âmbar, na mesma posição.

**CA25 — Editar pelo cabeçalho do quadro**
- **Dado** que estou na página do quadro "Alfa"
- **Quando** aciono editar no cabeçalho, altero o nome para "Ômega" e salvo
- **Então** continuo na página do quadro, o cabeçalho passa a exibir "Ômega" e, ao voltar para a listagem, o cartão também exibe "Ômega".

**CA26 — Edição preserva o conteúdo**
- **Dado** que o quadro "Alfa" tem 3 listas e 5 cards
- **Quando** altero seu nome e sua cor
- **Então** o quadro continua com as mesmas 3 listas e os mesmos 5 cards.

**CA27 — Edição com nome inválido**
- **Dado** que a janela "Editar quadro" de "Alfa" está aberta
- **Quando** apago o nome e salvo
- **Então** o quadro continua se chamando "Alfa", a janela continua aberta e vejo "Campo obrigatório." junto ao nome.

**CA28 — Cancelar edição**
- **Dado** que a janela "Editar quadro" de "Alfa" está aberta e alterei nome e cor
- **Quando** cancelo, fecho, pressiono Esc ou clico fora da janela
- **Então** o quadro continua com o nome "Alfa" e a cor original.

**CA29 — Salvar sem alterações**
- **Dado** que a janela "Editar quadro" de "Alfa" está aberta
- **Quando** salvo sem alterar nada
- **Então** a janela fecha sem erro e o quadro continua igual.

### Exclusão

**CA30 — Confirmação de exclusão**
- **Dado** que possuo o quadro "Alfa", com 3 listas e 5 cards
- **Quando** aciono excluir no cartão de "Alfa"
- **Então** vejo a janela de confirmação com o nome "Alfa", a informação de que 3 listas e 5 cards serão excluídos permanentemente e de que a ação não pode ser desfeita, e os botões "Cancelar" e "Excluir quadro".

**CA31 — Excluir quadro**
- **Dado** que a janela de confirmação de "Alfa" está aberta
- **Quando** confirmo a exclusão
- **Então** a janela fecha, o cartão de "Alfa" desaparece da listagem, o total diminui em 1 e o endereço de "Alfa" passa a produzir o resultado do CA22.

**CA32 — Exclusão remove todo o conteúdo**
- **Dado** que o quadro "Alfa" tinha listas e cards
- **Quando** o quadro é excluído
- **Então** nenhuma lista ou card de "Alfa" continua existindo nem é acessível por qualquer caminho, e as contagens dos outros quadros não mudam.

**CA33 — Cancelar exclusão**
- **Dado** que a janela de confirmação de "Alfa" está aberta
- **Quando** cancelo, fecho, pressiono Esc ou clico fora da janela
- **Então** "Alfa" continua existindo, com todo o seu conteúdo.

**CA34 — Duplo envio na exclusão**
- **Dado** que a janela de confirmação de "Alfa" está aberta
- **Quando** aciono "Excluir quadro" duas vezes seguidas
- **Então** "Alfa" é excluído uma única vez e nenhuma mensagem de erro é exibida.

### Proteção

**CA35 — Operações sobre quadro de outra conta**
- **Dado** que a conta B possui o quadro "Beta"
- **Quando**, autenticado como A, tento editar ou excluir "Beta" por qualquer meio
- **Então** a operação é recusada como se "Beta" não existisse, e "Beta" permanece inalterado.

**CA36 — Sessão expirada durante uma operação**
- **Dado** que a janela de criação, edição ou exclusão está aberta e minha sessão expirou
- **Quando** confirmo a operação
- **Então** a operação não é executada e o sistema segue o comportamento de sessão expirada do RF01.

---

## 4. Regras de negócio e restrições

**RN01 — Posse.** Todo quadro tem exatamente um dono, que é o usuário que o criou. O dono é definido pela sessão no momento da criação e nunca por um valor informado pelo cliente. O dono de um quadro não muda.

**RN02 — Acesso.** Neste requisito, apenas o dono pode ver, abrir, editar e excluir um quadro. O RF07 ampliará o acesso a membros convidados.

**RN03 — Inexistência aparente.** Para quem não tem acesso, um quadro de outra conta é indistinguível de um quadro inexistente: mesma mensagem, mesmo comportamento e nenhum dado do quadro revelado, nem sequer o nome.

**RN04 — Nome.** Obrigatório. Espaços nas extremidades são removidos antes de validar e de salvar; espaços internos são preservados como digitados. Após a remoção, deve ter entre 1 e 60 caracteres. Qualquer caractere é aceito, inclusive acentos, emojis e símbolos, e é exibido como texto literal.

**RN05 — Nomes não são únicos.** Um usuário pode ter vários quadros com o mesmo nome. Quadros são distinguidos por identidade, não por nome.

**RN06 — Cor.** Obrigatória e restrita à paleta de 5 cores. Não se aceita cor fora da paleta. Na criação, a cor padrão é azul-marinho.

**RN07 — Listas padrão.** Quando a opção está marcada na criação, o quadro nasce com exatamente três listas vazias: "A fazer", "Em progresso" e "Concluído", nessa ordem. A criação do quadro e das listas padrão é atômica: ou o quadro é criado com as três listas, ou nada é criado. As listas padrão são listas comuns e, depois de criadas, seguem as regras do RF03.

**RN08 — Campos editáveis.** Só nome e cor podem ser alterados. Dono e data de criação são imutáveis.

**RN09 — Ordem da listagem.** Do mais recente para o mais antigo pela data de criação. Edições não alteram a ordem.

**RN10 — Contagens.** A quantidade de listas e de cards exibida em cada cartão reflete o estado atual do quadro no momento em que a listagem é carregada. A contagem de cards soma os cards de todas as listas do quadro.

**RN11 — Exclusão em cascata.** Excluir um quadro exclui permanentemente, na mesma operação, todo o seu conteúdo. Ou tudo é excluído, ou nada é. Não pode restar lista ou card órfão de um quadro excluído.

**RN12 — Exclusão exige confirmação.** Nenhum quadro é excluído sem que o usuário confirme explicitamente na janela de confirmação.

**RN13 — Sem limite de quantidade.** Não há quantidade máxima de quadros por usuário neste requisito.

**RN14 — Exclusão idempotente para o usuário.** Pedir a exclusão de um quadro que o próprio usuário acabou de excluir não gera erro visível; o resultado final é o quadro excluído.

---

## 5. Casos de borda e condições de erro

### 5.1 Entrada de dados

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB01 | Nome com exatamente 1 caractere | Aceito. |
| CB02 | Nome com exatamente 60 caracteres após remover espaços das extremidades | Aceito. |
| CB03 | Nome com 61 caracteres ou mais após remover espaços das extremidades | Recusado com a mensagem de limite. |
| CB04 | Nome com espaços nas extremidades que, sem eles, fica com até 60 caracteres | Aceito, salvo sem os espaços das extremidades. |
| CB05 | Nome com acentos, emojis ou símbolos | Aceito e exibido exatamente como digitado. |
| CB06 | Nome contendo marcação HTML ou trecho de script | Salvo e exibido como texto literal, nunca interpretado. |
| CB07 | Nome com vários espaços internos seguidos | Preservado como digitado. |
| CB08 | Cor fora da paleta ou ausente, enviada por manipulação da requisição | Operação recusada; nada é criado ou alterado. |
| CB09 | Opção de listas padrão ausente na requisição de criação | Tratada como marcada. |
| CB10 | Tentativa de alterar dono ou data de criação por manipulação da requisição | Esses valores são ignorados; nada além de nome e cor é alterado. |

### 5.2 Concorrência e estado desatualizado

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB11 | O quadro foi excluído em outra aba e o usuário tenta abri-lo, editá-lo ou excluí-lo na aba desatualizada | Abrir ou editar: mensagem "Quadro não encontrado." e o cartão some da listagem na aba atual. Excluir: tratado como sucesso (RN14) e o cartão some. |
| CB12 | O quadro foi editado em outra aba e o usuário salva uma edição na aba desatualizada | A última edição salva prevalece; nenhum erro é exibido. |
| CB13 | O usuário cria dois quadros em abas diferentes ao mesmo tempo | Ambos são criados; ao recarregar a listagem, os dois aparecem. |
| CB14 | O usuário está na página de um quadro que é excluído em outra aba e executa uma ação sobre ele | A ação falha com "Quadro não encontrado." e o usuário recebe um caminho para voltar a "Meus quadros". |

### 5.3 Falhas

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CE01 | Falha de comunicação ao carregar a listagem | Mensagem genérica de erro com opção de tentar novamente; nenhum quadro é exibido como se a lista estivesse vazia. |
| CE02 | Falha de comunicação ao criar ou editar | A janela permanece aberta com os dados preenchidos, a mensagem genérica aparece nela e nada é considerado salvo. |
| CE03 | Falha de comunicação ao excluir | A janela de confirmação permanece aberta com a mensagem genérica; o cartão continua na listagem. |
| CE04 | Falha ao criar as listas padrão depois de criar o quadro | Nenhum quadro é criado (RN07) e a mensagem genérica é exibida. |
| CE05 | Falha no meio da exclusão do conteúdo | Nada é excluído (RN11) e a mensagem genérica é exibida. |
| CE06 | Erro inesperado em qualquer operação | A mensagem não revela detalhes internos do sistema. |

### 5.4 Mensagens ao usuário

A redação pode variar desde que o significado seja preservado e a mesma situação produza sempre a mesma mensagem. Mensagens de sessão seguem o RF01.

| Situação | Mensagem |
| --- | --- |
| Nome vazio | "Campo obrigatório." |
| Nome acima de 60 caracteres | "O nome do quadro deve ter no máximo 60 caracteres." |
| Cor inválida | "Selecione uma cor válida." |
| Quadro inexistente ou de outra conta | "Quadro não encontrado." |
| Nenhum quadro na listagem | "Você ainda não tem quadros. Crie o primeiro para começar." |
| Confirmação de exclusão | "O quadro "{nome}" e todo o seu conteúdo ({N} listas e {M} cards) serão excluídos permanentemente. Esta ação não pode ser desfeita." |
| Falha de comunicação ou erro inesperado | "Não foi possível concluir a operação. Tente novamente." |

---

## 6. Fora de escopo

- membros, convites, papéis e o selo de papel ("ADMIN"/"MEMBRO") e avatares exibidos nos cartões (RF07);
- o subtítulo "você é administrador em N" da listagem (RF07);
- contagem de cards atrasados nos cartões (RF10);
- criação, edição, reordenação e exclusão de listas e cards (RF03, RF04), além da criação das listas padrão;
- etiquetas, filtros e ordenação no cabeçalho do quadro (RF08, RF10);
- busca de quadros e cards no cabeçalho da aplicação;
- exclusão a partir da página do quadro (a exclusão é feita pela listagem);
- arquivamento, lixeira, restauração, duplicação, favoritos, reordenação manual e transferência de posse de quadros;
- cores personalizadas fora da paleta e imagens de fundo;
- atualização em tempo real entre abas ou dispositivos.
