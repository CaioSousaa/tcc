# RF09 — Comentários nos cards e histórico

**Requisito:** RF09 — Registro de comentários em um card pelos participantes do quadro, com exibição do histórico de comentários em ordem cronológica, identificando autor e momento de cada um.
**História de usuário:** HU09 — Como participante de um quadro, eu quero comentar nos cards e ver o histórico dos comentários, para que a discussão sobre cada tarefa fique registrada junto dela.

**Depende de:**
- **RF01:** contas, nome da conta, sessão e sessão expirada;
- **RF02:** acesso ao quadro e "Quadro não encontrado.";
- **RF04:** cards, janela do card, face do card e "Card não encontrado.";
- **RF05:** exclusão de lista com cards (mover ou excluir em cascata);
- **RF07:** participação, papéis, matriz de permissões (RN05) e avatar.

As regras desses requisitos valem aqui sem repetição.

Telas de referência no protótipo:
- `prototipo/modais/detalhe-card.png`: seção "Comentários" da janela do card;
- `prototipo/paginas/quadro.png`: ícone de comentários com a quantidade na face do card.

Os elementos de prazo que aparecem nessas telas pertencem ao RF10.

---

## 1. Visão geral

Cada card tem um **histórico de comentários**: mensagens de texto escritas pelos participantes do quadro, exibidas em ordem cronológica. Cada comentário mostra:
- quem escreveu;
- quando escreveu;
- se foi editado depois.

Na janela do card, qualquer participante pode:
- ler todos os comentários do card;
- escrever um comentário novo;
- editar e excluir os **próprios** comentários.

Administradores podem, além disso, **excluir** comentários de outras pessoas. Ninguém edita comentário de outra pessoa.

A face do card mostra quantos comentários ele tem.

### Conceitos

| Termo | Definição |
| --- | --- |
| Comentário | Texto escrito por uma conta em um card. Pertence a exatamente um card e tem exatamente um autor. |
| Autor | Conta que escreveu o comentário. Nunca muda. |
| Momento do comentário | Data e hora em que o comentário foi publicado. Nunca muda, nem quando o comentário é editado. |
| Comentário editado | Comentário cujo texto foi alterado pelo autor depois da publicação. |
| Histórico | Todos os comentários existentes de um card, do mais antigo para o mais recente. |
| Quantidade de comentários | Número de comentários existentes no card. |

### Salvamento imediato

Publicar, editar e excluir comentário são **salvos no momento em que são feitos**, independentemente do "Salvar card" do RF04. Por isso:
- fechar a janela do card sem salvar descarta só as alterações pendentes de título, descrição, lista e posição, nunca os comentários publicados, editados ou excluídos;
- um comentário **não enviado** (texto digitado sem acionar "Comentar") é descartado ao fechar a janela do card, sem confirmação;
- "Salvar card" não envia nem altera comentários.

### Relação com outros requisitos

- **RF04:** mover o card entre listas ou posições preserva o histórico. Excluir o card exclui todos os seus comentários.
- **RF05:** mover os cards de uma lista excluída preserva os comentários; excluir em cascata exclui os comentários junto com os cards.
- **RF07:**
  - "Comentar" é ação de qualquer participante (RN05);
  - quem deixa de participar do quadro não perde os comentários que escreveu: eles continuam no histórico, com o nome do autor (RN10 do RF07 preserva o conteúdo criado pela pessoa);
  - enquanto não participar, essa pessoa não vê, edita nem exclui nada no quadro.
- **RF08:** etiquetas e filtro não alteram nem dependem dos comentários.

---

## 2. Comportamento esperado

### 2.1 Seção "Comentários" na janela do card

Na janela do card, na coluna principal, **abaixo da seção "Checklist"** (RF06), aparece a seção **"Comentários"**. Ela é carregada junto com o card, e o seu estado de carregamento e de erro é o da janela do card (RF04).

A seção exibe, de cima para baixo:
1. o histórico, do comentário **mais antigo** (no topo) para o **mais recente** (embaixo);
2. o campo de novo comentário.

Sem comentários, o histórico exibe "Nenhum comentário ainda.".

