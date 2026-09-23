# RF02 — Plano técnico

**Base:** `docs/RF02-spec.md` (especificação funcional aprovada).
**Herda de:** `docs/RF01-plan.md`. Todas as restrições C01–C24 do RF01 continuam valendo. Este plano só acrescenta ou especializa regras; quando repete uma regra do RF01, é para deixar explícito como ela se aplica a quadros.

Este documento define **restrições de implementação**. Onde aparece "deve", a implementação não tem liberdade de escolha. Onde aparece "pode", há margem, desde que os critérios de aceite continuem verificáveis.

---

## 1. Tecnologias e frameworks

### 1.1 Stack

Nenhuma troca de tecnologia. O RF02 é construído sobre a base existente do RF01:

| Camada | Tecnologia | Uso no RF02 |
| --- | --- | --- |
| Banco | PostgreSQL | tabelas de quadros, listas e cards, integridade referencial e exclusão em cascata |
| ORM | TypeORM | entidades, migration, transação da criação com listas padrão |
| API | Express 5 + TypeScript | rotas `/api/boards` |
| Validação | `zod` (já instalado) | schemas de quadro no back-end e no front-end |
| Autenticação | middleware `authenticate` do RF01 | identidade em todas as rotas de quadros |
| Front-end | Next.js 16 (App Router) + React 19 + Tailwind 4 | páginas `/boards` e `/boards/[boardId]`, janelas de criação, edição e exclusão |
| HTTP no cliente | instância `api` de `lib/api.ts` | todas as chamadas de quadros |
| Testes | `vitest` (já instalado) | testes unitários do RF02 |

### 1.2 Dependências novas

**Nenhuma.** Restrição explícita:

- **T1.** Janelas modais devem ser construídas sobre o elemento nativo `<dialog>` com `showModal()`, que já oferece foco preso, fechamento por Esc e camada de fundo. Bibliotecas de modal, de componentes (Radix, Headless UI, MUI) ou de gerenciamento de estado (Redux, Zustand, React Query, SWR) **não** devem ser adicionadas.
- **T2.** Pluralização ("1 quadro", "2 quadros") é feita por função própria. Bibliotecas de i18n não devem ser adicionadas.
- **T3.** Se durante a implementação surgir necessidade real de dependência nova, ela deve ser instalada de fato (C22 do RF01) e registrada no arquivo de tarefas com justificativa.

---

## 2. Arquitetura de componentes e fronteiras

### 2.1 Visão geral

```
Navegador
  ├── /boards                 BoardsPage  → boardService → GET/POST/PUT/DELETE /api/boards
  ├── /boards/[boardId]       BoardPage   → boardService → GET/PUT /api/boards/:boardId
  └── lib/api.ts (cookie de sessão, interceptador de 401 do RF01)

API Express
  /api/boards  →  authenticate  →  validate  →  BoardController  →  BoardService  →  BoardRepository  →  PostgreSQL
```

### 2.2 Back-end: novos componentes

As camadas e proibições da seção 2.2 do plano do RF01 (F1–F4) valem integralmente.

```
back-end/src/
  entities/
    Board.ts
    BoardList.ts                 núcleo mínimo de lista (RF03 amplia)
    Card.ts                      núcleo mínimo de card (RF04 amplia)
  migrations/
    <timestamp>-CreateBoardsListsCards.ts
  repositories/
    BoardRepository.ts           interface + implementação TypeORM
  services/
    BoardService.ts
  controllers/
    BoardController.ts
  routes/
    board.routes.ts
  schemas/
    board.schemas.ts
  domain/
    boardColors.ts               paleta fechada e cor padrão
```

Responsabilidades:

| Componente | Responsabilidade | Proibições |
| --- | --- | --- |
| `board.routes.ts` | aplicar `authenticate` a **todas** as rotas do recurso, validar parâmetros e corpo | nenhuma rota de quadro sem `authenticate` |
| `board.schemas.ts` | validar e normalizar nome, cor, opção de listas padrão e identificador | não consultar banco |
| `BoardController` | ler `req.user.id`, chamar o serviço, serializar | não ler dono do corpo, query ou cabeçalho |
| `BoardService` | regras RN01–RN14: posse, listas padrão, tradução de "não encontrado" | não conhecer Express nem TypeORM |
| `BoardRepository` | consultas sempre escopadas pelo dono, transação da criação, agregação de contagens | não conter regra de negócio |
| `boardColors.ts` | fonte única da paleta no back-end | — |

