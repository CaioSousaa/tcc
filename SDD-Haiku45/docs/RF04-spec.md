# RF04: Gerenciamento de Cartões

## Visão Geral

Usuário autenticado pode criar, editar, deletar e mover cartões (cards) entre listas dentro de um quadro. Cartões são items de trabalho que pertencem a uma lista. Um cartão tem título, descrição opcional, posição dentro da lista, e pode ser movido entre listas via drag-drop ou menu.

## Atores

- **Usuário autenticado**: Proprietário do quadro (via RF02)
- **Sistema**: Persiste e valida dados de cartão

## Comportamento Esperado

### 1. Criação de Cartão

Usuário cria novo cartão em uma lista.

**Given**: Usuário acessa página de um quadro e clica "Adicionar Cartão" em uma lista  
**When**: Preenche título do cartão, clica "Criar"  
**Then**:
- Novo cartão criado ao final da lista
- Cartão associado à lista correta
- Título exibido em novo card de cartão
- Posição sequencial atualizada automaticamente
- Usuário pode editar cartão imediatamente

**Given**: Usuário tenta criar cartão com título vazio  
**When**: Submete formulário  
**Then**: Erro exibido ("Título não pode estar vazio")

**Given**: Usuário tenta criar cartão com título muito longo (> 255 caracteres)  
**When**: Submete formulário  
**Then**: Erro exibido ("Título muito longo (máximo 255 caracteres)")

### 2. Edição de Cartão

Usuário altera propriedades de um cartão existente.

**Given**: Usuário clica em um cartão para abrir detalhes  
**When**: Clica em botão "Editar" ou modo inline edit ativado  
**Then**:
- Campos título e descrição ficam editáveis
- Botões "Salvar" e "Cancelar" exibidos
- Usuário pode digitar novo título/descrição

**Given**: Usuário muda título para valor válido  
**When**: Clica "Salvar"  
**Then**:
- Novo título salvo no sistema
- Confirmação visual ("Cartão atualizado com sucesso")
- Modo edição encerrado
- Cartão atualizado em tempo real

**Given**: Usuário tenta salvar título vazio  
**When**: Clica "Salvar"  
**Then**: Erro ("Título não pode estar vazio") + permanece em modo edição

**Given**: Usuário clica "Cancelar" enquanto edita  
**When**: Clica "Cancelar"  
**Then**: Alterações descartadas, modo edição encerrado, conteúdo original permanece

### 3. Movimentação de Cartão

Usuário altera posição do cartão (reordenar dentro lista ou mover entre listas).

**Given**: Usuário acessa página do quadro  
**When**: Arrastra cartão para nova posição na mesma lista ou para outra lista  
**Then**:
- Cartão se move para nova posição
- Posição sequencial ajustada no sistema
- Cartão associado à nova lista (se movido entre listas)
- Outras cartões deslocados automaticamente
- Confirmação visual (transição suave, sem reload)

**Given**: Usuário arrasta cartão para topo da lista  
**When**: Solta  
**Then**: Cartão passa a ser primeiro, outros descem

**Given**: Usuário arrasta cartão para final da lista  
**When**: Solta  
**Then**: Cartão passa a ser último, outros sobem

**Given**: Usuário arrasta cartão para outra lista  
**When**: Solta em lista diferente  
**Then**:
- Cartão removido de lista origem
- Cartão adicionado a lista destino ao final
- Posições ajustadas em ambas listas
- List_id (column_id) atualizado

**Given**: Usuário arrasta cartão entre cartões em mesma lista  
**When**: Solta  
**Then**: Cartão insere naquela posição, outros ajustam índices

### 4. Exclusão de Cartão

Usuário deleta um cartão de uma lista.

**Given**: Usuário clica em botão "Deletar" ou menu do cartão  
**When**: Clica em botão "Deletar"  
**Then**:
- Confirmação exibida ("Tem certeza? Esta ação é irreversível.")
- Botões "Confirmar Exclusão" e "Cancelar" exibidos

**Given**: Usuário confirma exclusão  
**When**: Clica "Confirmar Exclusão"  
**Then**:
- Cartão deletado permanentemente
- Outros cartões da lista reordenados (posições ajustadas)
- Usuário permanece na página do quadro
- Mensagem de sucesso ("Cartão deletado com sucesso")

