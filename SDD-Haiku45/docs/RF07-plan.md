# RF07: Plano Técnico - Gerenciamento de Membros e Papéis com Atribuição a Cards

## 1. Stack Tecnológico

Mesmo stack RF01-RF06, sem novas dependências:

### Backend
- **ORM**: TypeORM (Entity relationships, FK constraints, cascata)
- **Banco**: PostgreSQL (transações, RBAC via application-level)
- **Validação**: Class-validator
- **Framework**: Express.js
- **Email**: NodeMailer ou sendgrid (para convites)
- **JWT/Token**: jsonwebtoken (para convites de email)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **HTTP**: Fetch API com credentials
- **UI**: Tailwind CSS
- **State**: React local state + refetch
- **Auth Context**: Fornece user + role atual

---

## 2. Arquitetura de Componentes

### Backend (Novos Componentes)

#### 2.1 Entities (Novas)

**BoardMember Entity**
```
- id: UUID (PK)
- board_id: UUID (FK → Board, ON DELETE CASCADE)
- user_id: UUID (FK → User, ON DELETE CASCADE)
- role: ENUM (ADMIN, EDITOR, VIEWER)
- status: ENUM (ACTIVE, INVITE_PENDING, REMOVED)
- invited_at: Timestamp
- accepted_at: Timestamp (null se INVITE_PENDING)
- created_at: Timestamp
- updated_at: Timestamp

Constraints:
- UNIQUE(board_id, user_id) para membros ativos
- Para convites pendentes: user_id NULL, email armazenado em Invitation
```

**CardAssignment Entity**
```
- id: UUID (PK)
- card_id: UUID (FK → Card, ON DELETE CASCADE)
- board_member_id: UUID (FK → BoardMember, ON DELETE CASCADE)
- assigned_at: Timestamp
- created_at: Timestamp

Constraints:
- UNIQUE(card_id, board_member_id) para evitar duplicatas
```

**Invitation Entity**
```
- id: UUID (PK)
- board_id: UUID (FK → Board, ON DELETE CASCADE)
- email: VARCHAR (email para convidar)
- role: ENUM (ADMIN, EDITOR, VIEWER)
- token: VARCHAR (hash único para link de convite)
- expires_at: Timestamp (7 dias por padrão)
- created_at: Timestamp
- accepted_at: Timestamp (null se pendente)

Constraints:
- UNIQUE(board_id, email) para evitar múltiplos convites
```

#### 2.2 Repositories (Novas)

**BoardMemberRepository**
- `findByBoardId(boardId)`: GET todos membros do quadro
- `findByBoardIdAndRole(boardId, role)`: Filtrar por papel
- `insert(member)`: Criar novo membro
- `update(memberId, data)`: Atualizar papel/status
- `delete(memberId)`: Remover membro
- `findAdminCount(boardId)`: Contar admins (para validação)

**CardAssignmentRepository**
- `findByCardId(cardId)`: GET responsáveis do cartão
- `insert(assignment)`: Atribuir membro
- `delete(assignmentId)`: Remover atribuição
- `deleteByBoardMemberId(memberId)`: Remover todas atribuições quando membro é deletado

**InvitationRepository**
- `insert(invitation)`: Criar convite
- `findByToken(token)`: GET convite pelo token único
- `findActiveByBoardAndEmail(boardId, email)`: Checar se já convidado
- `update(invitationId, data)`: Marcar como aceito
- `deleteExpired()`: Limpar convites expirados

#### 2.3 Services (Novas)

**MemberService**
- `inviteMember(boardId, email, role, userId)`: Criar convite + enviar email
  - Validação: user_id === board.owner (Admin)
  - Validação: email válido
  - Validação: email não já convidado
  - Gera token único
  - Envia email com link
  - Retorna invitation
  
- `acceptInvitation(token)`: Aceitar convite
  - Validação: token válido e não expirado
  - Cria BoardMember com status ACTIVE
  - Marca Invitation como aceito
  - Se usuário não existe, pode ser criado (v1) ou erro (v2)

- `getMembersOfBoard(boardId, userId)`: GET membros + convites
  - Validação: user_id é membro do board
  - Retorna membros ACTIVE + convites INVITE_PENDING

- `changeMemberRole(boardId, memberId, newRole, userId)`: Alterar papel
  - Validação: user_id === board.owner (Admin)
  - Validação: não remover último admin
  - UPDATE BoardMember SET role = newRole
  - Notifica membro
  - Retorna membro atualizado

