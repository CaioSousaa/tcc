# RF10 — Plano Técnico: Prazos em Cards, com Destaque de Atraso e Ordenação por Prazo

Referência: `docs/RF10-spec.md`. Este documento traduz a especificação em restrições de construção. Não descreve código. Assume `auth` (RF01), `boards` (RF02), `lists` (RF03), `cards` (RF04), a cascata de RF05, `checklists` (RF06), o modelo de membership de RF07, `labels` (RF08) e `comments` (RF09) já implementados e testados.

## 1. Tecnologias e Frameworks

Nenhuma dependência nova é necessária. RF10 é resolvido com o mesmo stack de RF01–RF09 (Express, TypeORM, PostgreSQL, `zod`, `apiClient` no front-end).

## 2. Arquitetura de Componentes e Fronteiras

### 2.1 Prazo é um campo do card existente, não um recurso novo

RF06–RF09 introduziram, cada um, um recurso novo (checklist, membership, etiqueta, comentário) com sua própria entidade e, na maioria dos casos, suas próprias rotas. RF10 é estruturalmente diferente: um prazo não é uma entidade com identidade própria, uma lista, ou algo que se cria e exclui separadamente — é um atributo do próprio card, da mesma natureza que `title` e `description` já são desde RF04. Não há, portanto, módulo novo, entidade nova, nem repositório novo: `dueDate` é uma coluna a mais em `Card`, lida e escrita pelos mesmos `CardRepository`/`CardsService`/`cards.controller` que já existem, através das mesmas rotas que já existem:

- `POST /boards/:boardId/lists/:listId/cards` (RF04) — `dueDate` passa a ser aceito, opcionalmente, na criação.
- `PATCH /boards/:boardId/lists/:listId/cards/:cardId` (RF04) — `dueDate` passa a ser aceito para definir, alterar ou remover o prazo, do mesmo jeito que `description` já aceita `null` para limpar o campo.

Nenhuma rota nova é criada para "definir prazo" — seria reintroduzir, para um campo simples, a mesma rota que já cobre esse campo desde RF04.

### 2.2 Status de atraso é calculado na serialização, nunca armazenado nem consultado à parte

RN-08 exige que "atrasado"/"vencimento próximo" nunca seja um valor gravado. Isso descarta tanto uma coluna (`is_overdue`) quanto uma consulta separada — o status é derivado só de `dueDate` e da data atual, no mesmo lugar em que RF06 já calcula o percentual de progresso: no `controller`, no momento de montar a resposta HTTP, não no `service` nem no `repository`. Diferente de `progress` (RF06), `assignees` (RF07) e `labels` (RF08) — todos dados que vêm de uma tabela associada e exigem uma leitura agregada em lote (`getProgressForCards`, `getAssigneesForCards`, `getLabelsForCards`) —, o status de prazo não depende de nenhuma outra tabela: é uma função pura de um campo que o card já carrega. Não há, portanto, nenhum método novo de leitura em lote no `CardsService` para isto — bastaria, e apenas, calcular o status a partir do `dueDate` de cada card já carregado.

**Restrição de fuso horário:** "hoje" é sempre a data atual do servidor em UTC. A especificação não define isso porque é uma decisão de construção, não de comportamento — mas precisa de uma resposta única para que "atrasado"/"vencimento próximo" seja determinístico. Comparar `dueDate` (armazenado sem horário nem fuso, seção 3) contra a data UTC do momento da consulta evita a ambiguidade de "fuso de qual usuário" sem introduzir nenhuma configuração nova.

### 2.3 Ordenação por prazo é um parâmetro de query, calculada em memória, sem nova consulta

Mesmo princípio de RF08 (filtro por etiqueta): ordenar por prazo é uma forma de visualização do `GET .../cards` já existente, nunca uma rota nova nem uma alteração de dados (RN-10). A diferença em relação ao filtro de RF08 é que RN-11/RN-12 não exigem cruzar nenhuma tabela — `dueDate` já está no próprio card retornado por `CardRepository.findAllByList` —, então a ordenação acontece inteiramente em memória, em `CardsService.list`, sobre a lista de cards já carregada na ordem manual (`position ASC`, RF04). Isso não precisa de nenhum método novo em `CardRepository`, diferente do filtro de etiquetas de RF08 (que precisou de `filterCardIdsByLabels` em `CardLabelRepository`, porque etiquetas vivem em outra tabela).

**Restrição de estabilidade (RN-12):** a ordenação por prazo deve ser uma ordenação estável aplicada sobre a lista já ordenada por posição manual — nunca uma nova consulta ao banco com `ORDER BY due_date`, que não teria nenhuma garantia de decidir o empate a favor da posição manual anterior. `Array.prototype.sort` do JavaScript é estável (garantido pela especificação ECMAScript desde 2019), então bastar ordenar a lista já carregada, sem embaralhar cards com o mesmo prazo (ou sem prazo) entre si, satisfaz RN-12 e RN-11 ao mesmo tempo.

## 3. Modelos de Dados e Schemas

### 3.1 `cards` ganha uma coluna nova
| Campo | Tipo | Restrições |
|---|---|---|
| due_date | date | nullable (RN-01) — tipo `DATE` do PostgreSQL, sem componente de horário nem fuso, refletindo diretamente a decisão da spec de que prazo é uma data, não uma data e hora |

**Sem índice em `due_date`.** Nenhuma consulta desta fase filtra ou ordena por `due_date` no banco — a ordenação (§2.3) acontece em memória, e não há nenhuma operação de "buscar cards vencendo em tal data" nesta especificação. Um índice sem nenhuma consulta que o use seria a mesma "engenhosidade evitável" que RF06 já rejeitou para a posição de checklist.