**Given**: Usuário cancela exclusão  
**When**: Clica "Cancelar"  
**Then**: Diálogo fechado, cartão permanece íntegro

### 5. Validação de Acesso

Apenas proprietário do quadro pode gerenciar cartões.

**Given**: Usuário A tenta editar cartão de quadro de Usuário B (via API)  
**When**: Submete requisição PUT  
**Then**: Acesso negado (401/403 Unauthorized)

**Given**: Usuário A tenta deletar cartão de quadro de Usuário B (via API)  
**When**: Submete requisição DELETE  
**Then**: Acesso negado (401/403 Unauthorized)

**Given**: Usuário não autenticado tenta gerenciar cartões  
**When**: Tenta acessar /api/cards  
**Then**: Redirecionado para /login

## Regras de Negócio

1. **Propriedade**: Cartão pertence a uma lista específica (via list_id/column_id FK)
2. **Isolamento**: Usuário só gerencia cartões de listas em quadros que possuem
3. **Título obrigatório**: Cartão sempre tem título (1-255 caracteres)
4. **Posição**: Cada cartão tem posição sequencial dentro da lista (0, 1, 2, ...)
5. **Lista destino**: Cartão sempre pertence a exatamente uma lista
6. **Descrição opcional**: Cartão pode ter descrição (0-5000 caracteres)
7. **Sem duplicação**: Título não precisa ser único (múltiplos cartões podem ter mesmo nome)
8. **Reordenação**: Ao mover ou deletar, posições ajustam automaticamente
9. **Sem compartilhamento**: Cartão não pode estar em múltiplas listas

## Restrições

- **Título cartão**: 1-255 caracteres, obrigatório
- **Descrição**: 0-5000 caracteres, opcional
- **Posição**: Inteiro >= 0, sequencial sem gaps
- **Identificador**: UUID (não exposição de IDs sequenciais)
- **List/Column ID**: FK referenciando coluna válida
- **Timestamps**: created_at, updated_at capturados
- **Deleção lógica**: Não usar soft-delete (delete físico)
- **Validação server**: Sempre validar server-side (cliente validação apenas UX)
- **Mínimo campos**: Título obrigatório, resto opcional

## Casos de Borda e Condições de Erro

### Criação
- Título com espaços: Preservar (não trimmar)
- Título com caracteres especiais: Aceitar
- Título com unicode: Aceitar (suporta acentos, emoji)
- Título muito curto (1 char): Aceitar (válido)
- Título muito longo (255+ chars): Rejeitar
- Descrição vazia: Aceitar (opcional)
- Ordem padrão: Novo cartão recebe position = número_cartões_atuais
- Quantidade máxima: Sem limite por lista (v1 assume <1000 cartões/lista)

### Edição
- Editar para mesmo título: Permitir (idempotente)
- Editar enquanto outra pessoa edita: Último a salvar vence
- Timeout na edição: Se leva > X tempo, sessão expirada
- Editar descrição só: Título permanece

### Movimentação
- Mover para mesma posição: Sem efeito, OK
- Mover com drag-drop: Sem reload, transição suave
- Mover para mesma lista: Apenas reordenar posições
- Mover para lista diferente: Mudar list_id + reordenar ambas
- Mover enquanto cartão é deletado: Conflito (recebe 404)
- Concorrência: Último move vence

### Exclusão
- Deletar cartão com histórico: Deletar associações (v2)
- Deletar último cartão: OK (lista pode ficar vazia)
- Deletar enquanto visualizando: Recarrega automaticamente
- Cascata: Nenhuma (apenas cartão, não dependências)

## Dados Capturados por Cartão

- id (UUID)
- list_id / column_id (FK referencia List/Column)
- title (varchar 1-255)
- description (varchar 0-5000, optional)
- position (int sequencial dentro lista)
- created_at (timestamp)
- updated_at (timestamp)
- Relacionamento: 1 Lista → N Cartões

## Respostas do Sistema

### Criação Cartão
- 201 Created: Cartão criado
  ```json
  { "id": "uuid", "list_id": "uuid", "title": "string", "description": "string", "position": 5, "created_at": "timestamp" }
  ```
