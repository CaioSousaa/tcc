# RF03 — Plano Técnico: Criar, Renomear, Reordenar e Excluir Listas dentro de um Quadro

Referência: `docs/RF03-spec.md`. Este documento traduz a especificação em restrições de construção. Não descreve código.

## 0. Pré-requisito bloqueante (estado atual do repositório)

RF03 depende de RF01 (autenticação) e RF02 (quadros) já estarem implementados: uma lista só existe dentro de um quadro, e toda autorização de RF03 deriva da posse do quadro. No estado atual do repositório, `back-end/src` contém apenas o esqueleto inicial (`main.ts` chamando `express()`) — os módulos `auth` e `boards` descritos nos planos já aprovados de RF01 e RF02 não existem em código. **A fase IMPLEMENT de RF03 precisa reconstruir `auth` e `boards` (seguindo os planos já aprovados dessas duas fases) antes de, ou junto com, construir o módulo `lists`.** Este plano assume que, quando a implementação começar, essas duas camadas existirão com as fronteiras já definidas em `RF01-plan.md`/`RF02-plan.md` (middleware `authenticate`, `boards.service`/`BoardRepository` com busca escopada por dono, `AppError`/`ValidationError` em `src/shared/errors.ts`).

## 1. Tecnologias e Frameworks

Nenhuma dependência nova é necessária — RF03 é resolvido com o mesmo stack de RF01/RF02:

**Back-end**
- Express + TypeORM + PostgreSQL, para o novo módulo `lists`.
- `zod`, para validação de payloads de criação/renomeação/reordenação.
- Middleware `authenticate` (RF01) e a capacidade de verificar posse de quadro já usada por `boards.service` (RF02) — reutilizados sem alteração.

**Front-end**
- Next.js + React + `axios`/`apiClient` (RF01/RF02) — reutilizados como cliente HTTP para as novas chamadas de listas.

**Restrição:** nenhuma dependência nova para RF03. Em particular, a ordenação das listas (RN-07/RN-09 da spec) é resolvida com uma coluna de posição inteira e lógica de aplicação — não introduzir uma biblioteca de ordenação/drag-and-drop no back-end nem um esquema de posição fracionária; isso é sobre-engenharia para o volume e a complexidade que RF03 pede.

## 2. Arquitetura de Componentes e Fronteiras

### 2.1 Back-end — módulo `lists`

Mesma divisão em camadas de `auth` e `boards`:

- **Rotas (`lists.routes`)**: aninhadas sob o quadro — todo endpoint de lista inclui o id do quadro na URL (`/boards/:boardId/lists...`), nunca só o id da lista isolado. Isso existe para que a spec consiga distinguir "quadro não encontrado" de "lista não encontrada" (RN-05 vs. RN-06): o id do quadro é sempre validado primeiro, independentemente do id da lista. Todas as rotas passam por `authenticate` (RF01), sem exceção.
- **Controller (`lists.controller`)**: valida forma da requisição (schema `zod`), extrai `ownerId` de `req.user` e `boardId`/`listId` dos parâmetros de rota, chama o service, traduz resultado/erro em resposta HTTP.
- **Service (`lists.service`)**: contém as regras de negócio (RN-01 a RN-11). Toda operação começa confirmando que o quadro pertence ao usuário autenticado (reutilizando a mesma verificação escopada por dono que `boards.service` já faz — RF02 RN-06); só então resolve a lista dentro desse quadro especificamente. Não conhece Express.
- **Repository (`ListRepository`, adapter TypeORM)**: acesso a dados, sem regra de negócio, mesmo padrão de interface + adapter já usado em `auth` e `boards`.
- **Reuso explícito:** `lists.service` depende de uma forma de verificar posse de quadro (RF02) — não duplica essa lógica. Se `boards.service` expõe hoje só métodos voltados a HTTP, o plano permite extrair dessa mesma verificação de posse (a busca escopada por `id + owner_id`) para reuso por `lists.service`, sem reimplementá-la.

### 2.2 Front-end — módulo `lists`