### 3.2 `boards`, `lists`, `users` — sem alteração de schema
Nenhuma coluna nova fora de `cards.due_date`.

## 4. Interfaces: APIs e Contratos

Nenhum prefixo novo — RF10 estende contratos já existentes de RF04.

**Restrição de formato:** `dueDate`, quando presente no corpo da requisição, é sempre uma string no formato `AAAA-MM-DD` (o mesmo formato que um seletor de data HTML padrão já produz) — nunca uma string ISO 8601 completa com horário, para não reabrir a ambiguidade que a spec fechou ao definir prazo como só uma data.

### `POST .../cards` (RF04, contrato estendido)
- Body ganha um campo opcional: `{ ..., dueDate?: string }` (formato `AAAA-MM-DD`).
- 400 `validation_error`: `dueDate` presente mas não é uma data válida nesse formato (critério 3).

### `PATCH .../cards/:cardId` (RF04, contrato estendido)
- Body ganha um campo opcional: `{ ..., dueDate?: string | null }` — `string` define ou altera o prazo (critério 7); `null` remove o prazo, inclusive quando o card já não tinha nenhum (RN-04, idempotente, critério 9); campo ausente não toca no prazo atual — mesma convenção já usada por `description` desde RF04.
- 400 `validation_error`: `dueDate` presente, não nulo, e não é uma data válida nesse formato (critério 3). Uma data no passado **não** é um erro de validação (RN-03, critério 2).

### Contrato estendido: todo card passa a incluir prazo e status
A partir de RF10, toda resposta de card (`GET/POST/PATCH .../cards`) passa a incluir:
```
"dueDate": "AAAA-MM-DD" | null,
"dueDateStatus": "overdue" | "due_soon" | null
```
- `dueDateStatus` é sempre derivado de `dueDate` e da data atual (§2.2) — nunca um valor que o cliente envia ou que o servidor grava.
- `"overdue"` quando `dueDate` é anterior a hoje (RN-05); `"due_soon"` quando `dueDate` é hoje ou amanhã (RN-06); `null` quando `dueDate` é `null` ou é uma data a partir de depois de amanhã (RN-07, critérios 13, 14) — nunca os dois de uma vez (RN-06).

### Contrato estendido: `GET .../cards` ganha ordenação por prazo
- Query param opcional: `?sortByDueDate=true`.
- Sem esse parâmetro (ausente, `false`, ou qualquer outro valor): comportamento inalterado, ordem manual por posição (RF04).
- Com `sortByDueDate=true`: cards reordenados do prazo mais próximo para o mais distante; cards sem prazo depois de todos os cards com prazo (RN-11); empates preservam a ordem relativa da posição manual (RN-12, critério 19). A posição manual armazenada de cada card não é alterada por este parâmetro (RN-10, critério 20).

## 5. Requisitos Não Funcionais

**Segurança**
- `dueDate` é validado estritamente no formato `AAAA-MM-DD` — nenhum parser de data "flexível" é usado, para não aceitar formatos ambíguos (por exemplo, `MM/DD/AAAA` vs `DD/MM/AAAA`) que poderiam gravar uma data diferente da pretendida.
- `dueDateStatus` nunca é aceito do cliente em nenhuma rota — é sempre calculado no servidor.
- Rate limiting dedicado não é necessário, mesmo raciocínio de RF02–RF09.

**Desempenho**
- Calcular `dueDateStatus` não custa nenhuma consulta adicional — é uma comparação de datas em memória sobre um campo que o card já carrega, diferente de `progress`/`assignees`/`labels` (RF06–RF08), que exigem uma leitura em lote de outra tabela.
- Ordenar por prazo (`sortByDueDate=true`) é uma ordenação em memória sobre a mesma lista de cards já buscada por `CardRepository.findAllByList` — nenhuma consulta adicional ao banco.

**Escalabilidade**
- Mesmo modelo stateless de RF01–RF09: nenhum estado novo em memória entre requisições.

## 6. Restrições Explícitas para a Implementação

- `dueDate` é um campo de `Card`, tratado por `CardsService`/`cards.controller`/`cards.schemas` já existentes — nenhum módulo, entidade, repositório, service ou controller novo é criado para esta fase.
- `dueDateStatus` é calculado exclusivamente em `cards.controller.ts`, no mesmo lugar em que `progress` já é serializado (RF06) — nunca em `CardsService` nem em `CardRepository`, e nunca armazenado.
- A comparação de "hoje" usa a data UTC do servidor no momento da requisição (§2.2) — não a de nenhum fuso horário de cliente.
- Nenhum índice é criado em `cards.due_date` (§3.1) — não introduzir um "por garantia" sem uma consulta que o use.
- A ordenação por prazo (`sortByDueDate=true`) é resolvida inteiramente em `CardsService.list`, em memória, sobre a lista já retornada por `CardRepository.findAllByList` — nenhum método novo é adicionado a `CardRepository`, e nenhuma consulta com `ORDER BY due_date` é feita ao banco.
- A ordenação por prazo usa uma ordenação estável (RN-12) — cards com o mesmo prazo (inclusive `null`) nunca trocam de posição relativa entre si.
- `dueDate`, no corpo da requisição, é sempre uma string `AAAA-MM-DD` ou `null` — nunca uma string de data e hora completa.
- Nenhuma dependência nova instalada para RF10 (seção 1).
- Uso de PostgreSQL via TypeORM obrigatório para a coluna `due_date` (tipo `date`) — sem acesso a banco fora do ORM.
