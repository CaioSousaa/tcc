# RF08: Etiquetas Coloridas e Filtros por Etiqueta

## Visão Geral

Usuários podem criar etiquetas (tags/labels) coloridas no quadro, aplicá-las a múltiplos cartões, e filtrar a visualização de cartões por etiqueta. Cada etiqueta tem um nome único por quadro e uma cor hexadecimal. Um cartão pode ter nenhuma, uma ou múltiplas etiquetas. A filtragem combina etiquetas com operação lógica OR (qualquer etiqueta selecionada mostra o cartão).

## Atores

- **Admin/Editor**: Cria etiquetas, aplica e remove de cartões, filtra
- **Viewer**: Visualiza etiquetas em cartões, pode filtrar, mas não criar/editar etiquetas
- **Sistema**: Persiste etiquetas, associações card-label, estado de filtros

## Comportamento Esperado

### 1. Criar Etiqueta no Quadro

Admin/Editor deseja criar uma etiqueta para organizar cartões (ex: "Bug", "Feature", "Urgent").

**Given**: Usuário editor acessa gerenciamento de etiquetas do quadro  
**When**: Clica em "Nova Etiqueta" e insere nome "Bug" + seleciona cor vermelha (#FF0000)  
**Then**:
- Etiqueta "Bug" é criada e fica visível na lista de etiquetas do quadro
- Cor vermelha é exibida ao lado do nome
- Etiqueta fica imediatamente disponível para ser aplicada a cartões
- Múltiplos usuários conseguem ver a etiqueta criada (sincronizada)

### 2. Editar Etiqueta

Editor deseja alterar nome ou cor de uma etiqueta existente.

**Given**: Etiqueta "Bug" existe no quadro com cor vermelha  
**When**: Clica em editar, muda nome para "BugReport" e cor para laranja (#FF8800)  
**Then**:
- Nome e cor são atualizados
- Todos os cartões com essa etiqueta veem a cor nova
- Nome antigo não pode ser mais usado nessa etiqueta
- Aplicações da etiqueta em cartões são mantidas (reparenting)

### 3. Deletar Etiqueta

Editor remove uma etiqueta do quadro.

**Given**: Etiqueta "WontFix" existe e está aplicada em 3 cartões  
**When**: Clica em deletar e confirma remoção  
**Then**:
- Etiqueta é removida do quadro
- Todos os cartões que tinham "WontFix" perdem essa etiqueta
- Cartões continuam existindo (sem a etiqueta)
- Etiqueta não aparece mais em nenhuma lista/filtro

### 4. Aplicar Etiqueta a Cartão

Editor abre um cartão e quer marcá-lo com uma etiqueta.

**Given**: Cartão "Implementar login" está aberto e "Feature" é uma etiqueta disponível  
**When**: Clica em "Adicionar Etiqueta" e seleciona "Feature"  
**Then**:
- "Feature" aparece no cartão com sua cor
- Etiqueta aparece na lista de etiquetas do cartão
- Um cartão pode ter múltiplas etiquetas (não exclusiva)
- Mesma etiqueta não pode ser aplicada 2x ao mesmo cartão

### 5. Remover Etiqueta de Cartão

Editor remove uma etiqueta de um cartão.

**Given**: Cartão "Implementar login" tem etiquetas "Feature" e "High Priority"  
**When**: Clica X em "Feature"  
**Then**:
- "Feature" é removido do cartão
- "High Priority" continua no cartão
- Etiqueta é desvinculada completamente
- Etiqueta continua disponível para outros cartões

### 6. Visualizar Etiquetas no Cartão

Qualquer usuário (inclusive viewer) consegue ver etiquetas aplicadas a um cartão.

**Given**: Cartão "Bug fix" tem etiquetas "Bug" (vermelho), "Urgent" (vermelho escuro), "Backend" (azul)  
**When**: Usuário abre o cartão ou visualiza na lista  
**Then**:
- Etiquetas são exibidas com nomes + cores
- Ordem das etiquetas é consistente
- Cores são fáceis de distinguir (não violam contraste)
- Tooltip ou label permite ler nome da cor se necessário

### 7. Filtrar Cartões por Uma Etiqueta

Usuário quer visualizar apenas cartões com uma etiqueta específica.

**Given**: Quadro tem 10 cartões, 5 com etiqueta "Feature", 3 com "Bug", 2 com ambas  
**When**: Clica em filtro, seleciona "Feature"  
**Then**:
- Exibe 7 cartões: os 5 com "Feature" + os 2 com "Feature" E "Bug"
- Cartões sem "Feature" são ocultados
- Estado do filtro é mantido enquanto navegando (se sair/voltar, filtro persiste)
- Possibilidade de remover filtro com botão X ou clicando novamente

### 8. Filtrar por Múltiplas Etiquetas (OR)

Usuário quer visualizar cartões com qualquer uma de múltiplas etiquetas.

**Given**: Quadro tem cartões com etiquetas "Feature", "Bug", "Improvement"  
**When**: Seleciona "Feature" E "Bug" no filtro  
**Then**:
- Exibe cartões que têm "Feature" OU "Bug" (ou ambas)
- Cartões com apenas "Improvement" são ocultados
- Operação é OR, não AND (não precisa ter todas)
- Cada nova seleção adiciona à lista de filtro

### 9. Remover Filtro de Etiqueta

Usuário quer voltar a ver todos os cartões.

**Given**: Filtro está ativo (exibindo cartões com "Bug")  
**When**: Clica X no filtro OU clica novamente em "Bug" para deselecionar  
**Then**:
- Filtro é removido
- Todos os cartões voltam a ser exibidos
- UI atualiza sem delay perceptível

### 10. Visualizador Pode Filtrar mas Não Criar

Viewer abre quadro e quer filtrar por etiqueta.

**Given**: Usuário é viewer, etiquetas "Feature" e "Bug" existem  
**When**: Clica em filtro de etiqueta  
**Then**:
- Consegue selecionar etiquetas para filtrar
- Filtro funciona normalmente
- Botões "Criar Etiqueta", "Editar", "Deletar" não aparecem ou são desabilitados
- Viewer consegue ver etiquetas mas não gerenciá-las

### 11. Sincronização em Tempo Real

Dois usuários têm o quadro aberto e um cria/aplica etiqueta.

**Given**: Admin A e Editor B têm o mesmo quadro aberto  
**When**: Admin A cria etiqueta "Blocker" (cor vermelha)  
**Then**:
- Editor B vê "Blocker" aparecer em seu painel de etiquetas em tempo real (ou em alguns segundos)
- Se Admin A aplica "Blocker" a um cartão que Editor B está vendo, Editor B vê a etiqueta aparecer
- Sem recarga de página necessária (sincronização via backend)

### 12. Etiquetas em Busca/Filtros Avançados

Sistema pode fornecer busca ou filtro combinado (etiqueta + texto).

**Given**: Quadro tem 50 cartões com várias etiquetas  
**When**: Usuário filtra por "Feature" E busca por "login"  
**Then**:
- Exibe cartões que têm "Feature" E contêm "login" no título/descrição
- Filtros combinam com operação AND entre tipos diferentes (etiqueta AND texto)
- Cada tipo de filtro é independente

## Regras de Negócio

1. **Etiqueta Única por Quadro**: Dois cartões podem compartilhar a mesma etiqueta; duas etiquetas não podem ter o mesmo nome no mesmo quadro
2. **Cor Hexadecimal**: Cores são representadas em formato HEX (ex: #FF0000) com 6 dígitos
3. **Um Label por Aplicação**: Um cartão pode ter a mesma etiqueta aplicada no máximo 1 vez
4. **Múltiplos Labels por Card**: Um cartão pode ter entre 0 e N etiquetas (sem limite específico)
5. **Filtro OR**: Múltiplas seleções de etiqueta funcionam com lógica OR (qualquer uma satisfaz)
6. **Sem Hierarquia**: Etiquetas não têm parent/child (plano, sem categorias)
7. **Persistência**: Etiquetas criadas são persistidas, não temporárias
8. **Proprietário**: Etiquetas pertencem ao quadro, não ao usuário
9. **Visualização**: Viewers conseguem filtrar mas não criar/editar
10. **Sincronização**: Mudanças em etiquetas são refletidas em tempo real para usuários no quadro

## Restrições

- **Nome Obrigatório**: Etiqueta precisa ter nome não-vazio e único por quadro
- **Cor Obrigatória**: Toda etiqueta tem uma cor (padrão possível: cinza claro se não especificada)
- **Comprimento de Nome**: Nome tem limite máximo (ex: 50 caracteres)
- **Sem Removição em Cascata**: Deletar etiqueta remove associações mas não cartões
- **Editor+**: Apenas Admin/Editor conseguem gerenciar etiquetas (criar/editar/deletar)
- **Sem Duplicação**: Mesma etiqueta não pode ser aplicada 2x ao mesmo cartão (UNIQUE constraint)
- **Sem Etiqueta Órfã**: Se todos os cartões com uma etiqueta perdem ela, etiqueta continua existindo (permitido ter 0 cartões com a etiqueta)
- **Sem Renomeação Pós-referência**: Renomear etiqueta afeta todos os cartões que a usam (sem "alias" antigo)

## Casos de Borda e Condições de Erro

### Validação de Entrada

- **Nome vazio**: "Etiqueta não pode ter nome vazio" (erro 400)
- **Nome duplicado**: "Já existe etiqueta com este nome neste quadro" (erro 409)
- **Nome muito longo**: "> 50 caracteres" rejeitado (erro 400)
- **Cor inválida**: Formato inválido (não HEX, ex: "red" ou "FF00") rejeitado (erro 400)

### Operações de Etiqueta

- **Editar etiqueta não-existente**: Erro 404 Not Found
- **Deletar etiqueta não-existente**: Erro 404 Not Found
- **Criar etiqueta sem permissão**: Erro 403 Forbidden (viewer não consegue)
- **Editar etiqueta sem permissão**: Erro 403 Forbidden

### Aplicação em Cartão

- **Aplicar etiqueta inexistente**: Erro 404 Not Found
- **Aplicar mesma etiqueta 2x**: Erro 400 Bad Request (duplicação)
- **Remover etiqueta não aplicada**: Erro 404 Not Found
- **Cartão com 100+ etiquetas**: Sem limite explícito (performance é responsabilidade da UI)

### Filtro e Sincronização

- **Filtrar com etiqueta deletada**: Se usuário tem filtro ativo e etiqueta é deletada, filtro limpa-se automaticamente
- **Etiqueta alterada enquanto filtro ativo**: Filtro continua funcionando (nomes referem a IDs, não strings)
- **Aplicar etiqueta a cartão em outro quadro**: Erro 400 Bad Request (etiqueta é local ao quadro)

### Concorrência

- **Dois usuários criam etiqueta com mesmo nome**: Último a criar vence (DB unique constraint previne duplicata)
- **Usuário A deleta, Usuário B edita simultaneamente**: A delete vence, B recebe erro 404 ou atualiza etiqueta já deletada (inconsistência transitória)
- **Aplicar e remover simultaneamente**: Ordem não-determinística, consistência eventual

### Permissões

- **Admin/Editor vê etiquetas criadas por outro**: Sim, etiquetas são do quadro, não do usuário
- **Viewer tenta criar**: Recebe 403 Forbidden
- **Viewer tenta editar**: Recebe 403 Forbidden
- **Viewer tenta deletar**: Recebe 403 Forbidden

## Dados Afetados

### Criados

- **Label** (entidade de etiqueta)
  - id (UUID, PK)
  - board_id (FK → Board, ON DELETE CASCADE)
  - name (VARCHAR 50, UNIQUE(board_id, name))
  - color (VARCHAR 7, HEX color #RRGGBB)
  - created_at (Timestamp)
  - updated_at (Timestamp)

- **CardLabel** (relação card-etiqueta)
  - id (UUID, PK)
  - card_id (FK → Card, ON DELETE CASCADE)
  - label_id (FK → Label, ON DELETE CASCADE)
  - created_at (Timestamp)
  - UNIQUE(card_id, label_id) para evitar duplicação

### Atualizados

- **Card**
  - updated_at (ao aplicar/remover etiqueta)

### Preservados

- Dados do cartão (título, descrição, membros)
- Dados do quadro
- Autenticação

### Deletados

- **CardLabel** (ao remover etiqueta de cartão ou deletar etiqueta)
- **Label** (ao deletar etiqueta do quadro)

## Respostas do Sistema

### Criar Etiqueta - Sucesso

- 201 Created
- Response: `{ id: "uuid", name: "Bug", color: "#FF0000", created_at: "...", board_id: "uuid" }`

### Editar Etiqueta - Sucesso

- 200 OK
- Response: `{ id: "uuid", name: "BugReport", color: "#FF8800", updated_at: "..." }`

### Deletar Etiqueta - Sucesso

- 204 No Content

### Aplicar Etiqueta a Cartão - Sucesso

- 201 Created
- Response: `{ id: "uuid", card_id: "uuid", label_id: "uuid", created_at: "..." }`

### Remover Etiqueta de Cartão - Sucesso

- 204 No Content

### Listar Etiquetas do Quadro - Sucesso

- 200 OK
- Response:
```json
{
  "labels": [
    { "id": "uuid", "name": "Bug", "color": "#FF0000", "card_count": 5 },
    { "id": "uuid", "name": "Feature", "color": "#00FF00", "card_count": 8 }
  ]
}
```

### Listar Etiquetas de um Cartão - Sucesso

- 200 OK
- Response:
```json
{
  "labels": [
    { "id": "uuid", "name": "Bug", "color": "#FF0000" },
    { "id": "uuid", "name": "Urgent", "color": "#FF0000" }
  ]
}
```

### Erro: Nome Duplicado

- 409 Conflict
- `{ "error": "Já existe etiqueta com este nome neste quadro" }`

### Erro: Sem Permissão

- 403 Forbidden
- `{ "error": "Você não tem permissão para gerenciar etiquetas" }`

### Erro: Etiqueta Não Encontrada

- 404 Not Found
- `{ "error": "Etiqueta não encontrada" }`

### Erro: Nome Inválido

- 400 Bad Request
- `{ "error": "Nome não pode estar vazio" }` ou `{ "error": "Nome muito longo (máximo 50 caracteres)" }`

### Erro: Cor Inválida

- 400 Bad Request
- `{ "error": "Cor deve ser um valor HEX válido (ex: #FF0000)" }`

## Fluxos Principais

### Fluxo 1: Criar Etiqueta e Aplicar a Cartão

```
Editor acessa quadro
  ↓
Clica "Gerenciar Etiquetas"
  ↓
Clica "Nova Etiqueta"
  ↓
Insere nome "Feature" + seleciona cor verde (#00FF00)
  ↓
Sistema cria etiqueta, exibe na lista
  ↓
Editor abre cartão "Implementar Dashboard"
  ↓
Clica "Adicionar Etiqueta" no cartão
  ↓
Seleciona "Feature"
  ↓
"Feature" aparece no cartão com cor verde
  ↓
Outros usuários veem "Feature" no cartão
```

### Fluxo 2: Filtrar Cartões por Etiqueta

```
Editor visualiza quadro com 20 cartões
  ↓
Clica em painel de filtros
  ↓
Seleciona etiqueta "Bug"
  ↓
Quadro exibe apenas cartões com "Bug" (ex: 5 cartões)
  ↓
Editor seleciona também "Urgent"
  ↓
Quadro exibe cartões com "Bug" OU "Urgent" (ex: 7 cartões)
  ↓
Editor clica X para remover "Bug"
  ↓
Quadro exibe cartões com apenas "Urgent" (ex: 3 cartões)
  ↓
Editor clica X em "Urgent"
  ↓
Filtro limpa, quadro volta a exibir todos 20 cartões
```

### Fluxo 3: Editar Etiqueta (Sincronização)

```
Admin A clica em editar "Bug" (vermelho)
  ↓
Muda nome para "BugReport" + cor para laranja (#FF8800)
  ↓
Sistema atualiza banco
  ↓
Editor B, que tem o quadro aberto, vê:
  - Nome muda de "Bug" para "BugReport"
  - Cor muda de vermelho para laranja em todos os cartões que tinham "Bug"
  ↓
Se Editor B tinha "Bug" selecionado no filtro, filtro permanece ativo (referencia por ID, não name)
```

### Fluxo 4: Deletar Etiqueta

```
Admin clica "Deletar" em etiqueta "WontFix"
  ↓
Confirma remoção
  ↓
Sistema deleta "WontFix" e remove de todos os cartões
  ↓
Cartões que tinham "WontFix" continuam existindo, apenas perdem a etiqueta
  ↓
Se alguém tinha filtro "WontFix" ativo, filtro limpa-se automaticamente
  ↓
"WontFix" desaparece da lista de etiquetas disponíveis
```

## Critérios de Aceite Resumidos

- [ ] C1: Criar etiqueta com nome e cor
- [ ] C2: Editar nome e cor de etiqueta
- [ ] C3: Deletar etiqueta (remove de cartões também)
- [ ] C4: Aplicar etiqueta a cartão
- [ ] C5: Remover etiqueta de cartão
- [ ] C6: Visualizar etiquetas em cartão
- [ ] C7: Filtrar por uma etiqueta
- [ ] C8: Filtrar por múltiplas etiquetas (OR)
- [ ] C9: Remover filtro de etiqueta
- [ ] C10: Viewer consegue filtrar mas não criar etiquetas
- [ ] C11: Admin/Editor conseguem gerenciar etiquetas
- [ ] C12: Nome de etiqueta é único por quadro
- [ ] C13: Validação: nome vazio rejeitado
- [ ] C14: Validação: cor inválida rejeitada
- [ ] C15: Validação: nome muito longo rejeitado
- [ ] C16: Validação: etiqueta duplicada no mesmo cartão rejeitada
- [ ] C17: Sem limite de etiquetas por cartão (até limite prático)
- [ ] C18: Sincronização em tempo real de etiquetas entre usuários
- [ ] C19: Etiqueta deletada remove-se de filtro ativo
- [ ] C20: Cor da etiqueta é visível e distinguível

---

## Dependências

- **RF01 (Autenticação)**: Valida permissão do usuário (Admin/Editor vs Viewer)
- **RF02 (Quadros)**: Etiqueta pertence a um quadro (FK)
- **RF04 (Cartões)**: Etiqueta é aplicada a cartões (FK CardLabel)
- **RF05 (Cascade Delete)**: Deletar quadro/cartão remove etiquetas em cascata

---

## Roadmap Futuro

- **v2**: Ordenação de etiquetas por drag-and-drop
- **v2**: Templates de cores/temas de etiquetas
- **v2**: Busca por etiqueta (autocomplete)
- **v2**: Atribuição de etiquetas a grupos (multi-select em batch)
- **v2**: Histórico de mudanças de etiqueta
- **v2**: Etiquetas automáticas baseadas em regras (ex: prioridade automática por data vencimento)
- **v2**: Integração com sistema externo (Jira labels, GitHub labels)
- **v2**: Relatório/dashboard por etiqueta (cards por label)

