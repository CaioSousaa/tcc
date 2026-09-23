# RF10 — Prazos nos cards e cards atrasados

**Requisito:** RF10 — Definição de prazo (data de vencimento) nos cards, com identificação visual dos cards atrasados e dos que vencem em breve, contagem de cards atrasados por quadro e ordenação dos cards por prazo.
**História de usuário:** HU10 — Como participante de um quadro, eu quero definir prazos nos cards e identificar quais estão atrasados, para que eu priorize o que precisa ser feito primeiro.

**Depende de:**
- **RF01:** sessão e sessão expirada;
- **RF02:** "Meus quadros", cartão do quadro e "Quadro não encontrado.";
- **RF04:** cards, janela do card, face do card, "Salvar card" e "Card não encontrado.";
- **RF05:** exclusão de lista com cards (mover ou excluir em cascata);
- **RF07:** participação, papéis e matriz de permissões (RN05);
- **RF08:** barra do quadro, filtro por etiqueta e contagens com filtro.

As regras desses requisitos valem aqui sem repetição.

Telas de referência no protótipo:
- `prototipo/paginas/quadro.png`: indicadores de prazo na face dos cards ("Vence 3 set", "Atrasado há 2 dias") e botão "Ordenar por prazo";
- `prototipo/modais/detalhe-card.png`: campo "Prazo" e indicador na janela do card;
- `prototipo/paginas/meus-quadros.png`: contagem "· 2 atrasados" no cartão do quadro.

---

## 1. Visão geral

Cada card pode ter um **prazo**: uma data, sem horário. O prazo é definido e removido na janela do card.

Com base no prazo e na **data de hoje**, o sistema classifica cada card em uma **situação de prazo** e a exibe:
- na face do card;
- na janela do card.

A classificação permite ao usuário identificar, sem abrir os cards:
- quais estão **atrasados**;
- quais **vencem em breve**.

Além disso:
- o cartão de cada quadro em "Meus quadros" mostra quantos cards do quadro estão atrasados;
- a tela do quadro permite **ordenar por prazo** os cards de cada lista, apenas na exibição.

### Conceitos

| Termo | Definição |
| --- | --- |
| Prazo | Data de vencimento de um card, composta de dia, mês e ano, sem horário. Um card tem no máximo um prazo. |
| Hoje | Data do calendário no dispositivo do usuário, no momento em que a tela é exibida. |
| Dias até o prazo | Diferença, em dias do calendário, entre o prazo e hoje. É 0 quando o prazo é hoje, 1 quando é amanhã, e negativa quando o prazo já passou. |
| Situação de prazo | Uma de quatro situações, definidas em RN03: **sem prazo**, **no prazo**, **vence em breve** e **atrasado**. |
| Card atrasado | Card cujo prazo é anterior a hoje. Um card com prazo hoje ainda **não** está atrasado. |

### O prazo faz parte do card

O prazo é editado junto com título, descrição, lista e posição, e é salvo por **"Salvar card"** (RF04). Por isso:
- fechar a janela do card sem salvar descarta a alteração de prazo;
- uma alteração de prazo inválida impede o salvamento do card inteiro, como acontece com o título.

Isso difere de checklist, responsáveis, etiquetas e comentários, que são salvos imediatamente.

### A situação depende do dia

A situação não é gravada: ela é calculada a partir do prazo e de **hoje** sempre que é exibida. Consequências:
- um card "no prazo" passa a "vence em breve" e depois a "atrasado" com o passar dos dias, sem que ninguém o altere;
- participantes com datas diferentes no dispositivo, por exemplo em fusos horários diferentes, podem ver a mesma situação mudar em momentos diferentes;
- o prazo em si, a data, é o mesmo para todos.

### Relação com outros requisitos

- **RF02:** o cartão do quadro em "Meus quadros" ganha a contagem de cards atrasados (2.6).
- **RF04:**
  - a janela do card ganha o campo "Prazo";
  - "Salvar card" passa a salvar também o prazo;
  - mover o card preserva o prazo, e excluir o card exclui o prazo.
- **RF05:** mover os cards de uma lista excluída preserva os prazos; excluir em cascata os exclui junto.
- **RF06:** a situação de prazo não depende do progresso da checklist. Um card com checklist completa e prazo passado continua atrasado.
- **RF07:** definir e remover prazo é permitido a qualquer participante (RN05, "definir prazo").
- **RF08:** a ordenação por prazo convive com o filtro por etiqueta. As contagens e o total da barra do quadro seguem o RF08; a ordenação não os altera.

