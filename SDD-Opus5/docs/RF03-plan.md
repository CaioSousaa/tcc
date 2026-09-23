# RF03 — Plano técnico

**Base:** `docs/RF03-spec.md` (especificação funcional aprovada).
**Herda de:** `docs/RF01-plan.md` (C01–C24) e `docs/RF02-plan.md` (C25–C43). Este plano acrescenta C44–C66 e **revoga ou altera explicitamente** duas decisões do RF02, listadas em 3.4.
**Considera:** `docs/RF02-validation.md`. As divergências D1 e D2 do componente `Modal` passam a ser restrições deste plano, porque as janelas do RF03 dependem dele.

Onde aparece "deve", a implementação não tem liberdade de escolha. Onde aparece "pode", há margem, desde que os critérios de aceite continuem verificáveis.

---

## 1. Tecnologias e frameworks

### 1.1 Stack

Nenhuma troca de tecnologia.

| Camada | Tecnologia | Uso no RF03 |
| --- | --- | --- |
| Banco | PostgreSQL | posições contíguas, unicidade `(board_id, position)` adiável, bloqueio de linha do quadro, transações |
| ORM | TypeORM | transação com `EntityManager`, migration |
| API | Express 5 + TypeScript | rotas aninhadas `/api/boards/:boardId/lists` |
| Validação | `zod`/validadores próprios existentes | nome e posição |
| Front-end | Next.js 16 + React 19 + Tailwind 4 | colunas, janela "Lista", confirmação de exclusão |
| Testes | `vitest` | unitários; integração contra PostgreSQL condicionada a variável de ambiente (5.5) |

### 1.2 Dependências novas

**Nenhuma.** Restrições:

- **T4.** A seleção de posição usa o elemento nativo `<select>`. Bibliotecas de arrastar e soltar (`dnd-kit`, `react-beautiful-dnd`, `sortablejs`) **não** devem ser adicionadas: reordenar arrastando está fora de escopo.
- **T5.** A regra C25 do RF02 continua valendo: nenhuma biblioteca de modal, componentes ou estado.

---

## 2. Arquitetura de componentes e fronteiras

### 2.1 Visão geral

```
Navegador
  /boards/[boardId]  BoardView
     ├── BoardLists            colunas + "Adicionar lista" + estado vazio
     │     └── ListColumn      nome, quantidade de cards, editar, excluir
     ├── ListFormDialog        janela "Lista" (adicionar / editar) com pré-visualização
     ├── DeleteListDialog      confirmação
     └── listService  →  POST/PATCH/DELETE /api/boards/:boardId/lists[/:listId]

API Express
  /api/boards/:boardId/lists
    authenticate → validateBoardId → validate(body) → ListController → ListService
        → BoardListRepository.withBoardLock(scope, boardId, tx => ...) → PostgreSQL (transação)
```

### 2.2 Back-end: componentes

```
back-end/src/
  domain/
    lists.ts                     LIST_NAME_MAX, tipos ListItem, função pura clampPosition
  services/
    boardAccess.ts               boardScopeFor(userId): ponto único de autorização (extraído do RF02)
    ListService.ts
  repositories/
    BoardListRepository.ts       interface ListTransaction + withBoardLock + implementação TypeORM
  controllers/
    ListController.ts
  routes/
    list.routes.ts               Router com mergeParams, montado sob /api/boards/:boardId/lists
  schemas/
    list.schemas.ts
  migrations/
    <timestamp>-ListPositionsAndNameLimit.ts
```

Responsabilidades e proibições:

| Componente | Responsabilidade | Proibições |
| --- | --- | --- |
| `boardAccess.ts` | produzir o `BoardScope` do usuário | ser duplicado; nenhum serviço monta `BoardScope` por conta própria |
| `list.schemas.ts` | validar e normalizar `name` e `position` | consultar banco; limitar a posição ao número de listas, que é regra de serviço |
| `ListController` | ler `req.user.id` e parâmetros, chamar o serviço, serializar | regra de negócio |
| `ListService` | RN01–RN16: limite de posição, inserção, movimentação, remoção, bloqueio de exclusão com cards, tradução de erros | conhecer Express, SQL ou TypeORM |
| `BoardListRepository` | abrir transação, bloquear o quadro, oferecer operações primitivas sobre listas daquele quadro | decidir posição final, decidir se pode excluir |

