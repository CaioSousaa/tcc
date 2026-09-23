# RF02: Tarefas de Implementação - Gerenciamento de Quadros

## Backend

### Fase 1: Database Setup
- [x] T01: Criar migration para tabela `boards` (id, user_id, name, created_at, updated_at, unique constraint)
- [x] T02: Criar migration para tabela `columns` (id, board_id, name, position, created_at)
- [x] T03: Criar índices (user_id, (user_id, name), created_at DESC, board_id)

### Fase 2: Entities e TypeORM
- [x] T04: Criar Entity `Board`
- [x] T05: Criar Entity `BoardColumn` (renomeado para evitar conflito com @Column)
- [x] T06: Configurar relacionamentos (1 Board → N Columns, 1 User → N Boards)

### Fase 3: Repositories
- [x] T07: Criar `BoardRepository` (insert, findById, findByUser, update, delete, checkNameDuplicate)
- [x] T08: Criar `ColumnRepository` (insertMany, findByBoard, deleteByBoard)

### Fase 4: Services
- [x] T09: Criar `ValidationService` para Board (validateBoardName, sanitizeBoardName)
- [x] T10: Criar `BoardService` (createBoard, getBoardsList, getBoard, updateBoard, deleteBoard)

### Fase 5: Middleware
- [x] T11: Criar middleware `validateBoardAccess` (verifica user_id do board)

### Fase 6: Endpoints
- [x] T12: POST `/api/boards` (criar board)
- [x] T13: GET `/api/boards` (listar boards do user)
- [x] T14: GET `/api/boards/:boardId` (detalhes board)
- [x] T15: PUT `/api/boards/:boardId` (editar nome)
- [x] T16: DELETE `/api/boards/:boardId` (deletar board)

### Fase 7: Testes Backend
- [x] T17: Testes unitários `ValidationService` (name validation)
- [ ] T18: Testes unitários `BoardService` (create, read, update, delete)
- [ ] T19: Testes integração endpoints

## Frontend

### Fase 1: Hooks
- [ ] T20: Criar hook `useBoards()` (GET /api/boards)
- [ ] T21: Criar hook `useCreateBoard()` (POST /api/boards)
- [ ] T22: Criar hook `useBoard()` (GET /api/boards/:id)
- [ ] T23: Criar hook `useUpdateBoard()` (PUT /api/boards/:id)
- [ ] T24: Criar hook `useDeleteBoard()` (DELETE /api/boards/:id)

### Fase 2: Componentes
- [ ] T25: Criar componente `BoardsList` (exibe lista boards)
- [ ] T26: Criar componente `BoardForm` (form criar board)
- [ ] T27: Criar componente `BoardHeader` (nome + edit + delete)
- [ ] T28: Criar componente `BoardKanban` (exibe colunas)
- [ ] T29: Criar componente `ProtectedBoardRoute` (wrapper)

### Fase 3: Páginas
- [ ] T30: Criar página `/boards` (lista boards)
- [ ] T31: Criar página `/boards/new` (criar board)
- [ ] T32: Criar página `/boards/:id` (visualizar board)

### Fase 4: Integração Layout
- [ ] T33: Integrar navbar com link `/boards`

## Validação

- [ ] T34: Testar criar board com nome válido (201)
- [ ] T35: Testar criar board com nome vazio (400)
- [ ] T36: Testar criar board com nome duplicado (409)
- [ ] T37: Testar listar boards (200 com lista)
- [ ] T38: Testar listar boards sem nenhum (200 com empty)
- [ ] T39: Testar acessar board válido (200 com colunas)
- [ ] T40: Testar acessar board não existe (404)
- [ ] T41: Testar acessar board de outro user (401)
- [ ] T42: Testar editar nome board (200)
- [ ] T43: Testar editar com nome duplicado (409)
- [ ] T44: Testar deletar board (204)
- [ ] T45: Testar deletar sem confirmação (bloqueado frontend)
- [ ] T46: Testar board deletado desaparece de lista

---

## Status Atual

**Backend: 16/19 tarefas implementadas (84%)**

### Concluído
- Migrations: Boards + Columns tables com índices + constraints
- Entities: Board, BoardColumn com relacionamentos cascade
- Repositories: BoardRepository (5 métodos) + ColumnRepository (3 métodos)
- Services: BoardService (5 métodos) + ValidationService (2 métodos board-specific)
- Middleware: validateBoardAccess (autorização user-level)
- Endpoints: 5 endpoints REST (POST, GET, GET/:id, PUT, DELETE)
- Testes: ValidationService 8 testes PASSAM

### Build Status
- ✅ Backend TypeScript: 0 erros, 0 warnings
- ✅ Jest: 2 test suites, 19 testes PASSED

### Pendente
- Frontend: Hooks, Componentes, Páginas (T20-T32)
- Testes: BoardService + integração (T18-T19, opcional para v1)
- Validação: E2E via manual ou teste integração