---

## 2. Comportamento esperado

### 2.1 Campo "Prazo" na janela do card

Na coluna lateral da janela do card, abaixo de "Etiquetas" (RF08), aparece o campo **"Prazo"**. Ele exibe:
- a data do prazo salvo, no formato DD/MM/AAAA, ou vazio quando o card não tem prazo;
- o **indicador de situação** (2.3) logo abaixo do campo, calculado a partir da data que está no campo, e atualizado enquanto o usuário a altera;
- a ação **"Remover prazo"**, somente quando o campo tem uma data.

O usuário pode:
- **definir ou alterar o prazo:** escolher uma data no campo, digitando-a ou pelo seletor de data do dispositivo;
- **remover o prazo:** acionar "Remover prazo", o que esvazia o campo.

A alteração só é salva ao acionar **"Salvar card"** (RF04). Depois do salvamento:
- a janela fecha, como no RF04;
- a face do card passa a exibir a nova situação.

Sem prazo, a janela não exibe indicador de situação.

### 2.2 Validação do prazo

Ao acionar "Salvar card", o prazo é validado junto com os demais campos do RF04:
- campo vazio é válido e significa "sem prazo";
- a data precisa existir no calendário, por exemplo 31/04 e 29/02 de ano não bissexto são inválidas;
- o ano precisa estar entre **2000 e 2099**, inclusive;
- datas anteriores a hoje são **aceitas**, para registrar prazos já vencidos.

Com prazo inválido:
- nenhum dado do card é salvo;
- a janela continua aberta, com a mensagem "Informe uma data válida." junto ao campo "Prazo".

Um texto parcialmente digitado que não forma uma data completa é tratado como inválido.

### 2.3 Situação de prazo e indicador

A situação é calculada com os dias até o prazo:

| Situação | Condição | Texto do indicador | Destaque |
| --- | --- | --- | --- |
| Sem prazo | O card não tem prazo | nenhum indicador | — |
| Atrasado | Dias até o prazo menor que 0 | "Atrasado há 1 dia" / "Atrasado há {N} dias" | vermelho |
| Vence em breve | Dias até o prazo igual a 0 | "Vence hoje" | âmbar |
| Vence em breve | Dias até o prazo igual a 1 | "Vence amanhã" | âmbar |
| Vence em breve | Dias até o prazo igual a 2 | "Vence {D mmm}" | âmbar |
| No prazo | Dias até o prazo maior que 2 | "Vence {D mmm}" | neutro |

No texto "Atrasado há {N} dias", N é o valor absoluto dos dias até o prazo.

**Formato {D mmm}:**
- é o dia sem zero à esquerda seguido do mês abreviado em minúsculas: jan, fev, mar, abr, mai, jun, jul, ago, set, out, nov, dez. Exemplo: "Vence 3 set";
- quando o ano do prazo é diferente do ano de hoje, o ano é acrescentado: "Vence 5 jan 2027".

**O destaque nunca é a única indicação:** o texto sempre informa a situação, e o indicador de atrasado tem, além da cor, um ícone de alerta.

**Nome acessível do indicador:** "Prazo: DD/MM/AAAA. {texto do indicador}.". Exemplo: "Prazo: 27/08/2026. Atrasado há 2 dias.".

### 2.4 Indicador na face do card

A face do card exibe o indicador de situação **no rodapé**, à esquerda da quantidade de comentários (RF09), com o mesmo texto e destaque de 2.3.

Card sem prazo não exibe indicador de prazo.

A face reflete o prazo salvo imediatamente após "Salvar card", sem recarregar a página.

### 2.5 Ordenar por prazo

A barra do quadro (RF08) exibe, à direita e antes do total de cards, o botão **"Ordenar por prazo"**, disponível para qualquer participante. Ele funciona como alternância, ativado ou desativado, e começa **desativado** ao abrir ou recarregar o quadro.

**Com a ordenação desativada:** os cards aparecem na ordem da lista (RF04).

**Com a ordenação ativada:** em cada lista, os cards exibidos aparecem nesta ordem:
1. primeiro os cards **com prazo**, do prazo mais antigo para o mais distante; portanto, os atrasados ficam no topo;
2. depois os cards **sem prazo**;
3. em qualquer empate (mesmo prazo, ou ambos sem prazo), vale a ordem da lista.

