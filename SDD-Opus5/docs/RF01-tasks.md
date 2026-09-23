# RF01 — Tarefas de implementação

**Base:** `docs/RF01-spec.md` e `docs/RF01-plan.md`.

Cada tarefa entrega uma parte funcional e verificável isoladamente. A ordem respeita dependências: infraestrutura, domínio do back-end, API, front-end, testes e verificação final.

Legenda de estado: `pendente` · `em andamento` · `concluída` · `bloqueada`

Restrição do ambiente (`context.md`): a verificação automática permitida é `tsc` e `npm run build`. Testes, endpoints e fluxos de API **não são executados** nesta seção; os testes unitários são escritos e verificados apenas quanto à compilação.

---

## Back-end

### T01 — Infraestrutura e configuração de ambiente
- Corrigir `docker-compose.yml` (variáveis compatíveis com a imagem, `env_file`, volume nomeado) — C24.
- Completar `.env` com `PORT`, `NODE_ENV`, `POSTGRES_HOST`, `POSTGRES_PORT`, `JWT_SECRET`, `SESSION_PERSISTENT_TTL_DAYS`, `SESSION_SHORT_TTL_HOURS`, `CORS_ORIGIN`.
- `config/env.ts`: leitura e validação das variáveis; abortar se `JWT_SECRET` ausente ou com menos de 32 caracteres — N12, C16.
- Instalar dependências do plano (`bcryptjs`, `zod`, `cookie-parser`, `helmet` e tipos) — C22.
- **Pronto quando:** `tsc` compila e a configuração rejeita segredo inválido.
- **Estado:** concluída

### T02 — Persistência: DataSource, entidade e migration
- `config/data-source.ts` com `synchronize: false` — C11, N3.
- Entidade `User` (`uuid`, `name`, `email`, `password_hash` com `select: false`, timestamps) — D1–D5.
- Migration reversível criando `users` e índice único de e-mail — D6, D7.
- Scripts npm de migration.
- **Pronto quando:** `tsc` compila e a migration possui `up` e `down`.
- **Estado:** concluída

### T03 — Erros de domínio, validação e tratador central
- `errors/AppError.ts` com os 6 códigos de A10 e as mensagens da spec 5.4.
- `schemas/auth.schemas.ts` (registro e login) com normalização de e-mail e nome, senha sem corte, erros agregados — RN02–RN06, C08–C10, CB01–CB07, CB10.
- `middlewares/validate.ts` e `middlewares/errorHandler.ts` (envelope único, sem detalhe interno, 413 para corpo grande) — A7–A9, CE04.
- **Pronto quando:** schemas produzem `fields` com todas as falhas e o tratador responde no envelope.
- **Estado:** concluída

### T04 — Serviços de senha, token e utilitário de cookie
- `PasswordService`: hash assíncrono com custo 10, verificação, verificação fictícia — C04, C05.
- `TokenService`: emissão HS256 com `sub`, expiração de 30 dias ou 8 horas; verificação com algoritmo fixo distinguindo expirado de inválido — A13–A16.
- `utils/cookies.ts`: cookie `session_token` HttpOnly, `SameSite=Lax`, `Secure` em produção, `Max-Age` só na sessão persistente; limpeza com os mesmos atributos — C01, C02, A11.
- **Pronto quando:** `tsc` compila e as opções do cookie seguem a tabela 4.7 do plano.
- **Estado:** concluída

### T05 — Repositório e serviço de autenticação
- `UserRepository`: busca por e-mail com hash, busca por id, criação.
- `AuthService`: `register` (pré-checagem amigável + tradução da violação de unicidade — C07, CB09), `login` (resposta idêntica para e-mail inexistente e senha errada — C05, C06), `getSessionUser`; serializador público `{ id, name, email }` — C14.
- Serviço sem conhecimento de HTTP — C13, F2.
- **Pronto quando:** `tsc` compila e o serviço não importa Express.
- **Estado:** concluída

### T06 — Controller, rotas, middleware de autenticação e bootstrap
- `middlewares/authenticate.ts`: ponto único de resolução de identidade; `SESSION_EXPIRED` vs `UNAUTHENTICATED` — N18, C12, CB12.
- `AuthController` e `routes/auth.routes.ts`: `POST /api/auth/register` (201 + cookie persistente), `POST /api/auth/login` (`rememberMe` padrão `true`), `POST /api/auth/logout` (204 idempotente), `GET /api/auth/me`.
- `app.ts` e `main.ts`: `helmet`, CORS com origem explícita e credenciais, `cookie-parser`, limite de 10 KB, inicialização do banco antes do `listen` — A17–A19, N11.
- **Pronto quando:** `tsc` e `npm run build` passam.
- **Estado:** concluída

