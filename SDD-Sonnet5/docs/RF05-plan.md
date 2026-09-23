# RF05 — Plano Técnico: Exclusão de Lista com Cards Associados (Regra de Cascata Explícita)

Referência: `docs/RF05-spec.md`. Este documento traduz a especificação em restrições de construção. Não descreve código. Assume `auth` (RF01), `boards` (RF02), `lists` (RF03) e `cards` (RF04) já implementados e testados.

## 1. Tecnologias e Frameworks

Nenhuma dependência nova é necessária. RF05 não introduz nenhuma tecnologia além do que RF01–RF04 já trazem (Express, TypeORM, PostgreSQL, `zod`, `axios`/`apiClient`).

**Restrição:** RF05 não introduz nenhuma rota HTTP nova, nenhum novo módulo de front-end, nem nenhuma biblioteca de diálogo/modal. O aviso ao usuário (RN-03) é resolvido com o mecanismo de confirmação já nativamente disponível no navegador (o mesmo padrão já usado para renomear lista/card em RF03/RF04 — `window.prompt`/`window.confirm`), não uma nova dependência de UI.

## 2. Arquitetura de Componentes e Fronteiras

### 2.1 Back-end — a cascata passa a ser explícita em `lists.service`

RF04 já declarou `Card.list_id` como FK `onDelete: CASCADE` para `lists.id`. Isso significa que, hoje, o banco **já** apaga os cards de uma lista excluída — mas isso acontece de forma invisível ao código da aplicação, sem nenhuma linha de `lists.service` ou `cards.service` saber que isso ocorreu, e sem nenhuma forma de verificar essa regra com um teste unitário (um repositório fake em memória não tem constraint de FK; só um PostgreSQL real teria). O título da própria especificação pede uma regra **explícita** — não uma que dependa silenciosamente de uma constraint de schema que um leitor do código poderia nem notar.

**Decisão:** a exclusão em cascata passa a ser também uma operação explícita em `ListsService.remove`, em duas camadas redundantes e intencionais:

1. **Camada de aplicação (nova, nesta fase):** antes de excluir a lista, `ListsService.remove` manda explicitamente excluir todos os cards que pertencem a ela. Isso torna RN-01/RN-02 testáveis com os mesmos repositórios fake em memória já usados em todo o projeto, sem depender de um banco real para verificar a regra central desta feature.
2. **Camada de banco (já existente, RF04):** a constraint `onDelete: CASCADE` permanece — não é removida. Funciona como rede de segurança: mesmo que um caminho de código futuro venha a excluir uma lista sem passar por `ListsService.remove` (uma migração de dados, um script administrativo), os cards órfãos não sobrevivem.

Para isso, `ListsService` passa a depender também de `CardRepository` (RF04), além de `ListRepository` e `BoardRepository` que já usava. Essa é uma dependência de **repositório** (acesso a dados), não do `CardsService` — evita criar uma dependência de serviço para serviço entre `lists` e `cards`, que seria circular (`cards.service` já depende de `ListRepository`).

**Ordem de operações dentro de `ListsService.remove`:**
1. Confirmar posse do quadro (reuso de RF02).
2. Confirmar que a lista pertence a esse quadro (reuso de RF03).
3. Excluir todos os cards da lista (nova chamada a `CardRepository`).
4. Excluir a lista e reindexar as listas restantes do quadro (comportamento já existente de RF03, inalterado).

A ordem (cards antes da lista) é deliberada: se a exclusão de cards falhar, a lista permanece intacta e a operação pode ser tentada de novo sem efeito colateral; se a lista fosse excluída primeiro, uma falha na exclusão dos cards deixaria cards órfãos até a constraint de banco eventualmente resolver a inconsistência.

**Restrição:** os dois passos (excluir cards, excluir lista) não precisam compartilhar uma única transação de banco cross-repositório — cada um permanece atômico dentro de si mesmo (mesmo padrão de "uma transação por repositório" já usado em `lists`/`cards` desde RF03/RF04). Introduzir uma transação compartilhada entre dois repositórios exigiria um mecanismo de unit-of-work que este escopo não justifica; o pior cenário de falha entre os dois passos é uma lista temporariamente vazia, não dado corrompido.

### 2.2 Front-end — aviso antes de confirmar, sem endpoint novo

