# RF07: Gerenciamento de Membros e Papéis com Atribuição a Cards

## Visão Geral

Um administrador de quadro pode convidar pessoas para colaborar, atribuir papéis com permissões específicas (Admin, Editor, Visualizador), e atribuir membros a cartões como responsáveis. Cada membro tem um papel que determina quais ações pode executar no quadro e seus cartões. Membros podem ser adicionados, removidos e ter seus papéis alterados. Cada cartão pode ter múltiplos membros atribuídos como responsáveis.

## Atores

- **Administrador**: Criador/proprietário do quadro, pode gerenciar membros e papéis
- **Editor**: Membro que pode criar/editar cartões, comentar e atribuir outros membros
- **Visualizador**: Membro que pode visualizar quadro e cartões (read-only)
- **Sistema**: Persiste membros, papéis, permissões e atribuições

## Comportamento Esperado

### 1. Convidar Membro para Quadro

Admin deseja adicionar um novo membro ao quadro.

**Given**: Admin acessa quadro e abre opções de gerenciamento de membros  
**When**: Clica em "Convidar Membro" e insere email do novo usuário + seleciona papel (ex: Editor)  
**Then**:
- Convite é enviado para o email do usuário (ou link de convite é gerado)
- Usuário recebe notificação (email/link)
- Status do membro exibe como "Convite Pendente"
- Admin consegue visualizar na lista de membros
- Convite permanece válido por X dias (padrão: 7 dias)

### 2. Aceitar Convite

Usuário convidado acessa sistema e aceita convite.

**Given**: Usuário recebeu convite para quadro "Projeto XYZ"  
**When**: Clica no link do convite ou acessa quadro e aceita convite pendente  
**Then**:
- Convite é marcado como aceito
- Usuário vira membro ativo do quadro com papel atribuído (Editor, Visualizador, etc.)
- Status muda de "Convite Pendente" para "Ativo"
- Usuário consegue visualizar e acessar quadro conforme seu papel

### 3. Rejeitar ou Cancelar Convite

Usuário rejeita convite ou admin cancela convite enviado.

**Given**: Convite pendente não foi aceito  
**When**: Usuário clica "Rejeitar" OU admin clica "Cancelar Convite"  
**Then**:
- Convite é removido
- Usuário não é adicionado ao quadro
- Admin consegue enviar novo convite depois

### 4. Visualizar Lista de Membros

Admin visualiza todos os membros do quadro.

**Given**: Admin acessa página de gerenciamento de membros  
**When**: Página carrega  
**Then**:
- Lista exibe todos os membros com:
  - Nome/email
  - Papel (Admin, Editor, Visualizador)
  - Status (Ativo, Convite Pendente, Inativo)
  - Data de adição/convite
  - Opções: Editar papel, Remover, Reenviar convite
- Admin consegue filtrar por papel ou status
- Admin consegue pesquisar por nome/email

### 5. Mudar Papel de Membro

Admin altera papel de um membro existente.

**Given**: Membro "João" é Editor no quadro  
**When**: Admin abre opções do membro e muda papel para Visualizador  
**Then**:
- Papel é atualizado para Visualizador
- Membro imediatamente perde acesso a funcionalidades de edição
- Notificação é enviada ao membro informando mudança de papel
- Log registra mudança (quem alterou, quando)

### 6. Remover Membro do Quadro

Admin remove um membro do quadro.

**Given**: Membro "Maria" é Editor no quadro  
**When**: Admin clica "Remover" no membro Maria  
**Then**:
- Membro é removido e perde acesso ao quadro
- Qualquer atribuição de Maria em cartões é removida (cartão fica sem responsável ou reassignado)
- Notificação é enviada ao membro informando remoção
- Maria não consegue mais visualizar quadro ou seus cartões

### 7. Atribuir Membro a Cartão

Editor/Admin atribui um membro como responsável por um cartão.

**Given**: Cartão "Implementar login" está aberto, com lista de membros disponíveis  
**When**: Clica em "Atribuir a" e seleciona membro "João"  
**Then**:
- João é adicionado como responsável do cartão
- Cartão exibe João como responsável (ex: avatar, nome)
- Notificação é enviada para João informando atribuição
- Um cartão pode ter múltiplos responsáveis