A ordenação:
- afeta **somente a exibição**: não altera a posição salva dos cards, não é vista por outros participantes e não é guardada;
- não oculta cards nem listas, e combina com o filtro por etiqueta (RF08): primeiro o filtro decide quais cards aparecem, depois a ordenação decide a ordem entre eles;
- não altera as contagens das listas nem o total da barra (RF08);
- não altera as posições oferecidas na janela do card, que continuam sendo as posições reais da lista (RF04).

O botão indica visualmente e para tecnologias assistivas se está ativado. Após qualquer mudança no quadro feita na mesma tela, como salvar um card ou criar um card, a ordenação ativa é reaplicada.

### 2.6 Cards atrasados em "Meus quadros"

O texto de contagens do cartão do quadro (RF02, "{L} listas · {C} cards") ganha, quando o quadro tem pelo menos um card atrasado, o sufixo:
- " · 1 atrasado", no singular;
- " · {N} atrasados", no plural.

Exemplo: "5 listas · 11 cards · 2 atrasados". Sem cards atrasados, o sufixo não aparece.

A contagem considera todos os cards do quadro, em todas as listas, com prazo anterior a hoje.

### 2.7 Mudança de dia com a tela aberta

As situações e a contagem de atrasados são calculadas quando a tela ou a janela é exibida. Se o dia muda com a tela aberta, as situações exibidas podem ficar desatualizadas até que:
- a tela seja recarregada; ou
- a parte correspondente seja exibida de novo, por exemplo ao abrir o card ou alternar a ordenação.

---

## 3. Critérios de aceite (Given/When/Then)

Salvo indicação contrária, considere que **hoje é 29/08/2026** no dispositivo. Existe o quadro "Sprint", com os participantes Caio (**Administrador**) e João (**Membro**), e as listas e cards, nesta ordem:
- **"A fazer":**
  - "Convite de membros", prazo 03/09/2026;
  - "Migrar cards", prazo 31/08/2026;
  - "Escrever docs", sem prazo;
  - "Refatorar filtros", prazo 27/08/2026;
- **"Concluído":**
  - "Ajustar layout", prazo 28/08/2026.

### Exibição

**CA01 — Indicadores na face**
- **Quando** Caio abre "Sprint"
- **Então**:
  - "Convite de membros" exibe "Vence 3 set", neutro;
  - "Migrar cards" exibe "Vence 31 ago", em âmbar;
  - "Escrever docs" não exibe indicador de prazo;
  - "Refatorar filtros" exibe "Atrasado há 2 dias", em vermelho e com ícone de alerta;
  - "Ajustar layout" exibe "Atrasado há 1 dia".

**CA02 — Vence hoje e amanhã**
- **Dado** que "Escrever docs" tem prazo 29/08/2026 e "Migrar cards" tem prazo 30/08/2026
- **Quando** Caio abre "Sprint"
- **Então** "Escrever docs" exibe "Vence hoje" e "Migrar cards" exibe "Vence amanhã", ambos em âmbar, e nenhum dos dois conta como atrasado.

**CA03 — Prazo em outro ano**
- **Dado** que "Convite de membros" tem prazo 05/01/2027
- **Quando** Caio abre "Sprint"
- **Então** o card exibe "Vence 5 jan 2027", neutro.

**CA04 — Situação muda com o passar dos dias**
- **Dado** que "Convite de membros" tem prazo 03/09/2026
- **Quando** João abre "Sprint" em 01/09/2026, em 03/09/2026 e em 05/09/2026
- **Então** o card exibe, respectivamente, "Vence 3 set" em âmbar, "Vence hoje" e "Atrasado há 2 dias", sem que ninguém tenha alterado o card.

**CA05 — Janela do card**
- **Quando** Caio abre "Refatorar filtros"
- **Então** o campo "Prazo" exibe 27/08/2026, o indicador "Atrasado há 2 dias" e a ação "Remover prazo".

**CA06 — Janela sem prazo**
- **Quando** Caio abre "Escrever docs"
- **Então** o campo "Prazo" está vazio, sem indicador e sem "Remover prazo".

**CA07 — Nome acessível**
- **Quando** uma tecnologia assistiva lê a face de "Refatorar filtros"
- **Então** o indicador é anunciado como "Prazo: 27/08/2026. Atrasado há 2 dias.".

### Definir, alterar e remover

**CA08 — Definir prazo**
- **Dado** que Caio abriu "Escrever docs"
- **Quando** escolhe 10/09/2026 no campo "Prazo"
- **Então** o indicador passa a exibir "Vence 10 set" antes de salvar; **e quando** aciona "Salvar card", a janela fecha e a face de "Escrever docs" exibe "Vence 10 set".