Regras de fronteira obrigatórias:

- **F20.** O ponto único de autorização do RF02 (F10) é extraído para `services/boardAccess.ts` e usado por `BoardService` e `ListService`. O comportamento do RF02 não muda.
- **F21.** Toda operação que altera listas roda dentro de `withBoardLock(scope, boardId, callback)`. Esse método:
  1. abre uma transação;
  2. executa `SELECT id FROM boards WHERE id = :boardId AND owner_id = :ownerId FOR UPDATE`;
  3. se nenhuma linha voltar, encerra a transação e sinaliza "quadro inacessível", que o serviço converte em `BOARD_NOT_FOUND`;
  4. caso contrário, entrega ao callback um objeto `ListTransaction` restrito àquele quadro e confirma a transação ao final; qualquer exceção desfaz tudo.
- **F22.** `ListTransaction` expõe apenas primitivas sem regra de negócio, todas implicitamente filtradas pelo `board_id` bloqueado:
  - `count()`;
  - `findList(listId)` (retorna `null` para lista de outro quadro);
  - `hasCards(listId)`;
  - `shiftRight(fromPosition)`;
  - `insert(list)`;
  - `rename(listId, name)`;
  - `move(listId, from, to)`;
  - `remove(listId)`;
  - `shiftLeft(afterPosition)`;
  - `listAll()`.

  O serviço compõe essas primitivas.
- **F23.** Toda alteração estrutural de listas **e de cards**, inclusive as do RF04 e do RF05, deve adquirir o mesmo bloqueio de linha do quadro antes de escrever. É isso que torna RN05 e RN11 verdadeiras com operações simultâneas, e o RF04 fica obrigado a respeitá-lo (C47).
- **F24.** O serviço valida o formato de `listId` (UUID) **depois** de confirmar o acesso ao quadro. Assim, um quadro inacessível responde sempre `BOARD_NOT_FOUND` (CA35), mesmo com `listId` malformado, e um quadro acessível com `listId` malformado responde `LIST_NOT_FOUND`.
- **F25.** Toda resposta de sucesso que altera listas devolve a lista completa do quadro, lida **dentro da mesma transação** após a alteração. O cliente substitui seu estado por ela (CB12, CB13, CB16, CB18).

### 2.3 Algoritmos de posição

Executados pelo `ListService` sobre `ListTransaction`, dentro da transação e do bloqueio:

**Criar (RN06, RN09, CB07):**
1. `N = count()`.
2. `P = clampPosition(requested ?? N+1, N+1)`.
3. `shiftRight(P)`: `position = position + 1` para `position >= P`.
4. `insert({ id, name, position: P })`.

**Editar (RN07, RN09, CB08, CB16):**
1. `list = findList(listId)`; ausente → `LIST_NOT_FOUND`.
2. `rename(listId, name)`.
3. Se `requested` estiver presente: `N = count()`, `B = clampPosition(requested, N)`, e `move(listId, list.position, B)` quando `B ≠ list.position`.

**Excluir (RN08, RN11):**
1. `list = findList(listId)`; ausente → `LIST_NOT_FOUND`.
2. `hasCards(listId)` verdadeiro → `LIST_HAS_CARDS`, sem alterar nada.
3. `remove(listId)`.
4. `shiftLeft(list.position)`: `position = position - 1` para `position > P`.

**`clampPosition(requested, max)`:** retorna `min(requested, max)`. A validação de schema já garante `requested` inteiro ≥ 1.

- **F26.** `move` deve ser **uma única instrução `UPDATE`**, que atribui `B` à lista movida e desloca as intermediárias ±1 com `CASE`, limitada ao intervalo entre `min(A,B)` e `max(A,B)`. `shiftRight` e `shiftLeft` também são uma instrução cada. A unicidade adiável (D19) é verificada ao final de cada instrução, o que permite esses deslocamentos sem colisão intermediária.