`handleDeleteList` (já existente em `/quadros/[id]`, RF03) passa a, antes de chamar `deleteList`:
1. Buscar a contagem atual de cards da lista, reutilizando `listCards(boardId, listId)` (já existente em `lib/cards/api.ts`, RF04) — **não** um novo endpoint de contagem.
2. Se a contagem for maior que zero, exibir uma confirmação nativa informando a quantidade; se o usuário recusar, a função retorna sem chamar `deleteList` — nenhuma requisição de rede que altere estado é disparada.
3. Se a contagem for zero, ou se o usuário confirmar, prosseguir exatamente como hoje (chamar `deleteList`, remover a lista do estado local).

**Restrição:** a contagem usada no aviso é sempre buscada no momento do clique em excluir (RN-05, "no momento da solicitação"), nunca reaproveitada do estado de cards já carregado na tela — que pode estar desatualizado em relação a outras abas/sessões.

## 3. Modelos de Dados e Schemas

Nenhuma mudança de schema. Reafirma-se a modelagem já existente:
- `cards.list_id` → FK para `lists.id`, `onDelete: CASCADE` (declarada em RF04, mantida sem alteração).

Nenhuma coluna, tabela ou índice novo é necessário para RF05.

## 4. Interfaces: APIs e Contratos

**Nenhum contrato HTTP muda.** RF05 não adiciona nenhuma rota. `DELETE /boards/:boardId/lists/:listId` (RF03) continua exatamente com o mesmo contrato — `204`, sem corpo, mesmos códigos de erro (`401 unauthenticated`, `404 board_not_found`, `404 list_not_found`). A informação de "quantos cards serão excluídos" (RN-03) é obtida pelo cliente reutilizando `GET /boards/:boardId/lists/:listId/cards` (RF04), que já retorna a lista completa de cards — sua contagem (`.length`) é suficiente, sem necessidade de um endpoint dedicado a contagem.

**Restrição de contrato:** nenhuma rota nova é criada nesta fase (nem uma rota de "preview de exclusão", nem uma de "contagem"). Se, no futuro, o volume de cards por lista tornar `GET .../cards` caro demais só para obter uma contagem, isso é uma otimização a ser tratada como uma fase própria — não faz parte do escopo de RF05.

## 5. Requisitos Não Funcionais

**Segurança**
- Nenhuma superfície de autorização nova: a exclusão de cards em cascata roda dentro da mesma verificação de posse de quadro/lista que `ListsService.remove` já fazia (RF02/RF03) — não há caminho para excluir cards de uma lista sem antes passar pelas mesmas checagens de dono.
- A contagem de cards exposta ao usuário (via `GET .../cards`) já é, desde RF04, escopada ao dono do quadro — nenhuma informação adicional é exposta por RF05.

**Desempenho**
- A exclusão de cards de uma lista é uma operação de exclusão em massa (todas as linhas com aquele `list_id`), não uma exclusão card a card — O(1) do ponto de vista de número de instruções ao banco, independentemente de quantos cards a lista tenha.
- Isso ocorre antes da reindexação das listas do quadro (já existente, O(número de listas do quadro)) — nenhuma mudança na complexidade dessa etapa.

**Escalabilidade**
- Mesmo modelo stateless de RF01–RF04: nenhum estado novo em memória entre requisições.

## 6. Restrições Explícitas para a Implementação

- `ListsService.remove` exclui os cards da lista antes de excluir a própria lista — nunca a lista primeiro.
- A exclusão de cards em `ListsService.remove` usa uma operação de exclusão em massa por `list_id` (uma query), não uma chamada por card.
- A constraint `onDelete: CASCADE` em `cards.list_id` (RF04) não é removida nem enfraquecida — permanece como rede de segurança redundante à exclusão explícita de aplicação.
- Nenhuma rota HTTP nova é criada; `DELETE /boards/:boardId/lists/:listId` mantém o contrato exato de RF03.
- O aviso de quantidade de cards no front-end reutiliza `GET .../cards` já existente; a contagem é buscada no momento da solicitação de exclusão, nunca a partir de estado local potencialmente desatualizado.
- Cancelar a confirmação no cliente não dispara nenhuma chamada de rede — nem a de exclusão, nem qualquer outra que altere estado.
- `ListsService` passa a depender de `CardRepository` (dependência de repositório, não de `CardsService`) — nenhuma dependência de serviço para serviço é criada entre os módulos `lists` e `cards`.
- Nenhuma dependência nova instalada para RF05 (seção 1).
