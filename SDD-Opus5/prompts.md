### Prompt 1

Esta seção deve ser executada com base no arquivo @context.md

---

### Prompt 2

FASE 1: SPECIFY

INTENÇÃO: Quero que o usuário consiga se cadastrar, fazer login e continuar autenticado entre sessões

Produza a especificação funcional desta intenção. A especificação deve responder à pergunta "o que o software deve fazer?", e não "como construir".

A especificação deve conter:
1 A descrição do comportamento esperado do sistema, do ponto de vista do usuário
2 Os critérios de aceite no formato Given/When/Then
3 As regras de negócio e restrições, capturadas explicitamente
4 Os casos de borda e as condições de erro, identificados agora e não descobertos durante a implementação

A especificação deve ser:

- focada em comportamento: descreve o que acontece, não como é feito
- testável: cada requisito precisa ser verificável
- não ambígua: leitores diferentes devem chegar à mesma interpretação
- completa o suficiente para cobrir os casos essenciais, sem sobre-especificar

Escreva no nível de detalhe necessário para remover a ambiguidade. Se um requisito puder ser interpretado de mais de uma forma, esclareça. Se houver apenas uma interpretação razoável, não sobre-especifique. Detalhe excessivo restringe a implementação desnecessariamente.

Não prescreva detalhes de implementação, tecnologia ou arquitetura nesta fase.

Não gere código.

Salve a especificação em docs/RF01-spec.md

---

### Prompt 3

FASE 2: PLAN

Leia @docs/RF01-spec.md

Com base na especificação funcional aprovada, produza o plano técnico. Esta fase responde à pergunta "como devemos construir isso?".

Onde a especificação declara a intenção, o plano declara as restrições que a implementação deve respeitar.

O plano deve cobrir:
1 As tecnologias e frameworks apropriados ao problema
2 A arquitetura de componentes e suas fronteiras
3 Os modelos de dados e schemas
4 As interfaces: APIs, mensagens e contratos
5 Os requisitos não funcionais de desempenho, segurança e escalabilidade

Deixe explícitas as restrições que a implementação deverá obedecer.

Não gere código.

Salve o plano em docs/RF01-plan.md

---

### Prompt 4

FASE 3: IMPLEMENT

Leia @docs/RF01-spec.md e @docs/RF01-plan.md

Com base na especificação e no plano técnico aprovados, implemente o requisito.

Proceda assim:
1 Quebre o plano em tarefas discretas e revisáveis. Cada tarefa deve entregar uma parte funcional e testável. Salve essa lista em docs/RF01-tasks.md antes de começar a implementar
2 Implemente as tarefas em incrementos pequenos e validados, e não a especificação inteira de uma só vez
3 Verifique se o código produzido está alinhado à especificação e ao plano
4 Escreva testes unitários que codifiquem os requisitos da especificação como asserções executáveis

Ao final, atualize docs/RF01-tasks.md indicando o estado de cada tarefa.

---

### Prompt 5

FASE 4: VALIDATE

Leia @docs/RF01-spec.md e @docs/RF01-plan.md

Verifique se o código implementado atende de fato à especificação.

Execute:
1 Os testes automatizados nos níveis unitário, de integração e de aceite
2 Os cenários Given/When/Then da especificação contra a implementação real

---

### Prompt 6

FASE 1: SPECIFY

INTENÇÃO: Quero que o usuário autenticado consiga criar, ver, editar e excluir seus próprios quadros

Produza a especificação funcional desta intenção. A especificação deve responder à pergunta "o que o software deve fazer?", e não "como construir".

A especificação deve conter:
1 A descrição do comportamento esperado do sistema, do ponto de vista do usuário
2 Os critérios de aceite no formato Given/When/Then
3 As regras de negócio e restrições, capturadas explicitamente
4 Os casos de borda e as condições de erro, identificados agora e não descobertos durante a implementação

A especificação deve ser:

