# RF02: Gerenciamento de Quadros

## Visão Geral

Usuário autenticado pode criar, visualizar, editar e excluir seus próprios quadros. Um quadro é container para gerenciar tarefas em colunas Kanban. Cada quadro pertence a exatamente um usuário.

## Atores

- **Usuário autenticado**: Criador e proprietário de quadros
- **Sistema**: Persiste e valida dados de quadro

## Comportamento Esperado

### 1. Criação de Quadro

Usuário cria novo quadro com nome.

**Given**: Usuário autenticado está na tela de criar quadro  
**When**: Preenche nome válido, clica "Criar Quadro"  
**Then**:
- Quadro criado no sistema com nome único (por usuário)
- Quadro associado ao usuário autenticado
- Colunas padrão criadas (Backlog, To Do, Doing, Done)
- Usuário recebe confirmação visual de sucesso
- Usuário redirecionado para tela do quadro

**Given**: Usuário tenta criar quadro com nome vazio  
**When**: Submete formulário  
**Then**: Erro exibido ("Nome não pode estar vazio")

**Given**: Usuário tenta criar quadro com nome duplicado (já possui quadro com mesmo nome)  
**When**: Submete formulário  
**Then**: Erro exibido ("Já existe quadro com este nome")

**Given**: Usuário tenta criar quadro com nome muito longo (> 100 caracteres)  
**When**: Submete formulário  
**Then**: Erro exibido ("Nome muito longo (máximo 100 caracteres)")

### 2. Visualização de Quadros

Usuário visualiza seus quadros e abre um para editar.

**Given**: Usuário autenticado acessa página "Meus Quadros"  
**When**: Página carrega  
**Then**:
- Lista de todos os quadros do usuário exibida
- Cada quadro mostra: nome, data criação, quantidade de colunas/cartões
- Se sem quadros: mensagem "Você ainda não tem quadros. Crie um novo."
- Botão "Criar Novo Quadro" sempre visível
- Cada quadro tem link/botão para abrir

**Given**: Usuário clica em um quadro na lista  
**When**: Quadro existe e pertence ao usuário  
**Then**:
- Tela do quadro aberta
- Nome do quadro exibido no topo
- Todas as colunas do quadro exibidas
- Cartões dentro de cada coluna exibidos

**Given**: Usuário tenta acessar quadro que não existe (URL direta com ID inválido)  
**When**: Tenta acessar  
**Then**: Erro "Quadro não encontrado" + redireciona para "Meus Quadros"

**Given**: Usuário tenta acessar quadro de outro usuário (URL direta com ID de quadro alheio)  
**When**: Tenta acessar  
**Then**: Acesso negado (401 Unauthorized) + redireciona para "Meus Quadros"

### 3. Edição de Quadro

Usuário altera nome do quadro.

**Given**: Usuário acessa página do quadro  
**When**: Clica em botão "Editar" ou ícone de lápis no nome  
**Then**:
- Campo de nome fica editável (modo inline ou modal)
- Usuário pode digitar novo nome
- Botão "Salvar" e "Cancelar" exibidos

**Given**: Usuário muda nome do quadro para nome válido  
**When**: Clica "Salvar"  
**Then**:
- Novo nome salvo no sistema
- Confirmação visual ("Quadro atualizado com sucesso")
- Modo edição encerrado

**Given**: Usuário tenta salvar nome vazio  
**When**: Clica "Salvar"  
**Then**: Erro ("Nome não pode estar vazio") + permanece em modo edição

**Given**: Usuário tenta salvar nome duplicado (já tem outro quadro com este nome)  
**When**: Clica "Salvar"  
**Then**: Erro ("Já existe quadro com este nome") + permanece em modo edição

**Given**: Usuário clica "Cancelar" enquanto edita  
**When**: Clica "Cancelar"  
**Then**: Alterações descartadas, modo edição encerrado, nome original permanece

### 4. Exclusão de Quadro

Usuário exclui um quadro.

**Given**: Usuário acessa página do quadro  
**When**: Clica em botão "Deletar" ou "Excluir"  
**Then**:
- Confirmação exibida ("Tem certeza? Esta ação é irreversível")
- Botões "Confirmar Exclusão" e "Cancelar" exibidos

