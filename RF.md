# Quadro – Requisitos Funcionais (RF) do sistema Kanban proposto

| Código | Descrição                                                                                                                                                                         |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF01   | Cadastro, autenticação e login de usuários, com manutenção de sessão persistente.                                                                                                 |
| RF02   | Criação, listagem, edição e exclusão de quadros (boards) pertencentes ao usuário autenticado.                                                                                     |
| RF03   | Criação, renomeação, reordenação e exclusão de listas (colunas) dentro de um quadro.                                                                                              |
| RF04   | Criação, edição, exclusão e movimentação de cards entre listas de um mesmo quadro.                                                                                                |
| RF05   | Exclusão de uma lista contendo cards associados, com definição explícita da regra de cascata (exclusão dos cards, bloqueio da ação ou migração para outra lista).                 |
| RF06   | Criação de checklists dentro de um card, com itens marcáveis como concluídos e cálculo automático do percentual de progresso exibido no próprio card.                             |
| RF07   | Convite e gerenciamento de membros do quadro em dois papéis (administrador e membro), restringindo as ações permitidas a cada papel, e atribuição de membros a cards específicos. |
| RF08   | Criação de etiquetas (labels) coloridas por quadro, associação de etiquetas a múltiplos cards e filtragem dos cards visíveis por etiqueta.                                        |
| RF09   | Adição de comentários em cards, com histórico ordenado cronologicamente e identificação do autor de cada comentário.                                                              |
| RF10   | Definição de data de vencimento (due date) em cards, com destaque visual para cards atrasados ou com vencimento próximo, e ordenação dos cards por prazo.                         |