- focada em comportamento: descreve o que acontece, não como é feito
- testável: cada requisito precisa ser verificável
- não ambígua: leitores diferentes devem chegar à mesma interpretação
- completa o suficiente para cobrir os casos essenciais, sem sobre-especificar

Escreva no nível de detalhe necessário para remover a ambiguidade. Se um requisito puder ser interpretado de mais de uma forma, esclareça. Se houver apenas uma interpretação razoável, não sobre-especifique. Detalhe excessivo restringe a implementação desnecessariamente.

Não prescreva detalhes de implementação, tecnologia ou arquitetura nesta fase.

Não gere código.

Salve a especificação em docs/RF02-spec.md

---

### Prompt 7

FASE 2: PLAN

Leia @docs/RF02-spec.md

Com base na especificação funcional aprovada, produza o plano técnico. Esta fase responde à pergunta "como devemos construir isso?".

Onde a especificação declara a intenção, o plano declara as restrições que a implementação deve respeitar.

O plano deve cobrir:
1 As tecnologias e frameworks apropriados ao problema
2 A arquitetura de componentes e suas fronteiras
3 Os modelos de dados e schemas
4 As interfaces: APIs, mensagens e contratos
5 Os requisitos não funcionais de desempenho, segurança e escalabilidade

Deixe explícitas as restrições que a implementação deverá obedecer.

Não gere código.

Salve o plano em docs/RF02-plan.md

---

### Prompt 8

FASE 3: IMPLEMENT

Leia @docs/RF02-spec.md e @docs/RF02-plan.md

Com base na especificação e no plano técnico aprovados, implemente o requisito.

Proceda assim:
1 Quebre o plano em tarefas discretas e revisáveis. Cada tarefa deve entregar uma parte funcional e testável. Salve essa lista em docs/RF02-tasks.md antes de começar a implementar
2 Implemente as tarefas em incrementos pequenos e validados, e não a especificação inteira de uma só vez
3 Verifique se o código produzido está alinhado à especificação e ao plano
4 Escreva testes unitários que codifiquem os requisitos da especificação como asserções executáveis

Ao final, atualize docs/RF02-tasks.md indicando o estado de cada tarefa.

---

### Prompt 9

FASE 4: VALIDATE

Leia @docs/RF02-spec.md e @docs/RF02-plan.md

Verifique se o código implementado atende de fato à especificação.

Execute:
1 Os testes automatizados nos níveis unitário, de integração e de aceite
2 Os cenários Given/When/Then da especificação contra a implementação real

---

### Prompt 10

FASE 1: SPECIFY

INTENÇÃO: Quero que o usuário consiga criar, renomear, reordenar e excluir listas dentro de um quadro

Produza a especificação funcional desta intenção. A especificação deve responder à pergunta "o que o software deve fazer?", e não "como construir".

A especificação deve conter:
1 A descrição do comportamento esperado do sistema, do ponto de vista do usuário
2 Os critérios de aceite no formato Given/When/Then
3 As regras de negócio e restrições, capturadas explicitamente
4 Os casos de borda e as condições de erro, identificados agora e não descobertos durante a implementação

A especificação deve ser:

- focada em comportamento: descreve o que acontece, não como é feito
- testável: cada requisito precisa ser verificável
- não ambígua: leitores diferentes devem chegar à mesma interpretação
- completa o suficiente para cobrir os casos essenciais, sem sobre-especificar

Escreva no nível de detalhe necessário para remover a ambiguidade. Se um requisito puder ser interpretado de mais de uma forma, esclareça. Se houver apenas uma interpretação razoável, não sobre-especifique. Detalhe excessivo restringe a implementação desnecessariamente.

Não prescreva detalhes de implementação, tecnologia ou arquitetura nesta fase.

Não gere código.

Salve a especificação em docs/RF03-spec.md

---

### Prompt 11

FASE 2: PLAN

Leia @docs/RF03-spec.md

Com base na especificação funcional aprovada, produza o plano técnico. Esta fase responde à pergunta "como devemos construir isso?".