### 8. Remover Atribuição de Cartão

Editor/responsável remove atribuição de um cartão.

**Given**: Cartão tem João e Maria como responsáveis  
**When**: Clica X em João  
**Then**:
- João é removido como responsável
- Maria continua responsável
- Notificação é enviada para João
- Cartão pode ficar sem responsáveis

### 9. Visualizar Atribuições no Cartão

Qualquer membro visualiza quem é responsável por um cartão.

**Given**: Cartão está aberto  
**When**: Usuário visualiza cartão  
**Then**:
- Exibe lista de responsáveis (avatares/nomes)
- Clicável para ver mais detalhes
- Se não houver responsáveis, exibe "Sem responsáveis" ou similar

### 10. Visualizador Acessa Quadro (Read-Only)

Visualizador abre quadro com permissões restritas.

**Given**: Usuário "Ana" é Visualizador do quadro  
**When**: Ana acessa quadro  
**Then**:
- Ana consegue visualizar: quadro, listas, cartões, descrições, comentários
- Ana NÃO consegue: criar cartões, editar cartões, deletar cartões, mudar papéis, convidar membros
- Botões de ação (editar, deletar, etc.) não aparecem ou são desabilitados
- Ana consegue visualizar responsáveis dos cartões

### 11. Papéis com Diferentes Permissões

Sistema respeita permissões de cada papel em todas operações.

**Given**: Quadro tem 3 membros com papéis diferentes (Admin, Editor, Visualizador)  
**When**: Cada um tenta executar operações  
**Then**:
- **Admin**: Pode tudo (gerenciar membros, convidar, editar cartões, deletar, atribuir)
- **Editor**: Pode criar/editar cartões, atribuir membros, comentar; NÃO pode gerenciar membros
- **Visualizador**: Pode visualizar tudo; NÃO pode editar, criar, deletar

### 12. Papéis e Cascata de Permissões

Membro é atribuído a um cartão apenas se é membro ativo do quadro.

**Given**: Cartão precisa de um responsável  
**When**: Lista de atribuição é exibida  
**Then**:
- Apenas membros ATIVOS aparecem na lista
- Membros com "Convite Pendente" não aparecem
- Membros removidos são automaticamente desatribuídos dos cartões

## Regras de Negócio

1. **Administrador Necessário**: Quadro sempre tem pelo menos 1 administrador (criador)
2. **Convite por Email**: Convites são enviados por email com link/código de aceitação
3. **Papéis Fixos**: Sistema define papéis (Admin, Editor, Visualizador) - não customizáveis v1
4. **Permissões Hierárquicas**: Admin > Editor > Visualizador
5. **Atribuição Múltipla**: Um cartão pode ter múltiplos responsáveis
6. **Membro Ativo Required**: Só membros ativos podem ser atribuídos a cartões
7. **Remoção com Cascata**: Remover membro remove suas atribuições em cartões
8. **Notificações**: Mudanças de papel, convites, atribuições disparam notificações (v1: email ou log)
9. **Sem Auto-aceitar**: Convites sempre requerem aceitação explícita do usuário
10. **Um Papel por Membro**: Cada membro tem exatamente 1 papel no quadro

## Restrições

- **Convite Válido**: Convites expiram após X dias (padrão: 7) sem aceitação
- **Email Único por Quadro**: Não pode convidar mesmo email 2x; convite anterior deve ser cancelado
- **Sem Duplicação de Responsáveis**: Um membro aparece 1x na lista de responsáveis de um cartão
- **Visualizador Read-Only**: Nenhuma ação de escrita (sem exceção)
- **Admin Sempre Acesso Total**: Admin não pode ser restrito (mesmo se papel mudar)
- **Papéis Pré-definidos**: Editor, Visualizador, Admin são os únicos (sem custom roles v1)
- **Sem Convite para Self**: Um membro não pode convidar a si mesmo
- **Sem Downgrade Único Admin**: Não é permitido downgradeUnique admin se é único

## Casos de Borda e Condições de Erro

### Convites

- Email inválido: Validação rejeita formato inválido (erro: "Email inválido")
- Email já convidado: Erro 409 Conflict (erro: "Este email já possui um convite pendente")
- Email de membro removido: Pode ser reinvitado
- Convite expirado: Após X dias, convite é automaticamente invalidado
- Aceitar convite expirado: Erro 410 Gone (erro: "Convite expirado")