Regras de fronteira obrigatórias:

- **F9.** Toda operação de leitura ou escrita de quadro recebe o `ownerId` vindo de `req.user.id` e o aplica **na própria consulta** (`WHERE id = :boardId AND owner_id = :ownerId`). Não existe método de repositório que busque, altere ou exclua quadro apenas por `id`.
- **F10.** A decisão "este usuário pode acessar este quadro?" fica concentrada em um único ponto do `BoardService`. O RF07 vai substituir "é dono" por "é membro com papel suficiente" alterando esse ponto, sem espalhar verificações pelos controllers.
- **F11.** O serviço nunca diferencia, para o chamador, quadro inexistente de quadro de outra conta: ambos resultam no mesmo erro de domínio `BOARD_NOT_FOUND` (RN03).
- **F12.** A criação de quadro com listas padrão é uma única operação de repositório executada em transação. O serviço não chama "criar quadro" e depois "criar listas" em chamadas separadas.
- **F13.** A exclusão em cascata é responsabilidade do banco, por chaves estrangeiras com `ON DELETE CASCADE` (seção 3). O código não percorre listas e cards para excluí-los um a um.

### 2.3 Front-end: novos componentes

```
front-end/src/
  app/(app)/boards/
    page.tsx                     rota da listagem (servidor, fino)
    BoardsView.tsx               listagem (cliente)
  app/(app)/boards/[boardId]/
    page.tsx                     rota do quadro (servidor, fino; resolve params)
    BoardView.tsx                página do quadro (cliente)
  components/
    Modal.tsx                    base acessível sobre <dialog>
    boards/
      BoardCard.tsx
      NewBoardCard.tsx           cartão "Criar quadro"
      BoardFormDialog.tsx        modos "criar" e "editar"
      DeleteBoardDialog.tsx
      ColorPicker.tsx
      BoardHeader.tsx
      BoardNotFound.tsx
  services/
    boardService.ts
  schemas/
    board.ts
  lib/
    boardColors.ts               paleta: chave → cor exibida
    plural.ts
```

Regras de fronteira obrigatórias:

- **F14.** Componentes não chamam `api` diretamente; usam `boardService` (extensão de F5).
- **F15.** Estado da listagem vive na própria página (`useState`). Após criar, editar ou excluir, a página atualiza o estado local com o retorno da API em vez de recarregar tudo, cumprindo "reflete imediatamente" (spec 2.1). O dado exibido após uma mutação é sempre o devolvido pela API, nunca o digitado.
- **F16.** `BoardFormDialog` é um único componente para criar e editar. No modo editar, a opção de listas padrão não é renderizada (spec 2.4).
- **F17.** Toda janela usa `Modal`, que fecha por botão de fechar, Esc e clique no fundo (CA16, CA28, CA33). Enquanto uma operação está em andamento, a janela não fecha por Esc nem por clique no fundo, para não perder o retorno da requisição.
- **F18.** Ao fechar a janela de criação, o formulário volta aos valores padrão (CA16). A janela de edição é sempre inicializada com os valores atuais do quadro no momento em que é aberta.
- **F19.** O proxy do RF01 já protege `/boards/:path*`. Nenhuma regra extra de rota é criada para o RF02.

### 2.4 Fluxos principais

**Criação (CA09, CA10, CA17):**
1. Formulário valida no cliente.
2. `POST /api/boards`; botão bloqueado durante o envio (`useSubmitLock` do RF01).
3. Resposta 201 traz o quadro com suas listas.
4. O front-end navega para `/boards/{id}`.

**Edição pela listagem (CA24):** `PUT` → substituir o item no estado local pela resposta, na mesma posição.
**Edição pelo cabeçalho (CA25):** `PUT` → atualizar o cabeçalho com a resposta. A listagem, ao ser visitada, recarrega do servidor.