### T07 — Testes unitários do back-end
- Instalar executor de testes.
- Schemas (CA04–CA08, CA14, CB01–CB07, CB10), senha (C04, CB07), token (A13–A16), cookies (C02, A11), `AuthService` com repositório em memória (CA01–CA03, CA09–CA13, CB09, C05, C14), `authenticate` (CA19, CB12), tratador de erros (A7–A10, CE04).
- **Pronto quando:** testes compilam com `tsc`. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, por restrição do `context.md`)

---

## Front-end

### T08 — Base do cliente: API, schemas, redirecionamento seguro e contexto de sessão
- Instalar dependências (`npm install` e `zod`) — C22.
- `lib/api.ts` com `withCredentials` e interceptador de 401 — F5, A18.
- `schemas/auth.ts` com as mesmas regras e mensagens — C20.
- `lib/redirect.ts`: aceita só caminho interno — A20, C19.
- `contexts/AuthContext.tsx`: `GET /auth/me` uma vez, `login`, `register`, `logout` — N4, F6.
- **Pronto quando:** `tsc` compila.
- **Estado:** concluída

### T09 — Proteção de rotas no Next
- Arquivo de interceptação de rotas da versão instalada do Next, verificando só a presença do cookie — C17, CA23, CA25.
- Visitante em rota protegida vai para `/login?redirect=<rota>`; autenticado em `/login` ou `/register` vai para `/boards`; `/` decide pelo cookie.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T10 — Telas de login e criação de conta
- Layout do protótipo (painel de formulário + painel escuro) — F8.
- Validação no cliente, erros por campo e aviso geral, senha limpa e e-mail preservado após erro, botão bloqueado durante o envio — N19–N22, CA27, CE01, CE03.
- "Manter-me conectado neste dispositivo" marcado por padrão — RN10.
- Aviso de sessão expirada — A21, CA19.
- Redirecionamento pós-login ao destino original — CA24.
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T11 — Área autenticada inicial, cabeçalho e logout
- Layout protegido sem renderizar conteúdo antes de confirmar a sessão — C18, F7.
- `AppHeader` com marca, nome do usuário e ação de sair — CA21, CA22.
- Página `/boards` como área autenticada inicial (conteúdo de quadros fica para o RF02).
- **Pronto quando:** `npm run build` passa.
- **Estado:** concluída

### T12 — Testes unitários do front-end
- Instalar executor de testes.
- Schemas do cliente (mensagens idênticas à spec 5.4), `redirect` seguro (A20), extração de mensagens de erro da API (A8, CE01).
- **Pronto quando:** testes compilam com `tsc`. Execução não permitida nesta seção.
- **Estado:** concluída (escritos e compilando; **não executados**, por restrição do `context.md`)

---

## Verificação

### T13 — Conferência final contra especificação e plano
- `tsc` e `npm run build` nos dois projetos.
- Revisão das restrições C01–C24 e da tabela de rastreabilidade do plano.
- Atualizar este arquivo com o estado final.
- **Estado:** concluída

---

## Resumo final

| Tarefa | Estado | Verificação realizada |
| --- | --- | --- |
| T01 — Infraestrutura e ambiente | concluída | `tsc` |
| T02 — DataSource, entidade e migration | concluída | `tsc`, `npm run build` |
| T03 — Erros, validação e tratador central | concluída | `tsc`, `npm run build` |
| T04 — Senha, token e cookie | concluída | `tsc`, `npm run build` |
| T05 — Repositório e `AuthService` | concluída | `tsc`, `npm run build` |
| T06 — Controller, rotas, `authenticate`, bootstrap | concluída | `tsc`, `npm run build` |
| T07 — Testes unitários do back-end | concluída (não executados) | `tsc` |
| T08 — Cliente HTTP, schemas, redirect, contexto | concluída | `tsc`, `npm run build` |
| T09 — Proteção de rotas | concluída | `tsc`, `npm run build` |
| T10 — Telas de login e cadastro | concluída | `tsc`, `npm run build` |
| T11 — Área autenticada, cabeçalho e logout | concluída | `tsc`, `npm run build` |
| T12 — Testes unitários do front-end | concluída (não executados) | `tsc`, `npm run build` |
| T13 — Conferência final | concluída | revisão de C01–C24 e da rastreabilidade do plano |

### Arquivos de teste

**Back-end** (`back-end/src/__tests__/`, executor `vitest`, comando `npm test`):

