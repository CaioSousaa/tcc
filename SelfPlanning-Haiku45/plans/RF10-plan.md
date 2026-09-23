# RF10 - Prazos nos Cartões

Intenção: Usuário consiga definir prazos nos cards e identificar quais estão atrasados

Plano:

1. Adicionar campo dataPrazo (datetime nullable) na entidade Card
2. Adicionar campo statusPrazo (enum) na entidade Card com valores: pendente, próximo, atrasado
3. Criar função para calcular statusPrazo baseado em dataPrazo vs data atual
4. Atualizar Card em CASCADE para resetar prazos ao deletar
5. Criar endpoint PATCH /boards/:boardId/lists/:listId/cards/:cardId para editar prazo
6. Validar dataPrazo (não pode ser no passado ao criar, aceita null para remover prazo)
7. Endpoint GET /cards retorna statusPrazo calculado dinamicamente
8. Criar endpoint GET /boards/:boardId/cards-atrasados para listar cartões atrasados (protegido)
9. Listar apenas cards atrasados do board com ordenação por data mais antiga primeiro
10. Frontend: adicionar campo data/hora ao criar/editar cartão (opcional)
11. Frontend: exibir prazo como badge no card preview (se existir)
12. Frontend: cor da badge indica status (verde=próximo, amarelo=hoje, vermelho=atrasado)
13. Frontend: exibir "Sem prazo" se dataPrazo é null
14. Frontend: no CardModal, adicionar campo para editar prazo com datepicker/datetime input
15. Frontend: permitir remover prazo (limpar data)
16. Frontend: exibir dias restantes ou "Atrasado por X dias"
17. Frontend: filtro/seção de cartões atrasados na página do board (opcional)
18. Frontend: validação: não permitir data/hora no passado
19. Frontend: tratamento de erro (data inválida, etc)
20. Frontend: atualizar cálculo de statusPrazo quando modal fecha ou intervalo atualiza