Onde a especificação declara a intenção, o plano declara as restrições que a implementação deve respeitar.

O plano deve cobrir:
1 As tecnologias e frameworks apropriados ao problema
2 A arquitetura de componentes e suas fronteiras
3 Os modelos de dados e schemas
4 As interfaces: APIs, mensagens e contratos
5 Os requisitos não funcionais de desempenho, segurança e escalabilidade

Deixe explícitas as restrições que a implementação deverá obedecer.

Não gere código.

Salve o plano em docs/RF03-plan.md

---

### Prompt 12

FASE 3: IMPLEMENT

Leia @docs/RF03-spec.md e @docs/RF03-plan.md

Com base na especificação e no plano técnico aprovados, implemente o requisito.

Proceda assim:
1 Quebre o plano em tarefas discretas e revisáveis. Cada tarefa deve entregar uma parte funcional e testável. Salve essa lista em docs/RF03-tasks.md antes de começar a implementar
2 Implemente as tarefas em incrementos pequenos e validados, e não a especificação inteira de uma só vez
3 Verifique se o código produzido está alinhado à especificação e ao plano
4 Escreva testes unitários que codifiquem os requisitos da especificação como asserções executáveis

Ao final, atualize docs/RF03-tasks.md indicando o estado de cada tarefa.

---

### Prompt 13

FASE 4: VALIDATE

Leia @docs/RF03-spec.md e @docs/RF03-plan.md

Verifique se o código implementado atende de fato à especificação.

Execute:
1 Os testes automatizados nos níveis unitário, de integração e de aceite
2 Os cenários Given/When/Then da especificação contra a implementação real

---

### Prompt 14

FASE 1: SPECIFY

INTENÇÃO: Quero que o usuário consiga criar, editar, excluir e mover cards entre as listas de um quadro

Produza a especificação funcional desta intenção. A especificação deve responder à pergunta "o que o software deve fazer?", e não "como construir".

A especificação deve conter:
1 A descrição do comportamento esperado do sistema, do ponto de vista do usuário
2 Os critérios de aceite no formato Given/When/Then
3 As regras de negócio e restrições, capturadas explicitamente
4 Os casos de borda e as condições de erro, identificados agora e não descobertos durante a implementação

A especificação deve ser:

- focada em comportamento: descreve o que acontece, não como é feito
- testável: cada requisito precisa ser verificável
- não ambígua: leitores diferentes devem chegar à mesma interpretação
- completa o suficiente para cobrir os casos essenciais, sem sobre-especificar

Escreva no nível de detalhe necessário para remover a ambiguidade. Se um requisito puder ser interpretado de mais de uma forma, esclareça. Se houver apenas uma interpretação razoável, não sobre-especifique. Detalhe excessivo restringe a implementação desnecessariamente.

Não prescreva detalhes de implementação, tecnologia ou arquitetura nesta fase.

Não gere código.

Salve a especificação em docs/RF04-spec.md

---

### Prompt 15

FASE 2: PLAN

Leia @docs/RF04-spec.md

Com base na especificação funcional aprovada, produza o plano técnico. Esta fase responde à pergunta "como devemos construir isso?".

Onde a especificação declara a intenção, o plano declara as restrições que a implementação deve respeitar.

O plano deve cobrir:
1 As tecnologias e frameworks apropriados ao problema
2 A arquitetura de componentes e suas fronteiras
3 Os modelos de dados e schemas
4 As interfaces: APIs, mensagens e contratos
5 Os requisitos não funcionais de desempenho, segurança e escalabilidade

Deixe explícitas as restrições que a implementação deverá obedecer.

Não gere código.

Salve o plano em docs/RF04-plan.md

---

### Prompt 16

FASE 3: IMPLEMENT

Leia @docs/RF04-spec.md e @docs/RF04-plan.md

Com base na especificação e no plano técnico aprovados, implemente o requisito.