**Cada comentário exibe:**
- o avatar do autor (iniciais, como no RF07);
- o nome do autor;
- o momento do comentário, no formato de 2.2;
- a indicação "(editado)" após o momento, se o comentário foi editado;
- o texto, com as quebras de linha preservadas;
- as ações disponíveis para a conta, conforme 2.5 e 2.6: "Editar" e/ou "Excluir".

### 2.2 Formato do momento

O momento é exibido no fuso horário do dispositivo do usuário, com horas e minutos em 24 horas:

| Quando foi publicado | Formato | Exemplo |
| --- | --- | --- |
| No dia de hoje | "hoje, HH:MM" | "hoje, 09:10" |
| No dia anterior | "ontem, HH:MM" | "ontem, 16:42" |
| Em outro dia do ano atual | "D mmm, HH:MM" | "3 set, 14:05" |
| Em outro ano | "D mmm AAAA, HH:MM" | "28 dez 2025, 08:00" |

Os meses são abreviados em minúsculas: jan, fev, mar, abr, mai, jun, jul, ago, set, out, nov, dez. "Hoje" e "ontem" referem-se ao dia do calendário, e não às últimas 24 horas.

Além do texto curto, a data e a hora completas ("17/09/2026 às 09:10") ficam disponíveis ao passar o ponteiro sobre o momento e para tecnologias assistivas.

O texto do momento é calculado ao exibir a seção. Uma janela aberta de um dia para o outro pode continuar mostrando "hoje" até que a seção seja exibida novamente.

### 2.3 Comentar

O campo de novo comentário fica abaixo do histórico e exibe:
- o avatar da conta atual;
- a área de texto com o texto de exemplo "Escreva um comentário";
- o botão "Comentar".

A área de texto aceita várias linhas: Enter insere uma quebra de linha, e **Ctrl+Enter** (ou **Cmd+Enter**) equivale a acionar "Comentar".

**Se o texto for válido:**
- o comentário é publicado com o autor sendo a conta atual e o momento sendo o do processamento;
- aparece **no final** do histórico e fica visível na área da seção;
- o campo é limpo e mantém o foco;
- a quantidade de comentários na face do card é atualizada.

**A publicação é recusada, com a mensagem junto ao campo e o texto mantido, quando:**
- o texto está vazio ou só com espaços e quebras de linha ("Campo obrigatório.");
- o texto passa de 2.000 caracteres ("O comentário deve ter no máximo 2000 caracteres.");
- o card já tem 500 comentários ("O card pode ter no máximo 500 comentários.").

Enquanto a publicação está em andamento, o botão "Comentar" fica desabilitado, e um novo envio não é feito.

### 2.4 Normalização do texto

Antes de validar e salvar:
- quebras de linha no estilo Windows (CR LF) e CR isolado viram uma quebra de linha simples;
- espaços e quebras de linha no **início e no fim** do texto são removidos;
- espaços e quebras de linha **internos** são mantidos como digitados.

### 2.5 Editar comentário

A ação "Editar" aparece **somente nos comentários da própria conta**, para qualquer papel.

"Editar" transforma o texto do comentário em uma área de texto preenchida com o texto atual, com os botões "Salvar" e "Cancelar". Apenas um comentário fica em edição por vez, e a edição não interfere no campo de novo comentário.

Ao salvar:
- o texto é validado como na publicação (2.3 e 2.4);
- o comentário mantém autor, momento e posição no histórico, e passa a exibir "(editado)";
- salvar sem alterar o texto é aceito, não produz erro e **não** marca o comentário como editado.

"Cancelar" e **Esc** descartam a edição sem fechar a janela do card. Ctrl+Enter (ou Cmd+Enter) equivale a "Salvar".

### 2.6 Excluir comentário

A ação "Excluir" aparece:
- nos comentários da própria conta, para qualquer papel;
- em **todos** os comentários, para Administradores.

"Excluir" abre a confirmação **"Excluir comentário?"** com o texto "Esta ação não pode ser desfeita." e os botões "Cancelar" e "Excluir". Ao confirmar:
- o comentário deixa de existir e some do histórico;
- a quantidade de comentários na face do card é atualizada.

Não há indicação de que um comentário foi excluído.

### 2.7 Quantidade na face do card

A face do card exibe, no rodapé, um ícone de comentário seguido da quantidade de comentários, quando a quantidade é maior que zero. Sem comentários, nada é exibido.