**CA09 — Membro define prazo**
- **Quando** João define o prazo de "Escrever docs" e salva
- **Então** o prazo é salvo (RF07 RN05).

**CA10 — Alterar prazo**
- **Quando** Caio altera o prazo de "Refatorar filtros" para 02/09/2026 e salva
- **Então** a face exibe "Vence 2 set", neutro, e o card deixa de contar como atrasado.

**CA11 — Remover prazo**
- **Quando** Caio aciona "Remover prazo" em "Refatorar filtros" e salva
- **Então** o campo fica vazio antes de salvar e, depois de salvar, a face não exibe indicador de prazo.

**CA12 — Fechar sem salvar**
- **Dado** que Caio alterou o prazo de "Migrar cards" para 15/09/2026, ou acionou "Remover prazo"
- **Quando** fecha a janela sem acionar "Salvar card"
- **Então** o prazo continua 31/08/2026.

**CA13 — Prazo no passado**
- **Quando** Caio define 01/08/2026 como prazo de "Escrever docs" e salva
- **Então** o prazo é salvo, e a face exibe "Atrasado há 28 dias".

**CA14 — Data inválida**
- **Quando** Caio informa uma data inexistente, como 31/04/2026, ou um ano fora de 2000 a 2099, como 01/01/1999, e aciona "Salvar card"
- **Então** nada do card é salvo, a janela continua aberta e aparece "Informe uma data válida." junto ao campo "Prazo".

**CA15 — Salvar com outros campos**
- **Quando** Caio altera o título e o prazo de "Escrever docs" e salva
- **Então** título e prazo são salvos juntos; **e quando** o título é inválido, nenhum dos dois é salvo.

**CA16 — Mover card**
- **Quando** Caio move "Refatorar filtros" para "Concluído" (RF04), ou exclui "A fazer" movendo os cards para "Concluído" (RF05)
- **Então** o card mantém o prazo 27/08/2026 e continua "Atrasado há 2 dias".

**CA17 — Checklist completa não muda a situação**
- **Dado** que "Refatorar filtros" tem todos os itens da checklist concluídos
- **Quando** Caio abre "Sprint"
- **Então** o card continua exibindo "Atrasado há 2 dias".

### Ordenar por prazo

**CA18 — Ordenação ativada**
- **Quando** João aciona "Ordenar por prazo"
- **Então** o botão fica ativado; "A fazer" exibe "Refatorar filtros", "Migrar cards", "Convite de membros" e "Escrever docs", nessa ordem; e "Concluído" exibe "Ajustar layout".

**CA19 — Empate mantém a ordem da lista**
- **Dado** que "Convite de membros" e "Migrar cards" têm o mesmo prazo, 31/08/2026, e "Escrever docs" e um novo card "Revisar" (posição 5) não têm prazo
- **Quando** João ativa a ordenação
- **Então** "A fazer" exibe "Refatorar filtros", "Convite de membros", "Migrar cards", "Escrever docs" e "Revisar", nessa ordem.

**CA20 — Desativar**
- **Dado** que a ordenação está ativada
- **Quando** João aciona "Ordenar por prazo" de novo
- **Então** o botão fica desativado, e os cards voltam à ordem da lista.

**CA21 — Ordenação não altera posições**
- **Dado** que a ordenação está ativada
- **Quando** João abre "Escrever docs"
- **Então** "Posição na lista" mostra a posição 3, e, com a ordenação desativada ou em outra conta, "A fazer" continua na ordem da lista.

**CA22 — Ordenação não é guardada**
- **Dado** que João ativou a ordenação
- **Quando** recarrega a página
- **Então** a ordenação está desativada.

**CA23 — Ordenação com filtro por etiqueta**
- **Dado** que "Convite de membros", "Escrever docs" e "Refatorar filtros" têm a etiqueta "Frontend", e "Migrar cards" não
- **Quando** João filtra por "Frontend" e ativa a ordenação
- **Então** "A fazer" exibe "Refatorar filtros", "Convite de membros" e "Escrever docs", nessa ordem, com contagem 3, e a barra exibe "3 de 5 cards".

**CA24 — Ordenação reaplicada após salvar**
- **Dado** que a ordenação está ativada
- **Quando** João define o prazo de "Escrever docs" como 28/08/2026 e salva
- **Então** "A fazer" passa a exibir "Escrever docs" logo após "Refatorar filtros".

### Meus quadros

