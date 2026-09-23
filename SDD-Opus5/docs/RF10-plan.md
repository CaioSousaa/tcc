# RF10 — Plano técnico

**Base:** `docs/RF10-spec.md` (especificação funcional aprovada).
**Herda de:** planos do RF01 ao RF09 (C01–C242).
Este plano acrescenta C243–C272 e altera explicitamente:
- as representações de card e de quadro (3.4);
- o contrato de salvamento do card do RF04 (4.3);
- a listagem "Meus quadros" do RF02 (4.4).

Onde aparece "deve", a implementação não tem liberdade de escolha. Onde aparece "pode", há margem, desde que os critérios de aceite continuem verificáveis.

---

## 1. Tecnologias e frameworks

### 1.1 Stack

Nenhuma troca de tecnologia.

| Camada | Tecnologia | Uso no RF10 |
| --- | --- | --- |
| Banco | PostgreSQL | coluna `cards.due_date` do tipo `date`, `CHECK` de faixa, contagem de atrasados na listagem |
| ORM | TypeORM | migration |
| API | Express 5 + TypeScript | `PATCH` do card (RF04) com `dueDate`; `GET /api/boards` com `today` |
| Front-end | Next.js 16 + React 19 + Tailwind 4 | campo "Prazo", indicadores na face e na janela, "Ordenar por prazo", sufixo em "Meus quadros" |
| Testes | `vitest` | unitários; integração condicionada a `TEST_DATABASE_URL` |

### 1.2 Dependências novas

**Nenhuma.**

- **T16.** O campo "Prazo" é um `<input type="date">` nativo, com `min="2000-01-01"` e `max="2099-12-31"`. Nenhuma biblioteca de seletor de data.
- **T17.** Datas do prazo são tratadas como **texto `YYYY-MM-DD`** em todo o sistema, e a aritmética de dias usa dias do calendário convertidos por `Date.UTC`. Nenhuma biblioteca de datas. `Date` com horário local nunca é usado para representar o prazo (D49).

---

## 2. Arquitetura de componentes e fronteiras

### 2.1 Visão geral

```
Navegador
  BoardsView ─ boardService.list(today) → GET /api/boards?today=YYYY-MM-DD
            └ BoardCard ─ boardCountsLabel(listas, cards, atrasados)
  BoardView  (estado: board, seleção do filtro, sortByDue)
    ├── LabelFilterBar ─ botão "Ordenar por prazo" (aria-pressed)
    ├── BoardLists(projectLists(board.lists, seleção, sortByDue)) → ListColumn → CardFace + DueDateBadge
    └── CardDialog ─ DueDateField (parte do formulário "Salvar card") + DueDateBadge
  lib/dueDate.ts (hoje local, dias até o prazo, situação, textos, ordenação estável, validação)

API
  PATCH /api/boards/:boardId/cards/:cardId  { title, description, listId, position, dueDate }
    → CardService.update (runInBoardLock, card.write + dueDate.write) → updateContent inclui due_date
  GET /api/boards?today → BoardRepository.listSummaries(scope, today) → overdue_count na mesma instrução
```

### 2.2 Regras de fronteira obrigatórias

- **F135.** O prazo é um campo do card, gravado **somente** pelo `PATCH` do card do RF04, na mesma transação e na mesma instrução `UPDATE` de título e descrição (RN04). Não existe rota própria de prazo.
- **F136.** `dueDate` é **obrigatório** no corpo do `PATCH` do card:
  - `null` significa sem prazo;
  - `"YYYY-MM-DD"` significa a data;
  - ausente, ou em qualquer outro formato, é `VALIDATION_ERROR`, com a mensagem de campo "Informe uma data válida." (CB05–CB07).

  É a única forma de evitar que um cliente antigo apague prazos sem querer: a ausência é recusada, e não interpretada como "manter" ou "remover".
