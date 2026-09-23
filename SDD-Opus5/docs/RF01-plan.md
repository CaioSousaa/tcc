# RF01 — Plano técnico

**Base:** `docs/RF01-spec.md` (especificação funcional aprovada).
**Escopo deste plano:** como construir cadastro, login, sessão persistente, encerramento de sessão e proteção de acesso, respeitando integralmente CA01–CA27, RN01–RN15 e CB/CE da especificação.

Este documento define **restrições de implementação**. Onde aparece "deve", a implementação não tem liberdade de escolha. Onde aparece "pode", há margem, desde que os critérios de aceite continuem verificáveis.

---

## 1. Tecnologias e frameworks

### 1.1 Stack fixada pelo contexto do projeto

| Camada | Tecnologia | Situação |
| --- | --- | --- |
| Banco de dados | PostgreSQL (container do `back-end/docker-compose.yml`) | já definido |
| ORM | TypeORM | já definido |
| Back-end | Node.js + Express 5 + TypeScript | já instalado |
| Front-end | Next.js 16 (App Router) + React 19 + TypeScript | já instalado |
| Estilo | Tailwind CSS 4 | já instalado |
| Cliente HTTP | axios | já instalado |
| Token de sessão | `jsonwebtoken` | já instalado |

### 1.2 Dependências novas a instalar

Devem ser instaladas de fato (`npm install`), nunca assumidas.

**Back-end:**

| Pacote | Função | Justificativa |
| --- | --- | --- |
| `bcryptjs` + `@types/bcryptjs` | hash e verificação de senha | atende RN07; implementação em JS puro, sem compilação nativa, evitando quebra de build entre máquinas |
| `zod` | validação e normalização de entrada | erros agregados por campo em uma única passada, exigido por CA07 e pela seção 2.1 da especificação |
| `cookie-parser` + `@types/cookie-parser` | leitura do cookie de sessão | o token trafega em cookie, não em cabeçalho manipulado pelo cliente |
| `helmet` | cabeçalhos HTTP de segurança | resposta padrão endurecida; complementa CE04 |

**Front-end:**

| Pacote | Função | Justificativa |
| --- | --- | --- |
| `zod` | validação dos formulários no cliente | mesmas regras e mensagens do back-end, sem duplicar texto |

Nenhuma outra dependência deve ser introduzida para atender ao RF01. Bibliotecas de autenticação prontas (Passport, NextAuth, Auth.js) **não** devem ser usadas: a especificação exige controle explícito sobre duração de sessão, persistência opcional e mensagens de erro, e o objetivo do trabalho é medir a construção da solução, não a configuração de um framework de terceiros.

### 1.3 Ajustes obrigatórios na infraestrutura existente

1. O `docker-compose.yml` atual usa a imagem `bitnami/postgresql` com variáveis `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB`, que essa imagem não reconhece (ela espera o prefixo `POSTGRESQL_`). A implementação deve corrigir esse ponto, trocando para variáveis reconhecidas pela imagem ou para a imagem oficial `postgres`, e deve declarar `env_file` e um volume nomeado para os dados.
2. O back-end ainda não inicializa TypeORM nem carrega variáveis de ambiente. A inicialização do `DataSource` deve ocorrer antes de o servidor passar a aceitar conexões: falha de conexão com o banco deve derrubar o processo com log claro, nunca subir um servidor que responderia 500 em toda requisição.
3. O front-end não possui cliente HTTP configurado nem provedor de sessão. Ambos entram neste requisito.

### 1.4 Variáveis de ambiente

**Back-end (`back-end/.env`):**

| Variável | Exemplo | Restrição |
| --- | --- | --- |
| `PORT` | `3333` | porta da API |
| `NODE_ENV` | `development` | controla o atributo `Secure` do cookie |
| `POSTGRES_HOST` / `POSTGRES_PORT` | `localhost` / `5432` | conexão do TypeORM |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `postgres` / `postgres` / `tcc_db` | já existentes |
| `JWT_SECRET` | — | obrigatória, mínimo 32 caracteres; o processo deve abortar na inicialização se estiver ausente ou curta demais |
| `SESSION_PERSISTENT_TTL_DAYS` | `30` | RN09 |
| `SESSION_SHORT_TTL_HOURS` | `8` | RN09 |
| `CORS_ORIGIN` | `http://localhost:3000` | origem única e explícita; `*` é proibido |