Proceda assim:
1 Quebre o plano em tarefas discretas e revisáveis. Cada tarefa deve entregar uma parte funcional e testável. Salve essa lista em docs/RF04-tasks.md antes de começar a implementar
2 Implemente as tarefas em incrementos pequenos e validados, e não a especificação inteira de uma só vez
3 Verifique se o código produzido está alinhado à especificação e ao plano
4 Escreva testes unitários que codifiquem os requisitos da especificação como asserções executáveis

Ao final, atualize docs/RF04-tasks.md indicando o estado de cada tarefa.

---

### Prompt 17

FASE 4: VALIDATE

Leia @docs/RF04-spec.md e @docs/RF04-plan.md

Verifique se o código implementado atende de fato à especificação.

Execute:
1 Os testes automatizados nos níveis unitário, de integração e de aceite
2 Os cenários Given/When/Then da especificação contra a implementação real

---

### Prompt 18

FASE 1: SPECIFY

INTENÇÃO: Quero que o sistema trate adequadamente o que acontece com os cards quando o usuário exclui uma lista que contém cards

Produza a especificação funcional desta intenção. A especificação deve responder à pergunta "o que o software deve fazer?", e não "como construir".

A especificação deve conter:
1 A descrição do comportamento esperado do sistema, do ponto de vista do usuário
2 Os critérios de aceite no formato Given/When/Then
3 As regras de negócio e restrições, capturadas explicitamente
4 Os casos de borda e as condições de erro, identificados agora e não descobertos durante a implementação

A especificação deve ser:

- focada em comportamento: descreve o que acontece, não como é feito
- testável: cada requisito precisa ser verificável
- não ambígua: leitores diferentes devem chegar à mesma interpretação
- completa o suficiente para cobrir os casos essenciais, sem sobre-especificar

Escreva no nível de detalhe necessário para remover a ambiguidade. Se um requisito puder ser interpretado de mais de uma forma, esclareça. Se houver apenas uma interpretação razoável, não sobre-especifique. Detalhe excessivo restringe a implementação desnecessariamente.

Não prescreva detalhes de implementação, tecnologia ou arquitetura nesta fase.

Não gere código.

Salve a especificação em docs/RF05-spec.md

---

### Prompt 19

FASE 2: PLAN

Leia @docs/RF05-spec.md

Com base na especificação funcional aprovada, produza o plano técnico. Esta fase responde à pergunta "como devemos construir isso?".

Onde a especificação declara a intenção, o plano declara as restrições que a implementação deve respeitar.

O plano deve cobrir:
1 As tecnologias e frameworks apropriados ao problema
2 A arquitetura de componentes e suas fronteiras
3 Os modelos de dados e schemas
4 As interfaces: APIs, mensagens e contratos
5 Os requisitos não funcionais de desempenho, segurança e escalabilidade

Deixe explícitas as restrições que a implementação deverá obedecer.

Não gere código.

Salve o plano em docs/RF05-plan.md

---

### Prompt 20

FASE 3: IMPLEMENT

Leia @docs/RF05-spec.md e @docs/RF05-plan.md

Com base na especificação e no plano técnico aprovados, implemente o requisito.

Proceda assim:
1 Quebre o plano em tarefas discretas e revisáveis. Cada tarefa deve entregar uma parte funcional e testável. Salve essa lista em docs/RF05-tasks.md antes de começar a implementar
2 Implemente as tarefas em incrementos pequenos e validados, e não a especificação inteira de uma só vez
3 Verifique se o código produzido está alinhado à especificação e ao plano
4 Escreva testes unitários que codifiquem os requisitos da especificação como asserções executáveis

Ao final, atualize docs/RF05-tasks.md indicando o estado de cada tarefa.

---

### Prompt 21

FASE 4: VALIDATE

Leia @docs/RF05-spec.md e @docs/RF05-plan.md

Verifique se o código implementado atende de fato à especificação.

Execute:
1 Os testes automatizados nos níveis unitário, de integração e de aceite
2 Os cenários Given/When/Then da especificação contra a implementação real