- **F137.** O `PATCH` do card continua exigindo `card.write` (RF07). Também chama `assertCan(role, "dueDate.write")` quando `dueDate` difere do salvo, porque a matriz do RF07 declara essa ação. Hoje ela vale para os dois papéis (RN05); a verificação existe para que uma mudança futura da matriz seja respeitada.
- **F138.** A **situação** e os **dias até o prazo** nunca são gravados nem calculados no servidor para a face ou a janela. O servidor só guarda e devolve a data (RN03, CB08). A situação é calculada no cliente, com o "hoje" do dispositivo (RN02).
- **F139.** A contagem de atrasados de "Meus quadros" é calculada **no servidor**, na mesma instrução da listagem (RF02 N23), com o "hoje" **informado pelo cliente** em `GET /api/boards?today=YYYY-MM-DD` (RN07). Assim, a listagem não precisa trazer as datas de todos os cards.
  - Sem `today`, o servidor usa `CURRENT_DATE` do banco, como alternativa para clientes que não sejam o front-end.
  - `today` presente e inválido → `400 VALIDATION_ERROR` (A69).
- **F140.** Respostas que trazem `BoardSummary` fora da listagem (criar, editar, aceitar convite, detalhe do quadro) calculam `overdueCount` com `CURRENT_DATE`. Exceção: `POST /api/invitations/:id/accept`, que também aceita `?today=` (A70). O front-end:
  - não exibe `overdueCount` fora de "Meus quadros";
  - ao substituir um cartão depois de editar o quadro, preserva o `overdueCount` que já exibia, porque editar o quadro não altera cards (F146).
- **F141.** A ordenação por prazo é **somente de exibição**, em função pura aplicada **depois** do filtro por etiqueta, dentro de cada lista. Só `BoardLists` recebe a projeção (RF08 F108, F109, C200). Posições, contagens, total e diálogos continuam usando `board.lists` (RN06).

### 2.3 Back-end: componentes

```
back-end/src/
  domain/dueDate.ts                    DUE_DATE_MIN = "2000-01-01", DUE_DATE_MAX = "2099-12-31",
                                       isValidDueDate(value): formato + calendário + faixa
  migrations/1760000009000-CardDueDate.ts
  entities/Card.ts                     alterado: dueDate (date, nullable)
  schemas/card.schemas.ts              alterado: dueDate obrigatório no update (F136)
  schemas/board.schemas.ts             alterado: parseBoardListQuery (today opcional)
  repositories/BoardCardRepository.ts  alterado: updateContent grava due_date; CardDetail.dueDate
  repositories/listsWithCards.ts       alterado: dueDate na instrução de cards
  repositories/BoardRepository.ts      alterado: overdue_count na instrução de resumo; listSummaries(scope, today)
  repositories/InvitationRepository.ts alterado: boardSummary(userId, today)
  services/CardService.ts              alterado: dueDate + dueDate.write (F137)
  services/BoardService.ts             alterado: list(userId, today)
  controllers/BoardController.ts, InvitationController.ts, routes   alterados: validateQuery de today
```

- **F142.** `isValidDueDate` aceita somente:
  - texto que casa com `^\d{4}-\d{2}-\d{2}$`;
  - que representa uma data existente, verificada pela ida e volta de `Date.UTC`;
  - entre `DUE_DATE_MIN` e `DUE_DATE_MAX`, por comparação de texto.

  A mesma função valida `dueDate` do card e `today` da listagem, exceto a faixa, que vale só para o prazo.

### 2.4 Algoritmos

**Salvar card (RF04 + RF10):** dentro de `runInBoardLock`, na ordem já definida no RF04:
1. `assertCan(role, "card.write")`.
2. Resolver o card (`CARD_NOT_FOUND`) e a lista de destino.
3. Se `input.dueDate !== card.dueDate`: `assertCan(role, "dueDate.write")`.
4. `updateContent(cardId, title, description, dueDate)` em uma instrução.
5. Mover dentro da lista ou entre listas, como no RF04.
6. Responder com `lists` afetadas (cada `CardSummary.dueDate`) e `card` (`CardDetail.dueDate`).

