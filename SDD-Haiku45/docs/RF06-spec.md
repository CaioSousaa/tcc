# RF06: Checklists em Cartões com Acompanhamento de Progresso

## Visão Geral

Um usuário pode adicionar itens de checklist a um cartão (task) e marcar itens como concluídos. O sistema rastreia quantos itens estão completos versus o total, exibindo progresso visual (e.g., "3 de 5" ou barra de progresso). Cada item é independente: marcar um não afeta os outros. Itens podem ser adicionados, removidos e editados a qualquer momento.

## Atores

- **Usuário autenticado**: Proprietário do quadro (via RF02)
- **Sistema**: Persiste, valida e exibe checklist com progresso

## Comportamento Esperado

### 1. Adicionar Checklist a um Cartão

Usuário abre um cartão e deseja criar um checklist para organizar subtarefas.

**Given**: Usuário acessa página/modal de um cartão vazio (sem checklist)  
**When**: Clica em botão "Adicionar Checklist"  
**Then**:
- Interface de entrada de checklist é exibida (input field + botão "Adicionar")
- Campo fica em foco e pronto para digitação
- Nenhum item ainda foi criado
- Estado padrão: 0 de 0 itens completos

### 2. Adicionar Primeiro Item ao Checklist

Usuário digita e adiciona o primeiro item.

**Given**: Interface de checklist aberta, campo vazio  
**When**: Usuário digita "Implementar login" e clica "Adicionar"  
**Then**:
- Item aparece na lista com checkbox desmarcado
- Contador exibe "0 de 1" (nenhum completo de 1 total)
- Campo de entrada é limpado para próximo item
- Foco permanece no campo para adicionar mais itens

### 3. Adicionar Múltiplos Itens

Usuário adiciona vários itens ao mesmo checklist.

**Given**: Checklist com 1 item ("Implementar login")  
**When**: Adiciona "Testar login" e depois "Deploy em staging"  
**Then**:
- Lista exibe 3 itens em ordem de adição
- Todos inicialmente desmarcados
- Contador exibe "0 de 3"
- Cada item tem position/ordem implícita (posição de adição)

### 4. Marcar Item como Completo

Usuário marca um item como concluído.

**Given**: Checklist com 3 itens, nenhum marcado  
**When**: Clica no checkbox do item "Implementar login"  
**Then**:
- Checkbox muda para marcado (✓)
- Item pode exibir visual diferente (e.g., strikethrough, cor cinza)
- Contador atualiza para "1 de 3"
- Progresso visível atualiza (se houver barra)

### 5. Desmarcar Item

Usuário desmarca um item completado.

**Given**: Item "Implementar login" está marcado  
**When**: Clica no checkbox novamente  
**Then**:
- Checkbox volta a desmarcado
- Visual do item volta ao normal
- Contador retorna para "0 de 3"

### 6. Remover Item do Checklist

Usuário deleta um item que não é mais necessário.

**Given**: Checklist com 3 itens, 1 marcado ("Implementar login")  
**When**: Clica em botão "Remover" ou ícone X no item "Testar login"  
**Then**:
- Item "Testar login" desaparece
- Contador atualiza para "1 de 2" (1 marcado de 2 restantes)
- Ordem dos itens restantes preservada

### 7. Editar Descrição de Item

Usuário corrige ou atualiza texto de um item.

**Given**: Item "Implementar login" já existe  
**When**: Clica para editar ou double-click no texto do item  
**Then**:
- Campo fica editável (inline ou modal)
- Texto atual é selecionável para modificação
- Usuário altera texto para "Implementar autenticação OAuth"
- Clica salvar ou Enter
- Item atualizado com novo texto, ordem preservada

### 8. Completar Todos os Itens

Usuário marca todos os itens como concluídos.

**Given**: Checklist com 3 itens, 0 marcados  
**When**: Marca checkbox de cada item (ou clica "Marcar tudo")  
**Then**:
- Todos 3 checkboxes ficam marcados
- Contador exibe "3 de 3" (100%)
- Barra de progresso (se houver) está completa (verde/100%)
- Visual do card pode indicar "Tarefa 100% concluída"

### 9. Visualizar Progresso em Múltiplos Cards

Usuário visualiza quadro com múltiplos cards, cada um com checklist.

**Given**: Quadro com 3 cards:
  - Card A: 2 de 3 itens (67%)
  - Card B: 0 de 2 itens (0%)
  - Card C: 1 de 1 item (100%)  
**When**: Usuário visualiza a lista  
**Then**:
- Cada card exibe progresso (e.g., "2/3" ou mini barra)
- Usuário consegue identificar rapidamente quais cards têm progresso
- Visualização não interfere em outras informações do card (título, descrição)

### 10. Card sem Checklist vs. com Checklist Vazio

Usuário cria card sem checklist, depois adiciona um.

**Given**: Card novo sem checklist  
**When**: Clica "Adicionar Checklist"  
**Then**:
- Seção de checklist é criada
- Nenhum item ainda existe
- Exibe "0 de 0" ou esconde contador (sem itens não há progresso)

