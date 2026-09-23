Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões
Plano:
1. Criar um endpoint para cadastro de usuário, recebendo nome, e-mail e senha.
2. Validar se o e-mail já está cadastrado na base.
3. Criptografar a senha antes de persistir o usuário.
4. Criar um endpoint para login, recebendo e-mail e senha.
5. Verificar as credenciais informadas contra a base de usuários.
6. Gerar um token de acesso (JWT) e um token de renovação (refresh token) ao autenticar com sucesso.
7. Persistir o refresh token vinculado ao usuário para permitir revogação.
8. Criar um endpoint para renovar o token de acesso a partir do refresh token válido.
9. Criar um middleware de autenticação que valide o token de acesso nas rotas protegidas.
10. Retornar erro de não autorizado quando o token estiver ausente, inválido ou expirado.
11. Criar um endpoint de logout que invalide o refresh token do usuário.