---

### Prompt 22

FASE 1: SPECIFY

INTENÇÃO: Quero que o usuário consiga adicionar checklists nos cards e acompanhar o progresso da tarefa

Produza a especificação funcional desta intenção. A especificação deve responder à pergunta "o que o software deve fazer?", e não "como construir".

A especificação deve conter:
1 A descrição do comportamento esperado do sistema, do ponto de vista do usuário
2 Os critérios de aceite no formato Given/When/Then
3 As regras de negócio e restrições, capturadas explicitamente
4 Os casos de borda e as condições de erro, identificados agora e não descobertos durante a implementação

A especificação deve ser:

- focada em comportamento: descreve o que acontece, não como é feito
- testável: cada requisito precisa ser verificável
- não ambígua: leitores diferentes devem chegar à mesma interpretação
- completa o suficiente para cobrir os casos essenciais, sem sobre-especificar

Escreva no nível de detalhe necessário para remover a ambiguidade. Se um requisito puder ser interpretado de mais de uma forma, esclareça. Se houver apenas uma interpretação razoável, não sobre-especifique. Detalhe excessivo restringe a implementação desnecessariamente.

Não prescreva detalhes de implementação, tecnologia ou arquitetura nesta fase.

Não gere código.

Salve a especificação em docs/RF06-spec.md

---

### Prompt 23

FASE 2: PLAN

Leia @docs/RF06-spec.md

Com base na especificação funcional aprovada, produza o plano técnico. Esta fase responde à pergunta "como devemos construir isso?".

Onde a especificação declara a intenção, o plano declara as restrições que a implementação deve respeitar.

O plano deve cobrir:
1 As tecnologias e frameworks apropriados ao problema
2 A arquitetura de componentes e suas fronteiras
3 Os modelos de dados e schemas
4 As interfaces: APIs, mensagens e contratos
5 Os requisitos não funcionais de desempenho, segurança e escalabilidade

Deixe explícitas as restrições que a implementação deverá obedecer.

Não gere código.

Salve o plano em docs/RF06-plan.md

---

### Prompt 24

FASE 3: IMPLEMENT

Leia @docs/RF06-spec.md e @docs/RF06-plan.md

Com base na especificação e no plano técnico aprovados, implemente o requisito.

Proceda assim:
1 Quebre o plano em tarefas discretas e revisáveis. Cada tarefa deve entregar uma parte funcional e testável. Salve essa lista em docs/RF06-tasks.md antes de começar a implementar
2 Implemente as tarefas em incrementos pequenos e validados, e não a especificação inteira de uma só vez
3 Verifique se o código produzido está alinhado à especificação e ao plano
4 Escreva testes unitários que codifiquem os requisitos da especificação como asserções executáveis

Ao final, atualize docs/RF06-tasks.md indicando o estado de cada tarefa.

---

### Prompt 25

FASE 4: VALIDATE

Leia @docs/RF06-spec.md e @docs/RF06-plan.md

Verifique se o código implementado atende de fato à especificação.

Execute:
1 Os testes automatizados nos níveis unitário, de integração e de aceite
2 Os cenários Given/When/Then da especificação contra a implementação real

---

### Prompt 26

FASE 1: SPECIFY

INTENÇÃO: Quero que o administrador do quadro consiga convidar e gerenciar membros com papéis diferentes, e atribuí-los a cards

Produza a especificação funcional desta intenção. A especificação deve responder à pergunta "o que o software deve fazer?", e não "como construir".

A especificação deve conter:
1 A descrição do comportamento esperado do sistema, do ponto de vista do usuário
2 Os critérios de aceite no formato Given/When/Then
3 As regras de negócio e restrições, capturadas explicitamente
4 Os casos de borda e as condições de erro, identificados agora e não descobertos durante a implementação

A especificação deve ser:

- focada em comportamento: descreve o que acontece, não como é feito
- testável: cada requisito precisa ser verificável
- não ambígua: leitores diferentes devem chegar à mesma interpretação
- completa o suficiente para cobrir os casos essenciais, sem sobre-especificar

Escreva no nível de detalhe necessário para remover a ambiguidade. Se um requisito puder ser interpretado de mais de uma forma, esclareça. Se houver apenas uma interpretação razoável, não sobre-especifique. Detalhe excessivo restringe a implementação desnecessariamente.

Não prescreva detalhes de implementação, tecnologia ou arquitetura nesta fase.

Não gere código.

Salve a especificação em docs/RF07-spec.md

---

### Prompt 27

FASE 2: PLAN

Leia @docs/RF07-spec.md

Com base na especificação funcional aprovada, produza o plano técnico. Esta fase responde à pergunta "como devemos construir isso?".

Onde a especificação declara a intenção, o plano declara as restrições que a implementação deve respeitar.

O plano deve cobrir:
1 As tecnologias e frameworks apropriados ao problema
2 A arquitetura de componentes e suas fronteiras
3 Os modelos de dados e schemas
4 As interfaces: APIs, mensagens e contratos
5 Os requisitos não funcionais de desempenho, segurança e escalabilidade

Deixe explícitas as restrições que a implementação deverá obedecer.

Não gere código.

Salve o plano em docs/RF07-plan.md

---

### Prompt 28

FASE 3: IMPLEMENT

Leia @docs/RF07-spec.md e @docs/RF07-plan.md

Com base na especificação e no plano técnico aprovados, implemente o requisito.

Proceda assim:
1 Quebre o plano em tarefas discretas e revisáveis. Cada tarefa deve entregar uma parte funcional e testável. Salve essa lista em docs/RF07-tasks.md antes de começar a implementar
2 Implemente as tarefas em incrementos pequenos e validados, e não a especificação inteira de uma só vez
3 Verifique se o código produzido está alinhado à especificação e ao plano
4 Escreva testes unitários que codifiquem os requisitos da especificação como asserções executáveis

Ao final, atualize docs/RF07-tasks.md indicando o estado de cada tarefa.

---

### Prompt 29

FASE 4: VALIDATE

Leia @docs/RF07-spec.md e @docs/RF07-plan.md

Verifique se o código implementado atende de fato à especificação.

Execute:
1 Os testes automatizados nos níveis unitário, de integração e de aceite
2 Os cenários Given/When/Then da especificação contra a implementação real

---

### Prompt 30

FASE 1: SPECIFY

INTENÇÃO: Quero que o usuário consiga criar etiquetas coloridas e filtrar os cards por elas

Produza a especificação funcional desta intenção. A especificação deve responder à pergunta "o que o software deve fazer?", e não "como construir".

A especificação deve conter:
1 A descrição do comportamento esperado do sistema, do ponto de vista do usuário
2 Os critérios de aceite no formato Given/When/Then
3 As regras de negócio e restrições, capturadas explicitamente
4 Os casos de borda e as condições de erro, identificados agora e não descobertos durante a implementação

A especificação deve ser:

- focada em comportamento: descreve o que acontece, não como é feito
- testável: cada requisito precisa ser verificável
- não ambígua: leitores diferentes devem chegar à mesma interpretação
- completa o suficiente para cobrir os casos essenciais, sem sobre-especificar

Escreva no nível de detalhe necessário para remover a ambiguidade. Se um requisito puder ser interpretado de mais de uma forma, esclareça. Se houver apenas uma interpretação razoável, não sobre-especifique. Detalhe excessivo restringe a implementação desnecessariamente.

Não prescreva detalhes de implementação, tecnologia ou arquitetura nesta fase.

Não gere código.

Salve a especificação em docs/RF08-spec.md

---

### Prompt 31

FASE 2: PLAN

Leia @docs/RF08-spec.md

Com base na especificação funcional aprovada, produza o plano técnico. Esta fase responde à pergunta "como devemos construir isso?".

