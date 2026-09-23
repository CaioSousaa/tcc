# RF05 - Tratamento de Exclusão de Lista com Cartões

Intenção: Sistema trata adequadamente o que acontece com os cartões quando usuário exclui uma lista que contém cartões

Plano:

1. Backend já implementa cascade delete via TypeORM (List.ts com `onDelete: "CASCADE"`)
2. Quando lista é deletada, banco de dados automaticamente deleta todos os cartões associados
3. Adicionar validação: avisar usuário quantos cartões serão deletados antes de confirmar exclusão
4. Endpoint DELETE /boards/:boardId/lists/:id retorna contagem de cartões deletados
5. Modificar resposta do DELETE para incluir campo `cardsDeleted: number`
6. Frontend: exibir confirmação com mensagem "Esta lista tem X cartão(ões). Tem certeza?"
7. Se X > 0, mostrar número de cartões que serão deletados
8. Permitir usuário cancelar operação antes de confirmar
9. Após confirmação e exclusão bem-sucedida, remover lista do estado
10. Logs: registrar deleção de lista com número de cartões afetados (optional, para auditoria)
11. Tratamento de erro: se deleção falhar, mostrar erro específico ao usuário
12. Teste: verificar que ao deletar lista com cartões, todos são removidos do banco
13. Teste: verificar que interface reflete mudança corretamente
14. Validação: garantir que não há cartões órfãos após deleção de lista
