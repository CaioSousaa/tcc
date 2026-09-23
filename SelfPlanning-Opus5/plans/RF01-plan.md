# RF01 - Cadastro, login e sessão persistida

Intenção: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões

Plano:

1 Criar o modelo de usuário com nome, e-mail único e senha

2 Criar um endpoint de cadastro que valide os dados recebidos

3 Verificar se o e-mail já está cadastrado e recusar a duplicidade

4 Gravar a senha com hash, nunca em texto puro

5 Criar um endpoint de login que confira o e-mail e a senha informados

6 Retornar uma resposta genérica quando as credenciais não conferirem

7 Gerar um token de acesso de curta duração e um token de renovação de longa duração no login

8 Persistir o token de renovação vinculado ao usuário para permitir a revogação

9 Criar um endpoint de renovação que troque o token de renovação válido por um novo token de acesso

10 Criar um middleware que proteja as rotas privadas exigindo o token de acesso

11 Criar um endpoint para retornar os dados do usuário autenticado

12 Criar um endpoint de logout que invalide o token de renovação

13 Criar as telas de cadastro e de login seguindo o protótipo

14 Enviar os dados dos formulários para os endpoints e tratar os erros retornados

15 Guardar os tokens no navegador de forma que sobrevivam ao fechamento da aba

16 Renovar o token de acesso automaticamente quando ele expirar durante o uso

17 Restaurar a sessão ao abrir a aplicação buscando os dados do usuário autenticado

18 Redirecionar para o login quando não houver sessão válida e para a área interna quando houver