**Given**: Usuário confirma exclusão  
**When**: Clica "Confirmar Exclusão"  
**Then**:
- Quadro deletado permanentemente do sistema
- Todas as colunas e cartões do quadro também deletados (cascata)
- Usuário redirecionado para "Meus Quadros"
- Mensagem de sucesso ("Quadro deletado com sucesso")

**Given**: Usuário cancela exclusão  
**When**: Clica "Cancelar"  
**Then**: Diálogo fechado, quadro permanece íntegro

### 5. Validação de Acesso

Sistema valida propriedade em todas operações.

**Given**: Usuário A tenta editar quadro de Usuário B (via API)  
**When**: Submete requisição PUT/PATCH  
**Then**: Acesso negado (401/403 Unauthorized) + mensagem "Você não tem permissão"

**Given**: Usuário A tenta deletar quadro de Usuário B (via API)  
**When**: Submete requisição DELETE  
**Then**: Acesso negado (401/403 Unauthorized)

**Given**: Usuário não autenticado tenta acessar "Meus Quadros"  
**When**: Tenta acessar URL /boards  
**Then**: Redirecionado para /login

## Regras de Negócio

1. **Propriedade**: Quadro pertence a exatamente um usuário (criador)
2. **Isolamento**: Usuário só visualiza seus próprios quadros
3. **Nome único por usuário**: Dois quadros do mesmo usuário não podem ter o mesmo nome
4. **Colunas padrão**: Novo quadro cria automaticamente 4 colunas: Backlog, To Do, Doing, Done
5. **Cascata de exclusão**: Deletar quadro deleta também todas suas colunas e cartões
6. **Sem compartilhamento v1**: Quadros não são compartilháveis (ver RF07 para members)
7. **Ordenação**: Quadros listados por ordem de criação (mais recente primeiro)

## Restrições

- **Nome quadro**: 1-100 caracteres, obrigatório
- **Nome único**: Dentro do escopo do usuário (não global)
- **Identificador**: UUID (não exposição de IDs sequenciais)
- **Timestamps**: created_at, updated_at capturados
- **Deleção lógica**: Não usar soft-delete (delete físico)
- **Validação server**: Sempre validar server-side (cliente validação apenas UX)

## Casos de Borda e Condições de Erro

### Criação
- Nome com espaços: Preservar (não trimmar)
- Nome com caracteres especiais: Aceitar
- Nome com unicode: Aceitar (suporta acentos, emoji)
- Nome muito curto (1 char): Aceitar (válido)
- Nome muito longo (100+ chars): Rejeitar
- Concorrência: Dois requests de criação simultâneos do mesmo nome
  - Vencer: último a salvar ganha, outro recebe erro "nome duplicado"

### Visualização
- Usuário sem quadros: Mostrar empty state com CTA "Criar Quadro"
- Página /boards sem autenticação: Redirecionar /login
- Quadro deletado: Remoção imediata da lista (sem delay)
- Lista grande (1000+ quadros): Paginação ou lazy-load (v2)

### Edição
- Editar nome para mesmo nome atual: Permitir (idempotente)
- Editar sem mudança: Salvar mesmo assim (atualiza updated_at)
- Editar enquanto outro usuário deleta: Conflito (recebe 404 após salvar)
- Timeout na edição: Se leva > X tempo, sessão expirada redireciona login

### Exclusão
- Deletar enquanto visualizando: Redirecionado para "Meus Quadros"
- Deletar múltiplos cartões em cascata: Todos deletados atomicamente
- Deletar com colunas vazia: Funcionamento normal (sem erro)
- Deletar sem confirmação: Não permitido (requer diálogo confirmação)

## Dados Capturados por Quadro

- id (UUID)
- user_id (FK referencia User)
- name (varchar 1-100)
- created_at (timestamp)
- updated_at (timestamp)
- Relacionamento: 1 usuário → N quadros, 1 quadro → N colunas

## Dados Capturados por Coluna (padrão)

- id (UUID)
- board_id (FK)
- name (varchar, fixo: "Backlog", "To Do", "Doing", "Done")
- position (int: 0, 1, 2, 3)
- created_at (timestamp)

