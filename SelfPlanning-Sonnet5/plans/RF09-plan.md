Intenção: Quero que o usuário consiga comentar nos cards e ver o histórico dos comentários
Plano:
1. Criar um modelo de comentário vinculado a um card e ao usuário autor, com o texto e a data de criação.
2. Verificar se o usuário autenticado é membro do quadro ao qual o card pertence antes de criar, listar ou excluir comentários.
3. Criar um endpoint para adicionar um comentário a um card, recebendo o texto.
4. Criar um endpoint para listar os comentários de um card, ordenados do mais antigo para o mais recente, incluindo o nome do autor de cada um.
5. Criar um endpoint para excluir um comentário, permitindo apenas que o autor do comentário ou um administrador do quadro o exclua.
6. Se o quadro, o card ou o comentário não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado ou de acesso negado, conforme o caso.
7. Proteger todos os endpoints com o middleware de autenticação existente.
