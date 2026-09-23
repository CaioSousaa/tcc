Intenção: Quero que o usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros
Plano:
1. Criar um modelo de quadro vinculado ao usuário autenticado como proprietário.
2. Criar um endpoint para criar um quadro, recebendo nome e cor/identificação visual.
3. Criar um endpoint para listar os quadros do usuário autenticado.
4. Criar um endpoint para obter um quadro específico pelo id.
5. Verificar se o quadro pertence ao usuário autenticado antes de retornar, editar ou excluir.
6. Se o quadro não existir ou não pertencer ao usuário, retornar erro de não encontrado.
7. Criar um endpoint para editar um quadro, permitindo atualizar nome e cor/identificação visual.
8. Criar um endpoint para excluir um quadro.
9. Ao excluir um quadro, excluir também os dados vinculados a ele (listas e cards).
10. Proteger todos os endpoints com o middleware de autenticação existente.