O nome acessível do indicador é "{N} comentários" ("1 comentário" no singular).

A face reflete cada publicação e exclusão feita na mesma tela, sem recarregar a página.

### 2.8 Autor que deixou o quadro

Comentários de uma conta que deixou de participar do quadro (RF07) continuam no histórico, com o avatar e o nome da conta.
- Nenhuma conta vê "Editar" nesses comentários.
- Administradores continuam vendo "Excluir".
- Se a conta voltar a participar, volta a poder editar e excluir os próprios comentários.

---

## 3. Critérios de aceite (Given/When/Then)

Salvo indicação contrária, considere que agora é **17/09/2026, 10:00**, no fuso do dispositivo. Existe o quadro "Sprint" com os participantes:
- Caio (**Administrador**);
- Marina (**Administrador**);
- João (**Membro**).

O card "Refatorar filtros" tem, nesta ordem:
- comentário de Marina publicado em 16/09/2026 às 16:42: "Sugiro manter o filtro por etiqueta na URL.";
- comentário de João publicado em 17/09/2026 às 09:10: "Concordo. Já ajustei o back.".

### Exibição

**CA01 — Histórico em ordem**
- **Quando** Caio abre "Refatorar filtros"
- **Então** a seção "Comentários", abaixo da "Checklist", exibe primeiro o comentário de Marina, com "ontem, 16:42", e depois o de João, com "hoje, 09:10", cada um com avatar, nome e texto.

**CA02 — Card sem comentários**
- **Dado** que o card "Escrever docs" não tem comentários
- **Quando** Caio o abre
- **Então** a seção exibe "Nenhum comentário ainda." e o campo de novo comentário, e a face de "Escrever docs" não exibe o indicador de comentários.

**CA03 — Quantidade na face**
- **Quando** João abre "Sprint"
- **Então** a face de "Refatorar filtros" exibe o ícone de comentário com "2", com nome acessível "2 comentários".

**CA04 — Formatos de momento**
- **Dado** que existem comentários publicados em 17/09/2026 00:05, em 16/09/2026 23:59, em 03/09/2026 14:05 e em 28/12/2025 08:00
- **Quando** Caio abre o card
- **Então** os momentos exibidos são "hoje, 00:05", "ontem, 23:59", "3 set, 14:05" e "28 dez 2025, 08:00", e cada um oferece a data e hora completas.

**CA05 — Quebras de linha preservadas**
- **Dado** que um comentário tem o texto "Passos:\n1. abrir\n2. salvar"
- **Quando** alguém abre o card
- **Então** o comentário é exibido em três linhas.

### Comentar

**CA06 — Publicar**
- **Quando** João digita "  Pronto para revisão  " e aciona "Comentar"
- **Então** "Pronto para revisão" aparece no final do histórico, com o nome de João e "hoje, 10:00"; o campo fica vazio e com foco; e a face de "Refatorar filtros" passa a exibir "3", sem salvar o card.

**CA07 — Atalho de teclado e quebra de linha**
- **Quando** Marina digita "Linha 1", pressiona Enter, digita "Linha 2" e pressiona Ctrl+Enter
- **Então** é publicado um único comentário com duas linhas.

**CA08 — Texto vazio**
- **Quando** Caio aciona "Comentar" com o campo vazio, ou só com espaços e quebras de linha
- **Então** nenhum comentário é publicado e ele vê "Campo obrigatório.".

**CA09 — Texto longo**
- **Quando** Caio tenta publicar um texto com 2.001 caracteres
- **Então** nenhum comentário é publicado, ele vê "O comentário deve ter no máximo 2000 caracteres." e o texto continua no campo; com 2.000 caracteres, o comentário é publicado.

**CA10 — Membro comenta**
- **Quando** João publica um comentário
- **Então** a publicação é aceita (RF07 RN05).

**CA11 — Texto digitado não enviado**
- **Dado** que Caio digitou "Rascunho" no campo e não acionou "Comentar"
- **Quando** fecha a janela do card e a abre de novo
- **Então** o campo está vazio e nenhum comentário "Rascunho" existe.

**CA12 — Independência do "Salvar card"**
- **Dado** que Caio alterou o título do card sem salvar e publicou "Ok"
- **Quando** fecha a janela do card
- **Então** o título volta ao original e o comentário "Ok" continua no histórico.