**Contagem de atrasados na listagem:** subconsulta por quadro na instrução de resumo:
`count(*)` de `cards` das listas do quadro com `due_date < $today::date` (N203).

### 2.5 Front-end: componentes

```
front-end/src/
  lib/dueDate.ts                       localToday(now), daysUntil(due, today), dueStatus(due, today),
                                       dueBadgeText, dueAccessibleName, formatDueField, isValidDueDate,
                                       sortCardsByDueDate, projectLists(lists, selection, sortByDue)
  lib/plural.ts                        alterado: boardCountsLabel(listas, cards, atrasados)
  components/cards/DueDateField.tsx    input date, "Remover prazo", badge prévio, erro de campo
  components/cards/DueDateBadge.tsx    texto, destaque, ícone de alerta, nome acessível (variantes face e janela)
  alterados: schemas/card.ts (dueDate), services/boardService.ts (list(today), tipos),
             services/cardService.ts (CardDetail.dueDate), CardDialog, CardFace, LabelFilterBar,
             BoardView, BoardsView, BoardCard
```

Regras de fronteira obrigatórias:

- **F143.** `localToday(now)` monta `YYYY-MM-DD` com `getFullYear`, `getMonth` e `getDate` locais (RN02). `daysUntil(due, today)` é:
  - `(Date.UTC(due) − Date.UTC(today)) / 86_400_000`, arredondado;
  - calculado entre datas sem horário, portanto imune a horário de verão e atravessando mês e ano (CB10).
- **F144.** `dueStatus(due, today)` implementa exatamente a tabela de 2.3 e RN03:

| Entrada | Resultado |
| --- | --- |
| `due` nulo | `{ kind: "none" }` |
| d < 0 | `kind: "overdue"` e texto "Atrasado há 1 dia" / "Atrasado há {N} dias" |
| d = 0 | `kind: "soon"` e texto "Vence hoje" |
| d = 1 | `kind: "soon"` e texto "Vence amanhã" |
| d = 2 | `kind: "soon"` e texto "Vence {D mmm[ AAAA]}" |
| d > 2 | `kind: "ok"` e texto "Vence {D mmm[ AAAA]}" |

  O ano é acrescentado quando o ano do prazo difere do ano de `today`. Os meses vêm de uma tabela fixa, como no RF09 T14. `dueAccessibleName` produz "Prazo: DD/MM/AAAA. {texto}.".
- **F145.** `hoje` é lido **uma vez por renderização** da tela, ou da janela, com `localToday(new Date())`, e passado às funções puras. Não há temporizador para a virada do dia (2.7, CB09).
- **F146.** `BoardsView` chama `boardService.list(localToday(new Date()))`, e o aceite de convite envia o mesmo `today`. Depois de editar um quadro, o cartão atualizado mantém o `overdueCount` anterior (F140).
- **F147.** Projeção de exibição do quadro:
  - `projectLists(lists, selection, sortByDue)` aplica `filterLists` do RF08 e, se `sortByDue`, `sortCardsByDueDate` em cada lista;
  - `sortCardsByDueDate` é estável: ordena por `dueDate` crescente (comparação de texto `YYYY-MM-DD`), com `null` por último e desempate por `position`;
  - `cardCount` de cada lista continua sendo o do filtro (RF08).

  O estado `sortByDue` fica em `BoardView` (`useState(false)`), sem URL nem armazenamento (RN06, CA22). Como a projeção é derivada de `board` com `useMemo`, qualquer atualização do quadro reaplica a ordenação (CA24).
- **F148.** `DueDateField` faz parte do formulário de "Salvar card" (RF04 F44):
  - o valor fica no estado de `CardDialog` e é enviado em todo salvamento (F136);
  - "Remover prazo" esvazia o estado, sem salvar (CA11, CA12).

  O campo fica na coluna lateral, depois de "Responsáveis", seguindo `prototipo/modais/detalhe-card.png` e ainda abaixo de "Etiquetas", como pede 2.1.