| Arquivo | Requisitos codificados |
| --- | --- |
| `auth.schemas.test.ts` | CA04–CA08, CA10, CA13, CA14, RN02–RN06, RN10, CB01–CB08, CB10 |
| `PasswordService.test.ts` | N1, C04, RN05, RN07, RN08, CA13, CB07 |
| `TokenService.test.ts` | RN09, A13–A16, C16, CA19, CB12 |
| `cookies.test.ts` | C01, C02, A11, CA16, CA17, CA18 |
| `AuthService.test.ts` | CA01–CA03, CA09–CA13, CA15, CA16, CA17, CA19, CA20, CA22, CA26, C05, C07, C14, CB09, CB12, CE02, D5, RN07, RN08, RN10, RN13, RN15 |
| `authenticate.test.ts` | CA15, CA19, CA22, CA23, CB11, CB12, RN13 |
| `errorHandler.test.ts` | A1, A7–A10, CA07, CE04, N5, N6, limite de 10 KB |
| `env.test.ts` | RN09, N12, C16, A17 |

**Front-end** (`front-end/src/**/__tests__/`, executor `vitest`, comando `npm test`):

| Arquivo | Requisitos codificados |
| --- | --- |
| `schemas/__tests__/auth.test.ts` | spec 5.4, CA01, CA04–CA08, CA10, CA13, CA14, RN02, RN04, RN05, RN10, CB01, CB04–CB07, CB10 |
| `lib/__tests__/redirect.test.ts` | A20, A21, C19, CA19, CA24, CA25 |
| `lib/__tests__/routeGuard.test.ts` | C17, CA15, CA19, CA23, CA24, CA25, CB11, CB15 |
| `lib/__tests__/api.test.ts` | A8, A18, CA07, CA11, CA19, CB12, CE01, CE04 |
| `lib/__tests__/initials.test.ts` | CA22 |

### Desvios e decisões tomadas durante a implementação

| Ponto | Decisão | Motivo |
| --- | --- | --- |
| `middleware.ts` (plano 2.4) | Implementado como `src/proxy.ts` | No Next.js 16 instalado, `middleware` foi renomeado para `proxy`. O comportamento é o previsto no plano (C17). |
| Executor de testes | `vitest` adicionado como dependência de desenvolvimento nos dois projetos | A fase exige testes unitários; o plano não listava executor. |
| `@types/node` do front-end | Atualizado de `^20` para `^24` | Conflito de peer dependency com o `vitest`; o runtime local é Node 24. |
| Limite de 72 bytes do bcrypt | A senha passa por SHA-256 (base64) antes do bcrypt, mantendo custo 10 | Senhas podem ter até 100 caracteres (RN05); sem isso, duas senhas diferentes só depois do byte 72 seriam aceitas uma pela outra. |
| Identificador do usuário | UUID gerado na aplicação, token assinado antes do `INSERT` | Garante RN15 sem transação: falha na emissão do token não deixa conta persistida. |
| Migrations | `migrationsRun: true` na inicialização, com scripts `migration:run` e `migration:revert` | O banco fica migrado antes de a API aceitar conexões (plano 1.3); `synchronize` continua desligado. |
| `docker-compose.yml` | Trocado para a imagem oficial `postgres:16-alpine`, com `env_file` e volume `postgres_data` | C24. O nome do contêiner passou a ser `tcc_postgres`. |
| Mensagens sem entrada na spec 5.4 | `UNAUTHENTICATED`: "Entre na sua conta para continuar."; `VALIDATION_ERROR` geral: "Verifique os campos informados."; `rememberMe` inválido: "Valor inválido."; senha acima de 100: "A senha deve ter no máximo 100 caracteres." | A spec não define texto para esses casos; as mensagens de campo continuam sendo as da tabela. |
| Sessão inválida detectada no front-end | O `AuthProvider` chama `POST /auth/logout` antes de redirecionar, e o proxy não expulsa de `/login?expired=1` quem ainda tem cookie | Evita laço de redirecionamento entre `/boards` e `/login` quando o cookie está expirado ou adulterado (CB11, CB12). |
| E-mail já cadastrado | Mensagem exibida junto ao campo de e-mail | N21: erro associado a um campo aparece junto ao campo. |
| Falha de rede ao confirmar a sessão | Área autenticada mostra a mensagem genérica com "Tentar novamente", sem deslogar | Uma falha de comunicação não é evidência de sessão inválida (CE01). |

### Pendências fora do alcance desta seção

- Execução dos testes (`npm test` nos dois projetos) e verificação ponta a ponta dos fluxos: não realizadas por restrição do `context.md`.
- Subir o banco (`docker compose up -d` em `back-end/`) antes de `npm run dev`: a API aborta se o banco estiver inacessível, como exige o plano.