**Front-end (`front-end/.env.local`):**

| Variável | Exemplo | Restrição |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3333` | base da API |

Nenhum segredo pode ser exposto com o prefixo `NEXT_PUBLIC_`. O `JWT_SECRET` nunca chega ao front-end.

---

## 2. Arquitetura de componentes e fronteiras

### 2.1 Visão geral

Duas aplicações separadas, comunicando-se por HTTP com cookie de sessão:

```
Navegador
  ├── Next.js (localhost:3000)
  │     ├── middleware de rota (verificação de presença do cookie)
  │     ├── páginas públicas: /login, /register
  │     ├── páginas protegidas: /boards (área autenticada inicial)
  │     └── AuthProvider (estado do usuário autenticado no cliente)
  │
  └── HTTP com credenciais (cookie httpOnly)
        │
        └── API Express (localhost:3333)
              routes → middlewares → controllers → services → repositories → TypeORM → PostgreSQL
```

### 2.2 Back-end: camadas e fronteiras

| Camada | Responsabilidade | Proibições |
| --- | --- | --- |
| **Routes** | declarar caminhos, métodos e a cadeia de middlewares | não conter regra de negócio |
| **Middlewares** | validação de schema, autenticação, tratamento de erro, CORS, cookies | não acessar o banco, exceto o guard de autenticação, que apenas resolve a identidade |
| **Controllers** | traduzir HTTP em chamada de serviço e serializar a resposta | não conter regra de negócio, não acessar repositório, não montar SQL |
| **Services** | regras de negócio (RN01–RN15), hash e verificação de senha, emissão de token | não conhecer `Request`, `Response`, cookies, status HTTP ou cabeçalhos |
| **Repositories** | acesso a dados via TypeORM | não conter regra de negócio nem validação de entrada |
| **Entities** | mapeamento objeto-relacional e restrições de schema | não conter lógica de aplicação |

Regras de fronteira obrigatórias:

- **F1.** Um controller nunca importa TypeORM nem entidades diretamente para consulta; sempre passa pelo serviço.
- **F2.** Um serviço nunca lança erro HTTP; lança erros de domínio tipados, traduzidos para status pelo tratador central de erros.
- **F3.** Nenhuma camada além do serviço de autenticação manipula hash de senha ou token.
- **F4.** A entidade de usuário nunca é devolvida diretamente na resposta; existe um serializador único que produz o objeto público `{ id, name, email }` (RN07).

### 2.3 Estrutura de arquivos prevista (back-end)

```
back-end/src/
  main.ts                      inicialização: env, DataSource, app, listen
  config/
    env.ts                     leitura e validação das variáveis de ambiente
    data-source.ts             configuração do TypeORM
  entities/
    User.ts
  repositories/
    UserRepository.ts
  services/
    AuthService.ts             registro, login, resolução de sessão
    PasswordService.ts         hash e verificação
    TokenService.ts            emissão e verificação do token
  controllers/
    AuthController.ts
  routes/
    auth.routes.ts
    index.ts
  middlewares/
    validate.ts                validação por schema
    authenticate.ts            exige sessão válida
    errorHandler.ts            tradutor central de erros
  schemas/
    auth.schemas.ts
  errors/
    AppError.ts                erros de domínio tipados
  utils/
    cookies.ts                 emissão e limpeza do cookie de sessão
  migrations/