### Operações de Membro

- Remover último Admin: Erro 400 Bad Request (erro: "Quadro deve ter pelo menos 1 Admin")
- Editar papel de não-existent membro: Erro 404 Not Found
- Membro tenta alterar seu próprio papel: Erro 403 Forbidden (apenas admin pode)
- Não-autorizado tenta convidar: Erro 403 Forbidden

### Atribuições

- Atribuir membro inativo: Erro 400 Bad Request (erro: "Membro não está ativo")
- Atribuir membro não-membro: Erro 404 Not Found
- Remover atribuição de membro não-atribuído: Erro 404 Not Found
- Atribuir a cartão não-existent: Erro 404 Not Found

### Permissões

- Visualizador tenta editar cartão: Erro 403 Forbidden
- Visualizador tenta convidar membro: Erro 403 Forbidden
- Editor tenta gerenciar membros: Erro 403 Forbidden
- Não-membro tenta acessar quadro: Erro 403 Forbidden ou redireciona para login

### Autenticação

- Não-autenticado tenta acessar quadro: Erro 401 Unauthorized (redireciona para /login)
- Token expirado: Erro 401 Unauthorized

### Concorrência

- Dois admins alterarem papel simultaneamente: Transação garante consistência (last-write-wins)
- Admin A remove membro enquanto Admin B atribui a cartão: Erro (membro não mais existe)
- Remover membro enquanto membro edita cartão: Cartão continua edível, mas membro perde acesso no próximo refresh

## Dados Afetados

### Criados

- **BoardMember** (relação usuário-quadro)
  - id
  - board_id (FK)
  - user_id (FK)
  - role (enum: ADMIN, EDITOR, VIEWER)
  - status (enum: ACTIVE, INVITE_PENDING, REMOVED)
  - invited_at
  - accepted_at
  - created_at
  - updated_at

- **CardAssignment** (membro atribuído a cartão)
  - id
  - card_id (FK)
  - board_member_id (FK)
  - assigned_at
  - created_at

- **Invitation** (convites temporários)
  - id
  - board_id (FK)
  - email
  - role (papel convidado)
  - token (link único)
  - expires_at
  - created_at
  - accepted_at (null se pendente)

### Atualizados

- **User**
  - Opcionalmente: last_board_access (denormalização, v2)

- **Card**
  - updated_at (ao atribuir/desatribuir membro)

### Preservados

- Dados do quadro (título, descrição)
- Dados do cartão (conteúdo, histórico)
- Autenticação do usuário

### Deletados

- **CardAssignment** (ao remover membro do quadro)
- **BoardMember** (ao remover membro)
- **Invitation** (ao expirar ou cancelar)

## Respostas do Sistema

### Convidar Membro - Sucesso

- 201 Created
- Response: `{ id: "uuid", email: "...", role: "EDITOR", status: "INVITE_PENDING", token: "...", expires_at: "..." }`

### Aceitar Convite - Sucesso

- 200 OK
- Response: `{ board_id: "uuid", user_id: "uuid", role: "EDITOR", status: "ACTIVE" }`

### Listar Membros - Sucesso

- 200 OK
- Response:
```json
{
  "members": [
    { "id": "uuid", "email": "admin@...", "role": "ADMIN", "status": "ACTIVE", "joined_at": "..." },
    { "id": "uuid", "email": "editor@...", "role": "EDITOR", "status": "ACTIVE", "joined_at": "..." }
  ],
  "invitations": [
    { "id": "uuid", "email": "invited@...", "role": "EDITOR", "status": "INVITE_PENDING", "expires_at": "..." }
  ]
}
```

### Mudar Papel - Sucesso

- 200 OK
- Response: `{ id: "uuid", role: "VIEWER", updated_at: "..." }`

### Remover Membro - Sucesso

- 204 No Content

### Atribuir a Cartão - Sucesso

- 201 Created
- Response: `{ id: "uuid", card_id: "uuid", member_id: "uuid", assigned_at: "..." }`

### Remover Atribuição - Sucesso

- 204 No Content

