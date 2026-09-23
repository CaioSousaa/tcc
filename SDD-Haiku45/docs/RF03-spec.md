# RF03: Gerenciamento de Listas

## Visão Geral

Usuário autenticado pode criar, renomear, reordenar e excluir listas (colunas) dentro de um quadro. Listas são containers para cartões (cards). Um quadro começa com 4 listas padrão (Backlog, To Do, Doing, Done) que podem ser customizadas.

## Atores

- **Usuário autenticado**: Proprietário do quadro (via RF02)
- **Sistema**: Persiste e valida dados de lista

## Comportamento Esperado

### 1. Criação de Lista

Usuário cria nova lista em um quadro.

**Given**: Usuário acessa página de um quadro e clica "Adicionar Lista"  
**When**: Preenche nome da lista, clica "Criar"  
**Then**:
- Nova lista criada no final do quadro
- Lista associada ao quadro correto
- Nome da lista exibido em novo card de coluna
- Usuário pode adicionar cartões à lista imediatamente
- Ordem de posição ajustada automaticamente

**Given**: Usuário tenta criar lista com nome vazio  
**When**: Submete formulário  
**Then**: Erro exibido ("Nome não pode estar vazio")

**Given**: Usuário tenta criar lista com nome muito longo (> 100 caracteres)  
**When**: Submete formulário  
**Then**: Erro exibido ("Nome muito longo (máximo 100 caracteres)")

**Given**: Usuário tenta criar lista com nome duplicado (já existe com mesmo nome no quadro)  
**When**: Submete formulário  
**Then**: Erro exibido ("Já existe uma lista com este nome neste quadro")

### 2. Renomear Lista

Usuário altera nome de uma lista existente.

**Given**: Usuário clica no nome da lista (ou ícone editar)  
**When**: Clica em botão "Editar" ou modo inline edit ativado  
**Then**:
- Nome fica editável (inline ou modal)
- Botões "Salvar" e "Cancelar" exibidos
- Usuário pode digitar novo nome

**Given**: Usuário muda nome para nome válido  
**When**: Clica "Salvar"  
**Then**:
- Novo nome salvo no sistema
- Confirmação visual ("Lista atualizada com sucesso")
- Modo edição encerrado

**Given**: Usuário tenta salvar nome vazio  
**When**: Clica "Salvar"  
**Then**: Erro ("Nome não pode estar vazio") + permanece em modo edição

**Given**: Usuário tenta salvar nome duplicado (já existe outra lista com este nome)  
**When**: Clica "Salvar"  
**Then**: Erro ("Já existe uma lista com este nome neste quadro") + permanece em modo edição

**Given**: Usuário clica "Cancelar" enquanto edita  
**When**: Clica "Cancelar"  
**Then**: Alterações descartadas, modo edição encerrado, nome original permanece

### 3. Reordenar Listas

Usuário altera ordem das listas no quadro.

**Given**: Usuário acessa página do quadro  
**When**: Arrastra lista para nova posição (ou usa botões reordenar)  
**Then**:
- Lista se move para nova posição
- Ordem de posição atualizada no sistema
- Cartões dentro da lista permanecem intactos
- Outras listas deslocadas automaticamente
- Confirmação visual (transição suave, sem reload)

**Given**: Usuário arrasta lista para primeira posição  
**When**: Solta  
**Then**: Lista passa a ser primeira, outras descem

**Given**: Usuário arrasta lista para última posição  
**When**: Solta  
**Then**: Lista passa a ser última, outras sobem

**Given**: Usuário arrasta lista para posição entre outras  
**When**: Solta  
**Then**: Lista insere naquela posição, outras ajustam indices

### 4. Exclusão de Lista

Usuário exclui uma lista de um quadro.

**Given**: Usuário clica em botão "Deletar" ou menu da lista  
**When**: Clica em botão "Deletar"  
**Then**:
- Confirmação exibida ("Tem certeza? Esta ação é irreversível. Cartões serão movidos para Lixo ou deletados.")
- Botões "Confirmar Exclusão" e "Cancelar" exibidos