**Exclusão (CA31, CA34, RN14, CB11):**
1. Janela mostra nome e contagens do item já carregado na listagem.
2. `DELETE`. Resposta `204` **ou** `404 BOARD_NOT_FOUND` são tratadas pelo front-end como "quadro não existe mais": fecha a janela e remove o cartão.
3. Qualquer outro erro mantém a janela aberta com a mensagem (CE03).

**Quadro não encontrado (CA21, CA22, CB11, CB14):**
- Na página do quadro: `404` → `BoardNotFound` com link para "Meus quadros".
- Na edição pela listagem: `404` → fecha a janela, remove o cartão e exibe "Quadro não encontrado." em aviso na listagem.

---

## 3. Modelo de dados e schema

### 3.1 Tabela `boards`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `uuid` | chave primária, gerada pela aplicação |
| `owner_id` | `uuid` | `NOT NULL`, FK → `users.id` `ON DELETE RESTRICT` |
| `name` | `varchar(60)` | `NOT NULL`, `CHECK (char_length(name) BETWEEN 1 AND 60)` |
| `color` | `varchar(16)` | `NOT NULL`, `CHECK (color IN ('navy','blue','green','amber','purple'))` |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()` |
| `updated_at` | `timestamptz` | `NOT NULL`, default `now()` |

Índice: `IDX_boards_owner_created` em `(owner_id, created_at DESC, id DESC)`.

### 3.2 Tabela `lists` (núcleo mínimo)

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `uuid` | chave primária |
| `board_id` | `uuid` | `NOT NULL`, FK → `boards.id` `ON DELETE CASCADE` |
| `name` | `varchar(100)` | `NOT NULL` |
| `position` | `integer` | `NOT NULL`, `CHECK (position >= 0)` |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()` |
| `updated_at` | `timestamptz` | `NOT NULL`, default `now()` |

Índice: `IDX_lists_board_position` em `(board_id, position)`.

### 3.3 Tabela `cards` (núcleo mínimo)

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `uuid` | chave primária |
| `list_id` | `uuid` | `NOT NULL`, FK → `lists.id` `ON DELETE CASCADE` |
| `title` | `varchar(200)` | `NOT NULL` |
| `position` | `integer` | `NOT NULL`, `CHECK (position >= 0)` |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()` |
| `updated_at` | `timestamptz` | `NOT NULL`, default `now()` |

Índice: `IDX_cards_list` em `(list_id)`.

### 3.4 Restrições de modelagem

- **D8.** As tabelas `lists` e `cards` são criadas agora porque o RF02 precisa delas para três comportamentos verificáveis: criar listas padrão (RN07), exibir contagens (RN10, CA04, CA30) e garantir exclusão em cascata (RN11, CA32). Elas contêm apenas o núcleo necessário. RF03 e RF04 podem **acrescentar** colunas e índices por migration própria, mas não podem alterar nome de tabela, chave primária, tipo de identificador nem as chaves estrangeiras com cascata definidas aqui. Os limites `varchar(100)` do nome de lista e `varchar(200)` do título de card são provisórios e serão confirmados pelas especificações de RF03 e RF04.
- **D9.** Toda tabela futura que pertença a um quadro, lista ou card (etiquetas, membros, checklists, comentários) deve referenciá-lo com `ON DELETE CASCADE`. É isso que mantém RN11 verdadeira à medida que o modelo cresce, sem mudar o código de exclusão.
- **D10.** `users` → `boards` usa `ON DELETE RESTRICT`: contas não são excluídas (RF01, RN14) e um quadro nunca pode ficar sem dono.
- **D11.** Nome e cor têm `CHECK` no banco, além da validação na aplicação. A validação da aplicação produz a mensagem; o banco é a última barreira contra dados fora da regra.
- **D12.** A cor é persistida como **chave semântica** (`navy`, `blue`, ...), nunca como código hexadecimal. A cor exibida é decisão do front-end, e a paleta pode ser reajustada visualmente sem migração de dados.
- **D13.** A ordem da listagem é `created_at DESC, id DESC`. O desempate por `id` torna a ordem determinística quando dois quadros têm o mesmo instante de criação.
- **D14.** `position` das listas padrão: `0` para "A fazer", `1` para "Em progresso", `2` para "Concluído". A estratégia de reordenação é do RF03.
- **D15.** `updated_at` é atualizado em toda edição, mesmo sem mudança de valores (CA29). Não há controle otimista de versão: a última gravação prevalece (CB12).
- **D16.** Migration única e reversível criando as três tabelas, na ordem `boards`, `lists`, `cards`, e removendo-as na ordem inversa. `synchronize` continua proibido (C11).

### 3.5 Paleta

| Chave | Rótulo acessível | Cor exibida |
| --- | --- | --- |
| `navy` | Azul-marinho | `#1d3355` |
| `blue` | Azul | `#2f6fb3` |
| `green` | Verde | `#2e8b67` |
| `amber` | Âmbar | `#d08c1f` |
| `purple` | Roxo | `#7c5cc4` |