### Erro: Email Inválido

- 400 Bad Request
- `{ "error": "Email inválido" }`

### Erro: Email Já Convidado

- 409 Conflict
- `{ "error": "Este email já possui um convite pendente" }`

### Erro: Único Admin Restante

- 400 Bad Request
- `{ "error": "Quadro deve ter pelo menos 1 Admin" }`

### Erro: Não Autorizado

- 403 Forbidden
- `{ "error": "Você não tem permissão para executar esta ação" }`

### Erro: Não Autenticado

- 401 Unauthorized
- Redireciona para /login

### Erro: Convite Expirado

- 410 Gone
- `{ "error": "Convite expirado" }`

## Fluxos Principais

### Fluxo 1: Convidar e Aceitar

```
Admin clica "Gerenciar Membros"
  ↓
Clica "Convidar Novo Membro"
  ↓
Insere email "joao@example.com" + seleciona papel "Editor"
  ↓
Sistema envia email com link/código
  ↓
João recebe email e clica link
  ↓
Sistema exibe página de aceitação (ou login se novo)
  ↓
João clica "Aceitar Convite"
  ↓
João vira membro ACTIVE com papel EDITOR
  ↓
João consegue acessar quadro
```

### Fluxo 2: Atribuir Responsável a Cartão

```
Editor abre cartão "Implementar Login"
  ↓
Clica "Atribuir a"
  ↓
Lista exibe membros ACTIVE (Admin, Editor, Visualizador)
  ↓
Editor seleciona "João"
  ↓
João é adicionado como responsável
  ↓
Cartão exibe João como responsável
  ↓
João recebe notificação
```

### Fluxo 3: Mudar Papel de Membro

```
Admin abre "Gerenciar Membros"
  ↓
Vê "João" (Editor)
  ↓
Clica "Editar Papel"
  ↓
Muda de "Editor" para "Visualizador"
  ↓
João imediatamente perde acesso de edição
  ↓
João recebe notificação de mudança
  ↓
Próximo refresh de João mostra quadro em read-only
```

### Fluxo 4: Remover Membro

```
Admin clica "Remover" em um membro
  ↓
Confirma remoção
  ↓
Membro é deletado
  ↓
Todas as atribuições do membro em cartões são removidas
  ↓
Membro perde acesso ao quadro
  ↓
Notificação é enviada
```

## Critérios de Aceite Resumidos

- [ ] C1: Convidar membro via email
- [ ] C2: Membro aceita convite
- [ ] C3: Membro rejeita/cancela convite
- [ ] C4: Visualizar lista de membros e convites
- [ ] C5: Mudar papel de membro ativo
- [ ] C6: Remover membro
- [ ] C7: Atribuir membro a cartão
- [ ] C8: Remover atribuição de cartão
- [ ] C9: Visualizador tem acesso read-only
- [ ] C10: Editor não consegue gerenciar membros
- [ ] C11: Admin tem acesso total
- [ ] C12: Convites expiram após X dias
- [ ] C13: Validação: email inválido rejeitado
- [ ] C14: Validação: email já convidado rejeitado
- [ ] C15: Erro: não consegue remover último admin
- [ ] C16: Membro inativo não aparece em atribuições
- [ ] C17: Remover membro remove suas atribuições
- [ ] C18: Notificações de convite/mudança/atribuição (v1: log ou email)
- [ ] C19: Não-autenticado não consegue acessar quadro
- [ ] C20: Permissões são verificadas em cada operação

---

## Dependências

- **RF01 (Autenticação)**: Valida se usuário está autenticado
- **RF02 (Quadros)**: Quadro é entidade pai de membros
- **RF04 (Cartões)**: Cards podem ter membros atribuídos
- **RF05 (Cascade Delete)**: Remover board remove membros (cascata)

---

## Roadmap Futuro

- **v2**: Custom roles e permissões granulares
- **v2**: Grupos de membros
- **v2**: Convites por link reutilizável
- **v2**: Histórico de atividades por membro
- **v2**: Notificações em tempo real (vs. email)
- **v2**: Integração com SSO/LDAP
- **v2**: Two-factor authentication
- **v2**: Auditoria detalhada de ações por membro
- **v2**: Restrições por lista/coluna