**Given**: Card com checklist, mas usuário remove todos os itens  
**When**: Remove o último item  
**Then**:
- Checklist fica vazio (0 itens)
- Contador exibe "0 de 0" ou seção é desmontada
- Card pode exibir "Sem itens" ou esconder seção

### 11. Persistência após Reload

Usuário cria checklist, fecha card, recarrega página.

**Given**: Card com checklist: "1 de 3" itens completos  
**When**: Usuário fecha card modal/página e recarrega  
**Then**:
- Checklist permanece com mesmos itens e status
- Contador ainda exibe "1 de 3"
- Nenhum dado foi perdido

## Regras de Negócio

1. **Checklist Opcional**: Um card pode ter 0 ou 1 checklist (não múltiplos)
2. **Ordem Preservada**: Itens mantêm ordem de adição (ou reordenável)
3. **Status Independente**: Cada item tem status próprio (completo/incompleto)
4. **Progresso Rastreado**: Sistema calcula progresso em tempo real (X de Y)
5. **Sem Hierarquia**: Itens não podem ter subitens (lista flat)
6. **Edição Livre**: Usuário pode editar item a qualquer momento
7. **Exclusão Livre**: Usuário pode remover item sem confirmação (ou com confirmação?)
8. **Um Card = Um Checklist**: Não pode haver múltiplos checklists no mesmo card
9. **Dados Atomicamente Atualizados**: Marcação/desmarção/adição/remoção são operações atômicas

## Restrições

- **Título Obrigatório**: Cada item do checklist precisa ter texto não-vazio
- **Comprimento Máximo**: Texto do item limitado a 500 caracteres (mesmo do card description)
- **Sem Itens Duplicados**: Se não, permitir duplicatas exatas (mesmo texto)? → Permitir (regra flexível)
- **Checklist Não é Obrigatório**: Card funciona sem checklist
- **Remover vs. Marcar**: Remover é permanente, marcar é reversível
- **Sem Reordenação Manual**: Itens mantêm ordem de criação (v2: drag-and-drop)
- **Sem Priorização**: Todos os itens têm mesmo peso (v2: prioridades)
- **Sem Deadlines Individuais**: Itens não têm datas (apenas card tem, via RF?)
- **Sem Tags/Categorias**: Itens não podem ser categorizados (v2)

## Casos de Borda e Condições de Erro

### Entrada Invalida

- Item vazio: Validação impede criação (erro: "Item não pode estar vazio")
- Whitespace-only: "   " → Validação rejeita (erro: "Título não pode conter apenas espaços")
- Muito longo: "X" * 501 → Truncado a 500 ou erro? → Erro: "Máximo 500 caracteres"

### Operações Concorrentes

- Usuário A marca item como completo, Usuário B edita mesmo item:
  - B vê versão atualizada de A + seu edit
  - Esperado: transação garante consistência
  
- Usuário A remove item, Usuário B tenta marcar mesmo item:
  - B vê erro 404 (item não existe mais)
  - Sem crash, sem corrupção

### Estado Extremo

- Card com 0 itens: Checklist existe mas vazio, exibe "0 de 0"
- Card com 100+ itens: Sem limite funcional, mas v2 pode ter UI limite
- Todos itens marcados: 100% completo, pode-se desmarcar qualquer um
- Todos itens desmarcados: 0% completo

### Exclusão e Recuperação

- Remover item: Permanentemente deletado (não soft-delete, via RF05 padrão)
- Remover checklist inteiro: Deleta todos os itens junto (cascata)
- Nenhuma opção de undo direto (v2: undo histórico)

### Restrições de Acesso

- Usuário não dono do card: Erro 403 (não consegue marcar, adicionar, remover)
- Não autenticado: Erro 401 (redireciona para /login)
- Card não existe: Erro 404

### Casos Limítrofes

- Card com título muito curto: Checklist funciona normalmente
- Card com descrição muito longa: Checklist não interfere
- Checklist com muitos itens (100+): Scroll interno ou layout responsivo necessário

## Dados Afetados

### Criados
- Checklist (1 por card)
  - card_id (FK)
  - created_at
  - updated_at
- ChecklistItem (múltiplos por card)
  - id
  - checklist_id (FK)
  - title (text)
  - is_completed (boolean)
  - position (int, ordem)
  - created_at
  - updated_at

### Atualizados
- Card
  - updated_at (ao criar/modificar checklist)
  - Opcionalmente: progresso (denormalização para performance, v2)

### Preservados
- Informações do card original (título, descrição, criador)
- Histórico de usuário (autenticação)
- Posição/ordem do card na lista (coluna)

### Deletados
- ChecklistItem (ao remover item)
- Checklist (ao remover card completo via cascata)

## Respostas do Sistema

### Adicionar Item - Sucesso
- 201 Created
- Response: `{ id: "uuid", checklist_id: "uuid", title: "...", is_completed: false, position: 0 }`