- 400 Bad Request: Título vazio, muito longo
  ```json
  { "error": "validation", "message": "Título não pode estar vazio" }
  ```
- 404 Not Found: Lista não existe
- 401 Unauthorized: Não autenticado
- 403 Forbidden: Lista pertence a outro usuário

### Listar Cartões (GET /api/lists/:listId/cards)
- 200 OK: Lista de cartões
  ```json
  {
    "cards": [
      { "id": "uuid", "title": "string", "position": 0, "description": "..." },
      ...
    ]
  }
  ```
- 404 Not Found: Lista não existe
- 401 Unauthorized: Sem permissão

### Atualizar Cartão (título ou descrição)
- 200 OK: Cartão atualizado
  ```json
  { "id": "uuid", "title": "string", "description": "string", "updated_at": "timestamp" }
  ```
- 400 Bad Request: Título vazio, inválido
- 404 Not Found: Cartão não existe
- 401 Unauthorized: Sem permissão

### Mover Cartão (posição ou lista)
- 200 OK: Cartão movido
  ```json
  { "id": "uuid", "list_id": "uuid", "position": 2, "updated_at": "timestamp" }
  ```
- 400 Bad Request: Posição inválida, lista inválida
- 404 Not Found: Cartão ou lista não existe
- 401 Unauthorized: Sem permissão

### Deletar Cartão
- 204 No Content: Deletado com sucesso
- 404 Not Found: Cartão não existe
- 401 Unauthorized: Sem permissão

## Fluxos Principais

### Fluxo 1: Criar Cartão
```
Usuário clica "Adicionar Cartão"
  ↓
Formulário exibido (título)
  ↓
Usuário preenche título, clica "Criar"
  ↓
POST /api/lists/:listId/cards { title: "...", description: "..." }
  ↓
Backend valida, cria Card
  ↓
201 Created com id do novo cartão
  ↓
Frontend exibe novo cartão ao final da lista
```

### Fluxo 2: Mover Cartão
```
Usuário arrasta cartão para nova posição (mesma lista ou outra)
  ↓
Drag-drop detecta posição final + lista destino
  ↓
PUT /api/lists/:listId/cards/:cardId { position: N, list_id: "..." }
  ↓
Backend ajusta posições nas listas afetadas
  ↓
200 OK
  ↓
Frontend atualiza ordem visualmente (sem reload)
```

### Fluxo 3: Editar Cartão
```
Usuário clica em cartão, abre detalhes
  ↓
Modo edição ativado
  ↓
Usuário muda título/descrição, clica "Salvar"
  ↓
PUT /api/lists/:listId/cards/:cardId { title: "...", description: "..." }
  ↓
Backend valida, atualiza
  ↓
200 OK
  ↓
Frontend atualiza card visualmente
```

### Fluxo 4: Deletar Cartão
```
Usuário clica botão "Deletar" no cartão
  ↓
Diálogo confirmação exibido
  ↓
Usuário clica "Confirmar Exclusão"
  ↓
DELETE /api/lists/:listId/cards/:cardId
  ↓
Backend deleta cartão, reajusta posições
  ↓
204 No Content
  ↓
Frontend remove cartão da lista, reajusta layout
```

## Critérios de Aceitação Resumidos

- [ ] T1: Usuário cria cartão com título válido (201)
- [ ] T2: Sistema rejeita título vazio (400)
- [ ] T3: Sistema rejeita título muito longo (400)
- [ ] T4: Usuário vê todos os cartões da lista
- [ ] T5: Usuário edita cartão (200)
- [ ] T6: Usuário move cartão dentro lista (200)
- [ ] T7: Usuário move cartão para outra lista (200)
- [ ] T8: Posições ajustadas automaticamente (ambas listas)
- [ ] T9: Usuário deleta cartão (204)
- [ ] T10: Confirmação necessária para deletar
- [ ] T11: Acesso negado a cartão de outro quadro (401/403)
- [ ] T12: Não autenticado redirecionado para login
- [ ] T13: Descrição opcional mantém cartão funcional
- [ ] T14: Múltiplos cartões com mesmo título (sem violação)