Onde a especificação declara a intenção, o plano declara as restrições que a implementação deve respeitar.

O plano deve cobrir:
1 As tecnologias e frameworks apropriados ao problema
2 A arquitetura de componentes e suas fronteiras
3 Os modelos de dados e schemas
4 As interfaces: APIs, mensagens e contratos
5 Os requisitos não funcionais de desempenho, segurança e escalabilidade

Deixe explícitas as restrições que a implementação deverá obedecer.

Não gere código.

Salve o plano em docs/RF08-plan.md

---

### Prompt 32

FASE 3: IMPLEMENT

Leia @docs/RF08-spec.md e @docs/RF08-plan.md

Com base na especificação e no plano técnico aprovados, implemente o requisito.

Proceda assim:
1 Quebre o plano em tarefas discretas e revisáveis. Cada tarefa deve entregar uma parte funcional e testável. Salve essa lista em docs/RF08-tasks.md antes de começar a implementar
2 Implemente as tarefas em incrementos pequenos e validados, e não a especificação inteira de uma só vez
3 Verifique se o código produzido está alinhado à especificação e ao plano
4 Escreva testes unitários que codifiquem os requisitos da especificação como asserções executáveis

Ao final, atualize docs/RF08-tasks.md indicando o estado de cada tarefa.

---

### Prompt 33

FASE 4: VALIDATE

Leia @docs/RF08-spec.md e @docs/RF08-plan.md

Verifique se o código implementado atende de fato à especificação.

Execute:
1 Os testes automatizados nos níveis unitário, de integração e de aceite
2 Os cenários Given/When/Then da especificação contra a implementação real

---

### Prompt 34

FASE 1: SPECIFY

INTENÇÃO: Quero que o usuário consiga comentar nos cards e ver o histórico dos comentários

Produza a especificação funcional desta intenção. A especificação deve responder à pergunta "o que o software deve fazer?", e não "como construir".

A especificação deve conter:
1 A descrição do comportamento esperado do sistema, do ponto de vista do usuário
2 Os critérios de aceite no formato Given/When/Then
3 As regras de negócio e restrições, capturadas explicitamente
4 Os casos de borda e as condições de erro, identificados agora e não descobertos durante a implementação

A especificação deve ser:

- focada em comportamento: descreve o que acontece, não como é feito
- testável: cada requisito precisa ser verificável
- não ambígua: leitores diferentes devem chegar à mesma interpretação
- completa o suficiente para cobrir os casos essenciais, sem sobre-especificar

Escreva no nível de detalhe necessário para remover a ambiguidade. Se um requisito puder ser interpretado de mais de uma forma, esclareça. Se houver apenas uma interpretação razoável, não sobre-especifique. Detalhe excessivo restringe a implementação desnecessariamente.

Não prescreva detalhes de implementação, tecnologia ou arquitetura nesta fase.

Não gere código.

Salve a especificação em docs/RF09-spec.md

---

### Prompt 35

FASE 2: PLAN

Leia @docs/RF09-spec.md

Com base na especificação funcional aprovada, produza o plano técnico. Esta fase responde à pergunta "como devemos construir isso?".

Onde a especificação declara a intenção, o plano declara as restrições que a implementação deve respeitar.

O plano deve cobrir:
1 As tecnologias e frameworks apropriados ao problema
2 A arquitetura de componentes e suas fronteiras
3 Os modelos de dados e schemas
4 As interfaces: APIs, mensagens e contratos
5 Os requisitos não funcionais de desempenho, segurança e escalabilidade

Deixe explícitas as restrições que a implementação deverá obedecer.

Não gere código.

Salve o plano em docs/RF09-plan.md

---

### Prompt 36

FASE 3: IMPLEMENT

Leia @docs/RF09-spec.md e @docs/RF09-plan.md

Com base na especificação e no plano técnico aprovados, implemente o requisito.