**Given**: Usuário confirma exclusão  
**When**: Clica "Confirmar Exclusão"  
**Then**:
- Lista deletada permanentemente
- Cartões na lista: deletados (não movidos, sim permanentemente) ou movidos para primeira lista (v2)
- Outras listas reordenadas (posições ajustadas)
- Usuário permanece na página do quadro
- Mensagem de sucesso ("Lista deletada com sucesso")

**Given**: Usuário cancela exclusão  
**When**: Clica "Cancelar"  
**Then**: Diálogo fechado, lista permanece íntegra

**Given**: Usuário tenta deletar última lista do quadro  
**When**: Clica "Confirmar Exclusão"  
**Then**: 
- Se >= 1 lista: deletada normalmente
- Se = 0 lista resultante: Erro ("Quadro deve ter pelo menos uma lista")

### 5. Validação de Acesso

Apenas proprietário do quadro pode gerenciar listas.

**Given**: Usuário A tenta editar lista de quadro de Usuário B (via API)  
**When**: Submete requisição PUT  
**Then**: Acesso negado (401/403 Unauthorized)

**Given**: Usuário A tenta deletar lista de quadro de Usuário B (via API)  
**When**: Submete requisição DELETE  
**Then**: Acesso negado (401/403 Unauthorized)

**Given**: Usuário não autenticado tenta gerenciar listas  
**When**: Tenta acessar /api/columns  
**Then**: Redirecionado para /login

## Regras de Negócio

1. **Propriedade**: Lista pertence a um quadro específico (via board_id FK)
2. **Isolamento**: Usuário só gerencia listas de quadros que possuem
3. **Nome único por quadro**: Duas listas do mesmo quadro não podem ter o mesmo nome
4. **Posição**: Cada lista tem posição sequencial (0, 1, 2, ...)
5. **Listas padrão**: Novo quadro cria 4 listas padrão (RF02)
6. **Mínimo uma lista**: Quadro deve sempre ter >= 1 lista (v1: manter sempre 4)
7. **Cascata de exclusão**: Deletar lista deleta ou move seus cartões (v2)
8. **Reordenação**: Ao deletar ou mover, posições ajustam automaticamente
9. **Sem compartilhamento**: Listas não podem ser compartilhadas (associadas a vários quadros)

## Restrições

- **Nome lista**: 1-100 caracteres, obrigatório
- **Nome único**: Dentro do escopo do quadro (não global)
- **Posição**: Inteiro >= 0, sequencial sem gaps
- **Identificador**: UUID (não exposição de IDs sequenciais)
- **Timestamps**: created_at capturado
- **Deleção lógica**: Não usar soft-delete (delete físico)
- **Validação server**: Sempre validar server-side (cliente validação apenas UX)
- **Mínimo listas**: >= 1 (v1), >= 4 é recomendado (padrão RF02)

## Casos de Borda e Condições de Erro

### Criação
- Nome com espaços: Preservar (não trimmar)
- Nome com caracteres especiais: Aceitar
- Nome com unicode: Aceitar (suporta acentos, emoji)
- Nome muito curto (1 char): Aceitar (válido)
- Nome muito longo (100+ chars): Rejeitar
- Ordem padrão: Nova lista recebe position = número_listas_atuais
- Quantidade máxima: Sem limite (v1 assume <100 listas/quadro)

### Renomeação
- Renomear para mesmo nome atual: Permitir (idempotente)
- Renomear para nome de lista deletada: Permitir (nome reutilizável)
- Renomear enquanto outra pessoa edita: Último a salvar vence
- Timeout na edição: Se leva > X tempo, sessão expirada

### Reordenação
- Mover para mesma posição: Sem efeito, OK
- Mover com drag-drop: Sem reload, transição suave
- Mover com botões: Up/Down, primeira/última
- Mover enquanto lista é deletada: Conflito (recebe 404)
- Concorrência: Último reorder vence

### Exclusão
- Deletar lista com cartões: Cartões deletados ou movidos (v2)
- Deletar última lista: Erro (manter >= 1)
- Deletar lista padrão: Permitido (pode renomear depois se quiser)
- Deletar enquanto visualizando: Recarrega automaticamente
- Cascata: Cartões associados também deletados (ou movidos v2)

## Dados Capturados por Lista

