# RF10: Prazos em Cartões (Due Dates)

## Visão Geral

Um usuário pode definir uma data de vencimento (prazo) em um cartão para indicar quando uma tarefa deve ser concluída. O sistema rastreia prazos, identifica automaticamente cartões atrasados (cuja data de vencimento passou), e oferece visualização clara do status de cada cartão (no prazo, vencendo em breve, vencido). Prazos são opcionais e não afetam o funcionamento dos cartões.

## Atores

- **Usuário autenticado**: Proprietário do board (via RF02)
- **Admin/Editor**: Pode definir, editar e remover prazos de qualquer cartão
- **Viewer**: Pode visualizar prazos, mas não pode criar, editar nem remover
- **Sistema**: Calcula automaticamente se um cartão está atrasado, identifica prazos próximos

## Comportamento Esperado

### 1. Definir Prazo em um Cartão

Um membro deseja marcar a data de vencimento de uma tarefa para organizar prioridades.

**Given**: Usuário é admin/editor e abre um cartão que não possui prazo  
**When**: Clica em "Definir Prazo" e seleciona uma data (ex: 2026-09-20) e clica "Salvar"  
**Then**:
- Prazo é definido e persistido no banco de dados
- Cartão exibe o prazo de forma clara (ex: "Vence em 5 dias", "Vence hoje", "Atrasado desde 2 dias")
- Data é exibida em formato legível ao usuário
- Prazo fica visível na thread do cartão

### 2. Visualizar Status do Prazo

Um membro abre um cartão e quer saber em quanto tempo a tarefa vence.

**Given**: Cartão tem um prazo definido  
**When**: Usuário visualiza o cartão  
**Then**:
- Indicador de prazo está visível (badge, cor, texto)
- Status é claro:
  - "Sem prazo" se nenhum foi definido
  - "Vence em X dias" se prazo é no futuro (>1 dia)
  - "Vence hoje" se prazo é hoje
  - "Atrasado desde X dias" se prazo foi ultrapassado
- Cor ou estilo visual diferencia o status:
  - Verde/cinza: sem prazo ou no prazo (>7 dias)
  - Amarelo/laranja: vencendo em breve (0-7 dias)
  - Vermelho: atrasado

### 3. Editar Prazo de um Cartão

Um membro descobre que a data de conclusão mudou e quer atualizar o prazo.

**Given**: Cartão já possui um prazo e usuário é admin/editor  
**When**: Clica em "Editar Prazo", seleciona nova data (ex: 2026-09-25) e clica "Salvar"  
**Then**:
- Prazo anterior é substituído
- Novo prazo é persistido
- Indicador visual é atualizado
- Histórico anterior não é mostrado (apenas último prazo é visível)

### 4. Remover Prazo de um Cartão

Um membro decide que um cartão não precisa mais de prazo.

**Given**: Cartão tem prazo definido e usuário é admin/editor  
**When**: Clica em "Remover Prazo" ou "Limpar" e confirma  
**Then**:
- Prazo é removido
- Cartão volta ao estado "Sem prazo"
- Indicador de prazo desaparece ou mostra "Sem prazo"
- Dados persistidos são atualizados

### 5. Identificar Cartões Atrasados

Um membro quer encontrar rapidamente tarefas que perderam prazo.

**Given**: Existem cartões com prazos definidos, alguns ultrapassados  
**When**: Usuário abre a lista de cartões ou aplica filtro "Atrasados"  
**Then**:
- Cartões atrasados são identificáveis (cor vermelha, ícone de alerta, ou em seção separada)
- Cartão mostra "Atrasado desde X dias" ou similar
- Todos os cartões com prazo < TODAY são listados como atrasados
- Contador ou indicador mostra quantos cartões estão atrasados

### 6. Filtrar Cartões por Status de Prazo

Um membro quer visualizar apenas cartões que vencem em um período específico.

**Given**: Board tem cartões com vários prazos  
**When**: Usuário seleciona filtro (ex: "Próximos 7 dias", "Atrasados", "Sem prazo")  
**Then**:
- Lista é filtrada para mostrar apenas cartões do período selecionado
- Filtros disponíveis: "Atrasados", "Vencendo hoje", "Próximos 7 dias", "Próximos 30 dias", "Sem prazo"
- Contador mostra quantos cartões correspondem a cada filtro
- Filtro é opcional (view padrão mostra todos)

### 7. Visualizar Viewer Sem Permissão de Edição

Um viewer (membro com permissão apenas de leitura) quer ver prazos mas não consegue editá-los.

**Given**: Usuário é viewer do board  
**When**: Abre um cartão com prazo  
**Then**:
- Prazo é visível e legível
- Botões "Definir Prazo", "Editar Prazo", "Remover Prazo" não aparecem ou estão desabilitados
- Viewer consegue visualizar mas não consegue modificar prazos
- Tentativa de edição (via API) é rejeitada com erro 403 Forbidden

### 8. Persistência de Prazo Após Recarga