```

### 2.4 Front-end: camadas e fronteiras

| Componente | Responsabilidade |
| --- | --- |
| `middleware.ts` | barrar navegação de visitante em rota protegida (CA23) e de autenticado em rota pública (CA25), pela presença do cookie |
| `lib/api.ts` | instância axios com `withCredentials: true` e interceptador de 401 |
| `contexts/AuthContext.tsx` | estado do usuário, ações de login, registro e logout, carregamento inicial via `GET /auth/me` |
| `app/(public)/login`, `app/(public)/register` | formulários, validação no cliente e exibição de erros por campo |
| `app/(app)/boards` | área autenticada inicial deste requisito |
| `components/AppHeader.tsx` | identificação do usuário autenticado e ação de sair (CA22, CA21) |
| `schemas/auth.ts` | schemas zod compartilhados pelos formulários |

Regras de fronteira obrigatórias:

- **F5.** Nenhum componente chama `axios` diretamente; todo acesso passa por `lib/api.ts`.
- **F6.** Token e dados de sessão nunca são gravados em `localStorage` ou `sessionStorage` (ver seção 5.2).
- **F7.** Páginas protegidas não renderizam conteúdo autenticado antes de a sessão estar confirmada; enquanto o estado inicial carrega, exibem um estado de carregamento (CA23 exige que o conteúdo protegido não apareça em momento algum).
- **F8.** O layout do protótipo (`prototipo/paginas/tela-login.png`, `criar-conta.png`, `meus-quadros.png`) é a referência visual: painel de formulário à esquerda, painel escuro de apresentação à direita, cabeçalho com marca à esquerda e identificação do usuário à direita.

### 2.5 Divisão de responsabilidade na proteção de rotas

Esta divisão é uma restrição, não uma sugestão:

1. O `middleware.ts` do Next faz **apenas verificação de presença** do cookie de sessão. Ele não valida assinatura nem expiração, porque o segredo não deve existir no front-end.
2. A verificação **autoritativa** é do back-end, em toda requisição, no middleware `authenticate` (RN12).
3. O `AuthProvider` confirma a sessão chamando `GET /auth/me` ao montar. Resposta 401 significa cookie presente mas inválido ou expirado: o front-end limpa o estado e redireciona para `/login` com indicação de sessão expirada (CA19, CB11, CB12).

Consequência aceita: um cookie expirado ainda presente no navegador faz a navegação passar pelo middleware e ser barrada logo em seguida pelo `AuthProvider`. Isso é correto do ponto de vista de segurança — nenhum dado protegido é servido — e é o comportamento esperado por CB11.

---

## 3. Modelo de dados e schema

### 3.1 Tabela `users`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `uuid` | chave primária, gerada pela aplicação/banco |
| `name` | `varchar(100)` | `NOT NULL` |
| `email` | `varchar(254)` | `NOT NULL`, índice único |
| `password_hash` | `varchar(255)` | `NOT NULL` |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()` |
| `updated_at` | `timestamptz` | `NOT NULL`, default `now()`, atualizado em cada escrita |

Restrições de modelagem:

- **D1.** O e-mail é gravado já normalizado em minúsculas e sem espaços nas extremidades (RN02). A unicidade é garantida por **índice único no banco**, não por consulta prévia na aplicação. A consulta prévia existe apenas para produzir a mensagem amigável; a garantia é a violação de unicidade, capturada e traduzida para o erro de e-mail já cadastrado. Isso é o que atende CB09 (cadastros simultâneos).
- **D2.** Não se deve usar a extensão `citext`. A normalização em minúsculas na aplicação, mais o índice único comum, já satisfazem RN01 e CA03/CA10 e evitam dependência de extensão do banco.
- **D3.** A coluna de hash chama-se `password_hash` e nunca `password`. Ela deve ser marcada no ORM para não ser selecionada por padrão; sua leitura acontece só na verificação de credenciais (RN07).
- **D4.** Não existe tabela de sessões neste requisito. A sessão é representada por um token assinado, sem estado no servidor (ver 5.3 para a consequência disso).
- **D5.** O identificador é `uuid` e não inteiro sequencial, para não expor volume de contas nem permitir varredura por identificador previsível.

### 3.2 Migrations

- **D6.** O schema deve ser criado por **migration versionada** do TypeORM. `synchronize: true` é proibido em qualquer ambiente, inclusive desenvolvimento, para que o estado do banco seja reproduzível e auditável.
- **D7.** A migration do RF01 cria a tabela `users` e o índice único de e-mail, e deve ser reversível (`down` funcional).

---

## 4. Interfaces: API e contratos

### 4.1 Convenções gerais

- Prefixo de rotas: `/api`. Recursos deste requisito sob `/api/auth`.
- Corpo de requisição e resposta em JSON, `Content-Type: application/json`.
- Tamanho máximo do corpo: 10 KB. Acima disso, 413.
- Toda resposta de erro segue o mesmo envelope (seção 4.6).
- Nenhum endpoint recebe identificador de usuário no corpo, na query ou em cabeçalho: a identidade vem sempre do cookie (RN13).

### 4.2 `POST /api/auth/register`

Cria conta e inicia sessão persistente (RN10, CA18).

Requisição:

| Campo | Tipo | Regras |
| --- | --- | --- |
| `name` | string | obrigatório; espaços das extremidades removidos; 2 a 100 caracteres após o corte (RN04) |
| `email` | string | obrigatório; espaços removidos; convertido para minúsculas; formato válido; até 254 caracteres (RN02, RN03) |
| `password` | string | obrigatório; 8 a 100 caracteres; sem corte de espaços (RN05) |
| `confirmPassword` | string | obrigatório; igual a `password` (RN06) |

Respostas:

| Status | Situação | Corpo |
| --- | --- | --- |
| `201` | conta criada | `{ "user": { "id", "name", "email" } }` + `Set-Cookie` de sessão persistente |
| `400` | validação falhou | envelope de erro com `code: "VALIDATION_ERROR"` e mapa `fields` |
| `409` | e-mail já cadastrado | envelope com `code: "EMAIL_ALREADY_EXISTS"` |
| `500` | falha inesperada | envelope com `code: "INTERNAL_ERROR"` |

Restrições:

- **A1.** A validação é executada inteira antes de responder; todos os campos inválidos aparecem de uma vez em `fields` (CA07).
- **A2.** Criação da conta e emissão do cookie acontecem na mesma resposta. Se a emissão do token falhar, a transação da conta não é confirmada (RN15).
- **A3.** `confirmPassword` não é persistido nem registrado em log.

### 4.3 `POST /api/auth/login`

Requisição:

| Campo | Tipo | Regras |
| --- | --- | --- |
| `email` | string | obrigatório; normalizado como no registro |
| `password` | string | obrigatório; não normalizado |
| `rememberMe` | boolean | opcional; ausente equivale a `true` (RN10) |

Respostas:

| Status | Situação | Corpo |
| --- | --- | --- |
| `200` | credenciais corretas | `{ "user": { "id", "name", "email" } }` + `Set-Cookie` com a duração escolhida |
| `400` | campos ausentes ou malformados | `VALIDATION_ERROR` |
| `401` | e-mail inexistente **ou** senha incorreta | `INVALID_CREDENTIALS` |
| `500` | falha inesperada | `INTERNAL_ERROR` |

Restrições:

- **A4.** As duas causas de falha produzem status, código, mensagem e forma de resposta idênticos (RN08, CA11, CA12).
- **A5.** Quando o e-mail não existe, o serviço deve ainda assim executar uma verificação de hash contra um valor fictício de custo equivalente, para que o tempo de resposta não revele a existência da conta (RN08).
- **A6.** Um login bem-sucedido substitui o cookie anterior do mesmo navegador (CB16).

### 4.4 `POST /api/auth/logout`

- Requer sessão válida? **Não.** Responde `204` mesmo sem cookie ou com cookie inválido (CB13).
- Sempre emite `Set-Cookie` de limpeza, com os mesmos atributos do cookie original e expiração no passado.
- Não afeta sessões de outros dispositivos (CA20) — consequência direta de D4.

### 4.5 `GET /api/auth/me`

- `200` com `{ "user": { "id", "name", "email" } }` quando há sessão válida.
- `401` com `code: "SESSION_EXPIRED"` quando o token existe mas está expirado.
- `401` com `code: "UNAUTHENTICATED"` quando não há cookie, a assinatura é inválida, o formato é irreconhecível ou o usuário do token não existe mais (CB12).
- É a fonte da identificação exibida no cabeçalho (CA22) e o mecanismo de confirmação de sessão do front-end.

### 4.6 Envelope de erro

```
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "texto exibível ao usuário",
    "fields": { "email": "Informe um e-mail válido." }
  }
}
```

