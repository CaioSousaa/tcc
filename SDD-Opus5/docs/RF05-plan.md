# RF05 — Plano técnico

**Base:** `docs/RF05-spec.md` (especificação funcional aprovada).
**Herda de:** planos do RF01 (C01–C24), RF02 (C25–C43), RF03 (C44–C66) e RF04 (C67–C92).
Este plano acrescenta C93–C116 e **altera explicitamente** decisões anteriores, listadas em 3.3. A principal alteração é a remoção de `LIST_HAS_CARDS` (RF03, A36).

Onde aparece "deve", a implementação não tem liberdade de escolha. Onde aparece "pode", há margem, desde que os critérios de aceite continuem verificáveis.

---

## 1. Tecnologias e frameworks

### 1.1 Stack

Nenhuma troca de tecnologia.

| Camada | Tecnologia | Uso no RF05 |
| --- | --- | --- |
| Banco | PostgreSQL | coluna de bloqueio no quadro, transferência de cards em instrução única, cascata por FK |
| ORM | TypeORM | migration e transação via `runInBoardLock` (RF04, C67) |
| API | Express 5 + TypeScript | `DELETE` de lista com parâmetros de regra; `PUT` de quadro com bloqueio |
| Front-end | Next.js 16 + React 19 + Tailwind 4 | janela de decisão e opção no "Editar quadro" |
| Testes | `vitest` | unitários; integração condicionada a `TEST_DATABASE_URL` |

### 1.2 Dependências novas

**Nenhuma.**

- **T8.** As opções da janela de decisão usam `<input type="radio">` nativos agrupados em `<fieldset>`, e o destino usa `<select>` nativo. Bibliotecas de formulário ou de componentes continuam proibidas (C25).

---

## 2. Arquitetura de componentes e fronteiras

### 2.1 Visão geral

```
Navegador  BoardView
  ├── ListColumn → excluir
  │     ├── cardCount = 0 → DeleteListDialog (RF03, inalterado)
  │     └── cardCount > 0 → DeleteListWithCardsDialog (RF05)
  ├── BoardFormDialog (modo editar) → opção "Bloquear exclusão de listas que contêm cards"
  └── listService.remove(boardId, listId, { strategy, targetListId, expectedCardCount })

API
  DELETE /api/boards/:boardId/lists/:listId?strategy=&targetListId=&expectedCardCount=
    authenticate → validateBoardId → validate(query) → ListController.delete → ListService.delete
      → BoardListRepository.withBoardLock → runInBoardLock (RF04, C67)
  PUT /api/boards/:boardId  (+ lockListDeletion)
```

### 2.2 Back-end

Nenhum arquivo novo de camada: o RF05 **estende** componentes existentes.

| Componente | Mudança |
| --- | --- |
| `migrations/<timestamp>-BoardListDeletionLock.ts` | nova coluna `boards.lock_list_deletion` |
| `domain/boards.ts` | `BoardSummary.lockListDeletion` |
| `domain/listDeletion.ts` (novo) | tipo `ListDeletionStrategy = "move" \| "cascade"` e `ListDeletionRequest` |
| `schemas/board.schemas.ts` | `lockListDeletion` opcional no `PUT` |
| `schemas/list.schemas.ts` | `parseDeleteListQuery` |
| `middlewares/validate.ts` | variante `validateQuery`, que valida `req.query` sem sobrescrevê-lo |
| `repositories/BoardRepository.ts` | leitura e escrita do bloqueio |
| `repositories/BoardListRepository.ts` | novas primitivas em `ListTransaction` (F52) |
| `services/ListService.ts` | algoritmo de exclusão de 2.3 |
| `controllers/ListController.ts` | repassa a requisição de exclusão validada |
| `errors/*`, `middlewares/errorHandler.ts` | novos códigos (4.5) e remoção de `LIST_HAS_CARDS` |

Regras de fronteira obrigatórias:

- **F52.** `ListTransaction` troca `hasCards` por primitivas sem regra de negócio, todas restritas ao quadro bloqueado:

| Primitiva | Efeito |
| --- | --- |
| `countCards(listId)` | quantidade de cards da lista |
| `isListDeletionLocked()` | valor de `boards.lock_list_deletion` do quadro já bloqueado |
| `appendCards(fromListId, toListId, offset)` | move **todos** os cards de `fromListId` para `toListId`, em **uma instrução**, com `position = position + offset` |

- **F53.** Toda a decisão do RF05 (vazia ou não, bloqueio, regra, conferência da quantidade, validade do destino) acontece no `ListService`, **dentro** de `withBoardLock`. É isso que torna RN03, RN05, RN08 e RN11 verdadeiras com operações concorrentes: criar ou mover card (RF04) adquire o mesmo bloqueio (C47, C67).
- **F54.** A exclusão em cascata continua a cargo do banco: `DELETE FROM lists` remove os cards por `ON DELETE CASCADE` (RF02, D9). O código não exclui cards um a um. Tudo o que os requisitos seguintes associarem a cards também deve usar cascata (D9), o que mantém RN07 sem mudança de código.
- **F55.** A transferência preserva a identidade dos cards: `appendCards` altera só `list_id`, `position` e `updated_at`. Nenhum card é recriado, portanto tudo o que referencia o card por `id` continua associado (RN06, RF04 RN13).
- **F56.** Nenhuma validação que dependa do estado do quadro, como destino existente ou quantidade de cards, é feita no schema. O schema só valida formato.

### 2.3 Algoritmo de exclusão

Executado pelo `ListService.delete` dentro de `withBoardLock`, nesta ordem obrigatória (C95):

1. `list = findList(listId)`; `listId` malformado ou ausente → `LIST_NOT_FOUND` (RN12, CA27).
2. `K = countCards(list.id)`.
3. **Se `K = 0`:** `remove` + `shiftLeft` (RF03). Qualquer regra enviada é ignorada (RN02, CB07, CA24).
4. `isListDeletionLocked()` verdadeiro → `LIST_DELETION_LOCKED` (RN03, CA20, CA25).
5. `strategy` ou `expectedCardCount` ausente → `LIST_DELETION_STRATEGY_REQUIRED` (RN01, CB01, CB06).
6. `expectedCardCount ≠ K` → `LIST_CARD_COUNT_CHANGED` (RN08, CA23).
7. **Se `strategy = "move"`:**
   1. `targetListId` igual a `listId` → `VALIDATION_ERROR` com `fields.targetListId` (CB05, CA31);
   2. `targetListId` malformado ou `findList(targetListId)` ausente → `TARGET_LIST_NOT_FOUND` (RN05, CB04, CA26, CA30);
   3. `M = countCards(targetListId)`;
   4. `appendCards(list.id, targetListId, M)`, que leva as posições `1..K` para `M+1..M+K` (RN06).
8. `remove(list.id)`: na regra `cascade`, os cards vão junto por FK (F54); na regra `move`, a lista já está vazia.
9. `shiftLeft(list.position)` (RF03).
10. Responder com `listAll()`, as listas do quadro inteiro com cards (RF03 F25, RF04).

- **F57.** O passo 7.4 é uma instrução única. Como os K cards ocupam `1..K` e o destino ocupa `1..M`, as novas posições `M+1..M+K` nunca colidem com as existentes, e a unicidade `(list_id, position)` é respeitada ao fim da instrução (RF04, D22).

### 2.4 Front-end

```
front-end/src/
  components/lists/DeleteListWithCardsDialog.tsx   janela de decisão
  components/lists/DeletionOption.tsx              opção de rádio com título, complemento e conteúdo
  lib/listDeletion.ts                              funções puras de estado da janela e de falhas
  components/boards/BoardFormDialog.tsx            alterado: opção de bloqueio no modo editar
  app/(app)/boards/BoardsView.tsx                  alterado: envia e aplica o bloqueio
  app/(app)/boards/[boardId]/BoardView.tsx         alterado: escolhe a janela pela quantidade de cards
  services/listService.ts, services/boardService.ts, lib/api.ts, lib/messages.ts, lib/listsState.ts
```

Regras de fronteira obrigatórias:

- **F58.** A escolha da janela usa `cardCount` do estado do quadro: `0` abre `DeleteListDialog` (RF03) e `> 0` abre `DeleteListWithCardsDialog`. A regra `canConfirmListDeletion` do RF03 (C59) é removida, porque a lista com cards deixa de mostrar só um aviso.
- **F59.** O estado inicial e a validade da janela vêm de funções puras em `lib/listDeletion.ts`:

| Função | Retorna |
| --- | --- |
| `targetOptions(lists, listId)` | listas do quadro, exceto a excluída, na ordem do quadro |
| `suggestedTarget(lists, listId)` | a lista imediatamente à direita; se não houver, a imediatamente à esquerda; se nenhuma existir, `null` (CA07–CA10) |
| `initialDecision(lists, listId, locked)` | com bloqueio: nada selecionado. Sem bloqueio e com destino possível: `move` com o destino sugerido. Sem destino possível: nada selecionado |
| `canConfirm(decision, locked, hasTarget)` | `false` com bloqueio, sem regra ou em `move` sem destino |
| `listDeletionFailureAction(error)` | tabela de F61 |

- **F60.** A janela recebe a lista e as listas do quadro por props. `expectedCardCount` enviado é **sempre** o `cardCount` exibido naquele momento. Quando o quadro é recarregado com a janela aberta:
  - a quantidade exibida e `expectedCardCount` passam a ser os novos (CA23);
  - o bloqueio exibido passa a ser o do quadro recarregado (CA25);
  - um destino selecionado que não existe mais é trocado pelo sugerido (CA26);
  - se a lista excluída não existir mais, a janela fecha (CA27);
  - se a lista ficar sem cards, a janela de decisão fecha e o usuário pode acionar excluir de novo, o que abre a confirmação simples. A regra CA24, lista esvaziada em outra aba e confirmada, é atendida pelo servidor (passo 3), que exclui sem regra.
- **F61.** Tratamento de falhas:

| Código | Ação |
| --- | --- |
| `LIST_NOT_FOUND` | fecha e recarrega o quadro (RN12) |
| `BOARD_NOT_FOUND` | tela `BoardNotFound` |
| `LIST_CARD_COUNT_CHANGED`, `LIST_DELETION_LOCKED`, `TARGET_LIST_NOT_FOUND` | mantém aberta com a mensagem **e** recarrega o quadro (CA23, CA25, CA26) |
| demais, inclusive `VALIDATION_ERROR` e `LIST_DELETION_STRATEGY_REQUIRED` | mantém aberta com a mensagem (CE01) |

- **F62.** A opção de bloqueio é um `<input type="checkbox">` exibido **somente** no modo `edit` do `BoardFormDialog`, inicializado com o valor atual do quadro. O modo `create` não envia o campo (CA02).

---

## 3. Modelo de dados e schema

### 3.1 Tabela `boards`

| Coluna nova | Tipo | Restrições |
| --- | --- | --- |
| `lock_list_deletion` | `boolean` | `NOT NULL DEFAULT false` |

### 3.2 Migration `BoardListDeletionLock`

- `up`: `ALTER TABLE boards ADD COLUMN lock_list_deletion boolean NOT NULL DEFAULT false`. Quadros existentes ficam com `false` (RN03).
- `down`: remove a coluna.

### 3.3 Decisões anteriores alteradas

| Decisão anterior | Nova regra | Motivo |
| --- | --- | --- |
| RF03 RN11 / C54 / A34 / A36: `LIST_HAS_CARDS` 409 | Código **removido**; substituído pelo algoritmo de 2.3 e pelos códigos de 4.5 | A spec do RF05 substitui RN11 do RF03 |
| RF03 C59 / F30: lista com cards só mostra aviso | Lista com cards abre a janela de decisão | Spec 2.3 |
| RF03 `DELETE` de lista sem parâmetros | Aceita `strategy`, `targetListId` e `expectedCardCount` na query; sem eles continua excluindo listas vazias | Compatível com o cliente do RF03 para lista vazia |
| RF03 `ListTransaction.hasCards` | Substituída por `countCards`; entram `isListDeletionLocked` e `appendCards` | F52 |
| RF02 A23: `PUT` de quadro com exatamente `name` e `color` | Aceita também `lockListDeletion` opcional; ausente mantém o valor atual (CB09) | Spec 2.1 |
| RF02 `BoardSummary` | Inclui `lockListDeletion` | A janela de decisão e o "Editar quadro" precisam do valor |