### 2.4 Front-end: componentes

```
front-end/src/
  app/(app)/boards/[boardId]/BoardView.tsx      alterado: delega listas a BoardLists
  components/lists/
    BoardLists.tsx
    ListColumn.tsx
    AddListButton.tsx
    ListFormDialog.tsx
    PositionSelect.tsx
    ListOrderPreview.tsx
    DeleteListDialog.tsx
  services/listService.ts
  schemas/list.ts
  lib/listOrder.ts                               funções puras de pré-visualização e opções de posição
  components/Modal.tsx                           alterado: foco inicial e evento close (D1, D2 do RF02)
```

Regras de fronteira obrigatórias:

- **F27.** Pré-visualização e opções de posição são calculadas por funções puras de `lib/listOrder.ts`:
  - `positionOptions(count, mode)` retorna `1..count+1` na criação e `1..count` na edição;
  - `previewOrder(lists, draft)` retorna a ordem resultante com o item destacado.

  Os componentes não reimplementam essa lógica.
- **F28.** O estado das listas vive em `BoardView` (é o `board.lists`). Após cada operação bem-sucedida, ele é **substituído integralmente** pelo array `lists` da resposta (F25). Nunca se aplica a movimentação localmente para "adivinhar" a ordem salva.
- **F29.** A pré-visualização trabalha sobre uma **cópia** das listas feita ao abrir a janela e não altera o quadro exibido ao fundo (CA23).
- **F30.** A ação de excluir de uma lista com `cardCount > 0` **não** abre a confirmação: exibe a mensagem de RN11 em aviso no quadro (CA33). Se o servidor responder `LIST_HAS_CARDS` depois da confirmação, porque a lista recebeu cards nesse meio-tempo, a janela exibe a mesma mensagem e permanece aberta.
- **F31.** `LIST_NOT_FOUND` na edição fecha a janela, exibe "Lista não encontrada." em aviso no quadro e recarrega o quadro (CB14). `LIST_NOT_FOUND` na exclusão fecha a janela sem erro e recarrega o quadro (RN15, CB15). `BOARD_NOT_FOUND` em qualquer operação leva a `BoardNotFound` (CB17).
- **F32.** `ListFormDialog` é um único componente para adicionar e editar (mesmo princípio de C39). Ele é montado ao abrir e desmontado ao fechar, garantindo que a reabertura parta dos valores padrão ou atuais (CA15).
- **F33.** `Modal` deve ser corrigido antes do uso pelas janelas do RF03:
  - **foco inicial:** após `showModal()`, mover o foco para o elemento marcado com `data-autofocus` dentro da janela, ou para o primeiro campo quando não houver marcação;
  - **fechamento nativo:** tratar o evento `close` do `<dialog>`. Se a janela fechar nativamente enquanto `busy`, ela deve ser reaberta; fora de `busy`, o fechamento deve ser propagado a `onClose`.

---

## 3. Modelo de dados e schema

### 3.1 Tabela `lists` após o RF03

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `uuid` | chave primária (sem mudança) |
| `board_id` | `uuid` | `NOT NULL`, FK → `boards.id` `ON DELETE CASCADE` (sem mudança) |
| `name` | `varchar(50)` | `NOT NULL`, `CHECK (char_length(name) BETWEEN 1 AND 50)` |
| `position` | `integer` | `NOT NULL`, `CHECK (position >= 1)` |
| `created_at` | `timestamptz` | sem mudança |
| `updated_at` | `timestamptz` | atualizado em renomeação e em movimentação |

Restrição nova: `UQ_lists_board_position UNIQUE (board_id, position) DEFERRABLE INITIALLY IMMEDIATE`.

### 3.2 Migration `ListPositionsAndNameLimit`