## Respostas do Sistema

### Criação Quadro
- 201 Created: Quadro criado
  ```json
  { "id": "uuid", "name": "string", "created_at": "timestamp", "columns": [...] }
  ```
- 400 Bad Request: Nome vazio, muito longo, caracteres inválidos
  ```json
  { "error": "validation", "message": "Nome muito longo" }
  ```
- 409 Conflict: Nome duplicado
  ```json
  { "error": "duplicate", "message": "Já existe quadro com este nome" }
  ```
- 401 Unauthorized: Não autenticado

### Listar Quadros
- 200 OK: Lista de quadros
  ```json
  {
    "boards": [
      { "id": "uuid", "name": "string", "created_at": "timestamp", "column_count": 4, "card_count": 5 },
      ...
    ]
  }
  ```
- 401 Unauthorized: Não autenticado

### Obter Quadro (por ID)
- 200 OK: Detalhes quadro com colunas
  ```json
  {
    "id": "uuid",
    "name": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "columns": [
      { "id": "uuid", "name": "Backlog", "position": 0, "cards": [...] },
      ...
    ]
  }
  ```
- 404 Not Found: Quadro não existe
- 401 Unauthorized: Quadro pertence a outro usuário ou não autenticado

### Atualizar Quadro (nome)
- 200 OK: Quadro atualizado
  ```json
  { "id": "uuid", "name": "string", "updated_at": "timestamp" }
  ```
- 400 Bad Request: Nome vazio, inválido
- 409 Conflict: Nome duplicado
- 404 Not Found: Quadro não existe
- 401 Unauthorized: Sem permissão

### Deletar Quadro
- 204 No Content: Deletado com sucesso (sem body)
- 404 Not Found: Quadro não existe
- 401 Unauthorized: Sem permissão

## Fluxos Principais

### Fluxo 1: Criar e Visualizar Quadro
```
Usuário clica "Criar Novo Quadro"
  ↓
Formulário exibido (nome)
  ↓
Usuário preenche nome, clica "Criar"
  ↓
POST /api/boards { name: "..." }
  ↓
Backend valida, cria Board + 4 Columns
  ↓
200 OK com id do novo quadro
  ↓
Frontend redireciona para /boards/:id
  ↓
GET /api/boards/:id retorna quadro com colunas
  ↓
Tela exibe quadro (Kanban board)
```

### Fluxo 2: Editar Nome do Quadro
```
Usuário clica ícone "Editar"
  ↓
Nome fica editável (inline ou modal)
  ↓
Usuário muda nome, clica "Salvar"
  ↓
PUT/PATCH /api/boards/:id { name: "..." }
  ↓
Backend valida, atualiza
  ↓
200 OK
  ↓
Frontend exibe "Salvo com sucesso", sai modo edição
```

### Fluxo 3: Deletar Quadro
```
Usuário clica botão "Deletar"
  ↓
Diálogo confirmação exibido
  ↓
Usuário clica "Confirmar Exclusão"
  ↓
DELETE /api/boards/:id
  ↓
Backend deleta Board, todas Columns, todos Cards (cascata)
  ↓
204 No Content
  ↓
Frontend redireciona para /boards
  ↓
GET /api/boards retorna lista atualizada (sem o quadro)
```

## Critérios de Aceitação Resumidos

- [ ] T1: Usuário autenticado cria quadro com nome válido (201)
- [ ] T2: Sistema rejeita nome vazio (400)
- [ ] T3: Sistema rejeita nome duplicado (409)
- [ ] T4: Colunas padrão criadas automaticamente
- [ ] T5: Usuário visualiza lista de seus quadros
- [ ] T6: Empty state quando sem quadros
- [ ] T7: Usuário abre quadro e vê colunas + cartões
- [ ] T8: Usuário edita nome do quadro (200)
- [ ] T9: Edição de nome duplicado rejeitada (409)
- [ ] T10: Usuário deleta quadro (204 + cascata)
- [ ] T11: Confirmação necessária para deletar
- [ ] T12: Acesso negado a quadro de outro usuário (401/403)
- [ ] T13: Não autenticado redirecionado para login
- [ ] T14: Quadro deletado desaparece de lista imediatamente