- id (UUID)
- board_id (FK referencia Board)
- name (varchar 1-100)
- position (int sequencial)
- created_at (timestamp)
- Relacionamento: 1 Board → N Listas, 1 Lista → N Cartões (Cards)

## Respostas do Sistema

### Criação Lista
- 201 Created: Lista criada
  ```json
  { "id": "uuid", "board_id": "uuid", "name": "string", "position": 4, "created_at": "timestamp" }
  ```
- 400 Bad Request: Nome vazio, muito longo
  ```json
  { "error": "validation", "message": "Nome não pode estar vazio" }
  ```
- 409 Conflict: Nome duplicado
  ```json
  { "error": "duplicate", "message": "Já existe uma lista com este nome neste quadro" }
  ```
- 401 Unauthorized: Não autenticado
- 403 Forbidden: Quadro pertence a outro usuário

### Listar Listas (GET /api/boards/:boardId/columns)
- 200 OK: Lista de colunas
  ```json
  {
    "columns": [
      { "id": "uuid", "name": "Backlog", "position": 0, "card_count": 5 },
      ...
    ]
  }
  ```
- 404 Not Found: Quadro não existe
- 401 Unauthorized: Sem permissão

### Obter Lista
- 200 OK: Detalhes da lista com cartões (v2)
  ```json
  { "id": "uuid", "name": "string", "position": 0, "cards": [...] }
  ```
- 404 Not Found: Lista não existe

### Atualizar Lista (nome ou posição)
- 200 OK: Lista atualizada
  ```json
  { "id": "uuid", "name": "string", "position": 2, "updated_at": "timestamp" }
  ```
- 400 Bad Request: Nome vazio, inválido
- 409 Conflict: Nome duplicado
- 404 Not Found: Lista não existe
- 401 Unauthorized: Sem permissão

### Deletar Lista
- 204 No Content: Deletado com sucesso
- 400 Bad Request: Última lista do quadro, não pode deletar
- 404 Not Found: Lista não existe
- 401 Unauthorized: Sem permissão

## Fluxos Principais

### Fluxo 1: Criar Lista
```
Usuário clica "Adicionar Lista"
  ↓
Formulário exibido (nome)
  ↓
Usuário preenche nome, clica "Criar"
  ↓
POST /api/boards/:boardId/columns { name: "..." }
  ↓
Backend valida, cria Column
  ↓
201 Created com id da nova lista
  ↓
Frontend exibe nova lista ao final do quadro
```

### Fluxo 2: Reordenar Listas
```
Usuário arrasta lista para nova posição
  ↓
Drag-drop detecta posição final
  ↓
PUT /api/boards/:boardId/columns/:columnId { position: N }
  ↓
Backend ajusta posições das outras listas
  ↓
200 OK
  ↓
Frontend atualiza ordem visualmente (sem reload)
```

### Fluxo 3: Deletar Lista
```
Usuário clica botão "Deletar" na lista
  ↓
Diálogo confirmação exibido
  ↓
Usuário clica "Confirmar Exclusão"
  ↓
DELETE /api/boards/:boardId/columns/:columnId
  ↓
Backend deleta lista, reajusta posições
  ↓
204 No Content
  ↓
Frontend remove lista do quadro, reajusta layout
```

## Critérios de Aceitação Resumidos

- [ ] T1: Usuário cria lista com nome válido (201)
- [ ] T2: Sistema rejeita nome vazio (400)
- [ ] T3: Sistema rejeita nome duplicado (409)
- [ ] T4: Usuário vê todas as listas do quadro
- [ ] T5: Usuário renomeia lista (200)
- [ ] T6: Renomear nome duplicado rejeitado (409)
- [ ] T7: Usuário reordena lista (drag-drop ou botões)
- [ ] T8: Posições ajustadas automaticamente
- [ ] T9: Usuário deleta lista (204)
- [ ] T10: Cartões deletados ou movidos (v2)
- [ ] T11: Confirmação necessária para deletar
- [ ] T12: Acesso negado a lista de outro quadro (401/403)
- [ ] T13: Não autenticado redirecionado para login
- [ ] T14: Listas padrão criadas em novo quadro (RF02)