Ordem obrigatória no `up`:
1. Renumerar posições existentes para `1..N` por quadro, com `ROW_NUMBER() OVER (PARTITION BY board_id ORDER BY position, created_at, id)`.
2. Substituir `CHK_lists_position (position >= 0)` por `CHECK (position >= 1)`.
3. Alterar `name` para `varchar(50)` e adicionar `CHK_lists_name_length`.
4. Remover `IDX_lists_board_position` e criar `UQ_lists_board_position`, cujo índice passa a servir à ordenação.

O `down` reverte na ordem inversa: remove a unicidade e recria o índice, volta `name` para `varchar(100)`, restaura `CHECK (position >= 0)` e subtrai 1 das posições.

- **D18.** Se alguma lista existente tiver nome com mais de 50 caracteres, o passo 3 falha e a migration inteira é desfeita. Hoje isso não ocorre, porque o único caminho de criação é o das listas padrão do RF02. A migration não deve truncar nomes silenciosamente.
- **D19.** A unicidade `(board_id, position)` é `DEFERRABLE INITIALLY IMMEDIATE`: verificada ao fim de cada instrução, e não a cada linha. É a garantia no banco contra posições repetidas (RN05). A contiguidade (sem lacunas) não é expressável como restrição e é garantida pelo bloqueio (F21) mais os algoritmos (2.3), verificados por teste (5.5).
- **D20.** Não se usa posição fracionária nem espaçamento entre posições. A spec exige posições visíveis `1..N`, e manter o valor salvo igual ao valor exibido elimina conversões e erros de base.

### 3.3 Cards

Nenhuma alteração na tabela `cards`. `hasCards` e a contagem por lista usam `IDX_cards_list`.

### 3.4 Decisões do RF02 revogadas ou alteradas

| Decisão do RF02 | Nova regra | Motivo |
| --- | --- | --- |
| D14 — listas padrão nas posições `0, 1, 2` | Listas padrão nas posições `1, 2, 3`; `BoardService` e seus testes devem ser ajustados | D20: base única igual à posição exibida |
| D8 — `name varchar(100)` provisório | `varchar(50)` com `CHECK` | RN03 do RF03 |
| `CHECK (position >= 0)` | `CHECK (position >= 1)` + unicidade adiável | RN05 |
| `BoardDetail.lists` = `{ id, name, position }` | `{ id, name, position, cardCount }` | CA01, CA02 |
| Texto de quadro sem listas no front-end | "Este quadro ainda não tem listas. Adicione a primeira para começar." | spec 5.4 |

---

## 4. Interfaces: API e contratos

### 4.1 Convenções

- Rotas sob `/api/boards/:boardId/lists`, todas com `authenticate` (C26) e `validateBoardId` (N30).
- Ordem de avaliação: sessão → formato de `boardId` → acesso ao quadro (bloqueio) → formato de `listId` → existência da lista no quadro → validação de regra (cards).
- A validação de corpo (`VALIDATION_ERROR`) ocorre antes do acesso ao quadro, como no RF02. Um corpo inválido enviado a quadro inacessível responde `400`, que não revela nada sobre o quadro.
- Campos desconhecidos são descartados (CB10).

### 4.2 Representação `ListItem`

| Campo | Tipo |
| --- | --- |
| `id` | string (UUID) |
| `name` | string |
| `position` | inteiro ≥ 1 |
| `cardCount` | inteiro ≥ 0 |

`lists` é sempre um array de `ListItem` ordenado por `position ASC`, com posições exatamente `1..N`.

### 4.3 `GET /api/boards/:boardId` (alterado)

Sem mudança de rota nem de status. `board.lists` passa a ser `ListItem[]` (com `cardCount`). Continua em no máximo duas consultas (N24): a consulta de listas agrega a contagem de cards por subconsulta.

### 4.4 `POST /api/boards/:boardId/lists`

Requisição:

| Campo | Tipo | Regras |
| --- | --- | --- |
| `name` | string | obrigatório; corte das extremidades; 1 a 50 caracteres (RN03) |
| `position` | inteiro | opcional; se presente, inteiro seguro ≥ 1; ausente equivale a final (CB07); acima de N+1 vira N+1 (RN09) |

Respostas:

| Status | Situação | Corpo |
| --- | --- | --- |
| `201` | criada | `{ "list": ListItem, "lists": ListItem[] }` |
| `400` | validação | `VALIDATION_ERROR` com `fields.name` e/ou `fields.position` |
| `404` | quadro inacessível | `BOARD_NOT_FOUND` |

### 4.5 `PATCH /api/boards/:boardId/lists/:listId`

Requisição:

| Campo | Tipo | Regras |
| --- | --- | --- |
| `name` | string | **obrigatório** (a janela sempre envia); mesmas regras da criação |
| `position` | inteiro | opcional; ausente mantém a posição (CB08); acima de N vira N (RN09) |

Respostas:

| Status | Situação | Corpo |
| --- | --- | --- |
| `200` | atualizada, inclusive sem mudança (CA24) | `{ "list": ListItem, "lists": ListItem[] }` |
| `400` | validação | `VALIDATION_ERROR` |
| `404` | quadro inacessível | `BOARD_NOT_FOUND` |
| `404` | lista inexistente, de outro quadro ou `listId` malformado | `LIST_NOT_FOUND` |

- **A31.** `PATCH`, e não `PUT`, porque `position` é opcional e sua ausência tem significado definido (manter). `name` é obrigatório porque a spec não prevê edição só de posição sem nome.

### 4.6 `DELETE /api/boards/:boardId/lists/:listId`

| Status | Situação | Corpo |
| --- | --- | --- |
| `200` | excluída | `{ "lists": ListItem[] }` |
| `404` | quadro inacessível | `BOARD_NOT_FOUND` |
| `404` | lista inexistente, de outro quadro ou `listId` malformado | `LIST_NOT_FOUND` |
| `409` | lista com cards | `LIST_HAS_CARDS` |

- **A32.** A exclusão responde `200` com a ordem salva, e não `204`, para cumprir F25 sem uma segunda requisição.
- **A33.** Mesmo princípio de A26 do RF02: a API responde `404` quando nada foi excluído, e o front-end trata `LIST_NOT_FOUND` na exclusão como sucesso e recarrega o quadro (RN15).

### 4.7 Erros

- **A34.** Novos códigos:

| Código | Status | Mensagem |
| --- | --- | --- |
| `LIST_NOT_FOUND` | 404 | "Lista não encontrada." |
| `LIST_HAS_CARDS` | 409 | "Esta lista contém cards e não pode ser excluída. Mova ou exclua os cards antes." |

  A lista fechada de códigos passa a ser: `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `UNAUTHENTICATED`, `SESSION_EXPIRED`, `BOARD_NOT_FOUND`, `LIST_NOT_FOUND`, `LIST_HAS_CARDS`, `INTERNAL_ERROR`.

- **A35.** Mensagens de campo:

| Campo | Situação | Mensagem |
| --- | --- | --- |
| `name` | vazio, só espaços, ausente ou não texto | "Campo obrigatório." |
| `name` | acima de 50 caracteres | "O nome da lista deve ter no máximo 50 caracteres." |
| `position` | presente e não inteiro, fracionário, ≤ 0 ou acima de `Number.MAX_SAFE_INTEGER` | "Selecione uma posição válida." |

- **A36.** `LIST_HAS_CARDS` será removido ou redefinido pelo RF05, que substitui RN11. O código não deve depender dele fora do fluxo de exclusão de lista.

### 4.8 Front-end: `listService`

| Função | Chamada | Retorno |
| --- | --- | --- |
| `create(boardId, { name, position })` | `POST` | `{ list, lists }` |
| `update(boardId, listId, { name, position })` | `PATCH` | `{ list, lists }` |
| `remove(boardId, listId)` | `DELETE` | `{ lists }` |

A janela sempre envia `position`, com o valor do seletor. A omissão de `position` só existe no contrato para CB07 e CB08.

---

## 5. Requisitos não funcionais

### 5.1 Desempenho

| Operação | Alvo (p95, local) | Condição |
| --- | --- | --- |
| `POST` / `PATCH` / `DELETE` de lista | < 100 ms | quadro com até 100 listas |
| `GET /api/boards/:boardId` | < 100 ms | até 100 listas e 2.000 cards |

- **N44.** Cada operação de lista usa um número **constante** de instruções, independente de N. Em uma transação:
  - bloqueio do quadro (1);
  - `count` (1);
  - `findList` (1);
  - `hasCards`, quando aplicável (1);
  - deslocamento em instrução única (1);
  - escrita da lista (1);
  - `listAll` com contagem de cards (1).

  É proibido atualizar posições com uma instrução por lista.
- **N45.** `listAll` e a consulta de listas do `GET` do quadro usam uma única consulta com subconsulta `count(*)` por lista, apoiada em `IDX_cards_list`, e ordenam por `position` usando o índice de `UQ_lists_board_position`.
- **N46.** A transação define `SET LOCAL lock_timeout = '5s'`. Esgotado o tempo, a operação falha com `INTERNAL_ERROR` e é desfeita (CE03), sem deixar requisições penduradas indefinidamente.
- **N47.** O front-end não faz requisição extra após criar, editar ou excluir com sucesso (F25, F28). Só recarrega o quadro nos casos de `LIST_NOT_FOUND` (F31).

### 5.2 Segurança

- **N48.** Autorização pelo bloqueio escopado por dono (F21): nenhuma primitiva de `ListTransaction` existe fora de um quadro já confirmado como acessível.
- **N49.** Toda primitiva filtra por `board_id` do quadro bloqueado, inclusive `findList`, `rename`, `move` e `remove`. Uma lista de outro quadro nunca é alterada, mesmo que o `listId` seja válido (CA36).
- **N50.** Respostas para quadro inacessível são idênticas às do RF02 (RN02, N29). `LIST_NOT_FOUND` só é possível após o acesso ao quadro ser confirmado, e portanto não revela listas de quadros alheios.
- **N51.** Todos os valores entram no SQL como parâmetros vinculados (N9). `position` é validado como inteiro seguro antes de chegar ao banco, evitando estouro de `integer` convertido em `500`.
- **N52.** Nome renderizado como texto; `dangerouslySetInnerHTML` continua proibido (CB05), inclusive na pré-visualização e no título da confirmação.

### 5.3 Integridade e concorrência

- **N53.** RN05 é garantida por três camadas combinadas:
  - bloqueio de linha do quadro, que serializa escritas estruturais do mesmo quadro;
  - algoritmos de 2.3, que preservam `1..N`;
  - unicidade adiável, a última barreira contra repetição.
- **N54.** RN10 é garantida por transação única por operação. Nenhuma operação faz commit parcial.
- **N55.** RN11 é verificada **dentro** do bloqueio (C47). Com F23, a criação de card no RF04 também adquire o bloqueio, então não há janela entre "não tem cards" e "exclui".
- **N56.** O bloqueio é por quadro: operações em quadros diferentes não se bloqueiam. A API continua sem estado (N15, N35).
- **N57.** Excluir um quadro (RF02) continua removendo listas em cascata. O `DELETE` do quadro não precisa do bloqueio de listas: a exclusão da linha já bloqueia o quadro, e operações de lista concorrentes esperam e depois recebem `BOARD_NOT_FOUND`.

### 5.4 Interface e acessibilidade

- **N58.** Colunas em faixa horizontal com rolagem própria; cabeçalho do quadro fixo no topo durante a rolagem (spec 2.1).
- **N59.** Ações de editar e excluir de cada coluna são botões com rótulo acessível que inclui o nome da lista ("Editar lista A fazer", "Excluir lista A fazer").
- **N60.** `PositionSelect` é um `<select>` com rótulo "Posição no quadro"; as opções exibem apenas o número.
- **N61.** A pré-visualização é uma lista ordenada (`<ol>`) só de leitura, com o item destacado identificado também por texto oculto para leitores de tela ("posição da lista"), e não apenas por cor.
- **N62.** A janela de exclusão tem título "Excluir a lista "{nome}"?", corpo "Esta ação não pode ser desfeita.", botão destrutivo "Excluir lista" e foco inicial em "Cancelar" (via F33).
- **N63.** O layout segue `prototipo/paginas/quadro.png` e `prototipo/modais/criar-nova-lista.png`: colunas com nome, contagem e ícones de lápis e lixeira; "Adicionar lista" tracejado ao final; janela "Lista" com nome, "Posição no quadro", pré-visualização e botões "Cancelar" e "Salvar lista".

### 5.5 Testabilidade

- **N64.** As funções puras (`clampPosition`, `positionOptions`, `previewOrder`) têm testes unitários com as tabelas de RN06–RN09.
- **N65.** `ListService` é testado com uma implementação em memória de `withBoardLock`/`ListTransaction`, incluindo um teste de sequência que aplica muitas operações aleatórias com semente fixa e verifica, após cada uma, que as posições são exatamente `1..N`.
- **N66.** Existe um arquivo de testes de integração do `BoardListRepository` contra PostgreSQL, **pulado automaticamente** quando a variável `TEST_DATABASE_URL` não estiver definida. Ele cobre:
  - bloqueio e serialização de duas criações concorrentes (CB12);
  - `move` em instrução única;
  - rollback em falha (CE03);
  - `LIST_HAS_CARDS`;
  - renumeração da migration.

  Isso responde à lacuna L1 de `docs/RF02-validation.md` sem exigir banco para rodar a suíte unitária.

---

## 6. Restrições consolidadas

| # | Restrição |
| --- | --- |
| C44 | Nenhuma dependência nova; posição por `<select>` nativo; sem arrastar e soltar |
| C45 | Autorização de quadro extraída para `boardAccess.ts` e compartilhada por `BoardService` e `ListService` |
| C46 | Toda alteração de listas dentro de `withBoardLock`: transação + `SELECT ... FOR UPDATE` do quadro escopado por dono |
| C47 | Toda alteração estrutural de listas **e cards** (RF03, RF04, RF05) adquire o bloqueio do quadro antes de escrever |
| C48 | Regras de posição no `ListService`; repositório só com primitivas filtradas por `board_id` |
| C49 | Posições armazenadas e expostas em base 1, contíguas `1..N`; listas padrão do RF02 passam a `1, 2, 3` |
| C50 | `UNIQUE (board_id, position) DEFERRABLE INITIALLY IMMEDIATE` |
| C51 | Deslocamentos e movimentação em instrução única cada; número constante de instruções por operação |
| C52 | Posição acima do máximo é limitada ao máximo no momento do processamento; inválida é recusada |
| C53 | `name`: corte das extremidades, 1 a 50 caracteres, contagem igual à do RF02, `CHECK` no banco, sem truncamento na migration |
| C54 | Exclusão de lista com cards recusada com `409 LIST_HAS_CARDS`, verificada dentro do bloqueio |
| C55 | Ordem de avaliação: sessão → `boardId` → acesso ao quadro → `listId` → lista no quadro → regra |
| C56 | Respostas de sucesso incluem a lista completa do quadro lida na mesma transação; o front-end substitui seu estado por ela |
| C57 | `POST` 201 `{list, lists}`; `PATCH` 200 `{list, lists}`; `DELETE` 200 `{lists}` |
| C58 | Front-end trata `LIST_NOT_FOUND` na exclusão como sucesso e recarrega o quadro; na edição, fecha com aviso e recarrega |
| C59 | Lista com `cardCount > 0` não abre confirmação; exibe a mensagem de RN11 |
| C60 | Pré-visualização e opções de posição por funções puras; pré-visualização sobre cópia, sem alterar o quadro ao fundo |
| C61 | Um único `ListFormDialog` para adicionar e editar, montado ao abrir |
| C62 | `Modal` corrigido: foco inicial por `data-autofocus` após `showModal()` e tratamento do evento `close` |
| C63 | `lock_timeout` de 5 s por transação de lista |
| C64 | `GET` do quadro inclui `cardCount` por lista, em no máximo duas consultas |
| C65 | Migration reversível: renumeração, `CHECK`s, `varchar(50)`, unicidade adiável |
| C66 | Testes: funções puras, serviço com invariante `1..N` após sequência aleatória com semente fixa, e integração com PostgreSQL condicionada a `TEST_DATABASE_URL` |

---

## 7. Rastreabilidade: critério de aceite → mecanismo

| Critérios | Mecanismo |
| --- | --- |
| CA01, CA02 | `GET` do quadro com `ListItem.cardCount` (C64); `ListColumn` |
| CA03, CA10, CA34 | estado vazio em `BoardLists` com a mensagem da spec 5.4 |
| CA04 | posições persistidas `1..N` (C49), ordenação por `position` |
| CA05, CA06, CA18, CA23 | `positionOptions` e `previewOrder` sobre cópia (C60) |
| CA07, CA08, CA09 | algoritmo de criação (2.3), `shiftRight` em instrução única (C51) |
| CA11, CA12, CA13, CA25, CB01–CB06, CB11 | `list.schemas.ts` + validação no cliente (C53) |
| CA14 | ausência de unicidade de nome |
| CA15, CA26, CA31 | `Modal` + `ListFormDialog`/`DeleteListDialog` montados ao abrir (C61, C62) |
| CA16, CA32 | `useSubmitLock` (C41) + bloqueio no servidor (C46) |
| CA17 | contagem de listas do RF02 (C35) |
| CA19–CA22, CA24 | algoritmo de edição (2.3), `move` em instrução única, resposta com `lists` (C56) |
| CA27 | cards referenciam a lista por `list_id`; mover e renomear não tocam `cards` |
| CA28, CA29, CA30 | `DeleteListDialog` (N62), algoritmo de exclusão com `shiftLeft` |
| CA33 | C59 no cliente + C54 no servidor |
| CA35 | `withBoardLock` escopado por dono → `BOARD_NOT_FOUND` (C46, C55) |
| CA36 | primitivas filtradas por `board_id` → `LIST_NOT_FOUND` (C48, N49) |
| CA37 | `authenticate` + interceptador do RF01 |
| CB07, CB08, CB09, CB10 | contrato de `position` opcional e validado (4.4, 4.5, A35) |
| CB12, CB13, CB16, CB18 | bloqueio do quadro (C46), limite de posição (C52), estado substituído pela resposta (C56) |
| CB14, CB15, CB17 | tratamento de `LIST_NOT_FOUND` e `BOARD_NOT_FOUND` (C58, F31) |
| CE01, CE02, CE04 | `toApiError` + janelas abertas em erro |
| CE03 | transação única (N54) + `lock_timeout` (C63) |

---

## 8. Riscos e decisões registradas

| Risco / decisão | Análise |
| --- | --- |
| Bloqueio pessimista por quadro | Serializa escritas estruturais do mesmo quadro. Aceitável: são operações humanas, raras e rápidas. O ganho é garantir RN05 e RN11 sem lógica de reprocessamento. |
| C47 impõe obrigação ao RF04 e ao RF05 | Sem esse bloqueio na criação de cards, RN11 teria uma condição de corrida. A restrição deve ser citada nos planos seguintes. |
| Posições inteiras contíguas em vez de fracionárias | Toda inserção ou movimentação reescreve até N linhas. Com número constante de instruções (C51) e N pequeno, o custo é desprezível, e a spec exige `1..N` visível. |
| Mudança de base de `0` para `1` | Altera dado existente e testes do RF02. A migration renumera, e C49 elimina conversões de base no código. |
| `LIST_HAS_CARDS` provisório | O RF05 redefine a exclusão com cards. A36 isola o código para facilitar a troca. |
| Contagens na pré-visualização desatualizadas | A pré-visualização usa as listas carregadas. Se outra aba mudou o quadro, o resultado salvo pode diferir do previsto; a resposta substitui o estado e mostra a ordem real (CB18). |
| Integração com banco não executada nesta seção | C66 exige o arquivo, pulado sem `TEST_DATABASE_URL`, o que mantém a suíte unitária executável sem banco e deixa pronta a verificação que faltou no RF02. |