- **Camada de acesso a dados (`lib/lists/api.ts`)**: funções finas sobre o `apiClient` existente, uma por operação, seguindo exatamente o padrão já usado por `lib/boards/api.ts`.
- **Página**: a página de detalhe de um quadro (`/quadros/[id]`, hoje mostrando só nome/descrição/exclusão do quadro — RF02) passa a exibir as listas desse quadro, com ações de criar, renomear, reordenar e excluir lista.
- **Estado**: mesmo estilo `useEffect`/`useState` já usado nas páginas de RF02; sem Context dedicado a listas nem biblioteca de data-fetching.

## 3. Modelos de Dados e Schemas

Nova entidade TypeORM, PostgreSQL como storage:

### 3.1 `lists`
| Campo | Tipo | Restrições |
|---|---|---|
| id | uuid | PK, gerado pelo banco |
| name | varchar(100) | not null (RN-02) |
| board_id | uuid | FK → `boards.id`, not null, `onDelete: CASCADE` (RN-01, e cumpre a cascata que RF02/RN-07 previa quando este conteúdo existisse) |
| position | integer | not null — posição de exibição entre as listas do mesmo quadro, base 0 |
| created_at | timestamp | not null, default now |
| updated_at | timestamp | not null, atualizado em cada update |

Índice composto em `(board_id, position)` — toda listagem ordenada (critério 7) e toda operação de reposicionamento consultam/atualizam por essa combinação.

**Estratégia de posição (RN-07, RN-08, RN-09):** `position` é um inteiro contíguo por quadro, começando em 0, sem lacunas — não um valor fracionário nem um espaçamento esparso. Isso é uma escolha deliberada de implementação: mantém `GET` simples (`ORDER BY position ASC`) e faz a validação de RN-09 ("posição fora do intervalo válido") trivial (comparar contra `0` e `total de listas do quadro - 1`). O custo é que criar, mover ou excluir uma lista exige recalcular a posição de outras linhas do mesmo quadro — ver seção 5 (Desempenho) para o formato dessa operação.

**Restrição:** nenhuma constraint de unicidade de banco em `(board_id, position)` é necessária nem desejada — a invariante "sem posições empatadas" (RN-07) é garantida pela lógica de aplicação dentro de uma transação (seção 5), não pelo schema. Uma constraint rígida aqui obrigaria a reordenar em duas fases (liberar posições antes de ocupá-las), complexidade que este escopo não justifica.

## 4. Interfaces: API e Contratos

Prefixo: `/boards/:boardId`. Todas as rotas exigem `Authorization: Bearer <accessToken>` — sem ele, `401 unauthenticated` (contrato já definido em RF01). Formato de erro reutilizado de RF01/RF02:
```
{ "error": { "code": "<slug>", "message": "<texto>", "fields"?: { "<campo>": "<motivo>" } } }
```

**Restrição de contrato central:** o id do quadro na URL é sempre resolvido primeiro. Se `boardId` não existir ou não pertencer ao usuário autenticado, a resposta é `404 board_not_found` (RN-05) — o id da lista nem chega a ser consultado. Só depois de confirmado que o quadro é do usuário, o id da lista é resolvido *dentro daquele quadro*; se não existir ali (não existe em lugar nenhum, ou existe mas pertence a outro quadro), a resposta é `404 list_not_found` (RN-06) — nunca `board_not_found` nesse segundo caso, mesmo que a causa raiz também seja "não encontrado".

### `POST /boards/:boardId/lists`
- Body: `{ name: string }`
- 201: `{ id, name, boardId, position, createdAt, updatedAt }`
- 400 `validation_error`: nome ausente/vazio (critério 2) ou acima de 100 caracteres (critério 3).
- 404 `board_not_found`: quadro inexistente ou de outro usuário (critério 5).
- `position` da lista criada é sempre `total de listas já existentes no quadro` (posiciona ao final — RN-08); o corpo da requisição não pode informar `position` na criação.

### `GET /boards/:boardId/lists`
- Sem body.
- 200: `{ lists: [{ id, name, boardId, position, createdAt, updatedAt }, ...] }`, ordenada por `position` ascendente; array vazio quando o quadro não tem listas (critério 8), nunca um erro.
- 404 `board_not_found`: quadro inexistente ou de outro usuário (critério 9).