Um usuário define prazo, fecha o cartão e recarrega a página.

**Given**: Cartão tem prazo definido  
**When**: Usuário fecha o cartão/página e recarrega  
**Then**:
- Prazo permanece intacto
- Nenhum dado foi perdido
- Indicador de prazo mostra o mesmo status

### 9. Prazo Automático Muda de Status

Um cartão tem prazo para amanhã, depois de uma mudança de dia passa a ter prazo para hoje, depois fica atrasado.

**Given**: Cartão com prazo fixo em 2026-09-20  
**When**: Dia muda para 2026-09-20 (hoje)  
**Then**:
- Indicador muda automaticamente para "Vence hoje"
- Cor/estilo visual muda para laranja/vermelho

**When**: Dia muda para 2026-09-21 (próximo dia)  
**Then**:
- Indicador muda automaticamente para "Atrasado desde 1 dia"
- Cor/estilo visual muda para vermelho

### 10. Cartão Sem Prazo Não Exibe Informação de Atraso

Um cartão nunca teve prazo definido.

**Given**: Cartão não possui prazo  
**When**: Usuário visualiza o cartão  
**Then**:
- Nenhum indicador de prazo é exibido (ou exibe "Sem prazo" de forma discreta)
- Cartão não aparece em filtros de atraso
- Não há confusão com cartões que têm prazos

### 11. Data Inválida é Rejeitada

Um usuário tenta definir um prazo com data em formato incorreto.

**Given**: Usuário tenta definir prazo  
**When**: Digita data em formato inválido (ex: "32/09/2026" ou "abc")  
**Then**:
- Sistema exibe mensagem de erro clara
- Prazo não é definido
- Usuário consegue corrigir e tentar novamente

### 12. Prazo Passado é Permitido

Um usuário define prazo em data que já passou (por erro ou proposital).

**Given**: Usuário seleciona data anterior a hoje  
**When**: Clica "Salvar"  
**Then**:
- Prazo é aceito e salvo
- Cartão exibe imediatamente como "Atrasado desde X dias"
- Sem bloqueio ou aviso especial (apenas informação clara)

## Regras de Negócio

1. **Prazo Opcional**: Um cartão pode ter 0 ou 1 prazo (não múltiplos)
2. **Única Data por Cartão**: Não há múltiplos prazos ou sub-prazos
3. **Status Automático**: Sistema calcula automaticamente se cartão está atrasado
4. **Atraso Persiste**: Cartão atrasado permanece atrasado até prazo ser removido ou novo prazo ser definido
5. **Data de Referência**: Atraso é calculado comparando prazo com a data/hora atual do servidor
6. **Sem Notificações Automáticas**: Não há alertas ou lembretes (v2 feature)
7. **Permissões**: Admin/Editor podem gerenciar qualquer prazo; Viewer apenas lê
8. **Independência**: Prazo não afeta outras funcionalidades do cartão (descrição, atribuições, comentários, checklists)

## Restrições

- **Formato de Data**: Data deve estar em formato padrão (YYYY-MM-DD) ou usar date picker nativo
- **Prazo Obrigatório**: Prazo é totalmente opcional (cartão funciona sem)
- **Sem Recorrência**: Prazos não se repetem (sem prazo recorrente)
- **Sem Zonas de Horário**: Assume UTC ou timezone do servidor (sem ajuste por usuário)
- **Sem Hard Limit**: Não há limite no passado (prazos antigos são permitidos)
- **Sem Priorização Implícita**: Prazo não afeta automaticamente prioridade visual do cartão (apenas cor/status)
- **Sem Cascata Automática**: Deletar card remove seu prazo (via FK cascata, não lógica especial)

## Casos de Borda e Condições de Erro

### Validação de Entrada

- **Data vazia/nula**: "Prazo não pode estar vazio" (erro 400)
- **Data em formato inválido**: "Data inválida" (erro 400)
- **Data muito antiga** (ex: 1900-01-01): Aceita, sem erro (apenas exibe como "Atrasado desde X anos")
- **Data muito futura** (ex: 2100-12-31): Aceita, sem erro

### Operações de Prazo

- **Editar prazo de cartão inexistente**: Erro 404 Not Found
- **Remover prazo de cartão inexistente**: Erro 404 Not Found
- **Definir prazo sem permissão (viewer)**: Erro 403 Forbidden
- **Editar prazo sem permissão**: Erro 403 Forbidden
- **Remover prazo sem permissão**: Erro 403 Forbidden

### Permissões

- **Viewer tenta definir prazo**: Erro 403 Forbidden
- **Não-autenticado tenta acessar**: Erro 401 Unauthorized
- **Editor/Admin consegue gerenciar**: Sucesso (200 OK / 204 No Content)

### Concorrência

- **Dois usuários editam simultaneamente**: Última edição prevalece (timestamp é atualizado)
- **Um user deleta prazo enquanto outro edita**: Delete sucede, edit retorna 404 ou prazo deletado

