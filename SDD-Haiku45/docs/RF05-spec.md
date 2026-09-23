# RF05: Cascata de Exclusão de Listas com Cartões

## Visão Geral

Quando um usuário exclui uma lista (coluna) que contém cartões, o sistema automaticamente remove todos os cartões associados àquela lista. Isso garante consistência de dados: nenhum cartão pode existir órfão sem uma lista válida. A ação é irreversível e exige confirmação do usuário, informando quantos cartões serão afetados.

## Atores

- **Usuário autenticado**: Proprietário do quadro (via RF02)
- **Sistema**: Persiste e valida cascata de exclusão

## Comportamento Esperado

### 1. Exclusão de Lista Vazia

Usuário exclui uma lista que não contém cartões.

**Given**: Usuário acessa página de um quadro com lista vazia (0 cartões)  
**When**: Clica em botão "Deletar" na lista, confirma exclusão  
**Then**:
- Confirmação exibida: "Tem certeza? Esta ação é irreversível."
- Nenhuma menção a cartões (pois lista está vazia)
- Após confirmação: lista deletada
- Cartões restantes (de outras listas) permanecem íntegros
- Posições de listas restantes reajustadas (0, 1, 2, ...)

### 2. Exclusão de Lista com Cartões (sem aviso específico)

Usuário exclui uma lista que contém cartões.

**Given**: Usuário acessa página de um quadro com lista contendo 3 cartões  
**When**: Clica em botão "Deletar" na lista  
**Then**:
- Confirmação exibida: "Tem certeza? Esta ação é irreversível. **Todos os 3 cartões nesta lista também serão deletados.**"
- Mensagem clara: "Todos os N cartões" (com N = quantidade real)
- Botões: "Confirmar Exclusão", "Cancelar"

**Given**: Usuário confirma exclusão  
**When**: Clica "Confirmar Exclusão"  
**Then**:
- Lista deletada
- Todos os 3 cartões da lista deletados permanentemente
- Cartões de outras listas permanecem
- Posições de listas restantes reajustadas
- Quadro atualiza visualmente (remove lista + seus cartões)

**Given**: Usuário cancela exclusão  
**When**: Clica "Cancelar"  
**Then**:
- Diálogo fechado
- Lista e cartões permanecem íntegros
- Nenhuma mudança no banco de dados

### 3. Exclusão de Múltiplas Listas Sequenciais

Usuário exclui lista 1 (com 2 cartões), depois lista 2 (com 5 cartões).

**Given**: Quadro com 3 listas (L1: 2 cards, L2: 5 cards, L3: 0 cards)  
**When**: Deleta L1 → confirma → depois deleta L2 → confirma  
**Then**:
- Após L1 delete: L1 removida (+ 2 cards), L2 e L3 permanecem
- Posições das listas reajustam: L2 posição 0, L3 posição 1
- Após L2 delete: L2 removida (+ 5 cards), L3 permanece
- Posições: L3 fica posição 0
- Total: 7 cartões deletados, nenhum órfão

### 4. Cascata não Afeta Outras Listas

Exclusão de uma lista não afeta cartões de outras listas.

**Given**: Quadro com L1 (5 cards), L2 (3 cards), L3 (1 card)  
**When**: Deleta L1  
**Then**:
- L1 e seus 5 cartões deletados
- L2 e seus 3 cartões permanecem íntegtos
- L3 e seu 1 cartão permanecem íntegtos
- Cartões de L2/L3 mantêm mesmos dados (title, description, position dentro sua lista)

### 5. Undo/Reversão não Disponível

Exclusão de lista com cascata é irreversível.

**Given**: Lista deletada com seus cartões (ação já confirmada)  
**When**: Usuário tenta desfazer (ctrl+z, botão undo, etc)  
**Then**:
- Nenhuma opção de desfazer disponível
- Dados permanentemente removidos do banco de dados
- Usuário deve ser informado em tempo de exclusão

## Regras de Negócio

1. **Cascata Obrigatória**: Quando lista é deletada, TODOS seus cartões são também deletados (não podem ficar órfãos)
2. **Exclusão Permanente**: Delete físico, não soft-delete (completo removido do banco)
3. **Confirmação Explícita**: Usuário deve confirmar exclusão da lista
4. **Aviso de Impacto**: Se lista tem cartões, confirmação deve mencionar quantidade e que cartões serão perdidos
5. **Sem Recuperação**: Nenhum undo, restore ou backup automático disponível
6. **Reajuste Automático**: Posições de listas restantes reajustadas (sem gaps)
7. **Isolamento de Usuário**: Usuário só consegue deletar listas em quadros que possui

## Restrições

- **Confirmação**: Diálogo explícito obrigatório antes de qualquer delete
- **Mensagem**: Se lista tem cartões, mensagem deve incluir exatamente: "Todos os N cartões nesta lista também serão deletados"
- **Quantidade Real**: Mostrar número real de cartões que serão afetados
- **Delete Físico**: DELETE FROM cards + DELETE FROM columns, não UPDATE status
- **Atomicidade**: Lista e seus cartões deletados em transação (tudo ou nada)
- **Sem Cascata Reversa**: Deletar cartão não afeta lista (apenas reajusta positions dentro lista)
- **Sem Limite**: Funciona com 0, 1, 100+ cartões na lista

## Casos de Borda e Condições de Erro