### `PATCH /boards/:boardId/lists/:listId`
- Body: `{ name?: string, position?: number }` — ambos opcionais e independentes; enviar só `name` renomeia sem mexer na posição (critério 10), enviar só `position` reordena sem mexer no nome (critério 13).
- 200: lista atualizada, mesmo formato de `POST`.
- 400 `validation_error`: `name` enviado vazio ou acima do limite (critério 11); `position` enviada fora do intervalo válido do quadro (`0` a `total de listas do quadro - 1`) (critério 16, RN-09).
- 404 `board_not_found`: `boardId` inexistente ou de outro usuário.
- 404 `list_not_found`: `listId` inexistente, ou existente mas pertencente a um quadro diferente do `boardId` da URL (critério 12, 17, RN-06).

### `DELETE /boards/:boardId/lists/:listId`
- Sem body.
- 204: lista excluída; posições das listas restantes do quadro recalculadas para permanecerem contíguas, preservando a ordem relativa entre elas (RN-10).
- 404 `board_not_found`: mesmo critério de `PATCH`.
- 404 `list_not_found`: `listId` inexistente, de outro quadro, ou já excluído anteriormente (critérios 20, 21 — segunda exclusão usa o mesmo caminho de "não encontrada", sem tratamento especial de idempotência, mesmo padrão de RF02).

## 5. Requisitos Não Funcionais

**Segurança**
- Toda resolução de `boardId` é escopada por dono na própria query (reuso do padrão já estabelecido em RF02) — nunca "buscar quadro por id, checar dono depois em código".
- Toda resolução de `listId` é escopada por `board_id` na própria query (`WHERE id = :listId AND board_id = :boardId`) — pelo mesmo motivo: uma lista de outro quadro nunca deve ser alcançável trocando só o `listId` na URL, mesmo que o `boardId` informado seja legitimamente do usuário.
- `board_id` e `position` de uma lista nunca são aceitos livremente a partir do corpo da requisição fora dos contratos acima — `board_id` vem exclusivamente da URL (após validado), `position` só é aceito em `PATCH` e é validada contra o intervalo real de posições do quadro antes de aplicada.
- Rate limiting dedicado não é necessário para RF03, pelo mesmo raciocínio de RF02 (não há alvo de força bruta aqui; a proteção relevante é a autorização por dono, já coberta acima).

**Desempenho**
- Índice composto em `(board_id, position)` (seção 3.1).
- Recalcular posições (criar, mover, excluir) é uma operação sobre no máximo as listas de **um** quadro — não da tabela inteira. Isso deve rodar dentro de uma única transação de banco, para que a listagem (`GET`) nunca observe um estado intermediário com posições duplicadas ou faltando (garante RN-07 sob concorrência).

**Escalabilidade**
- Mesmo modelo stateless de RF01/RF02: nenhuma regra de RF03 depende de estado em memória entre requisições; múltiplas instâncias do back-end funcionam sem alteração.

## 6. Restrições Explícitas para a Implementação

- `auth` e `boards` devem existir e funcionar (testes de RF01/RF02 passando) antes de `lists` ser considerado implementado — ver seção 0.
- Toda regra de negócio de RF03 (RN-01 a RN-11) reside em `lists.service`, nunca no controller ou nas rotas.
- Nenhuma query de leitura/edição/exclusão de uma lista específica busca por `id` sem também filtrar por `board_id` na mesma query; nenhuma query de quadro dentro deste módulo busca sem filtrar por `owner_id`, reaproveitando exatamente a lógica de RF02.
- `boardId` inacessível → sempre `404 board_not_found`; `listId` inacessível dentro de um `boardId` válido → sempre `404 list_not_found`. As duas respostas nunca se confundem (ver seção 4).
- Toda operação que recalcula `position` de mais de uma lista (criar, mover, excluir) ocorre dentro de uma única transação de banco.
- Nenhuma lacuna nem posição repetida é observável em `GET /boards/:boardId/lists` em nenhum momento (RN-07) — não implementar reordenação "em duas chamadas" do lado do cliente.
- Nenhuma dependência nova instalada para RF03 (seção 1).
- Uso de PostgreSQL via TypeORM obrigatório para a entidade `lists`, com `board_id` como FK real para `boards.id` (`onDelete: CASCADE`) — sem acesso a banco fora do ORM.