### Dados Especiais

- **Data é 2026-02-29** (leap year): Aceita se ano bissexto, rejeita se não
- **Data é 9999-12-31**: Aceita (sem limite de ano)
- **Mudança de horário de verão/inverno**: Sem impacto (usa data, não hora específica)

## Dados Afetados

### Criados

- **Prazo** (associado a cartão, não entidade separada)
  - card_id (FK)
  - due_date (DATE ou TIMESTAMP, nullable)
  - created_at
  - updated_at

### Atualizados

- **Card**
  - updated_at (ao definir/editar/remover prazo)

### Preservados

- Informações do cartão original (título, descrição, atribuições)
- Histórico de comentários
- Checklist do cartão

### Deletados

- **Prazo** (ao remover ou deletar cartão via FK)

## Respostas do Sistema

### Definir Prazo - Sucesso

- 201 Created ou 200 OK
- Response: `{ id: "uuid", card_id: "uuid", due_date: "2026-09-20", created_at: "...", updated_at: "..." }`

### Visualizar Prazo - Sucesso

- 200 OK
- Response: `{ id: "uuid", card_id: "uuid", due_date: "2026-09-20", status: "due_soon" }`

### Editar Prazo - Sucesso

- 200 OK
- Response: `{ id: "uuid", due_date: "2026-09-25", updated_at: "..." }`

### Remover Prazo - Sucesso

- 204 No Content

### Erro: Data Inválida

- 400 Bad Request
- `{ "error": "Data inválida" }`

### Erro: Sem Permissão

- 403 Forbidden
- `{ "error": "Você não tem permissão para editar prazos" }`

### Erro: Não Encontrado

- 404 Not Found
- `{ "error": "Cartão não encontrado" }`

### Erro: Não Autenticado

- 401 Unauthorized

## Fluxos Principais

### Fluxo 1: Definir Prazo

```
Membro abre cartão
  ↓
Clica "Definir Prazo"
  ↓
Seleciona data (ex: 2026-09-20)
  ↓
Clica "Salvar"
  ↓
Prazo é persistido
  ↓
Cartão exibe "Vence em 5 dias" com cor laranja
```

### Fluxo 2: Identificar Atrasado

```
Cartão tem prazo em 2026-09-15
  ↓
Data atual avança para 2026-09-16
  ↓
Sistema recalcula status
  ↓
Cartão exibe "Atrasado desde 1 dia" com cor vermelha
  ↓
Cartão aparece em filtro "Atrasados"
```

### Fluxo 3: Filtrar e Priorizar

```
Membro quer ver tarefas urgentes
  ↓
Aplica filtro "Próximos 7 dias"
  ↓
Lista mostra apenas cartões com prazo 0-7 dias no futuro
  ↓
Contador mostra "12 cartões vencendo em breve"
```

## Critérios de Aceite Resumidos

- [ ] C1: Definir prazo em cartão (admin/editor)
- [ ] C2: Visualizar prazo com status legível
- [ ] C3: Editar prazo existente
- [ ] C4: Remover prazo
- [ ] C5: Identificar cartões atrasados automaticamente
- [ ] C6: Filtrar cartões por status de prazo
- [ ] C7: Viewer visualiza mas não edita prazos
- [ ] C8: Admin/Editor conseguem gerenciar qualquer prazo
- [ ] C9: Persistência de prazo após reload
- [ ] C10: Status de prazo muda automaticamente (diariamente)
- [ ] C11: Validação: data inválida rejeitada
- [ ] C12: Validação: data vazia rejeitada
- [ ] C13: Permissões: viewer rejeitado (403)
- [ ] C14: Permissões: não-autenticado rejeitado (401)
- [ ] C15: Cartão sem prazo não exibe informação de atraso
- [ ] C16: Prazo passado é permitido (aceito como atrasado)
- [ ] C17: Cascata: deletar cartão remove prazo
- [ ] C18: Prazo é opcional (cartão funciona sem)
- [ ] C19: Um prazo por cartão (não múltiplos)
- [ ] C20: Indicador visual diferencia status (cor/texto)

---

## Dependências

- **RF01 (Autenticação)**: Validação de quem está editando prazos
- **RF02 (Quadros)**: Cartão pertence a um quadro
- **RF04 (Cartões)**: Prazo é propriedade do cartão
- **RF07 (Membros)**: Valida role de quem pode editar (admin, editor, viewer)
- **RF05 (Cascade Delete)**: Ao deletar cartão, prazo é deletado (via FK)

---

## Roadmap Futuro

- **v2**: Notificações e lembretes quando prazo está próximo
- **v2**: Histórico de mudanças de prazo
- **v2**: Prazos recorrentes (semanal, mensal)
- **v2**: Calendário visual com todos os prazos
- **v2**: Exportação de prazos (iCal, Google Calendar)
- **v2**: Priorização automática por prazo (mais urgente fica no topo)
- **v2**: Bloqueio de edição se cartão atrasado (workflow rule)