- **A7.** `fields` só existe em `VALIDATION_ERROR`, com uma entrada por campo inválido.
- **A8.** `message` deve corresponder exatamente à tabela de mensagens da seção 5.4 da especificação. O front-end exibe a mensagem recebida; não mantém um segundo catálogo de textos para erros vindos da API.
- **A9.** `message` nunca contém detalhe interno: nome de tabela, consulta, caminho de arquivo ou pilha (CE04). O detalhe técnico vai apenas para o log do servidor.
- **A10.** Códigos de erro deste requisito, e nenhum outro: `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `UNAUTHENTICATED`, `SESSION_EXPIRED`, `INTERNAL_ERROR`.

### 4.7 Contrato do cookie de sessão

| Atributo | Valor | Motivo |
| --- | --- | --- |
| Nome | `session_token` | único cookie do requisito |
| `HttpOnly` | sim | impede leitura por script, mitigando roubo de sessão por XSS |
| `SameSite` | `Lax` | front-end e API compartilham o host `localhost`, logo o cookie é same-site; `Lax` cobre a navegação e barra envio em requisições cross-site |
| `Secure` | somente quando `NODE_ENV=production` | em desenvolvimento o transporte é HTTP |
| `Path` | `/` | válido para toda a aplicação |
| `Max-Age` | 30 dias na sessão persistente; **ausente** na sessão de curta duração | a ausência de `Max-Age` transforma o cookie em cookie de sessão do navegador, que morre ao fechá-lo — é exatamente o que separa CA16 de CA17 |
| Conteúdo | JWT assinado em HS256 | ver 4.8 |

- **A11.** A sessão de curta duração tem **duas** barreiras independentes: cookie sem `Max-Age` (morre ao fechar o navegador) e `exp` do token em 8 horas (RN09). As duas devem existir; nenhuma sozinha atende CA17 e CA19 ao mesmo tempo.
- **A12.** O token não pode trafegar em `Authorization: Bearer` nem ser devolvido no corpo da resposta. Se ele chegasse ao JavaScript da página, F6 seria impossível de garantir.

### 4.8 Conteúdo do token

| Claim | Conteúdo |
| --- | --- |
| `sub` | identificador do usuário |
| `iat` | emissão |
| `exp` | expiração: 30 dias ou 8 horas, conforme a escolha do login |

- **A13.** O token não carrega nome, e-mail nem qualquer dado exibível: esses vêm de `GET /auth/me`, para que uma alteração futura de nome não fique presa ao token.
- **A14.** O token não carrega hash de senha, papel ou permissão.
- **A15.** Algoritmo fixo HS256 e verificação com algoritmo explicitamente declarado. Aceitar o algoritmo anunciado pelo próprio token é proibido.
- **A16.** Não há renovação automática nem "sessão deslizante" (RN09): o `exp` é definido no login e não é estendido por atividade.

### 4.9 CORS

- **A17.** `origin` deve ser o valor exato de `CORS_ORIGIN`; `*` é proibido, porque é incompatível com envio de credenciais.
- **A18.** `credentials: true` é obrigatório no servidor e `withCredentials: true` no cliente; sem os dois, o cookie não trafega e nenhum critério de sessão passa.
- **A19.** Métodos liberados: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`, `OPTIONS`.

### 4.10 Rotas do front-end

| Rota | Acesso | Comportamento |
| --- | --- | --- |
| `/login` | visitante | autenticado é redirecionado para `/boards` (CA25) |
| `/register` | visitante | autenticado é redirecionado para `/boards` (CA25) |
| `/boards` | autenticado | área autenticada inicial; visitante vai para `/login?redirect=<rota>` (CA23) |
| `/` | qualquer | redireciona para `/boards` se autenticado, senão para `/login` |

- **A20.** O parâmetro `redirect` carrega o destino original e é consumido após o login bem-sucedido (CA24). Ele deve ser validado como **caminho interno**: valores que comecem com `//` ou que contenham esquema e host são descartados em favor de `/boards`, para impedir redirecionamento aberto.
- **A21.** Sessão expirada leva a `/login` com indicação própria, exibindo "Sua sessão expirou. Entre novamente." (CA19).

---

## 5. Requisitos não funcionais

### 5.1 Desempenho

| Item | Alvo | Observação |
| --- | --- | --- |
| `GET /api/auth/me` | < 100 ms no percentil 95, em ambiente local | consulta por chave primária |
| `POST /api/auth/login` | < 400 ms no percentil 95 | dominado pelo custo do bcrypt |
| `POST /api/auth/register` | < 500 ms no percentil 95 | hash mais inserção |
| Consulta por e-mail | sempre por índice | o índice único de D1 também serve à busca do login |

- **N1.** Fator de custo do bcrypt: **10**. É o ponto de equilíbrio entre o alvo de latência acima e a resistência a ataque offline; valor menor que 10 é proibido.
- **N2.** O hash é operação cara em CPU: deve-se usar a API assíncrona da biblioteca, para não bloquear o laço de eventos.
- **N3.** O `DataSource` do TypeORM é único no processo, com pool de conexões reutilizado. Abrir conexão por requisição é proibido.
- **N4.** O front-end chama `GET /auth/me` **uma vez** por carga da aplicação, no `AuthProvider`. Cada página protegida repetir essa chamada é proibido.