**CA13 — Envio repetido**
- **Quando** Caio aciona "Comentar" várias vezes rapidamente com o mesmo texto
- **Então** apenas um comentário é publicado.

### Editar

**CA14 — Editar o próprio comentário**
- **Quando** João aciona "Editar" no próprio comentário, altera o texto para "Concordo. Back ajustado." e salva
- **Então** o comentário continua na mesma posição, com "hoje, 09:10 (editado)" e o novo texto.

**CA15 — Salvar sem alteração**
- **Quando** João aciona "Editar" no próprio comentário e salva sem mudar o texto
- **Então** o comentário não passa a exibir "(editado)".

**CA16 — Cancelar edição**
- **Quando** João altera o texto em edição e aciona "Cancelar" ou pressiona Esc
- **Então** o comentário volta ao texto original, e a janela do card continua aberta.

**CA17 — Editar comentário de outra pessoa**
- **Quando** Caio, Administrador, abre o card
- **Então** não vê "Editar" nos comentários de Marina e João; **e quando** tenta editar o comentário de João por qualquer meio, recebe "Você não tem permissão para esta ação." e nada muda.

**CA18 — Edição com texto inválido**
- **Quando** João salva a edição com texto vazio ou com mais de 2.000 caracteres
- **Então** a edição é recusada com a mensagem correspondente, e o comentário mantém o texto anterior.

### Excluir

**CA19 — Excluir o próprio comentário**
- **Quando** João aciona "Excluir" no próprio comentário
- **Então** vê "Excluir comentário?" e "Esta ação não pode ser desfeita."; **e quando** confirma, o comentário some do histórico, e a face passa a exibir "1".

**CA20 — Cancelar exclusão**
- **Quando** João aciona "Excluir" no próprio comentário e cancela
- **Então** o comentário continua no histórico.

**CA21 — Administrador exclui comentário de outra pessoa**
- **Quando** Caio aciona "Excluir" no comentário de João e confirma
- **Então** o comentário some do histórico.

**CA22 — Membro não exclui comentário de outra pessoa**
- **Quando** João abre o card
- **Então** não vê "Excluir" no comentário de Marina; **e quando** tenta excluí-lo por qualquer meio, recebe "Você não tem permissão para esta ação." e nada muda.

**CA23 — Último comentário excluído**
- **Dado** que o card tem apenas um comentário
- **Quando** o autor o exclui
- **Então** o histórico exibe "Nenhum comentário ainda." e a face deixa de exibir o indicador.

### Card movido, card excluído e autor removido

**CA24 — Mover card e lista excluída movendo cards**
- **Quando** Caio move "Refatorar filtros" para outra lista (RF04), ou exclui a lista do card movendo os cards (RF05)
- **Então** o histórico do card continua com os mesmos comentários, autores, momentos e ordem.

**CA25 — Excluir card**
- **Quando** Caio exclui "Refatorar filtros" (RF04), ou exclui a lista em cascata (RF05)
- **Então** os comentários do card deixam de existir.

**CA26 — Autor removido do quadro**
- **Dado** que Caio removeu João do quadro (RF07)
- **Quando** Marina abre "Refatorar filtros"
- **Então** o comentário de João continua no histórico, com o nome de João, sem "Editar" e com "Excluir" para Marina.

### Acesso, concorrência e sessão

**CA27 — Não participante**
- **Dado** que Bruno não participa de "Sprint"
- **Quando** tenta ler, publicar, editar ou excluir comentários de "Refatorar filtros" por qualquer meio
- **Então** recebe "Quadro não encontrado." e nada muda.

**CA28 — Comentário de outro card**
- **Quando** alguém tenta, por qualquer meio, editar ou excluir um comentário de outro card informando "Refatorar filtros"
- **Então** recebe "Comentário não encontrado." e nada muda.

**CA29 — Comentário excluído em outra aba**
- **Dado** que João está com o card aberto e Caio excluiu o comentário de João em outra aba
- **Quando** João tenta salvar uma edição desse comentário
- **Então** vê "Comentário não encontrado.", e o histórico é atualizado sem o comentário.

**CA30 — Comentários de outras pessoas com a janela aberta**
- **Dado** que Caio está com o card aberto e Marina publicou um comentário em outra aba
- **Quando** Caio publica um comentário
- **Então** o histórico passa a exibir os dois comentários novos, na ordem em que foram publicados.