### Marcar Item - Sucesso
- 200 OK
- Response: `{ id: "uuid", is_completed: true, updated_at: "2026-09-14T..." }`

### Editar Item - Sucesso
- 200 OK
- Response: `{ id: "uuid", title: "novo texto", updated_at: "..." }`

### Remover Item - Sucesso
- 204 No Content

### Obter Checklist (com progresso)
- 200 OK
- Response:
```json
{
  "id": "uuid",
  "card_id": "uuid",
  "items": [
    { "id": "uuid", "title": "Implementar", "is_completed": true, "position": 0 },
    { "id": "uuid", "title": "Testar", "is_completed": false, "position": 1 }
  ],
  "progress": {
    "completed": 1,
    "total": 2,
    "percentage": 50
  }
}
```

### Erro: Item Inválido
- 400 Bad Request
- Mensagem: "Item não pode estar vazio" ou "Máximo 500 caracteres"

### Erro: Não Autorizado
- 403 Forbidden
- Mensagem: "Você não tem permissão para modificar este card"

### Erro: Não Autenticado
- 401 Unauthorized
- Redireciona para /login

### Erro: Card/Checklist não Existe
- 404 Not Found
- Mensagem: "Card não encontrado" ou "Checklist não existe"

## Fluxos Principais

### Fluxo 1: Criar Checklist e Adicionar Itens
```
Usuário abre card
  ↓
Clica "Adicionar Checklist"
  ↓
Interface de checklist aparece
  ↓
Digita "Item 1" e clica "Adicionar"
  ↓
Item 1 aparece na lista (0 de 1)
  ↓
Repete para "Item 2", "Item 3"
  ↓
Checklist exibe 3 itens, nenhum marcado (0 de 3)
```

### Fluxo 2: Marcar Itens e Acompanhar Progresso
```
Usuário visualiza checklist com 3 itens (0 de 3)
  ↓
Clica checkbox de "Item 1"
  ↓
Item 1 marcado, contador atualiza (1 de 3)
  ↓
Clica checkbox de "Item 2"
  ↓
Contador atualiza (2 de 3)
  ↓
Barra de progresso exibe ~67%
```

### Fluxo 3: Editar e Remover Itens
```
Usuário clica editar em "Item 1"
  ↓
Campo fica editável
  ↓
Altera texto para "Item 1 - Revisado"
  ↓
Clica salvar
  ↓
Item atualizado, ordem preservada
  ↓
Clica X em "Item 2"
  ↓
Item 2 removido
  ↓
Contador atualiza (1 de 2)
```

### Fluxo 4: Remover Card com Checklist
```
Usuário remove card (via RF05)
  ↓
Backend: DELETE card
  ↓
Cascata: DELETE checklist_items WHERE checklist_id = X
  ↓
Cascata: DELETE checklist WHERE card_id = X
  ↓
Card desaparece com seu checklist
```

## Critérios de Aceite Resumidos

- [ ] A1: Criar checklist em card vazio
- [ ] A2: Adicionar primeiro item ao checklist
- [ ] A3: Adicionar múltiplos itens
- [ ] A4: Marcar item como completo
- [ ] A5: Desmarcar item
- [ ] A6: Remover item do checklist
- [ ] A7: Editar descrição de item
- [ ] A8: Visualizar progresso (X de Y)
- [ ] A9: Card com 100% itens marcados
- [ ] A10: Progresso persiste após reload
- [ ] A11: Validação: item vazio rejeitado
- [ ] A12: Validação: texto muito longo rejeitado
- [ ] A13: Acesso negado: usuário não dono (403)
- [ ] A14: Acesso negado: não autenticado (401)
- [ ] A15: Remover card remove checklist (cascata)
- [ ] A16: Checklist é opcional (card pode não ter)
- [ ] A17: Um card = Um checklist (não múltiplos)
- [ ] A18: Itens sem hierarquia (lista flat)
- [ ] A19: Ordem de itens preservada
- [ ] A20: Progresso atualiza em tempo real

---

## Dependências

- **RF01 (Autenticação)**: Valida se usuário está autenticado
- **RF02 (Quadros)**: Valida se usuário é dono do quadro
- **RF04 (Cartões)**: Card é entidade pai do checklist
- **RF05 (Cascade Delete)**: Ao deletar card, checklist é deletado em cascata

---

## Roadmap Futuro

- **v2**: Reordenação manual (drag-and-drop) de itens
- **v2**: Prioridades por item (alto/médio/baixo)
- **v2**: Deadlines individuais por item
- **v2**: Atribuição de itens (quem ficou responsável)
- **v2**: Histórico de marcação (quando foi completado)
- **v2**: Subtarefas (hierarquia de checklists)
- **v2**: Tags/categorias por item
- **v2**: Undo/redo para operações de checklist
- **v2**: Notificações de progresso
- **v2**: Templates de checklist reutilizáveis