- **F149.** Entrada parcial: `<input type="date">` devolve `""` tanto para vazio quanto para data incompleta. `DueDateField` deve ler `event.target.validity.badInput` e guardar esse estado. `validateCardForm` recusa o salvamento com "Informe uma data válida." quando `badInput` é verdadeiro, ou quando o valor não passa em `isValidDueDate` (CB04, CA14).
- **F150.** O indicador da janela é calculado a partir do valor **em edição** no campo (2.1, CA08). O indicador da face usa o `dueDate` salvo em `board.lists` (2.4).
- **F151.** Falhas do salvamento seguem a tabela do RF04 (`cardFailureAction`). `VALIDATION_ERROR` com `fields.dueDate` é exibido junto ao campo "Prazo" (CA14).

---

## 3. Modelo de dados e schema

### 3.1 Coluna `cards.due_date`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `due_date` | `date` | `NULL` significa sem prazo; `CHECK (due_date IS NULL OR due_date BETWEEN DATE '2000-01-01' AND DATE '2099-12-31')` |

Índice parcial `IDX_cards_list_due_date` em `(list_id, due_date)` `WHERE due_date IS NOT NULL`, para a contagem de atrasados por quadro.

### 3.2 Migration `CardDueDate`

- **D48.** Um único arquivo `1760000009000-CardDueDate`, registrado depois de `1760000008000`:
  - `up`: adiciona a coluna (nula para os cards existentes: sem prazo), o `CHECK` e o índice;
  - `down`: remove índice, `CHECK` e coluna.

  Nenhuma migração de dados.

### 3.3 Restrições de modelagem

- **D49.** O tipo `date` do PostgreSQL não tem horário nem fuso (RN01).
  - Toda leitura deve converter para texto no SQL (`to_char(due_date, 'YYYY-MM-DD')` ou `due_date::text`). O driver `pg` converte `date` em `Date` **local** do servidor, o que desloca o dia em fusos negativos.
  - Toda escrita recebe o texto validado com `$n::date`.
- **D50.** Nada derivado do prazo é armazenado: nem situação, nem contagem de atrasados (RN03, D40/D46 dos requisitos anteriores).
- **D51.** O prazo pertence à linha do card. Mover o card (`UPDATE` de `list_id` e `position`) o preserva; excluir o card, a lista em cascata ou o quadro o remove com a linha (RN08).

### 3.4 Alterações em representações existentes

| Anterior | Nova regra |
| --- | --- |
| RF09 `CardSummary` | Ganha `dueDate: string \| null` (`YYYY-MM-DD`), na **mesma** instrução de cards |
| RF09 `CardDetail` | Ganha `dueDate: string \| null` |
| RF07 `BoardSummary` | Ganha `overdueCount: number`, na **mesma** instrução de resumo (F139, F140) |

Nenhuma instrução nova no quadro aberto nem na listagem.

---

## 4. Interfaces: API e contratos

### 4.1 Representação do prazo

| Campo | Tipo | Observação |
| --- | --- | --- |
| `dueDate` | `string` (`YYYY-MM-DD`) \| `null` | data de calendário; nunca com horário ou fuso |
| `overdueCount` | `number` | cards com `dueDate < today` no quadro |

### 4.2 Validação

| Entrada | Regra | Mensagem |
| --- | --- | --- |
| `dueDate` no `PATCH` do card | ausente, não `null` e não texto `YYYY-MM-DD` | "Informe uma data válida." |
| `dueDate` | data inexistente no calendário | "Informe uma data válida." |
| `dueDate` | fora de 2000-01-01 a 2099-12-31 | "Informe uma data válida." |
| `today` em `GET /api/boards` e no aceite de convite | presente e não é data `YYYY-MM-DD` existente | "Informe uma data válida." |

Os erros de campo do `PATCH` do card vêm juntos em `VALIDATION_ERROR` (`fields.dueDate` ao lado de `title`, `description` e `position`), como no RF04.

### 4.3 Alteração do `PATCH /api/boards/:boardId/cards/:cardId` (RF04)