- `removeMember(boardId, memberId, userId)`: Remover membro
  - Validação: user_id === board.owner (Admin)
  - Validação: não remover se é único admin
  - DELETE BoardMember (cascata remove CardAssignments)
  - Notifica membro
  - Retorna sucesso

- `getMemberRole(boardId, userId)`: GET papel do user no board
  - Retorna role enum ou null se não é membro

#### 2.4 Services (Modificadas)

**CardService (Expandido)**
- Ao criar/editar cartão: Verificar permissão (EDITOR+)
- Ao deletar cartão: Cascata remove CardAssignments via FK
- Novo método: `getResponsibles(cardId)`: GET lista de responsáveis

#### 2.5 Routes (Novas)

```http
-- Gerenciamento de Membros (Admin apenas)
POST   /api/boards/:boardId/members/invite
GET    /api/boards/:boardId/members
PUT    /api/boards/:boardId/members/:memberId/role
DELETE /api/boards/:boardId/members/:memberId

-- Convites (Público, sem auth)
GET    /api/invitations/:token
POST   /api/invitations/:token/accept
POST   /api/invitations/:token/reject

-- Atribuições (Editor+)
POST   /api/boards/:boardId/cards/:cardId/assignees
DELETE /api/boards/:boardId/cards/:cardId/assignees/:assignmentId

-- Validação de Permissão (Internal, middleware)
GET    /api/boards/:boardId/members/me/role (para refresh de permissões)
```

#### 2.6 Middleware (Novo)

**requireRole(allowedRoles: Role[])**
- Middleware que valida se usuário tem papel permitido
- Verifica BoardMember.role
- Retorna 403 se não autorizado
- Usado em rotas protegidas

**optionalAuth**
- Middleware que carrega user se autenticado
- Não falha se não autenticado (para invites públicos)

#### 2.7 Controladores (Novos)

**MemberController**
- POST /invite: Chamar MemberService.inviteMember
- GET /list: Chamar MemberService.getMembersOfBoard
- PUT /:memberId/role: Chamar MemberService.changeMemberRole
- DELETE /:memberId: Chamar MemberService.removeMember

**InvitationController**
- GET /:token: Verificar validade do convite
- POST /:token/accept: Chamar MemberService.acceptInvitation
- POST /:token/reject: Chamar InvitationRepository.delete

**AssignmentController**
- POST /cards/:cardId/assignees: Criar CardAssignment
- DELETE /assignees/:assignmentId: Deletar CardAssignment

### Frontend (Novos Componentes)

#### 2.8 Componentes Novos

**MembersPanel.tsx**
- Renderiza lista de membros + convites (Admin apenas)
- Exibe papel, status, ações (editar papel, remover, reenviar convite)
- Modal para convidar novo membro
- Filtro por papel/status

**MemberRow.tsx**
- Componente individual de um membro
- Avatar, nome, papel, status
- Botões: Editar papel, Remover, Reenviar convite

**InvitationAcceptPage.tsx**
- Página pública para aceitar convite
- Recebe token via URL
- Exibe detalhes (quadro, papel)
- Botões: Aceitar, Rejeitar

**AssigneeSelector.tsx**
- Dropdown de membros para atribuir a cartão
- Filtra por membros ACTIVE
- Permite múltiplas seleções
- Mostra avatares

**AssigneeList.tsx**
- Exibe responsáveis de um cartão
- Cada responsável é removível

#### 2.9 Hooks (Novos)

**useMembers(boardId)**
- Retorna: { members, invitations, loading, error, refetch }
- GET /api/boards/:boardId/members

**useMemberManagement(boardId)**
- Retorna: { invite, changeRole, removeMember, loading, error }
- POST /invite, PUT /role, DELETE /member

**useAssignees(cardId, boardId)**
- Retorna: { assignees, addAssignee, removeAssignee, loading, error }
- GET /card/assignees, POST/DELETE assignments

**useMyRole(boardId)**
- Retorna: { role, loading } para validar permissões no frontend
- GET /me/role

#### 2.10 Páginas (Modificadas)

**/boards/[id]/members** (Nova)
- Admin dashboard para gerenciar membros
- Renderiza MembersPanel

