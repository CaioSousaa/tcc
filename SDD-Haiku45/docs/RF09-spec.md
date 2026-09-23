# RF09: Comentários em Cards com Histórico

## Visão Geral

Usuários podem adicionar comentários a cartões para colaboração e discussão. Cada cartão possui uma thread de comentários onde membros do board podem deixar mensagens. Um histórico completo de comentários é mantido, exibindo quem comentou, quando, e o conteúdo de cada mensagem. Comentários são persistidos e visíveis a todos os membros do board que conseguem acessar o cartão.

## Atores

- **Membro Ativo**: Usuário autenticado com status ACTIVE em algum board (admin, editor, viewer)
- **Admin/Editor**: Pode criar, editar e deletar comentários próprios; pode deletar comentários de outros
- **Viewer**: Pode visualizar e criar comentários, mas não editar nem deletar
- **Sistema**: Persiste comentários, timestamps, histórico de edições
- **Board**: Contexto onde os comentários residem (cartão pertence a um board)

## Comportamento Esperado

### 1. Adicionar Comentário a um Cartão

Um membro quer deixar uma mensagem em um cartão para colaborar com o time.

**Given**: Usuário está autenticado e é membro ativo do board  
**When**: Abre um cartão e digita um comentário no campo "Adicionar comentário", clicando em "Enviar"  
**Then**:
- Comentário é criado e aparece imediatamente na thread
- Comentário exibe: nome do autor, timestamp, conteúdo
- Novo comentário aparece na ordem apropriada (mais recente ao final)
- Comentário fica persistido no banco de dados
- Todos os outros membros veem o comentário em tempo real (ou ao refrescar)

### 2. Visualizar Histórico de Comentários

Um usuário quer ver todas as conversas passadas sobre um cartão.

**Given**: Um cartão tem 5 comentários de diferentes membros  
**When**: Usuário abre o cartão  
**Then**:
- Todos os 5 comentários aparecem em ordem cronológica (mais antigo acima, mais recente abaixo)
- Cada comentário exibe: autor, data/hora, conteúdo
- Se comentário foi editado, exibe indicador "editado em HH:MM" ou similar
- Comentários são legíveis e formatados de forma clara
- Quantidade total de comentários é visível ("5 comentários")

### 3. Editar Comentário Próprio

Um membro quer corrigir ou atualizar um comentário que enviou.

**Given**: Usuário é autor de um comentário e é admin/editor  
**When**: Clica em "Editar" no seu próprio comentário, modifica o texto, clica "Salvar"  
**Then**:
- Comentário é atualizado com novo conteúdo
- Timestamp de criação não muda
- Indicador "editado em HH:MM" aparece ou é atualizado
- Novo conteúdo aparece imediatamente
- Histórico de versões não é exposto (apenas última versão visível)
- Outros membros veem comentário atualizado

### 4. Editar Comentário de Outro Usuário

Um admin/editor quer corrigir ou remover conteúdo inadequado de um comentário de outro membro.

**Given**: Usuário é admin/editor (não autor do comentário)  
**When**: Tenta clicar em "Editar" em um comentário de outro usuário  
**Then**:
- Botão "Editar" não aparece ou está desabilitado para comentários alheios
- Apenas o próprio comentário pode ser editado por quem o criou
- Admin/Editor pode DELETAR comentários de outros, mas não editar (ver C6)

### 5. Deletar Comentário Próprio

Um membro quer remover um comentário que enviou.

**Given**: Usuário é autor do comentário  
**When**: Clica em "Deletar" ou "×" no seu comentário, confirma remoção  
**Then**:
- Comentário é removido e não aparece mais na thread
- Espaço deixado pelo comentário desaparece (sem "deletado por X")
- Contagem total de comentários é atualizada
- Outros membros não veem mais o comentário

### 6. Deletar Comentário de Outro Usuário

Um admin/editor quer remover um comentário inapropriado de outro membro.

**Given**: Usuário é admin ou editor (não autor do comentário)  
**When**: Clica em "Deletar" em um comentário de outro usuário, confirma  
**Then**:
- Comentário é removido
- Não aparece mais na thread
- Todos veem a remoção
- Viewer não consegue deletar comentários (apenas ler)

### 7. Visualizar Cartão Vazio de Comentários

Um usuário abre um cartão novo que nenhum comentário foi adicionado.