### 5.2 Segurança

- **N5.** Senha só existe em três lugares: no corpo da requisição em trânsito, em memória durante a verificação e como hash no banco. Nunca em log, resposta, URL, mensagem de erro ou armazenamento do navegador (RN07).
- **N6.** Logs de requisição devem mascarar os campos `password` e `confirmPassword`.
- **N7.** Nenhum dado de sessão em `localStorage` ou `sessionStorage` (F6). O cookie `HttpOnly` é o único portador da sessão.
- **N8.** Toda entrada é validada no servidor por schema antes de chegar ao serviço. A validação do cliente é conveniência de interface e nunca substitui a do servidor.
- **N9.** O acesso a dados usa exclusivamente o repositório do TypeORM com parâmetros vinculados. Concatenar valor de usuário em SQL é proibido.
- **N10.** A saída é renderizada como texto pelo React; `dangerouslySetInnerHTML` é proibido nas telas deste requisito (CB08).
- **N11.** `helmet` aplicado globalmente na API.
- **N12.** Falha de validação de `JWT_SECRET` na inicialização derruba o processo. Não pode existir valor padrão embutido no código.
- **N13.** A resposta de erro segue A9; o rastreamento técnico fica no log do servidor, com identificador de correlação quando houver.
- **N14.** Limite de tentativas de login, captcha e bloqueio de conta estão **fora de escopo** por decisão da especificação. O tratador de erros e o serviço de autenticação devem, ainda assim, ser escritos de modo que a inclusão futura de um limitador não exija reescrever a camada de rotas.

### 5.3 Escalabilidade

- **N15.** A API é **sem estado**: a sessão vive no token assinado, não em memória do processo. Consequência: é possível rodar várias instâncias atrás de um balanceador sem sessão fixa por servidor, e reiniciar o processo não desloga ninguém.
- **N16.** Consequência aceita da escolha D4: **não existe revogação server-side de token**. O logout apaga o cookie do navegador (CA21, CB13); um token que já tivesse sido copiado para fora do navegador continuaria válido até `exp`. Isso é aceitável porque o cookie é `HttpOnly`, o escopo é same-site e a especificação não exige encerramento remoto de sessões — item explicitamente fora de escopo. Se um requisito futuro exigir revogação, o caminho é uma tabela de sessões ou lista de tokens revogados, e esta decisão deve ser revista, não contornada.
- **N17.** O modelo de dados do RF01 é a base de todos os requisitos seguintes: `users.id` será chave estrangeira de quadros, membros, cards e comentários. Portanto o tipo do identificador (`uuid`) e o nome da tabela não podem mudar depois deste requisito sem migração em cascata.
- **N18.** O middleware `authenticate` é o ponto único onde a identidade é resolvida e anexada à requisição. Todo requisito posterior deve reutilizá-lo, nunca reimplementar leitura de token.

### 5.4 Acessibilidade e interface

- **N19.** Cada campo de formulário tem rótulo associado; a mensagem de erro é ligada ao campo, de modo a ser anunciada por leitor de tela.
- **N20.** O botão de envio fica desabilitado e em estado de carregamento enquanto a requisição está em andamento, e a função de envio ignora chamadas concorrentes (CA27, CE03).
- **N21.** Erros de campo aparecem junto ao campo; erros gerais (credenciais inválidas, falha de comunicação) aparecem em um aviso no topo do formulário.
- **N22.** Após erro, o campo de senha é limpo e o e-mail preservado (seções 2.1 e 2.2 da especificação).

---

## 6. Restrições consolidadas

Lista fechada do que a implementação **deve** obedecer. Cada item é verificável em revisão de código.