**/boards/[id]/cards/[cardId]** (Modificado)
- Adiciona AssigneeList e AssigneeSelector
- Verifica permissões (Editor+) para atribuir

#### 2.11 Auth Context (Expandido)

**AuthContext**
- Já fornece user + isAuthenticated
- Expandir com: `userRole` (papel no board atual)
- Método: `hasRole(role)` para verificar permissões locais

---

## 3. Modelos de Dados

### Schema: Novas Tabelas

```sql
-- Membros do quadro
CREATE TABLE board_members (
  id UUID PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role ENUM('ADMIN', 'EDITOR', 'VIEWER') NOT NULL,
  status ENUM('ACTIVE', 'INVITE_PENDING', 'REMOVED') NOT NULL,
  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(board_id, user_id)
);

-- Atribuições (quem é responsável por cada cartão)
CREATE TABLE card_assignments (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  board_member_id UUID NOT NULL REFERENCES board_members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(card_id, board_member_id)
);

-- Convites pendentes
CREATE TABLE invitations (
  id UUID PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'EDITOR', 'VIEWER') NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP,
  UNIQUE(board_id, email)
);

-- Índices
CREATE INDEX idx_board_members_board_id ON board_members(board_id);
CREATE INDEX idx_board_members_user_id ON board_members(user_id);
CREATE INDEX idx_board_members_status ON board_members(status);
CREATE INDEX idx_card_assignments_card_id ON card_assignments(card_id);
CREATE INDEX idx_card_assignments_board_member_id ON card_assignments(board_member_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_board_id_email ON invitations(board_id, email);
```

### Modificações em Tabelas Existentes

**boards table**
- Sem mudanças obrigatórias
- Já tem user_id (criador = primeiro admin)

**users table**
- Sem mudanças obrigatórias
- Já tem email, autenticação

**cards table**
- updated_at já existe
- Sem campo de "owner" obrigatório (responsáveis são em CardAssignment)

---

## 4. Interfaces de API

### Convidar Membro

```http
POST /api/boards/:boardId/members/invite
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "email": "joao@example.com",
  "role": "EDITOR"
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "email": "joao@example.com",
  "role": "EDITOR",
  "status": "INVITE_PENDING",
  "token": "token_unico_para_link",
  "expires_at": "2026-09-21T12:00:00Z"
}
```

### Listar Membros

```http
GET /api/boards/:boardId/members
Authorization: Bearer <token>
```

**Response: 200 OK**
```json
{
  "members": [
    { "id": "uuid", "user_id": "uuid", "email": "admin@...", "role": "ADMIN", "status": "ACTIVE", "joined_at": "..." },
    { "id": "uuid", "user_id": "uuid", "email": "editor@...", "role": "EDITOR", "status": "ACTIVE", "joined_at": "..." }
  ],
  "invitations": [
    { "id": "uuid", "email": "invited@...", "role": "EDITOR", "status": "INVITE_PENDING", "expires_at": "..." }
  ]
}
```

### Mudar Papel de Membro

```http
PUT /api/boards/:boardId/members/:memberId/role
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "role": "VIEWER"
}
```

**Response: 200 OK**
```json
{
  "id": "uuid",
  "role": "VIEWER",
  "updated_at": "..."
}
```

### Remover Membro

```http
DELETE /api/boards/:boardId/members/:memberId
Authorization: Bearer <token>
```

**Response: 204 No Content**

### Aceitar Convite

```http
POST /api/invitations/:token/accept
```

**Request Body** (se usuário novo):
```json
{
  "email": "joao@example.com",
  "password": "...",
  "name": "João"
}
```

**Response: 200 OK**
```json
{
  "board_id": "uuid",
  "user_id": "uuid",
  "role": "EDITOR",
  "status": "ACTIVE"
}
```

### Atribuir Membro a Cartão

```http
POST /api/boards/:boardId/cards/:cardId/assignees
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "board_member_id": "uuid"
}
```

**Response: 201 Created**
```json
{
  "id": "uuid",
  "card_id": "uuid",
  "board_member_id": "uuid",
  "assigned_at": "..."
}
```

### Remover Atribuição

```http
DELETE /api/boards/:boardId/cards/:cardId/assignees/:assignmentId
Authorization: Bearer <token>
```

**Response: 204 No Content**

### Erros