**CA25 — Contagem de atrasados**
- **Quando** Caio acessa "Meus quadros"
- **Então** o cartão de "Sprint" exibe "2 listas · 5 cards · 2 atrasados".

**CA26 — Singular e ausência**
- **Dado** que "Ajustar layout" teve o prazo removido
- **Quando** Caio acessa "Meus quadros"
- **Então** o cartão exibe "2 listas · 5 cards · 1 atrasado"; e, se nenhum card estiver atrasado, exibe apenas "2 listas · 5 cards".

**CA27 — Prazo hoje não conta**
- **Dado** que o único card com prazo de um quadro vence hoje
- **Quando** Caio acessa "Meus quadros"
- **Então** o cartão desse quadro não exibe o sufixo de atrasados.

### Acesso, concorrência e sessão

**CA28 — Não participante**
- **Dado** que Bruno não participa de "Sprint"
- **Quando** tenta ler ou alterar o prazo de um card de "Sprint" por qualquer meio
- **Então** recebe "Quadro não encontrado." e nada muda.

**CA29 — Última gravação prevalece**
- **Dado** que Caio e João estão com a janela de "Migrar cards" aberta
- **Quando** Caio salva com prazo 05/09/2026 e, depois, João salva com prazo 07/09/2026
- **Então** o prazo final é 07/09/2026, como nas demais alterações de card do RF04.

**CA30 — Card excluído com a janela aberta**
- **Dado** que João alterou o prazo na janela de "Migrar cards" e Caio excluiu o card em outra aba
- **Quando** João aciona "Salvar card"
- **Então** vê "Card não encontrado.", a janela fecha e o quadro é recarregado (RF04).

**CA31 — Sessão expirada**
- **Dado** que a sessão de João expirou com a janela do card aberta e o prazo alterado
- **Quando** ele aciona "Salvar card"
- **Então** nada é alterado, e o sistema segue o comportamento de sessão expirada do RF01.

---

## 4. Regras de negócio e restrições

**RN01 — Prazo.**
- É uma data de calendário, com dia, mês e ano, sem horário e sem fuso horário.
- Um card tem zero ou um prazo.
- A data precisa existir no calendário e ter ano entre 2000 e 2099.
- Datas passadas são aceitas.

**RN02 — Hoje.** "Hoje" é a data do calendário no dispositivo do usuário no momento da exibição. O prazo salvo é o mesmo para todos os participantes; apenas a situação calculada pode variar entre dispositivos com datas diferentes.

**RN03 — Situação.** Com d = dias do calendário do hoje até o prazo:
- sem prazo;
- **atrasado** se d < 0;
- **vence em breve** se 0 ≤ d ≤ 2;
- **no prazo** se d > 2.

A situação nunca é gravada. É sempre calculada na exibição e independe de lista, checklist, responsáveis, etiquetas e comentários.

**RN04 — Salvamento.**
- O prazo é salvo somente por "Salvar card", junto com os campos do RF04, em uma única operação: ou tudo é salvo, ou nada é.
- Remover o prazo é salvar o card com o campo vazio.

**RN05 — Permissões.** Definir, alterar e remover prazo é permitido a Administradores e Membros (RF07 RN05). Quem não participa do quadro recebe "Quadro não encontrado." (RF07 RN02).

**RN06 — Ordenação por prazo.**
- Ordem crescente de prazo, com cards sem prazo depois dos que têm prazo, e desempate pela posição na lista.
- É aplicada dentro de cada lista, sobre os cards exibidos, somente na tela de quem a ativou.
- Não é guardada nem compartilhada, e não altera posições salvas, contagens, total nem filtros.

**RN07 — Contagem de atrasados.**
- Número de cards do quadro, em todas as listas, com situação "atrasado" em relação ao hoje de quem vê a listagem.
- Aparece no cartão do quadro em "Meus quadros" somente quando é maior que zero.
- Não depende do filtro por etiqueta.

**RN08 — Ciclo de vida.**
- Mover o card, ou mover os cards de uma lista excluída, preserva o prazo.
- Excluir o card, a lista em cascata ou o quadro exclui o prazo.

**RN09 — Formatos.**
- Campo: DD/MM/AAAA.
- Indicador: "Vence hoje", "Vence amanhã", "Vence D mmm", "Vence D mmm AAAA", "Atrasado há 1 dia" e "Atrasado há N dias".
- Meses abreviados em minúsculas conforme 2.3.

**RN10 — Última gravação prevalece.** Alterações simultâneas do mesmo card seguem o RF04: prevalece o último salvamento processado, com todos os campos enviados por ele, inclusive o prazo.