### Quantidade Cartões

- Lista com 0 cartões: Confirmação sem menção a cartões (válido)
- Lista com 1 cartão: "1 cartão nesta lista também será deletado" (singular OK)
- Lista com 100+ cartões: "Todos os 100 cartões..." (funciona com qualquer número)

### Estado Concurrent

- Deletar lista enquanto usuário cria novo cartão nela: 
  - Se delete commita primeiro: novo cartão falha (lista não existe)
  - Se novo cartão commita primeiro: cartão deletado junto com lista
  - Esperado: transação DB garante consistência

- Deletar lista enquanto outro usuário exibe seus cartões:
  - Outro usuário vê erro 404 (lista não existe mais)
  - Sem crash, sem dados corrompidos

### Reajuste Positions

- Lista com position=0 deletada: Lista position=1 vira 0, position=2 vira 1, etc (sem gaps)
- Última lista deletada: Próxima lista passa a ser a última
- Única lista deletada: Quadro fica vazio (0 listas)

### Casos Extremos

- Deletar lista enquanto outro usuário tenta mover cartão dela para outra: 
  - Move falha (lista não existe mais)
  - Sem corrupção

- Deletar lista sem autorização (não é dono do quadro):
  - Erro 403 Forbidden (antes de confirmar)
  - Confirmação nunca é mostrada

- Deletar lista sem autenticação:
  - Erro 401 Unauthorized (antes de confirmar)
  - Confirmação nunca é mostrada

## Dados Afetados

### Deletados
- Registro de lista (columns table)
- Todos os cartões associados (cards table)
  - IDs dos cartões
  - Títulos
  - Descrições
  - Posições

### Preservados
- Outras listas (columns) do mesmo quadro
- Cartões de outras listas
- Histórico de usuário (RF01 autenticação)
- Quadro em si

## Respostas do Sistema

### Confirmação Dialog
```
Tem certeza? Esta ação é irreversível.
[Se lista tem cartões: Todos os N cartões nesta lista também serão deletados.]

Botões: "Confirmar Exclusão" | "Cancelar"
```

### Delete Bem-Sucedido
- 204 No Content (HTTP DELETE)
- Lista + cartões removidos
- Frontend: Visuais atualizam (lista desaparece, outras listas reordenadas)

### Erro: Usuário não Autorizado
- 403 Forbidden
- Mensagem: "Você não tem permissão para deletar esta lista"

### Erro: Não Autenticado
- 401 Unauthorized
- Redireciona para /login

### Erro: Lista não Existe
- 404 Not Found (não deve acontecer após confirmação, mas possível em race condition)
- Mensagem: "Lista não encontrada"

## Fluxos Principais

### Fluxo 1: Deletar Lista Vazia
```
Usuário clica "Deletar" em lista (0 cartões)
  ↓
Dialog: "Tem certeza? Esta ação é irreversível."
  ↓
Usuário clica "Confirmar Exclusão"
  ↓
Backend: DELETE lista (transação)
  ↓
Backend: Reajusta positions de listas restantes
  ↓
204 No Content
  ↓
Frontend: Lista desaparece, outras reordenadas
```

### Fluxo 2: Deletar Lista com Cartões
```
Usuário clica "Deletar" em lista (5 cartões)
  ↓
Dialog: "Tem certeza? Esta ação é irreversível.
Todos os 5 cartões nesta lista também serão deletados."
  ↓
Usuário clica "Confirmar Exclusão"
  ↓
Backend: DELETE cartões WHERE list_id = X (transação)
  ↓
Backend: DELETE lista (mesma transação)
  ↓
Backend: Reajusta positions de listas restantes
  ↓
204 No Content
  ↓
Frontend: Lista + seus 5 cartões desaparecem, outras listas reordenadas
```

### Fluxo 3: Cancelar Exclusão
```
Usuário clica "Deletar" em lista
  ↓
Dialog exibido
  ↓
Usuário clica "Cancelar"
  ↓
Dialog fechado, nenhuma requisição ao backend
  ↓
Lista e cartões permanecem
```

## Critérios de Aceitação Resumidos

- [ ] C1: Confirmar exclusão lista vazia (sem mensagem cartões)
- [ ] C2: Confirmar exclusão lista com cartões (com avisos específico)
- [ ] C3: Dialog mostra quantidade real de cartões
- [ ] C4: Confirmação deleta lista + todos seus cartões
- [ ] C5: Cancelação não deleta nada
- [ ] C6: Cartões de outras listas permanecem
- [ ] C7: Posições de listas restantes reajustadas (sem gaps)
- [ ] C8: Acesso negado: usuário não dono do quadro (403)
- [ ] C9: Acesso negado: não autenticado (401)
- [ ] C10: Delete é irreversível, sem undo

---

## Dependências

- **RF01 (Autenticação)**: Valida se usuário está autenticado
- **RF02 (Quadros)**: Valida se usuário é dono do quadro
- **RF03 (Listas)**: Define estrutura de lista, posições, reajuste
- **RF04 (Cartões)**: Define que cartões pertencem a listas via FK

## Roadmap Futuro

- **v2**: Soft-delete com trash/recovery window (30 dias)
- **v2**: Undo button imediato (próxima ação, não próximo dia)
- **v2**: Notificações para colaboradores (quadro compartilhado)
- **v2**: Audit log (quem deletou, quando, quantos cartões)