- **A68.** Corpo: `{ title, description, listId, position, dueDate }`, com `dueDate` obrigatório (F136). Resposta inalterada na forma: `{ card: CardDetail, lists: ListWithCards[] }`, com `dueDate` nos dois.

### 4.4 Alteração de `GET /api/boards` (RF02)

- **A69.** Query opcional `today=YYYY-MM-DD`. Cada `BoardSummary` traz `overdueCount` calculado com `today`, ou com `CURRENT_DATE` quando ausente. `today` inválido → `400 VALIDATION_ERROR` com `fields.today`.
- **A70.** `POST /api/invitations/:invitationId/accept` aceita a mesma query `today`, com as mesmas regras, para o `BoardSummary` inserido na grade (RF07 CA12).

### 4.5 Outros contratos

- `GET /api/boards/:boardId` e toda resposta com `ListWithCards`: `CardSummary.dueDate`.
- `GET` do card: `CardDetail.dueDate`.
- Nenhum código de erro novo: prazo inválido é `VALIDATION_ERROR` (RF01 A8).

### 4.6 Front-end: serviços

| Função | Alteração |
| --- | --- |
| `boardService.list(today)` | envia `?today=` |
| `invitationService.accept(id, today)` | envia `?today=` |
| `cardService.update(boardId, cardId, payload)` | `payload.dueDate: string \| null` sempre presente |

---

## 5. Requisitos não funcionais

### 5.1 Desempenho

| Operação | Alvo (p95, local) | Condição |
| --- | --- | --- |
| `GET /api/boards` | < 220 ms | 200 quadros, 2.000 cards cada, metade com prazo |
| `PATCH` do card | inalterado em relação ao RF04 | — |
| Aplicar ou desfazer a ordenação no cliente | < 50 ms | 2.000 cards |
| Calcular situações ao renderizar o quadro | < 30 ms | 2.000 cards |

- **N201.** A listagem continua em **uma** instrução (RF02 N23, RF07 N135). `overdue_count` é uma subconsulta por quadro apoiada no índice parcial de 3.1.
- **N202.** `dueDate` é lido na instrução de cards de `loadListsWithCards` e no `SELECT` do detalhe, sem consulta extra.
- **N203.** O parâmetro `today` é sempre passado como parâmetro de consulta (`$n::date`), nunca interpolado no SQL.
- **N204.** A ordenação é `O(n log n)` por lista, memorizada por `(board.lists, selection, sortByDue)`.

### 5.2 Segurança

- **N205.** Participação e papel lidos no bloqueio (RF07 F79, F81). Não participante recebe `BOARD_NOT_FOUND` antes da validação de estado (CA28).
- **N206.** `today` só influencia a contagem de atrasados das próprias listagens do usuário. Não altera dados nem dá acesso a nada (F139).
- **N207.** O prazo é exibido como texto formatado a partir de números validados. Nenhum valor da API é inserido como HTML.

### 5.3 Integridade e concorrência

- **N208.** Prazo e demais campos do card são gravados na mesma instrução, sob o bloqueio do quadro (RF04). Ou tudo é salvo, ou nada é (RN04, CE01). A última gravação prevalece (RN10, CA29).
- **N209.** O `CHECK` de faixa é a última barreira contra datas fora de 2000–2099, mesmo que a validação do serviço seja contornada.
- **N210.** A leitura sempre em texto (D49) garante que o mesmo prazo apareça igual para todos os participantes, qualquer que seja o fuso do servidor ou do cliente (CB11).

### 5.4 Interface e acessibilidade

- **N211.** `DueDateBadge`:
  - sempre exibe o texto da situação;
  - "atrasado" tem, além do destaque vermelho, um ícone de alerta com `aria-hidden`;
  - o nome acessível é o de F144.

  Na face, é um `<span>` dentro do botão do card (RF06 N128). O contraste do texto sobre o fundo deve ser de pelo menos 4,5:1 nas variantes neutra, âmbar e vermelha.