- 400 Bad Request: Email inválido, último admin, membro inativo
- 401 Unauthorized: Não autenticado
- 403 Forbidden: Não autorizado (não é admin para gerenciar membros)
- 404 Not Found: Membro/cartão não existe
- 409 Conflict: Email já convidado
- 410 Gone: Convite expirado

---

## 5. Fluxos de Integração

### Fluxo 1: Convidar Membro

```
Frontend: Admin clica "Convidar Membro"
  ↓
Frontend: POST /api/boards/:boardId/members/invite
  Body: { email: "joao@...", role: "EDITOR" }
  ↓
Backend: MemberService.inviteMember
  - Valida: user_id === board.owner
  - Valida: email válido, não já convidado
  - Cria Invitation com token + expires_at
  - Envia email: "Você foi convidado para [board_name]"
  - Email contém: link com token
  ↓
Response: 201 Created
  ↓
Frontend: Exibe "Convite enviado"
  ↓
Usuário recebe email
  ↓
Clica link: /join?token=XXX
  ↓
Frontend: GET /api/invitations/:token (valida)
  ↓
Se novo user: Exibe form de registro
Se user existe: Login requerido
  ↓
POST /api/invitations/:token/accept
  ↓
Backend: MemberService.acceptInvitation
  - Valida: token válido, não expirado
  - Cria BoardMember(user_id, board_id, role, status=ACTIVE)
  - UPDATE Invitation SET accepted_at=NOW()
  ↓
Response: 200 OK
  ↓
Frontend: Redireciona para quadro
```

### Fluxo 2: Mudar Papel de Membro

```
Frontend: Admin abre "Gerenciar Membros"
  ↓
Clica "Editar Papel" em membro
  ↓
Seleciona novo papel (ex: VIEWER)
  ↓
Frontend: PUT /api/boards/:boardId/members/:memberId/role
  Body: { role: "VIEWER" }
  ↓
Backend: MemberService.changeMemberRole
  - Valida: user_id === board.owner
  - Valida: não remover último admin
  - UPDATE board_members SET role = VIEWER
  - Envia notificação (email/log)
  ↓
Response: 200 OK
  ↓
Frontend: Atualiza lista
  ↓
Se membro está online: Próximo refresh vê quadro em read-only
```

### Fluxo 3: Atribuir Responsável a Cartão

```
Frontend: Editor abre cartão
  ↓
Clica "Atribuir a"
  ↓
GET /api/boards/:boardId/members/active-only
  ↓
Frontend: Exibe dropdown com membros ACTIVE
  ↓
Editor seleciona membro "João"
  ↓
Frontend: POST /api/boards/:boardId/cards/:cardId/assignees
  Body: { board_member_id: "uuid" }
  ↓
Backend: CardAssignmentService.addAssignment
  - Valida: board_member_id is ACTIVE
  - Valida: user_id has EDITOR+ role
  - INSERT CardAssignment
  - Notifica João
  ↓
Response: 201 Created
  ↓
Frontend: João aparece na lista de responsáveis
```

### Fluxo 4: Remover Membro (Cascata)

```
Frontend: Admin clica "Remover" em membro
  ↓
Confirma remoção
  ↓
Frontend: DELETE /api/boards/:boardId/members/:memberId
  ↓
Backend: MemberService.removeMember
  - Valida: user_id === board.owner
  - Valida: não último admin
  - DELETE board_members WHERE id = memberId
  - Cascata: DELETE card_assignments WHERE board_member_id = memberId
  - Notifica membro
  ↓
Response: 204 No Content
  ↓
Frontend: Membro desaparece da lista
  ↓
Cartões que tinham este membro ficam sem este responsável
  ↓
Se membro está online: Acesso é revogado no próximo refresh
```

---

## 6. Requisitos Não-Funcionais

### Segurança

| Requisito | Implementação | Notas |
|-----------|---------------|-------|
| Autenticação | requireAuth middleware (existente) | Sem mudança |
| Autorização | requireRole middleware (RBAC) | Verificar em cada rota |
| Role Validation | BoardMember.role verificado | Não confiar em JWT role |
| Token Convite | Hash único, válido por X dias | Não reutilizável |
| SQL Injection | TypeORM parameterized queries | FK CASCADE DB-level |
| Email Validation | Class-validator isEmail | Rejeitar formato inválido |

### Performance