---

## 5. Casos de borda e condições de erro

### 5.1 Entrada de dados e manipulação

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB01 | 29/02 em ano bissexto (29/02/2028) | Aceito. |
| CB02 | 29/02 em ano não bissexto, 31/04, 00/05 ou 13/13 | "Informe uma data válida."; nada é salvo. |
| CB03 | Ano 1999 ou 2100 | "Informe uma data válida."; nada é salvo. Os anos 2000 e 2099 são aceitos. |
| CB04 | Data parcialmente digitada, como "12/0", ao salvar | "Informe uma data válida."; nada é salvo. |
| CB05 | Prazo enviado com horário ou fuso, por manipulação | Recusado com "Informe uma data válida."; nada é salvo. |
| CB06 | Prazo enviado em formato diferente de data, como texto ou número, por manipulação | "Informe uma data válida."; nada é salvo. |
| CB07 | Salvamento sem o campo de prazo, por manipulação | Recusado com "Informe uma data válida.": o prazo sempre acompanha o salvamento do card, vazio ou com data. |
| CB08 | Situação ou contagem de atrasados enviadas por manipulação | Ignoradas: nunca são gravadas (RN03). |

### 5.2 Tempo, concorrência e estado desatualizado

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB09 | Virada do dia com o quadro aberto | As situações podem ficar desatualizadas até a próxima exibição da parte correspondente (2.7). Nenhum dado muda. |
| CB10 | Prazo em 31/12 visto em 30/12 e em 01/01 | Em 30/12: "Vence amanhã". Em 01/01: "Atrasado há 1 dia". Os dias são contados no calendário, atravessando mês e ano. |
| CB11 | Participantes em fusos com datas diferentes no mesmo instante | Cada um vê a situação conforme a própria data (RN02); o prazo exibido no campo é o mesmo. |
| CB12 | Prazo alterado por outra pessoa enquanto a janela está aberta | A janela mostra o prazo carregado ao abrir. Ao salvar, prevalece o último salvamento (RN10). |
| CB13 | Card movido ou com prazo alterado em outra aba com a ordenação ativa | A ordem exibida reflete os dados da tela até a próxima atualização do quadro nessa tela. |
| CB14 | Conta removida do quadro com a janela do card aberta aciona "Salvar card" | "Quadro não encontrado." (RF07, 2.10). |
| CB15 | Quadro com muitos cards atrasados | A contagem exibe o número exato, sem abreviação. |

### 5.3 Falhas

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CE01 | Falha de comunicação ao salvar o card com prazo alterado | A janela continua aberta, com os valores digitados e a mensagem genérica; nada é salvo (RF04). |
| CE02 | Erro inesperado | A mensagem não revela detalhes internos. |

### 5.4 Mensagens e textos

A redação pode variar desde que o significado seja preservado e a mesma situação produza sempre o mesmo texto. Mensagens de sessão seguem o RF01; de quadro, o RF02; de card, o RF04.

| Situação | Texto |
| --- | --- |
| Campo da janela | "Prazo" |
| Ação da janela | "Remover prazo" |
| Vence hoje | "Vence hoje" |
| Vence amanhã | "Vence amanhã" |
| Vence em outra data | "Vence {D mmm}" / "Vence {D mmm AAAA}" |
| Atrasado | "Atrasado há 1 dia" / "Atrasado há {N} dias" |
| Nome acessível do indicador | "Prazo: DD/MM/AAAA. {texto do indicador}." |
| Botão da barra do quadro | "Ordenar por prazo" |
| Sufixo em "Meus quadros" | " · 1 atrasado" / " · {N} atrasados" |
| Data inválida | "Informe uma data válida." |
| Falha de comunicação ou erro inesperado | "Não foi possível concluir a operação. Tente novamente." |

---

## 6. Fora de escopo

- horário no prazo, prazo com fuso horário e data de início;
- marcar card como concluído, ou deixar de considerar atrasado um card em determinada lista;
- lembretes, notificações e e-mails sobre prazos;
- filtro por situação de prazo ("somente atrasados") e contagem de atrasados na tela do quadro;
- ordenação por outros critérios e ordenação guardada entre visitas;
- prazos recorrentes, prazos em itens de checklist e histórico de alterações de prazo;
- alterar o prazo diretamente pela face do card, sem abrir a janela do card;
- atualização em tempo real entre abas ou dispositivos, e atualização automática das situações na virada do dia.