- **D17.** A ordem da tabela é a ordem de exibição, e `navy` é a cor padrão (RN06). As chaves existem em exatamente três lugares: `domain/boardColors.ts` no back-end, `lib/boardColors.ts` no front-end e o `CHECK` da migration. Um teste deve garantir que as listas de chaves do back-end e do front-end são iguais.

---

## 4. Interfaces: API e contratos

### 4.1 Convenções

- Todas as rotas sob `/api/boards` exigem sessão válida via `authenticate`. Sem sessão: `401 UNAUTHENTICATED` ou `401 SESSION_EXPIRED`, conforme o RF01.
- O parâmetro `:boardId` que não seja um UUID válido resulta em `404 BOARD_NOT_FOUND`, **nunca** `400` nem `500` (CA22). Ele é validado antes de qualquer consulta ao banco.
- Campos desconhecidos no corpo são descartados pela validação e nunca chegam ao serviço (CB10).
- Datas são serializadas em ISO 8601 UTC.

### 4.2 Representações

**`BoardSummary`** (listagem):

| Campo | Tipo |
| --- | --- |
| `id` | string (UUID) |
| `name` | string |
| `color` | `"navy" \| "blue" \| "green" \| "amber" \| "purple"` |
| `listCount` | inteiro ≥ 0 |
| `cardCount` | inteiro ≥ 0 |
| `createdAt` | string ISO |
| `updatedAt` | string ISO |

**`BoardDetail`** (quadro aberto): mesmos campos de `BoardSummary`, mais `lists`: array de `{ id, name, position }` ordenado por `position ASC, created_at ASC`.

- **A22.** `ownerId` **não** é exposto em nenhuma representação. Neste requisito ele é sempre o próprio usuário e não tem utilidade para o cliente; o RF07 decide o que expor sobre membros.

### 4.3 `GET /api/boards`

- `200` com `{ "boards": BoardSummary[] }`, na ordem de D13.
- Lista vazia retorna `200` com `{ "boards": [] }` (CA05).

### 4.4 `POST /api/boards`

Requisição:

| Campo | Tipo | Regras |
| --- | --- | --- |
| `name` | string | obrigatório; espaços das extremidades removidos; 1 a 60 caracteres após o corte (RN04) |
| `color` | string | obrigatório; uma das 5 chaves (RN06, CB08) |
| `withDefaultLists` | boolean | opcional; ausente equivale a `true` (CB09) |

Respostas:

| Status | Situação | Corpo |
| --- | --- | --- |
| `201` | criado | `{ "board": BoardDetail }` |
| `400` | validação | `VALIDATION_ERROR` com `fields` |
| `401` | sessão | conforme RF01 |
| `500` | falha, inclusive na criação das listas padrão | `INTERNAL_ERROR`, nada persistido (CE04) |

### 4.5 `GET /api/boards/:boardId`

| Status | Situação | Corpo |
| --- | --- | --- |
| `200` | quadro do usuário | `{ "board": BoardDetail }` |
| `404` | inexistente, de outra conta ou identificador malformado | `BOARD_NOT_FOUND` |

### 4.6 `PUT /api/boards/:boardId`

Requisição: `name` e `color`, ambos obrigatórios, com as mesmas regras da criação. `withDefaultLists`, `ownerId`, `createdAt` e qualquer outro campo são descartados.