- **N212.** O campo "Prazo" tem `<label>` visível "Prazo". O erro é associado ao campo por `aria-describedby`. "Remover prazo" é um botão com esse nome.
- **N213.** "Ordenar por prazo" é um `<button>` com `aria-pressed` e indicação visual do estado ativo além da cor, como na barra de filtro do RF08 (N177).
- **N214.** O layout segue os protótipos:
  - na face, o indicador fica no rodapé, à esquerda, antes da quantidade de comentários;
  - na janela, "Prazo" tem o campo e o indicador abaixo;
  - na barra, "Ordenar por prazo" fica à direita.

### 5.5 Testabilidade

- **N215.** Funções puras testadas:
  - **back-end:** `isValidDueDate` (formato, bissexto, 31/04, faixa 2000/2099), `parseUpdateCardInput` com `dueDate` (nulo, ausente, texto, número, data com horário) e a validação de `today`;
  - **front-end:** `localToday`, `daysUntil` (virada de mês e de ano e datas de horário de verão), `dueStatus` com todos os limites da tabela (−1, 0, 1, 2, 3 e outro ano), `dueAccessibleName`, `sortCardsByDueDate` (estabilidade e nulos por último), `projectLists` combinada com filtro, `boardCountsLabel` com 0, 1 e N atrasados, e `validateCardForm` com `badInput`.
- **N216.** Serviços testados com repositórios em memória: salvar card com prazo, remover prazo, prazo preservado ao mover card e lista, `overdueCount` com `today` informado (prazo hoje não conta) e rejeição de `dueDate` inválido na borda de validação.
- **N217.** Integração com PostgreSQL, pulada sem `TEST_DATABASE_URL`, cobrindo:
  - `CHECK` de faixa;
  - ida e volta de `YYYY-MM-DD` sem deslocamento de dia com `TZ` diferente de UTC no processo;
  - `overdueCount` com `today` em uma única instrução;
  - reversão da migration.

  Os testes de integração existentes recebem a nova migration e um `undoLastMigration` a mais nos testes de reversão.

---

## 6. Restrições consolidadas

| # | Restrição |
| --- | --- |
| C243 | Nenhuma dependência nova; `<input type="date">` nativo e aritmética de datas por `Date.UTC` |
| C244 | Coluna `cards.due_date date NULL` com `CHECK` 2000–2099 e índice parcial; migration reversível |
| C245 | Prazo trafega e é lido sempre como texto `YYYY-MM-DD`; nunca como `Date` com horário |
| C246 | Prazo gravado só pelo `PATCH` do card, na mesma instrução dos demais campos |
| C247 | `dueDate` obrigatório no `PATCH` do card (`null` ou data); ausência é `VALIDATION_ERROR` |
| C248 | `isValidDueDate`: formato, calendário e faixa; mensagem "Informe uma data válida." |
| C249 | `assertCan("dueDate.write")` quando o prazo muda, além de `card.write` |
| C250 | Situação e dias até o prazo nunca gravados nem calculados no servidor para exibição |
| C251 | `overdueCount` na instrução da listagem, com `today` do cliente e `CURRENT_DATE` como alternativa |
| C252 | `today` inválido → `400 VALIDATION_ERROR`; `today` sempre parametrizado |
| C253 | Aceite de convite aceita `today`; edição de quadro preserva `overdueCount` exibido |
| C254 | `CardSummary.dueDate`, `CardDetail.dueDate` e `BoardSummary.overdueCount` sem instruções extras |
| C255 | `localToday` por componentes locais; `hoje` lido uma vez por renderização |
| C256 | `daysUntil` por dias do calendário, imune a horário de verão e a viradas de mês e ano |
| C257 | `dueStatus` segue exatamente a tabela de F144 |
| C258 | Meses por tabela fixa; ano incluído quando difere de hoje |
| C259 | Nome acessível "Prazo: DD/MM/AAAA. {texto}." |
| C260 | Face: indicador no rodapé, à esquerda dos comentários, com o prazo salvo |
| C261 | Janela: indicador calculado do valor em edição; "Remover prazo" só esvazia o campo |
| C262 | Prazo enviado em todo "Salvar card"; fechar sem salvar descarta |
| C263 | `badInput` tratado como data inválida |
| C264 | Ordenação estável por prazo crescente, nulos por último, desempate por posição |
| C265 | Ordenação aplicada depois do filtro, só na projeção de `BoardLists` |
| C266 | Estado da ordenação local em `BoardView`, sem URL ou armazenamento, começando desativado |
| C267 | Contagens, total, posições e diálogos nunca usam a projeção ordenada |
| C268 | Sufixo " · 1 atrasado" / " · {N} atrasados" só quando maior que zero |
| C269 | Nenhum temporizador para a virada do dia |
| C270 | Acessibilidade e contraste conforme N211–N213 |
| C271 | Última gravação prevalece; tudo ou nada no salvamento do card |
| C272 | Testes: funções puras nos dois projetos, serviços em memória, integração condicionada com fuso diferente de UTC |

