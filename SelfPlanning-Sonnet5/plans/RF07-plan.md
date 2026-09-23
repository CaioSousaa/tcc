Intenção: Quero que o administrador do quadro consiga convidar e gerenciar membros com papéis diferentes, e atribuí-los a cards
Plano:
1. Criar um modelo de membro de quadro, vinculando um usuário a um quadro com um papel (administrador ou membro).
2. Ao criar um quadro, adicionar automaticamente o usuário criador como membro com papel de administrador.
3. Verificar se o usuário autenticado é membro do quadro antes de listar membros ou atribuir responsáveis em cards, e se é administrador antes de convidar, alterar papel ou remover membro.
4. Criar um endpoint para convidar um membro para o quadro, recebendo o e-mail do usuário a ser adicionado.
5. Validar se o e-mail informado corresponde a um usuário cadastrado e se ele ainda não é membro do quadro.
6. Criar um endpoint para listar os membros de um quadro com seus papéis.
7. Criar um endpoint para alterar o papel de um membro do quadro.
8. Criar um endpoint para remover um membro do quadro.
9. Impedir que o último administrador do quadro seja removido ou tenha o papel alterado, garantindo que o quadro sempre tenha ao menos um administrador.
10. Criar um endpoint para atribuir e remover responsáveis em um card, escolhendo entre os membros do quadro.
11. Se o quadro, o membro ou o card não existir ou não pertencer ao usuário autenticado, retornar erro de não encontrado ou de acesso negado, conforme o caso.
12. Proteger todos os endpoints com o middleware de autenticação existente.
