# RF01 - Autenticação de Usuário

Intenção: O usuário deve conseguir se cadastrar, fazer login e continuar autenticado entre sessões

Plano:

1. Criar entidade User com campos: id, email, senha (hash), nome, dataInclusão
2. Criar endpoint POST /auth/register para cadastro com validação de email único
3. Hash da senha com bcrypt antes de persistir no banco
4. Criar endpoint POST /auth/login que valida email/senha e gera token JWT
5. Armazenar token JWT no localStorage do frontend
6. Criar middleware de autenticação para validar token nas requisições protegidas
7. Criar endpoint GET /auth/me para retornar dados do usuário autenticado
8. Implementar refresh token com expiração maior para renovar sessão
9. Frontend: interceptor HTTP para incluir token em todas as requisições
10. Frontend: verificar autenticação ao carregar app e redirecionar se inválido
11. Criar endpoint POST /auth/logout que invalida o token (opcional em JWT, blacklist se necessário)
12. Frontend: rota protegida que redireciona para login se não autenticado