**Given**: Cartão recém criado ou nunca teve comentários  
**When**: Usuário abre o cartão  
**Then**:
- Nenhum comentário aparece
- Mensagem "Nenhum comentário ainda" ou similar é exibida
- Campo "Adicionar comentário" está visível e pronto
- Contagem mostra "0 comentários"

### 8. Caracteres Especiais e Formatação

Um usuário quer adicionar um comentário com quebras de linha, emojis ou caracteres especiais.

**Given**: Usuário digita comentário com quebra de linha, emojis, ou caracteres especiais (ex: @user, #hashtag, <html>)  
**When**: Envia comentário  
**Then**:
- Quebras de linha são preservadas (shift+enter ou \n renderizado)
- Emojis aparecem corretamente
- Caracteres especiais são escapados (HTML tags não executam)
- Conteúdo é renderizado como texto, não como código ou markup
- Comprimento máximo é 1000 caracteres (ou similar prático)

### 9. Sincronização de Comentários Entre Usuários

Dois membros têm o mesmo cartão aberto e um adiciona um comentário.

**Given**: Membro A e Membro B têm cartão X aberto  
**When**: Membro A adiciona um comentário  
**Then**:
- Comentário aparece para Membro A imediatamente
- Membro B vê o comentário em tempo real (ou ao refrescar página)
- Sem necessidade de recarregar página (refetch automático ou WebSocket)
- Ordem de comentários permanece consistente para ambos

### 10. Edição de Comentário Sincronizada

Membro A edita um comentário que Membro B está visualizando.

**Given**: Comentário é visível para Membro B  
**When**: Membro A edita o comentário  
**Then**:
- Novo conteúdo aparece para Membro B em tempo real
- Indicador "editado em X" aparece ou é atualizado
- Timestamp de criação não muda para Membro B
- Sem refresh necessário (sincronização automática ou fetch)

### 11. Deleção de Comentário Sincronizada

Membro A deleta um comentário que Membro B está visualizando.

**Given**: Comentário é visível para Membro B  
**When**: Membro A deleta o comentário  
**Then**:
- Comentário desaparece para Membro B em tempo real
- Thread é atualizada sem necessidade de refresh
- Contagem de comentários é decrementada
- Ordem de comentários permanece consistente

### 12. Usuário Viewer Abre Cartão

Um viewer (apenas leitura) quer participar da discussão sobre um cartão.

**Given**: Usuário é viewer (não admin/editor)  
**When**: Abre um cartão e tenta adicionar um comentário  
**Then**:
- Campo "Adicionar comentário" está visível
- Pode digitar e enviar comentário normalmente
- Comentário é criado e visível a todos
- Botão "Editar" não aparece em seus comentários (ou está desabilitado)
- Botão "Deletar" não aparece em seus comentários (ou está desabilitado)
- Pode ver todos os comentários (leitura completa)

### 13. Histórico com Muitos Comentários

Um cartão tem 100+ comentários (discussão longa).

**Given**: Cartão tem 150 comentários  
**When**: Usuário abre o cartão  
**Then**:
- Todos os comentários são carregáveis (não há limite hard)
- Performance é aceitável (carregar, renderizar, scrollar)
- Ou comentários são paginados (ex: "Carregar mais" / "Mostrar primeiros 50")
- Novo comentário aparece sempre que adicionado
- Não há perda de comentários devido a limite técnico

## Regras de Negócio

1. **Propriedade do Comentário**: Comentário pertence ao seu autor (usuário que o criou)
2. **Edição Limitada**: Apenas o autor pode editar seu próprio comentário
3. **Deleção por Autor ou Admin**: Autor sempre pode deletar seu comentário; admin/editor pode deletar qualquer comentário
4. **Viewer Pode Contribuir**: Viewers conseguem criar comentários, mas não editar/deletar
5. **Pertencimento ao Board**: Comentário existe apenas no contexto de um cartão (que pertence a um board)
6. **Membros Podem Ver**: Todos os membros ativos do board podem ver comentários do cartão
7. **Persistência**: Comentários são persistidos e não são temporários
8. **Cronologia**: Comentários aparecem em ordem temporal (mais antigo primeiro, mais recente último)
9. **Timestamps Imutáveis**: Data de criação não muda após edição
10. **Indicador de Edição**: Comentário editado exibe indicador "editado em X"

## Restrições

- **Membro Ativo**: Apenas membros com status ACTIVE no board conseguem comentar
- **Autenticação Obrigatória**: Usuário não autenticado não consegue comentar
- **Texto Não-Vazio**: Comentário precisa ter pelo menos 1 caractere
- **Comprimento Máximo**: Comentário tem limite máximo (ex: 1000 caracteres)
- **Sem Comentário em Comentário**: Comments são flat (não há respostas aninhadas a comentários)
- **Sem Comentário de Cartão Deletado**: Se cartão é deletado, comentários são removidos também (cascata)
- **Sem Edição de Timestamp**: Data de criação não pode ser alterada
- **Sem Histórico de Versões**: Apenas última versão é visível (não há "ver edições anteriores")
- **Sem Reações**: Reações em emoji (👍, ❤️) não fazem parte desta feature (v2)
- **Sem Menções**: Mencionar usuários com @usuario não tem funcionalidade (v2)

## Casos de Borda e Condições de Erro

### Validação de Entrada

- **Comentário vazio**: "Comentário não pode estar vazio" (erro 400)
- **Comentário só espaços em branco**: Rejeitado (erro 400)
- **Comentário muito longo (>1000 chars)**: "Comentário muito longo" (erro 400)
- **Comentário com tags HTML**: Escapado, não executado (XSS prevention)

### Operações de Comentário

- **Editar comentário não-existente**: Erro 404 Not Found
- **Deletar comentário não-existente**: Erro 404 Not Found
- **Editar comentário de outro**: Erro 403 Forbidden (viewer ou editor tentando editar alheio)
- **Deletar comentário de outro** (viewer): Erro 403 Forbidden
- **Comentar em cartão não-existente**: Erro 404 Not Found
- **Comentar em cartão de outro board**: Validação (apenas cartões do board atual)

### Permissões

- **Membro não-ativo**: Não consegue criar comentário (erro 403)
- **Não-autenticado**: Erro 401 Unauthorized
- **Viewer edita comentário alheio**: Erro 403 Forbidden
- **Viewer deleta comentário alheio**: Erro 403 Forbidden
- **Editor/Admin edita comentário alheio**: Erro 403 Forbidden (apenas delete é permitido)

### Concorrência

- **Dois usuários editam simultaneamente**: Última edição vence (timestamp atualizado)
- **Usuário deleta comentário enquanto outro edita**: Delete vence, edit retorna 404
- **Adicionar comentário enquanto outro deleta**: Ambos sucesso (comentários independentes)

### Dados Especiais

- **Comentário com quebras de linha**: Preservadas (renderizadas como \n)
- **Comentário com emojis**: Aparecem normalmente
- **Caracteres acentuados**: Suportados (UTF-8)
- **URLs em comentário**: Renderizadas como texto (não clicáveis, a menos que v2)

## Dados Afetados

### Criados

- **Comment** (entidade de comentário)
  - id (UUID, PK)
  - card_id (FK → Card, ON DELETE CASCADE)
  - user_id (FK → User)
  - content (TEXT ou VARCHAR 1000, não-nulo)
  - created_at (Timestamp)
  - updated_at (Timestamp, inicialmente = created_at)
  - edited_at (Timestamp nullable, null se nunca editado)

### Atualizados

- **Card**
  - updated_at (ao adicionar/editar/deletar comentário)
  - Potencialmente: comment_count (cache, opcional)

### Preservados

- Dados do cartão (título, descrição, membros)
- Dados do usuário (nome, email, role)
- Dados do board
- Autenticação

### Deletados

- **Comment** (ao deletar comentário ou cartão)

## Respostas do Sistema

### Adicionar Comentário - Sucesso

- 201 Created
- Response: `{ id: "uuid", card_id: "uuid", user_id: "uuid", author_name: "João", content: "Isso!", created_at: "...", updated_at: "...", edited_at: null }`

### Listar Comentários de um Cartão - Sucesso

- 200 OK
- Response:
```json
{
  "comments": [
    { "id": "uuid", "author_name": "João", "content": "Iniciar", "created_at": "2026-09-15T10:00:00Z", "edited_at": null },
    { "id": "uuid", "author_name": "Maria", "content": "Concordo", "created_at": "2026-09-15T10:05:00Z", "edited_at": null },
    { "id": "uuid", "author_name": "João", "content": "Isso! (editado)", "created_at": "2026-09-15T10:00:00Z", "edited_at": "2026-09-15T10:10:00Z" }
  ],
  "total": 3
}
```

### Editar Comentário - Sucesso

- 200 OK
- Response: `{ id: "uuid", content: "Novo conteúdo", updated_at: "2026-09-15T10:11:00Z", edited_at: "2026-09-15T10:11:00Z" }`

### Deletar Comentário - Sucesso

- 204 No Content

### Erro: Comentário Vazio

- 400 Bad Request
- `{ "error": "Comentário não pode estar vazio" }`

### Erro: Sem Permissão

- 403 Forbidden
- `{ "error": "Você não tem permissão para editar este comentário" }`

### Erro: Não Encontrado

- 404 Not Found
- `{ "error": "Comentário não encontrado" }`

### Erro: Não Autenticado

- 401 Unauthorized
- `{ "error": "Autenticação necessária" }`

## Fluxos Principais

### Fluxo 1: Adicionar e Ver Comentário

```
Membro abre cartão
  ↓
Vê "Adicionar comentário" com campo de texto
  ↓
Digita "Implementar autenticação"
  ↓
Clica "Enviar"
  ↓
Comentário aparece na thread com seu nome, hora
  ↓
Outros membros veem o comentário ao abrir/refrescar cartão
```

### Fluxo 2: Editar Comentário Próprio

```
Membro vê seu comentário na thread
  ↓
Clica "Editar" no comentário
  ↓
Campo fica editável, conteúdo visível
  ↓
Modifica texto, clica "Salvar"
  ↓
Comentário é atualizado, "editado em HH:MM" aparece
  ↓
Timestamp de criação não muda
```

### Fluxo 3: Admin Deleta Comentário Inadequado

```
Admin vê comentário inapropriado de outro membro
  ↓
Clica "Deletar" (ou ícone 🗑)
  ↓
Confirmação: "Deletar este comentário?"
  ↓
Clica "Confirmar"
  ↓
Comentário desaparece da thread
  ↓
Contagem de comentários é atualizada
```

### Fluxo 4: Histórico Longo

```
Cartão tem 50 comentários de discussão
  ↓
Membro abre cartão
  ↓
Vê primeiros 20 comentários + botão "Carregar mais"
  ↓
(Ou: vê scroll infinito, carrega conforme scroll)
  ↓
Clica "Carregar mais"
  ↓
Próximos 20 aparecem
  ↓
Continua até ver todos
```

## Critérios de Aceite Resumidos

- [ ] C1: Adicionar comentário a cartão
- [ ] C2: Visualizar comentários em ordem cronológica
- [ ] C3: Editar comentário próprio
- [ ] C4: Deletar comentário próprio
- [ ] C5: Admin/Editor deleta comentário de outro
- [ ] C6: Viewer não consegue editar/deletar comentários
- [ ] C7: Indicator "editado em X" aparece
- [ ] C8: Validação: comentário vazio rejeitado
- [ ] C9: Validação: comentário muito longo rejeitado
- [ ] C10: XSS Prevention: HTML tags escapadas
- [ ] C11: Caracteres especiais preservados (quebras de linha, emojis)
- [ ] C12: Sincronização de novos comentários entre usuários
- [ ] C13: Sincronização de edição entre usuários
- [ ] C14: Sincronização de deleção entre usuários
- [ ] C15: Membro não-ativo não consegue comentar
- [ ] C16: Permissões corretas (RBAC)
- [ ] C17: Cascata: deletar cartão remove comentários
- [ ] C18: Contador de comentários atualizado
- [ ] C19: Nenhum comentário mostra mensagem apropriada
- [ ] C20: Carregar histórico grande (100+ comentários) é funcional

---

## Dependências

- **RF01 (Autenticação)**: Valida quem está comentando
- **RF02 (Quadros)**: Cartão pertence a um quadro
- **RF04 (Cartões)**: Comentário pertence a um cartão
- **RF07 (Membros)**: Valida role de quem comenta (admin, editor, viewer)
- **RF05 (Cascade Delete)**: Deletar cartão remove comentários (FK CASCADE)

---

## Roadmap Futuro

- **v2**: Respostas em thread (comentários aninhados)
- **v2**: Reações em emoji (👍, ❤️, 😄)
- **v2**: Menções com @usuario (notificações)
- **v2**: Histórico de edições (ver quem editou quando)
- **v2**: Pins / favorite comments
- **v2**: Busca em comentários
- **v2**: Markdown support (bold, italic, lists)
- **v2**: Integração com notificações (email, push)
- **v2**: Comments em listas/boards (além de cartões)