Proceda assim:
1 Quebre o plano em tarefas discretas e revisáveis. Cada tarefa deve entregar uma parte funcional e testável. Salve essa lista em docs/RF09-tasks.md antes de começar a implementar
2 Implemente as tarefas em incrementos pequenos e validados, e não a especificação inteira de uma só vez
3 Verifique se o código produzido está alinhado à especificação e ao plano
4 Escreva testes unitários que codifiquem os requisitos da especificação como asserções executáveis

Ao final, atualize docs/RF09-tasks.md indicando o estado de cada tarefa.

---

### Prompt 37

FASE 4: VALIDATE

Leia @docs/RF09-spec.md e @docs/RF09-plan.md

Verifique se o código implementado atende de fato à especificação.

Execute:
1 Os testes automatizados nos níveis unitário, de integração e de aceite
2 Os cenários Given/When/Then da especificação contra a implementação real

---

### Prompt 38

FASE 1: SPECIFY

INTENÇÃO: Quero que o usuário consiga definir prazos nos cards e identificar quais estão atrasados

Produza a especificação funcional desta intenção. A especificação deve responder à pergunta "o que o software deve fazer?", e não "como construir".

A especificação deve conter:
1 A descrição do comportamento esperado do sistema, do ponto de vista do usuário
2 Os critérios de aceite no formato Given/When/Then
3 As regras de negócio e restrições, capturadas explicitamente
4 Os casos de borda e as condições de erro, identificados agora e não descobertos durante a implementação

A especificação deve ser:

- focada em comportamento: descreve o que acontece, não como é feito
- testável: cada requisito precisa ser verificável
- não ambígua: leitores diferentes devem chegar à mesma interpretação
- completa o suficiente para cobrir os casos essenciais, sem sobre-especificar

Escreva no nível de detalhe necessário para remover a ambiguidade. Se um requisito puder ser interpretado de mais de uma forma, esclareça. Se houver apenas uma interpretação razoável, não sobre-especifique. Detalhe excessivo restringe a implementação desnecessariamente.

Não prescreva detalhes de implementação, tecnologia ou arquitetura nesta fase.

Não gere código.

Salve a especificação em docs/RF10-spec.md

---

### Prompt 39

FASE 2: PLAN

Leia @docs/RF10-spec.md

Com base na especificação funcional aprovada, produza o plano técnico. Esta fase responde à pergunta "como devemos construir isso?".

Onde a especificação declara a intenção, o plano declara as restrições que a implementação deve respeitar.

O plano deve cobrir:
1 As tecnologias e frameworks apropriados ao problema
2 A arquitetura de componentes e suas fronteiras
3 Os modelos de dados e schemas
4 As interfaces: APIs, mensagens e contratos
5 Os requisitos não funcionais de desempenho, segurança e escalabilidade

Deixe explícitas as restrições que a implementação deverá obedecer.

Não gere código.

Salve o plano em docs/RF10-plan.md

---

### Prompt 40

FASE 3: IMPLEMENT

Leia @docs/RF10-spec.md e @docs/RF10-plan.md

Com base na especificação e no plano técnico aprovados, implemente o requisito.

Proceda assim:
1 Quebre o plano em tarefas discretas e revisáveis. Cada tarefa deve entregar uma parte funcional e testável. Salve essa lista em docs/RF10-tasks.md antes de começar a implementar
2 Implemente as tarefas em incrementos pequenos e validados, e não a especificação inteira de uma só vez
3 Verifique se o código produzido está alinhado à especificação e ao plano
4 Escreva testes unitários que codifiquem os requisitos da especificação como asserções executáveis

Ao final, atualize docs/RF10-tasks.md indicando o estado de cada tarefa.

---

### Prompt 41

FASE 4: VALIDATE

Leia @docs/RF10-spec.md e @docs/RF10-plan.md

Verifique se o código implementado atende de fato à especificação.

Execute:
1 Os testes automatizados nos níveis unitário, de integração e de aceite
2 Os cenários Given/When/Then da especificação contra a implementação real

---