---

## 7. Rastreabilidade: critério de aceite → mecanismo

| Critérios | Mecanismo |
| --- | --- |
| CA01–CA04 | `CardSummary.dueDate` (C254) + `dueStatus` (C257) + `localToday` (C255) + `DueDateBadge` (C260) |
| CA05, CA06 | `CardDetail.dueDate` + `DueDateField` (F148) |
| CA07 | `dueAccessibleName` (C259) |
| CA08–CA11 | `DueDateField` com indicador em edição (C261) + `PATCH` do card (C246, C247) |
| CA12, CA15 | prazo no formulário de "Salvar card" (C262) + instrução única (C271) |
| CA13, CA14 | `isValidDueDate` (C248) + `badInput` (C263) |
| CA16 | prazo na linha do card (D51) |
| CA17 | situação independente da checklist (C250, C257) |
| CA18–CA24 | `projectLists` e `sortCardsByDueDate` (C264–C267) |
| CA25–CA27 | `overdueCount` com `today` (C251–C253) + `boardCountsLabel` (C268) |
| CA28 | participação no bloqueio (RF07) |
| CA29, CA30 | RF04 (última gravação, `CARD_NOT_FOUND`) |
| CA31 | `authenticate` + interceptador do RF01 |
| CB01–CB08 | `isValidDueDate`, `dueDate` obrigatório, `CHECK`, situação não gravada |
| CB09–CB15 | cálculo por renderização (C255, C269), dias de calendário (C256), leitura em texto (C245) |
| CE01, CE02 | tabela de falhas do RF04, envelope de erro |

---

## 8. Riscos e decisões registradas

| Risco / decisão | Análise |
| --- | --- |
| `today` informado pelo cliente | Um cliente pode enviar outra data e ver outra contagem, mas só nas próprias listagens, e sem efeito em dados ou acesso. É a forma de respeitar a data do dispositivo (RN02) sem trazer as datas de todos os cards para a listagem. |
| `overdueCount` com `CURRENT_DATE` fora da listagem | Pode divergir do "hoje" do usuário perto da meia-noite. É mitigado porque o front-end só exibe o valor vindo da listagem ou do aceite com `today`, e preserva o valor ao editar o quadro (F140, F146). |
| `dueDate` obrigatório no `PATCH` | Muda o contrato do RF04: clientes antigos recebem `400`. Foi preferido a interpretar a ausência como "remover", que apagaria prazos em silêncio. |
| Driver `pg` e o tipo `date` | A conversão automática para `Date` local desloca o dia em fusos negativos. É eliminada pela leitura em texto (D49) e coberta por teste de integração com `TZ` diferente de UTC (N217). |
| Entrada parcial em `<input type="date">` | O valor vazio é ambíguo. `validity.badInput` distingue "vazio" de "incompleto" nos navegadores atuais (F149). |
| Situação calculada no cliente | Participantes em fusos diferentes veem transições em momentos diferentes. Aceito pela spec (RN02, CB11). |
| Virada do dia sem temporizador | As situações ficam defasadas até a próxima renderização. Aceito pela spec (2.7), e evita recálculos periódicos. |
