# RF01: Autenticação e Gerenciamento de Sessão

## Visão Geral

Sistema permite usuário criar conta, fazer login e permanecer autenticado entre sessões sem necessidade de re-autenticar a cada visita.

## Atores

- **Usuário não autenticado**: Acessa aplicação sem credenciais válidas
- **Usuário autenticado**: Possui conta e sessão ativa

## Comportamento Esperado

### 1. Cadastro (Signup)

Usuário novo cria conta fornecendo email e senha.

**Given**: Usuário não autenticado acessa tela de cadastro  
**When**: Preenche email válido e senha, clica "Cadastrar"  
**Then**:
- Conta criada no sistema com email e senha (criptografada)
- Usuário recebe confirmação visual de sucesso
- Usuário é redirecionado para tela de login ou autenticado automaticamente

**Given**: Usuário tenta cadastro com email já registrado  
**When**: Submete formulário  
**Then**: Erro exibido ("Email já cadastrado")

**Given**: Usuário tenta cadastro com email inválido  
**When**: Submete formulário  
**Then**: Erro exibido ("Email inválido")

**Given**: Usuário tenta cadastro com senha fraca  
**When**: Submete formulário  
**Then**: Erro exibido ("Senha não atende requisitos mínimos")

### 2. Login

Usuário autenticado com email e senha.

**Given**: Usuário com conta válida acessa tela de login  
**When**: Preenche email e senha corretos, clica "Entrar"  
**Then**:
- Sessão criada
- Usuário recebe feedback visual de sucesso
- Usuário redirecionado para dashboard/página principal
- Sessão permanece ativa nas visitas subsequentes

**Given**: Usuário tenta login com email não registrado  
**When**: Submete formulário  
**Then**: Erro genérico ("Email ou senha inválidos")

**Given**: Usuário tenta login com senha incorreta  
**When**: Submete formulário  
**Then**: Erro genérico ("Email ou senha inválidos")

**Given**: Usuário tenta login com email correto e senha vazia  
**When**: Submete formulário  
**Then**: Erro exibido ("Preencha todos os campos")

### 3. Sessão Persistida

Usuário autenticado permanece autenticado entre visitas.

**Given**: Usuário faz login com sucesso  
**When**: Fecha navegador e volta à aplicação depois (em tempo razoável)  
**Then**: Usuário continua autenticado, sem necessidade de login novamente

**Given**: Usuário autenticado clica "Sair" ou "Logout"  
**When**: Confirma ação  
**Then**:
- Sessão encerrada
- Cookies/tokens removidos
- Usuário redirecionado para tela de login
- Volta posterior requer nova autenticação

**Given**: Sessão expirou (passou tempo máximo de inatividade)  
**When**: Usuário tenta acessar área autenticada  
**Then**:
- Sessão invalidada
- Usuário redirecionado para login
- Mensagem informando que sessão expirou

### 4. Validação de Sessão

Acesso à aplicação verifica autenticação a cada navegação.

**Given**: Usuário não autenticado tenta acessar área protegida diretamente (URL)  
**When**: Acesso tentado  
**Then**: Redirecionado para login

**Given**: Usuário autenticado acessa aplicação  
**When**: Sessão válida existe  
**Then**: Usuário redirecionado para dashboard/área principal

## Regras de Negócio

1. **Email único**: Dois usuários não podem compartilhar mesmo email
2. **Senha obrigatória**: Cadastro sem senha não permitido
3. **Criptografia de senha**: Senha armazenada criptografada, nunca em texto plano
4. **Sessão vinculada a usuário**: Uma sessão corresponde a exatamente um usuário
5. **Logout encerra sessão**: Após logout, sessão não reutilizável
6. **Expiração de sessão**: Sessão inativa por X tempo é automaticamente invalidada
7. **Sem recuperação de senha**: Nesta versão, usuário não pode recuperar/resetar senha esquecidar

## Restrições

- **Email**: Deve ser formato válido (padrão RFC 5322 simplificado)
- **Senha**: Mínimo 8 caracteres
- **Sessão**: Válida por máximo 24 horas (renovável com atividade)
- **Tentativas de login**: Sem limite por hora (sem rate-limiting nesta versão)
- **Dados de sessão**: Armazenados servidor-side (não confiável apenas em cliente)

## Casos de Borda e Condições de Erro

### Cadastro
- Email com espaços em branco antes/depois: Trimmed antes de validação
- Senha com espaços: Preservados (faz parte da senha)
- Caracteres especiais em email/senha: Aceitos
- Email com uppercase/lowercase: Tratado como mesmo email (case-insensitive)

### Login
- Email com espaços: Trimmed antes de busca
- Sessão anterior ativa ao fazer novo login: Sessão anterior encerrada, nova sessão criada
- Múltiplas abas do navegador: Ambas compartilham mesma sessão, logout em uma afeta outra

### Sessão
- Tab fechada: Sessão continua ativa (não é logout)
- Janela privada/incógnito: Sessão NÃO persiste após fechar (sem cookies persistentes)
- Servidor fora: Usuário perde acesso até servidor retornar (sem funcionalidade offline)
- Relógio do servidor alterado: Expiração pode se comportar inesperadamente (aceitar como limitação)

### Sincronização
- Múltiplos dispositivos: Cada login cria sessão separada (não sincronizadas)
- Logout em dispositivo X: Não afeta sessões em dispositivo Y

## Dados Capturados por Usuário

- Email (identificador único)
- Senha (criptografada)
- Data/hora criação conta
- Data/hora último login

## Dados Capturados por Sessão

- ID único da sessão
- ID do usuário associado
- Data/hora criação
- Data/hora última atividade
- Status (ativa/expirada/invalidada)

## Respostas do Sistema

### Cadastro
- 201 Created: Usuário criado com sucesso
- 400 Bad Request: Email inválido, senha fraca, campo vazio
- 409 Conflict: Email já existe

### Login
- 200 OK: Login bem-sucedido, sessão criada
- 401 Unauthorized: Email ou senha incorretos
- 400 Bad Request: Campo vazio, formato inválido

### Logout
- 200 OK: Logout bem-sucedido
- 401 Unauthorized: Nenhuma sessão ativa

### Verificação de Sessão
- 200 OK: Sessão válida
- 401 Unauthorized: Nenhuma sessão ou sessão expirada