**CA31 — Card excluído com a janela aberta**
- **Dado** que João está com o card aberto e Caio excluiu o card em outra aba
- **Quando** João tenta publicar um comentário
- **Então** vê "Card não encontrado.", a janela do card fecha e o quadro é recarregado (RF04).

**CA32 — Limite de comentários**
- **Dado** que o card tem 500 comentários
- **Quando** Marina tenta publicar outro
- **Então** nenhum comentário é publicado e ela vê "O card pode ter no máximo 500 comentários.".

**CA33 — Sessão expirada**
- **Dado** que a sessão de João expirou com a janela do card aberta e um texto digitado
- **Quando** ele aciona "Comentar", salva uma edição ou confirma uma exclusão
- **Então** nada é alterado, e o sistema segue o comportamento de sessão expirada do RF01.

---

## 4. Regras de negócio e restrições

**RN01 — Pertencimento.** Todo comentário pertence a exatamente um card e aparece somente no histórico desse card.

**RN02 — Autor e momento.**
- O autor é sempre a conta da sessão que publicou, e o momento é o do processamento da publicação.
- Autor e momento nunca mudam, e não podem ser informados nem alterados por quem envia.

**RN03 — Texto.**
- Normalizado conforme 2.4.
- Depois da normalização, tem de 1 a 2.000 caracteres. Emoji e letras acentuadas contam como um caractere cada, e quebra de linha conta como um caractere.
- O texto é sempre exibido como texto literal: marcação, links e formatação não são interpretados.

**RN04 — Ordem.** O histórico é ordenado pelo momento de publicação, do mais antigo para o mais recente. Comentários publicados no mesmo instante mantêm uma ordem estável entre si, que não muda entre exibições. Editar não altera a ordem.

**RN05 — Permissões.**

| Ação | Administrador | Membro |
| --- | --- | --- |
| Ler os comentários | sim | sim |
| Publicar comentário | sim | sim |
| Editar comentário | só os próprios | só os próprios |
| Excluir comentário | próprios e de qualquer pessoa | só os próprios |

- A verificação usa o papel e a participação **no momento do processamento** (RF07 RN06).
- Ação não permitida → "Você não tem permissão para esta ação.".
- Para quem não participa do quadro → "Quadro não encontrado." (RF07 RN02).

**RN06 — Edição.**
- Uma edição salva só altera o texto.
- O comentário passa a ser "editado" somente quando o texto normalizado salvo é **diferente** do anterior.
- Uma vez editado, continua editado, mesmo que o texto volte ao original.

**RN07 — Exclusão.** Excluir remove o comentário definitivamente. Não há lixeira, desfazer nem marca de "comentário excluído".

**RN08 — Limite.** Um card tem no máximo **500** comentários existentes. Comentários excluídos não contam.

**RN09 — Ciclo de vida.**
- Mover o card, ou mover os cards de uma lista excluída, preserva os comentários.
- Excluir o card, a lista em cascata ou o quadro exclui os comentários.
- Remover um participante ou a sua saída do quadro não altera os comentários que ele escreveu.

**RN10 — Quantidade.** A quantidade na face é sempre o número de comentários existentes do card na última atualização da tela.

**RN11 — Sem efeito no card.** Publicar, editar e excluir comentários não alteram título, descrição, lista, posição, checklist, responsáveis nem etiquetas do card.

---

## 5. Casos de borda e condições de erro

### 5.1 Entrada de dados e manipulação

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB01 | Texto com CR LF, espaços ou quebras de linha nas extremidades | Normalizado conforme 2.4. |
| CB02 | Texto com 2.000 caracteres, incluindo emoji e quebras de linha | Aceito. |
| CB03 | Texto com marcação HTML, links ou sintaxe de formatação | Aceito e exibido literalmente, sem links clicáveis nem formatação. |
| CB04 | Texto muito longo sem espaços | Exibido com quebra dentro da área da seção, sem rolagem horizontal. |
| CB05 | Autor, momento, card ou marca de editado enviados por manipulação | Ignorados; valem a sessão, o momento do processamento e o card do endereço. |
| CB06 | Identificador de comentário malformado ou inexistente | "Comentário não encontrado."; nada muda. |
| CB07 | Identificador de card malformado, inexistente ou de outro quadro | "Card não encontrado."; nada muda. |
| CB08 | Campo de texto ausente ou que não é texto, por manipulação | "Campo obrigatório."; nada muda. |