| Requisito | Implementação | Notas |
|-----------|---------------|---|
| Get members | Single query com JOIN | Índice em board_id |
| Add member | INSERT 1 row | Checar unique constraint |
| Get assignees | SELECT CardAssignments + JOIN | Índice em card_id |
| List my boards | SELECT boards WHERE user_id | Usuário consegue listar seus boards |
| Invite email | Async job (queue) | Não bloqueia request |
| Cleanup expirado | Cron job (nightly) | DELETE WHERE expires_at < NOW() |

### Escalabilidade

| Requisito | Implementação | Notas |
|-----------|---------------|---|
| Stateless | Cada request valida role | Sem cache de permissão |
| Transação | DB constraints + indexes | Atomicidade garantida |
| Cascata DB | FK ON DELETE CASCADE | Não application-level |
| No N+1 | JOIN em queries | Single query para membros |

### Confiabilidade

| Requisito | Implementação | Notas |
|-----------|---------------|---|
| Atomicidade | Transação DB | Tudo ou nada |
| Consistência | FK constraints | Sem board_members órfãos |
| Cascata delete | FK ON DELETE CASCADE | Remove assignments com membro |
| Error Handling | 400/401/403/404/409/410 | Específicos por erro |
| Notificações | Email ou log | v1: sem timeout, async |

---

## 7. Restrições Implementação

1. **Role Obrigatório**: Cada membro tem exatamente 1 papel
2. **Admin Necessário**: Quadro sempre tem ≥1 admin
3. **Convite com Token**: Email com link único, não reutilizável
4. **Expiração**: Convites expiram em 7 dias (configurable)
5. **Email Único por Quadro**: Não pode convidar 2x mesmo email
6. **Cascata**: Remover membro remove suas atribuições
7. **Membro Ativo Requerido**: Só membros ACTIVE em atribuições
8. **Validação Prévia**: Rejeitar entrada inválida antes de INSERT
9. **Sem Duplicação**: Um membro aparece 1x em CardAssignments
10. **Delete Físico**: DELETE, não soft-delete
11. **Permissões por Rota**: Cada endpoint verifica role
12. **Token Seguro**: Hash de 32+ chars, armazenar hash (não plain)

---

## 8. Mudanças Específicas no Código

### Backend

#### Novos Arquivos
- `src/entities/BoardMember.ts`
- `src/entities/CardAssignment.ts`
- `src/entities/Invitation.ts`
- `src/repositories/BoardMemberRepository.ts`
- `src/repositories/CardAssignmentRepository.ts`
- `src/repositories/InvitationRepository.ts`
- `src/services/MemberService.ts`
- `src/controllers/MemberController.ts`
- `src/controllers/InvitationController.ts`
- `src/controllers/AssignmentController.ts`
- `src/routes/members.routes.ts`
- `src/routes/invitations.routes.ts`
- `src/routes/assignments.routes.ts`
- `src/middleware/requireRole.ts`
- `src/utils/tokenGenerator.ts` (para convites)
- `src/services/EmailService.ts` (expandido para convites)

#### Modificados
- `src/routes/index.ts`: Registrar rotas de membros, convites, assignments
- `src/services/CardService.ts`: Adicionar cascata + validação de permissão
- `src/types/auth.ts`: Expandir user object com role
- `src/middleware/auth.ts`: Carregar board_member info no context

#### Dependências
- NodeMailer (já deve estar) ou sendgrid para email
- crypto (nativo) para token generation

### Frontend

#### Novos Arquivos
- `src/components/MembersPanel.tsx`
- `src/components/MemberRow.tsx`
- `src/components/InvitationAcceptPage.tsx`
- `src/components/AssigneeSelector.tsx`
- `src/components/AssigneeList.tsx`
- `src/hooks/useMembers.ts`
- `src/hooks/useMemberManagement.ts`
- `src/hooks/useAssignees.ts`
- `src/hooks/useMyRole.ts`
- `src/app/boards/[id]/members/page.tsx` (nova página)

#### Modificados
- `src/app/boards/[id]/cards/[cardId]/page.tsx`: Integrar AssigneeList/Selector
- `src/context/AuthContext.tsx`: Expandir com role + hasRole()
- `src/components/CardDetail.tsx`: Validar permissões para ações

#### Dependências
- Nenhuma nova

---

## 9. Dependências Entre RFs

### RF07 ← RF01 (Autenticação)
- Autenticação obrigatória para rotas protegidas

### RF07 ← RF02 (Quadros)
- BoardMember relaciona a quadro (FK)
- Quadro criador vira primeiro admin