---

## 4. Interfaces: API e contratos

### 4.1 `DELETE /api/boards/:boardId/lists/:listId`

Parâmetros de query, todos opcionais no formato:

| Parâmetro | Formato | Regras de formato (schema) |
| --- | --- | --- |
| `strategy` | `move` ou `cascade` | outro valor → `VALIDATION_ERROR`, `fields.strategy` = "Escolha o que deve acontecer com os cards da lista." (CB02) |
| `targetListId` | texto | ausente com `strategy=move` → `VALIDATION_ERROR`, `fields.targetListId` = "Selecione outra lista de destino." (CB03); formato de UUID é verificado no serviço (C95) |
| `expectedCardCount` | inteiro decimal ≥ 0 | não inteiro, negativo ou acima de `Number.MAX_SAFE_INTEGER` → `VALIDATION_ERROR`, `fields.expectedCardCount` = "Escolha o que deve acontecer com os cards da lista." (CB06) |

- **A42.** A regra vai na query, e não no corpo, porque corpos de `DELETE` não têm semântica definida e podem ser descartados por intermediários. Os três valores são curtos e não sensíveis.
- **A43.** Parâmetro repetido (`?strategy=move&strategy=cascade`) é tratado como formato inválido do respectivo campo.

Respostas:

| Status | Código | Situação |
| --- | --- | --- |
| `200` | — | `{ "lists": ListWithCards[] }`, o quadro inteiro após a exclusão |
| `400` | `VALIDATION_ERROR` | formato inválido (4.1) ou destino igual à lista excluída |
| `404` | `BOARD_NOT_FOUND` | quadro inacessível |
| `404` | `LIST_NOT_FOUND` | lista inexistente, de outro quadro ou malformada |
| `409` | `LIST_DELETION_LOCKED` | lista com cards e bloqueio ligado |
| `409` | `LIST_DELETION_STRATEGY_REQUIRED` | lista com cards sem `strategy` ou sem `expectedCardCount` |
| `409` | `LIST_CARD_COUNT_CHANGED` | `expectedCardCount` diferente da quantidade atual |
| `409` | `TARGET_LIST_NOT_FOUND` | destino inexistente, de outro quadro ou malformado |

- **A44.** `LIST_CARD_COUNT_CHANGED` não traz a quantidade atual no corpo; o envelope de erro continua o do RF01 (A7). O cliente obtém a quantidade atual recarregando o quadro (F61), o que também atualiza as demais listas.
- **A45.** `TARGET_LIST_NOT_FOUND` é `409`, e não `404`, porque o recurso da URL (a lista a excluir) existe; o conflito é com o estado de outra lista. Isso impede que o cliente confunda os dois casos e feche a janela.

### 4.2 `PUT /api/boards/:boardId` (alterado)

| Campo | Tipo | Regras |
| --- | --- | --- |
| `name`, `color` | — | sem mudança (RF02) |
| `lockListDeletion` | boolean | opcional; ausente mantém o valor atual (CB09); presente e não booleano → `VALIDATION_ERROR`, `fields.lockListDeletion` = "Valor inválido." (CB08) |

A resposta `BoardSummary` inclui `lockListDeletion`.

### 4.3 Representações alteradas

- `BoardSummary` e `BoardDetail` ganham `lockListDeletion: boolean`.
- `POST /api/boards` descarta `lockListDeletion` enviado, e o quadro nasce com `false` (CA02).

### 4.4 Front-end

| Função | Chamada |
| --- | --- |
| `listService.remove(boardId, listId)` | lista vazia (RF03), sem parâmetros |
| `listService.remove(boardId, listId, { strategy, targetListId?, expectedCardCount })` | lista com cards |
| `boardService.update(boardId, { name, color, lockListDeletion })` | modo editar sempre envia os três |

Os parâmetros de query são montados com `URLSearchParams`, nunca por concatenação de texto.

### 4.5 Erros

- **A46.** Novos códigos e mensagens:

| Código | Status | Mensagem |
| --- | --- | --- |
| `LIST_DELETION_LOCKED` | 409 | "A exclusão de listas com cards está bloqueada neste quadro." |
| `LIST_DELETION_STRATEGY_REQUIRED` | 409 | "Escolha o que deve acontecer com os cards da lista." |
| `LIST_CARD_COUNT_CHANGED` | 409 | "A lista foi alterada enquanto esta janela estava aberta. Revise e confirme novamente." |
| `TARGET_LIST_NOT_FOUND` | 409 | "A lista de destino não existe mais. Escolha outra lista." |

- **A47.** `LIST_HAS_CARDS` deixa de existir na API, no front-end e nos testes.
- **A48.** A lista fechada de códigos passa a ser:
  - `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `UNAUTHENTICATED`, `SESSION_EXPIRED`, `INTERNAL_ERROR`;
  - `BOARD_NOT_FOUND`, `LIST_NOT_FOUND`, `CARD_NOT_FOUND`;
  - `LIST_DELETION_LOCKED`, `LIST_DELETION_STRATEGY_REQUIRED`, `LIST_CARD_COUNT_CHANGED`, `TARGET_LIST_NOT_FOUND`.

---

## 5. Requisitos não funcionais

### 5.1 Desempenho

| Operação | Alvo (p95, local) | Condição |
| --- | --- | --- |
| Exclusão com `move` | < 150 ms | lista com 500 cards, destino com 500 cards |
| Exclusão com `cascade` | < 150 ms | lista com 500 cards |
| `PUT` do quadro com bloqueio | < 100 ms | — |

- **N90.** Número **constante** de instruções, independente de K e M. No pior caso, a regra `move`:
  - bloqueio (1);
  - `findList` origem (1);
  - `countCards` origem (1);
  - `isListDeletionLocked` (1);
  - `findList` destino (1);
  - `countCards` destino (1);
  - `appendCards` (1);
  - `remove` (1);
  - `shiftLeft` (1);
  - `listAll` (2).

  Proibido mover ou excluir cards com uma instrução por card.
- **N91.** A cascata usa o índice da FK `cards.list_id` (a unicidade `UQ_cards_list_position` começa por `list_id`), e `appendCards` usa o mesmo índice.
- **N92.** O front-end não faz requisição extra ao abrir a janela: quantidade, destinos e bloqueio vêm do estado do quadro já carregado. Só recarrega o quadro nos casos de F61.

### 5.2 Segurança

- **N93.** A exclusão continua escopada pelo bloqueio do quadro com dono (C46, C67). Quadro inacessível responde `BOARD_NOT_FOUND` antes de qualquer leitura de listas ou cards (CA29).
- **N94.** O destino é resolvido com `findList`, filtrado pelo quadro bloqueado. `appendCards` também filtra origem e destino pelo quadro na própria instrução, então cards nunca vão para lista de outro quadro, mesmo com `targetListId` válido (CA30).
- **N95.** O bloqueio de exclusão só é alterado pelo `PUT` do quadro, escopado por dono (RF02 C27). Nenhuma outra rota altera `lock_list_deletion`.
- **N96.** `expectedCardCount` é validado como inteiro seguro antes de chegar ao serviço; `targetListId` é validado como UUID antes de chegar ao banco (N30).
- **N97.** Nomes de listas na janela de decisão são renderizados como texto (CB05 do RF03).

### 5.3 Integridade e concorrência

- **N98.** Atomicidade (RN09) por transação única do `runInBoardLock`. Qualquer falha nos passos 7 a 10 desfaz a transferência, a exclusão e o recuo das posições (CE02).
- **N99.** Serialização (RN11) pelo bloqueio compartilhado. Uma criação ou movimentação de card para a lista espera a exclusão terminar e então recebe `LIST_NOT_FOUND` (RF04), ou acontece antes e muda K, que é detectado pelo passo 6.
- **N100.** A conferência da quantidade (passo 6) é feita **depois** do bloqueio, garantindo que o K conferido é o K excluído ou transferido.
- **N101.** Depois de `move`, a lista de destino ocupa `1..M+K`, e as listas ocupam `1..N-1` (RN10). A ordem dos passos 7 a 9 mantém a unicidade das posições de listas e de cards.

### 5.4 Interface e acessibilidade

- **N102.** A janela usa `Modal` com título "Excluir a lista "{nome}"?", o texto de quantidade e um `<fieldset>` com `<legend>` visualmente oculta "O que fazer com os cards". Cada opção é um `<label>` com rádio, título e complemento. A opção 3 é um rádio desabilitado.
- **N103.** O seletor de destino fica dentro da opção 1, com rótulo acessível "Lista de destino", e é desabilitado quando a opção 1 não está selecionada ou está desabilitada.
- **N104.** Com bloqueio, a opção 3 aparece com o indicador visual de ativa, não só por cor, e o aviso é exibido em `Alert` informativo.
- **N105.** "Confirmar" tem aparência destrutiva e fica desabilitado conforme `canConfirm`. O foco inicial vai para "Cancelar" (C62).
- **N106.** O layout segue `prototipo/modais/excluir-lista.png`: ícone de alerta ao lado do título, opções em cartões com borda, opção recomendada com o seletor dentro do cartão, e botões "Cancelar" e "Confirmar" à direita.

### 5.5 Testabilidade

- **N107.** Funções puras de `lib/listDeletion.ts` testadas com o quadro de exemplo da spec: sugestão à direita e à esquerda, lista única, bloqueio, `canConfirm` e tabela de F61.
- **N108.** `ListService` testado com o repositório em memória do RF04, estendido com as primitivas de F52 e com a verificação de unicidade por primitiva. Casos obrigatórios:
  - todos os ramos de 2.3;
  - a ordem de avaliação;
  - `appendCards` preservando ids e ordem;
  - rollback em falha de cada primitiva de escrita.
- **N109.** A sequência aleatória do RF04 passa a incluir exclusão de lista com `move` e `cascade`, verificando posições `1..N` de listas e de cards e a preservação dos ids transferidos.
- **N110.** Integração com PostgreSQL, pulada sem `TEST_DATABASE_URL`, cobrindo:
  - `appendCards` sem violar `UQ_cards_list_position`;
  - cascata real removendo cards;
  - exclusão concorrente com criação de card na lista (CA23 e RN11);
  - bloqueio lido sob `FOR UPDATE`;
  - migration.

---

## 6. Restrições consolidadas

| # | Restrição |
| --- | --- |
| C93 | Nenhuma dependência nova; rádios, checkbox e select nativos |
| C94 | `boards.lock_list_deletion boolean NOT NULL DEFAULT false`, migration reversível |
| C95 | Ordem do algoritmo de exclusão: lista → quantidade → vazia exclui → bloqueio → regra → conferência → destino → transferência → remoção → recuo |
| C96 | Toda a decisão dentro de `withBoardLock` (bloqueio compartilhado do RF04) |
| C97 | `ListTransaction`: `hasCards` substituída por `countCards`; novas `isListDeletionLocked` e `appendCards` |
| C98 | `appendCards` em instrução única com `position + M`, filtrando origem e destino pelo quadro |
| C99 | Cascata de cards pela FK; nenhuma exclusão de card por card |
| C100 | Transferência preserva `id` dos cards |
| C101 | Número constante de instruções por exclusão (N90) |
| C102 | Regra em query string: `strategy` (`move`/`cascade`), `targetListId`, `expectedCardCount` |
| C103 | Schema valida só formato; estado do quadro é verificado no serviço |
| C104 | Lista vazia ignora a regra e é excluída; `DELETE` sem parâmetros continua válido para ela |
| C105 | `expectedCardCount` diferente da quantidade atual → `409 LIST_CARD_COUNT_CHANGED`, sem alteração |
| C106 | Destino igual à lista → `400 VALIDATION_ERROR`; destino inexistente, de outro quadro ou malformado → `409 TARGET_LIST_NOT_FOUND` |
| C107 | `LIST_HAS_CARDS` removido da API, do front-end e dos testes |
| C108 | `PUT` do quadro aceita `lockListDeletion` opcional; ausente mantém; `POST` descarta |
| C109 | `BoardSummary` e `BoardDetail` expõem `lockListDeletion` |
| C110 | Front-end escolhe a janela por `cardCount`: 0 → confirmação do RF03; > 0 → janela de decisão |
| C111 | Estado da janela por funções puras (`targetOptions`, `suggestedTarget`, `initialDecision`, `canConfirm`) |
| C112 | `expectedCardCount` = quantidade exibida; recarga do quadro atualiza quantidade, bloqueio e destinos da janela aberta |
| C113 | Tratamento de falhas pela tabela de F61 |
| C114 | Opção de bloqueio apenas no modo editar, enviada sempre nesse modo |
| C115 | Parâmetros montados com `URLSearchParams` |
| C116 | Testes: funções puras, serviço em memória com todos os ramos, sequência aleatória com exclusão de listas, integração condicionada |

---

## 7. Rastreabilidade: critério de aceite → mecanismo

| Critérios | Mecanismo |
| --- | --- |
| CA01–CA04 | `BoardFormDialog` modo editar + `PUT` com `lockListDeletion` (C108, C114), coluna com default (C94) |
| CA05, CA06, CA21 | escolha da janela por `cardCount` (C110); passo 3 antes do bloqueio (C95) |
| CA07–CA10 | `targetOptions`, `suggestedTarget`, `initialDecision`, `canConfirm` (C111) |
| CA11 | `Modal` sem requisição ao fechar |
| CA12–CA15 | `appendCards` com `offset = M` (C98), preservação de `id` (C100), `listAll` na resposta |
| CA16–CA18 | cascata pela FK (C99); contagens do RF02; `CARD_NOT_FOUND` do RF04 |
| CA19, CA20, CA22 | bloqueio exibido pela prop do quadro; passo 4 do servidor (C95) |
| CA23 | passo 6 + F61 com recarga (C105, C112) |
| CA24 | passo 3 no servidor (C104) |
| CA25 | passo 4 + F61 com recarga |
| CA26, CA30 | passo 7.2 → `TARGET_LIST_NOT_FOUND` + recarga (C106, N94) |
| CA27 | passo 1 → `LIST_NOT_FOUND` → fecha e recarrega (F61) |
| CA28 | `useSubmitLock` + bloqueio compartilhado + conferência da quantidade |
| CA29 | `withBoardLock` escopado por dono; `PUT` escopado por dono |
| CA31 | passo 7.1 → `VALIDATION_ERROR` |
| CA32 | `authenticate` + interceptador do RF01 |
| CB01–CB06 | schema de 4.1 e passos 5, 7.1 e 7.2 |
| CB07 | passo 3 |
| CB08, CB09 | schema de 4.2 |
| CB10–CB12 | instruções únicas (C98, C99, C101) |
| CB13–CB20 | bloqueio compartilhado, conferência e F61 |
| CE01–CE04 | janela mantida em erro, transação única (N98), envelope de erro do RF01 |

---

## 8. Riscos e decisões registradas

| Risco / decisão | Análise |
| --- | --- |
| Conferência pela quantidade, e não pelos ids | É o que a spec define (CB14). Trocar um card por outro mantendo a quantidade passa pela conferência. Aceito: a janela informa quantidade, não quais cards. |
| Regra na query string de `DELETE` | Mantém o verbo semântico e evita corpo em `DELETE`. Os parâmetros não são sensíveis e ficam registrados em logs de acesso, o que é aceitável. |
| Remoção de `LIST_HAS_CARDS` | Muda um contrato do RF03. Como o único cliente é o front-end do projeto, a troca é feita junto, e os testes do RF03 que o citam passam a verificar os novos códigos. |
| Janela fechada quando a lista fica vazia após recarga | Evita uma janela de decisão sobre zero cards. A spec (CA24) cobre a confirmação enviada antes da recarga, e o servidor a atende. |
| Recarga do quadro após conflitos | Uma requisição extra só nos casos de conflito. Mantém a janela coerente sem mudar o envelope de erro. |
| Bloqueio verificado depois de "lista vazia" | Garante CA06 e CA21: o bloqueio nunca impede excluir lista vazia. |
| Cascata dependente de FKs futuras | D9 do RF02 já obriga `ON DELETE CASCADE` em toda tabela dependente de card. Um requisito futuro que ignore D9 quebraria RN07; a integração deve incluir essas tabelas quando existirem. |