| Status | Situação | Corpo |
| --- | --- | --- |
| `200` | atualizado | `{ "board": BoardSummary }` com contagens atuais |
| `400` | validação | `VALIDATION_ERROR` com `fields` |
| `404` | inexistente, de outra conta ou identificador malformado | `BOARD_NOT_FOUND` |

- **A23.** A escolha por `PUT` com os dois campos obrigatórios é deliberada: o formulário de edição sempre envia nome e cor, e um contrato de substituição completa elimina a ambiguidade de "campo ausente significa manter ou limpar".
- **A24.** A atualização é um único `UPDATE ... WHERE id = :boardId AND owner_id = :ownerId`. Zero linhas afetadas significa `BOARD_NOT_FOUND`. Não se faz leitura prévia para verificar posse.

### 4.7 `DELETE /api/boards/:boardId`

| Status | Situação | Corpo |
| --- | --- | --- |
| `204` | excluído | vazio |
| `404` | inexistente, de outra conta ou identificador malformado | `BOARD_NOT_FOUND` |

- **A25.** A exclusão é um único `DELETE ... WHERE id = :boardId AND owner_id = :ownerId`, e o banco remove listas e cards em cascata na mesma instrução, portanto de forma atômica (RN11, CE05).
- **A26.** A API é honesta: responde `404` quando nada foi excluído. A idempotência exigida por RN14 e CB11 é garantida pelo front-end, que trata `404` na exclusão como sucesso. Isso preserva CA35: uma tentativa de excluir quadro de outra conta não altera nada e recebe a mesma resposta de um quadro inexistente.

### 4.8 Erros