| # | Restrição |
| --- | --- |
| C01 | Cookie `HttpOnly` é o único portador da sessão; nada de token em `localStorage`, `sessionStorage` ou corpo de resposta |
| C02 | Sessão persistente = cookie com `Max-Age` de 30 dias; curta = cookie sem `Max-Age` e token com `exp` de 8 horas |
| C03 | Sem renovação automática de sessão |
| C04 | bcrypt com custo 10, em chamada assíncrona |
| C05 | Verificação de hash fictícia quando o e-mail não existe, para equalizar o tempo de resposta |
| C06 | Mesma resposta para e-mail inexistente e senha incorreta: `401` + `INVALID_CREDENTIALS` |
| C07 | Unicidade de e-mail garantida por índice único no banco, com o erro de violação traduzido para `EMAIL_ALREADY_EXISTS` |
| C08 | E-mail normalizado (minúsculas, sem espaços nas extremidades) antes de validar, buscar ou gravar |
| C09 | Senha nunca sofre corte de espaços |
| C10 | Validação por schema no servidor, agregando todos os erros de campo em uma resposta |
| C11 | Schema criado por migration reversível; `synchronize` desligado |
| C12 | Identidade sempre derivada do cookie, nunca de dado enviado pelo cliente |
| C13 | Serviços não conhecem HTTP; controllers não contêm regra de negócio; repositórios não contêm validação |
| C14 | Entidade de usuário nunca serializada diretamente; apenas `{ id, name, email }` sai da API |
| C15 | CORS com origem explícita e credenciais habilitadas nas duas pontas |
| C16 | JWT HS256 com algoritmo verificado explicitamente; segredo obrigatório com no mínimo 32 caracteres |
| C17 | Middleware do Next apenas verifica presença do cookie; a validação autoritativa é do back-end |
| C18 | Página protegida não renderiza conteúdo antes de a sessão estar confirmada |
| C19 | Parâmetro `redirect` restrito a caminho interno |
| C20 | Mensagens ao usuário idênticas às da seção 5.4 da especificação, com a API como fonte única para erros vindos dela |
| C21 | Envio duplicado bloqueado no cliente por estado de carregamento |
| C22 | Toda dependência nova instalada de fato, no back-end e no front-end |
| C23 | Nenhuma biblioteca de autenticação pronta |
| C24 | `docker-compose.yml` corrigido para variáveis compatíveis com a imagem escolhida, com volume nomeado |

---

## 7. Rastreabilidade: critério de aceite → mecanismo

| Critérios | Mecanismo que os atende |
| --- | --- |
| CA01, CA18 | `POST /auth/register` com cookie persistente na mesma resposta (A2) |
| CA02, CA03, CB09 | normalização C08 + índice único C07 |
| CA04–CA08, CA14, CB01–CB07, CB10 | schema de validação C10 |
| CA09, CA10 | normalização de e-mail no login + busca por índice |
| CA11, CA12, CA13, RN08 | C05 + C06 |
| CA15, CA16, CA18 | cookie com `Max-Age` (C02) |
| CA17 | cookie sem `Max-Age` (C02) |
| CA19, CB11, CB12 | `exp` do token + `GET /auth/me` retornando 401 + interceptador do cliente |
| CA20, CB13 | ausência de estado de sessão no servidor (D4) + logout idempotente |
| CA21, CB14, CB15 | limpeza do cookie + revalidação em toda ação autenticada (RN12) |
| CA22 | `GET /auth/me` alimentando o cabeçalho |
| CA23, CA25 | middleware do Next + `AuthProvider` (C17, C18) |
| CA24 | parâmetro `redirect` validado (C19) |
| CA26 | identidade vinda do cookie (C12) |
| CA27 | estado de carregamento bloqueando reenvio (C21) |
| CB08 | renderização como texto (N10) |
| CE01–CE04 | envelope de erro único + tratador central (A7–A9) |

---

## 8. Riscos e decisões registradas

| Risco / decisão | Análise |
| --- | --- |
| Cookie entre portas diferentes (`3000` e `3333`) | Cookies ignoram porta: `localhost:3000` e `localhost:3333` são o mesmo site para efeito de cookie, então `SameSite=Lax` funciona. Se algum dia front e API ficarem em domínios distintos, será necessário `SameSite=None; Secure` e HTTPS nas duas pontas. |
| JWT sem revogação | Aceito e registrado em N16. Revisar se surgir requisito de encerrar sessões remotamente. |
| Middleware do Next sem validação de assinatura | Aceito e registrado em 2.5. Colocar o segredo no front-end seria um problema maior do que o redirecionamento extra. |
| `bcryptjs` em vez de `bcrypt` nativo | Mais lento que a versão nativa, mas sem compilação nativa, o que reduz risco de quebra de ambiente. Com custo 10 o alvo de latência da seção 5.1 continua válido. |
| Sem limite de tentativas de login | Fora de escopo por decisão da especificação; N14 mantém o caminho aberto para incluir depois. |
| `users` como base dos próximos requisitos | N17: mudar tipo ou nome depois custa migração em cascata. Decidir agora, não depois. |