### RF07 ← RF04 (Cartões)
- CardAssignment relaciona a cartão (FK)
- Responsáveis exibidos no cartão

### RF07 ← RF05 (Cascade Delete)
- Remover board remove membros + atribuições (cascata FK)
- Remover membro remove suas atribuições (cascata FK)

---

## 10. Casos de Teste Previstos

### Unitários

**MemberService**
- inviteMember: Email válido, não convidado, convite criado
- acceptInvitation: Token válido, membro criado, invitation marcada
- changeMemberRole: Role atualizado, não último admin, notificação enviada
- removeMember: Membro removido, atribuições cascata, não último admin
- getMemberRole: Retorna role correto ou null se não membro

**Validação**
- Email inválido rejeitado
- Email já convidado rejeitado
- Último admin não removível
- Membro inativo não pode ser atribuído

### Integração

- Convidar → Aceitar → Verificar ativo
- Mudar papel → Verificar permissões atualizadas
- Remover membro → Verificar cascata de atribuições
- Atribuir → Verificar no cartão

### E2E

- Admin convida editor
- Editor aceita convite
- Admin atribui editor a cartão
- Editor visualiza atribuição
- Viewer não consegue editar
- Admin remove editor → editor perde acesso

---

## 11. Pseudo-código Key Methods

```
MemberService.inviteMember(boardId, email, role, userId):
  1. Validate userId owns board (board.owner == userId)
  2. Validate email format
  3. Check if email already invited: SELECT FROM invitations WHERE board_id=X AND email=Y
  4. Generate unique token (crypto.randomBytes + hash)
  5. INSERT INTO invitations(board_id, email, role, token, expires_at)
  6. Send email with link: /join?token=TOKEN
  7. Return invitation

MemberService.acceptInvitation(token):
  1. SELECT FROM invitations WHERE token=X AND expires_at > NOW()
  2. If not found: Error 410 Gone
  3. If found but accepted: Error 409 Conflict
  4. If user_id is null: Create user (or error if no signup data)
  5. INSERT INTO board_members(board_id, user_id, role, status=ACTIVE)
  6. UPDATE invitations SET accepted_at=NOW()
  7. Return board_member

MemberService.changeMemberRole(boardId, memberId, newRole, userId):
  1. Validate userId === board.owner
  2. SELECT FROM board_members WHERE id=memberId
  3. If role=ADMIN AND newRole!=ADMIN:
     - Count admins: SELECT COUNT(*) WHERE board_id=X AND role=ADMIN
     - If count==1: Error 400 (último admin)
  4. UPDATE board_members SET role=newRole WHERE id=memberId
  5. Send notification
  6. Return updated member

MemberService.removeMember(boardId, memberId, userId):
  1. Validate userId === board.owner
  2. SELECT FROM board_members WHERE id=memberId
  3. If role=ADMIN:
     - Count admins: SELECT COUNT(*) WHERE board_id=X AND role=ADMIN
     - If count==1: Error 400 (último admin)
  4. DELETE FROM board_members WHERE id=memberId
  5. [Cascata: DELETE FROM card_assignments WHERE board_member_id=memberId]
  6. Send notification
  7. Return success

CardAssignmentService.addAssignment(cardId, boardMemberId, userId):
  1. Validate user has EDITOR+ role in board
  2. SELECT FROM board_members WHERE id=boardMemberId AND status=ACTIVE
  3. If not found: Error 400 (membro inativo)
  4. INSERT INTO card_assignments(card_id, board_member_id)
  5. Send notification to assigned member
  6. Return assignment
```

---

## Conclusão

**Implementação Focada**: RF07 adiciona 3 novas entities (BoardMember, CardAssignment, Invitation), 3 repositories, 1 service, 6 novos endpoints, 5 componentes frontend, 4 hooks.

**Stack Completo**: Reutiliza PostgreSQL + TypeORM + Express + Next.js, adiciona apenas email sender (já presente).

**Cascata Automática**: Remover membro remove atribuições via FK ON DELETE CASCADE.

**RBAC**: Role-based access control via middleware + validação em cada operação.

**Segurança**: Email validation, token único, permissões verificadas, sem confiar em JWT role.

**Performance**: Single queries com índices, async email, cascata DB-level.

**Escalabilidade**: Stateless requests, transações DB, sem N+1.