### 5.2 Concorrência e estado desatualizado

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB09 | Outras pessoas publicam, editam ou excluem comentários enquanto a janela está aberta | Não há atualização em tempo real. Após qualquer ação de comentário da conta, o histórico passa a exibir todos os comentários salvos do card. |
| CB10 | Duas edições simultâneas do mesmo comentário pelo autor, em abas diferentes | Prevalece a última edição salva. |
| CB11 | Excluir um comentário que já foi excluído | Tratado como sucesso: a confirmação fecha e o histórico é atualizado sem o comentário. |
| CB12 | Editar um comentário que foi excluído | "Comentário não encontrado."; a edição fecha e o histórico é atualizado (CA29). |
| CB13 | Duas publicações simultâneas com o card em 499 comentários | Uma é publicada; a outra recebe "O card pode ter no máximo 500 comentários.". |
| CB14 | Administrador rebaixado a Membro com a janela aberta tenta excluir comentário de outra pessoa | "Você não tem permissão para esta ação."; nada muda, e o quadro é recarregado, passando a ocultar a ação (RF07). |
| CB15 | Conta removida do quadro com a janela do card aberta tenta publicar, editar ou excluir | "Quadro não encontrado." (RF07, 2.10). |
| CB16 | Card movido para outra lista em outra aba enquanto a janela está aberta | Publicar, editar e excluir continuam funcionando, porque o comentário pertence ao card. |

### 5.3 Falhas

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CE01 | Falha de comunicação ao publicar | O texto permanece no campo, com a mensagem genérica; nenhum comentário aparece. |
| CE02 | Falha ao salvar edição | A edição permanece aberta com o texto digitado e a mensagem genérica; o comentário não muda. |
| CE03 | Falha ao excluir | A confirmação permanece aberta, com a mensagem genérica; o comentário continua. |
| CE04 | Erro inesperado | A mensagem não revela detalhes internos. |

### 5.4 Mensagens ao usuário

A redação pode variar desde que o significado seja preservado e a mesma situação produza sempre a mesma mensagem. Mensagens de sessão seguem o RF01; de quadro, o RF02; de card, o RF04; de permissão, o RF07.

| Situação | Mensagem |
| --- | --- |
| Título da seção | "Comentários" |
| Histórico vazio | "Nenhum comentário ainda." |
| Texto de exemplo do campo | "Escreva um comentário" |
| Botões | "Comentar" / "Editar" / "Excluir" / "Salvar" / "Cancelar" |
| Comentário editado | "(editado)" |
| Momento | "hoje, HH:MM" / "ontem, HH:MM" / "D mmm, HH:MM" / "D mmm AAAA, HH:MM" |
| Data e hora completas | "DD/MM/AAAA às HH:MM" |
| Indicador na face | "{N} comentários" / "1 comentário" |
| Confirmar exclusão | "Excluir comentário?" / "Esta ação não pode ser desfeita." |
| Texto vazio | "Campo obrigatório." |
| Texto longo | "O comentário deve ter no máximo 2000 caracteres." |
| Limite do card | "O card pode ter no máximo 500 comentários." |
| Comentário inexistente | "Comentário não encontrado." |
| Sem permissão | "Você não tem permissão para esta ação." |
| Falha de comunicação ou erro inesperado | "Não foi possível concluir a operação. Tente novamente." |

---

## 6. Fora de escopo

- menções a pessoas (@nome), notificações e envio de e-mails;
- respostas encadeadas, reações e fixar comentários;
- formatação de texto (negrito, listas, markdown), links clicáveis e anexos ou imagens;
- histórico de versões de um comentário editado (só a marca "(editado)" é exibida);
- registro automático de atividades do card (quem moveu, quem alterou etc.) no histórico;
- busca e filtro de comentários;
- edição de comentário de outra pessoa, inclusive por Administradores;
- paginação ou carregamento parcial do histórico;
- atualização em tempo real entre abas ou dispositivos;
- prazo e ordenação por prazo (RF10).