- **A27.** Novo código de erro: `BOARD_NOT_FOUND` → `404`, mensagem "Quadro não encontrado.". A lista fechada de códigos de A10 passa a ser: `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `UNAUTHENTICATED`, `SESSION_EXPIRED`, `BOARD_NOT_FOUND`, `INTERNAL_ERROR`.
- **A28.** Mensagens de campo:

| Campo | Situação | Mensagem |
| --- | --- | --- |
| `name` | vazio, só espaços ou ausente | "Campo obrigatório." |
| `name` | acima de 60 caracteres | "O nome do quadro deve ter no máximo 60 caracteres." |
| `color` | ausente ou fora da paleta | "Selecione uma cor válida." |
| `withDefaultLists` | presente e não booleano | "Valor inválido." |

- **A29.** Envelope de erro, ausência de detalhes internos e tradução centralizada seguem A7–A9 do RF01.

### 4.9 Rotas do front-end

| Rota | Conteúdo |
| --- | --- |
| `/boards` | listagem "Meus quadros" |
| `/boards/[boardId]` | página do quadro |

- **A30.** No Next.js 16, `params` de página dinâmica é assíncrono. A página de servidor resolve `boardId` e o repassa ao componente cliente; a validação do formato do identificador é feita pela API (seção 4.1), não pela rota.

---

## 5. Requisitos não funcionais

### 5.1 Desempenho

| Operação | Alvo (p95, ambiente local) | Condição |
| --- | --- | --- |
| `GET /api/boards` | < 150 ms | até 200 quadros, com listas e cards |
| `GET /api/boards/:boardId` | < 100 ms | até 50 listas |
| `POST /api/boards` | < 150 ms | com listas padrão |
| `PUT` / `DELETE` | < 100 ms | exclusão de quadro com até 1.000 cards |

- **N23.** A listagem é resolvida em **uma única consulta** que traz os quadros e suas contagens por agregação (subconsultas ou `LEFT JOIN` com `GROUP BY`). Proibido o padrão N+1: uma consulta por quadro para contar listas ou cards.
- **N24.** `GET /api/boards/:boardId` usa no máximo duas consultas: quadro com contagens e listas do quadro.
- **N25.** Toda consulta de quadros filtra por `owner_id` e usa o índice de 3.1. Toda busca de listas usa o índice `(board_id, position)`. Contagem de cards usa `IDX_cards_list`.
- **N26.** Sem paginação neste requisito: RN13 não impõe limite e o alvo de desempenho cobre até 200 quadros. Se um requisito futuro exigir volumes maiores, a paginação deve ser por cursor sobre `(created_at, id)`, compatível com D13, e não por deslocamento.
- **N27.** O front-end carrega a listagem uma vez ao abrir a página e não recarrega após mutações feitas nela (F15). A página do quadro carrega o quadro uma vez ao abrir.

### 5.2 Segurança

- **N28.** Autorização por escopo na consulta (F9, A24, A25). Nenhum caminho de código lê um quadro sem `owner_id` no filtro.
- **N29.** Respostas para quadro de outra conta são idênticas às de quadro inexistente em status, código, mensagem e corpo (RN03). Nenhum log de nível de aviso é emitido para essas tentativas, para não criar diferença observável de tempo ou comportamento.
- **N30.** `:boardId` é validado como UUID antes de chegar ao banco, evitando erro de sintaxe do PostgreSQL convertido em `500` e ruído de log.
- **N31.** Nome do quadro é renderizado como texto pelo React; `dangerouslySetInnerHTML` continua proibido (CB06). O nome aparece também no `title` da página do quadro, que o Next.js escapa.
- **N32.** Os limites da API do RF01 (corpo de 10 KB, `helmet`, CORS com origem explícita) valem para as novas rotas sem configuração adicional.
- **N33.** Nenhum identificador de dono é aceito do cliente (RN01). O `owner_id` gravado na criação é sempre `req.user.id`.

### 5.3 Integridade e escalabilidade

- **N34.** Atomicidade da criação por transação do banco (F12, RN07, CE04) e da exclusão por cascata em instrução única (F13, A25, RN11, CE05). Nenhuma das duas depende de compensação no código.
- **N35.** A API continua sem estado (N15 do RF01). Nenhum cache de quadros em memória do processo.
- **N36.** A cascata no banco mantém o custo de exclusão proporcional ao conteúdo do quadro e independente do número de requisições do cliente. D9 garante que novas tabelas entrem nessa cascata sem mudança de código.
- **N37.** O ponto único de autorização (F10) é o que permite ao RF07 introduzir membros sem reescrever repositório, controller e rotas.

### 5.4 Interface e acessibilidade

- **N38.** `Modal` usa `<dialog>` com `aria-labelledby` apontando para o título da janela e devolve o foco ao elemento que a abriu ao fechar.
- **N39.** A seleção de cor é um grupo de opções exclusivas acessível por teclado (`role="radiogroup"`), e cada opção tem o rótulo acessível da seção 3.5, porque a cor sozinha não comunica a escolha.
- **N40.** O cartão do quadro é navegável por teclado. As ações de editar e excluir são botões próprios com rótulo acessível que inclui o nome do quadro ("Editar quadro Alfa") e não disparam a abertura do quadro.
- **N41.** O botão "Excluir quadro" tem aparência destrutiva, e o foco inicial da janela de exclusão fica em "Cancelar".
- **N42.** Estados de carregamento, erro com "Tentar novamente" e lista vazia são visualmente distintos (spec 2.6, CE01, CA05).
- **N43.** O layout segue `prototipo/paginas/meus-quadros.png`, `prototipo/modais/novo-quadro.png` e o cabeçalho de `prototipo/paginas/quadro.png`: grade de cartões com faixa de cor no topo, cartão tracejado "Criar quadro" e janela com nome, paleta e opção de listas padrão.

---

## 6. Restrições consolidadas

| # | Restrição |
| --- | --- |
| C25 | Nenhuma dependência nova; modais sobre `<dialog>` nativo |
| C26 | Todas as rotas de quadros exigem `authenticate` |
| C27 | Todo acesso a quadro filtra por `id` **e** `owner_id` na mesma consulta; não existe busca por `id` isolado |
| C28 | Quadro inexistente, de outra conta ou com identificador malformado produz a mesma resposta `404 BOARD_NOT_FOUND` |
| C29 | Autorização concentrada em um único ponto do `BoardService` |
| C30 | Dono sempre derivado da sessão; `ownerId` nunca aceito nem exposto |
| C31 | Nome: corte das extremidades, 1 a 60 caracteres, validado na aplicação e com `CHECK` no banco |
| C32 | Cor persistida como chave da paleta fechada, validada na aplicação e com `CHECK` no banco |
| C33 | Criação com listas padrão em transação única |
| C34 | Exclusão por instrução única com `ON DELETE CASCADE` em `lists` e `cards`; toda tabela futura dependente de quadro, lista ou card deve usar cascata |
| C35 | Listagem em uma única consulta com contagens agregadas; ordem `created_at DESC, id DESC` |
| C36 | Edição via `PUT` com nome e cor obrigatórios; demais campos descartados |
| C37 | API responde `404` na exclusão sem efeito; front-end trata esse `404` como sucesso |
| C38 | Front-end atualiza a listagem com o retorno da API, sem recarregar a página |
| C39 | Um único componente de formulário para criar e editar; opção de listas padrão só na criação |
| C40 | Janelas fecham por Cancelar, botão de fechar, Esc e clique no fundo, exceto durante operação em andamento |
| C41 | Envio duplicado bloqueado em criação, edição e exclusão |
| C42 | Paleta com as mesmas chaves no back-end, no front-end e na migration, verificada por teste |
| C43 | Migration única e reversível para `boards`, `lists` e `cards`; RF03 e RF04 só acrescentam |

---

## 7. Rastreabilidade: critério de aceite → mecanismo

| Critérios | Mecanismo |
| --- | --- |
| CA01, CA06 | `GET /api/boards` escopado por `owner_id` (C27) |
| CA02, CA03, CA11 | ordem `created_at DESC, id DESC`, edição não altera `created_at` (D13, RN08) |
| CA04, RN10 | contagens agregadas na listagem (C35), cor por chave (D12) |
| CA05 | `200` com lista vazia + estado vazio distinto (N42) |
| CA07, CA08, CA16, CA23, CA28 | `BoardFormDialog` com valores padrão e inicialização por quadro (F16, F18), `Modal` (C40) |
| CA09, CA10 | `POST` com `withDefaultLists` e transação (C33), navegação para o quadro |
| CA12, CA13, CA14, CA27, CB01–CB07 | schema de nome (C31) |
| CA15 | ausência de unicidade de nome (RN05) |
| CA17, CA34 | `useSubmitLock` (C41) |
| CA18, CA19, CA20 | rota `/boards/[boardId]` + `GET /api/boards/:boardId` com listas ordenadas |
| CA21, CA22, CA35, CB11, CB14 | `404 BOARD_NOT_FOUND` uniforme (C28) |
| CA24, CA25, CA26, CA29, CB12 | `PUT` com `UPDATE` escopado (A24), atualização local (C38), `updated_at` sempre (D15) |
| CA30 | janela de exclusão com contagens da listagem |
| CA31, CA32, CE05 | `DELETE` com cascata (C34) |
| CA33 | `Modal` sem efeito colateral ao cancelar |
| CA36 | `authenticate` + interceptador de sessão do RF01 |
| CB08, CB09, CB10 | schema de criação e edição (C32, C36) |
| CE01–CE03, CE06 | `toApiError` do RF01, janelas mantidas abertas em erro, estado de erro com nova tentativa |
| CE04 | transação da criação (C33) |

---

## 8. Riscos e decisões registradas

| Risco / decisão | Análise |
| --- | --- |
| Criar `lists` e `cards` antes de RF03 e RF04 | Necessário para cumprir RN07, RN10 e RN11 de forma verificável. O risco é o núcleo mínimo não servir aos requisitos seguintes; D8 limita o que pode mudar e mantém esse risco baixo. |
| Contagens desatualizadas na janela de exclusão | A janela usa as contagens carregadas com a listagem. Se o conteúdo mudou em outra aba, os números podem estar defasados. A spec não exige recontagem no momento da confirmação, e a exclusão continua removendo tudo corretamente. |
| `404` em exclusão tratado como sucesso no front-end | Mantém a API honesta e a UX idempotente (A26). O custo é que a regra de RN14 vive no cliente; um teste unitário do fluxo de exclusão deve cobri-la. |
| Última gravação prevalece | Aceito pela spec (CB12). Controle de concorrência otimista fica para quando houver colaboração de membros (RF07). |
| Sem paginação | Aceito por RN13 e N26; o índice e a ordenação já são compatíveis com paginação por cursor. |
| Autorização apenas por posse | Correto para o RF02. F10 e N37 garantem que o RF07 troque a regra em um único lugar. |
