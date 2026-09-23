# RF03 — Gerenciamento de listas de um quadro

**Requisito:** RF03 — Criação, renomeação, reordenação e exclusão de listas (colunas) dentro de um quadro.
**História de usuário:** HU03 — Como usuário de um quadro, eu quero criar, renomear, reordenar e excluir listas, para que eu estruture as etapas do meu fluxo de trabalho.

**Depende de:**
- RF01, para sessão, proteção de acesso e sessão expirada;
- RF02, para acesso ao quadro, "Quadro não encontrado.", listas padrão e contagens da listagem.

As regras desses requisitos valem aqui sem repetição.

Telas de referência no protótipo: `prototipo/paginas/quadro.png` (listas no quadro), `prototipo/modais/criar-nova-lista.png` (janela de lista), `prototipo/modais/excluir-lista.png` (exclusão de lista com cards, detalhada no RF05).

---

## 1. Visão geral

Um quadro é organizado em listas dispostas lado a lado, da esquerda para a direita, cada uma representando uma etapa do fluxo de trabalho. O sistema deve permitir que o usuário com acesso ao quadro:

- veja as listas do quadro na ordem definida;
- adicione uma lista, escolhendo nome e posição;
- renomeie uma lista;
- mude a posição de uma lista em relação às demais;
- exclua uma lista vazia após confirmação.

### Conceitos

| Termo | Definição |
| --- | --- |
| Lista | Coluna de um quadro. Tem nome e posição, e pertence a exatamente um quadro. Contém cards (RF04). |
| Posição | Número de ordem da lista no quadro, contado a partir de 1 da esquerda para a direita. As posições de um quadro com N listas são sempre exatamente 1, 2, …, N, sem lacunas nem repetições. |
| Lista vazia | Lista sem nenhum card. |
| Janela "Lista" | Janela usada tanto para adicionar quanto para editar uma lista, com nome, posição e pré-visualização da ordem. |

### Relação com outros requisitos

- **RF02:** as listas padrão criadas junto com o quadro são listas comuns e seguem integralmente esta especificação. Excluir o quadro continua excluindo todas as suas listas.
- **RF04:** cards são criados, editados e movidos pelo RF04. Este requisito só exibe a quantidade de cards de cada lista e considera se a lista está vazia para decidir se ela pode ser excluída.
- **RF05:** define o que acontece ao excluir uma lista **que contém cards** (mover os cards, excluí-los junto ou bloquear). Enquanto o RF05 não existir, esse caso é tratado pela regra RN11 desta especificação. Quando existir, o RF05 substitui RN11, e as demais regras de exclusão daqui continuam valendo.
- **RF07:** até existirem membros e papéis, "usuário com acesso ao quadro" significa o dono do quadro (RF02, RN02). O RF07 definirá quais papéis podem gerenciar listas.

---

## 2. Comportamento esperado

### 2.1 Exibição das listas no quadro

Na página do quadro, abaixo do cabeçalho definido no RF02, o usuário vê:

- uma coluna para cada lista, da posição 1 (mais à esquerda) até a última;
- no topo de cada coluna, o nome da lista, a quantidade de cards que ela contém e as ações de editar e excluir;
- depois da última lista, à direita, a ação "Adicionar lista".

Quando as listas não cabem na largura da tela, a área das listas rola horizontalmente, e o cabeçalho do quadro permanece visível.

Um quadro sem listas mostra apenas a ação "Adicionar lista", acompanhada da mensagem "Este quadro ainda não tem listas. Adicione a primeira para começar.".

A ordem exibida é sempre a ordem salva: recarregar a página, abrir o quadro em outra aba ou em outro dispositivo mostra as listas na mesma ordem.

Depois de qualquer criação, edição ou exclusão feita pelo próprio usuário, o quadro reflete o resultado imediatamente, sem recarregar a página.

### 2.2 Adicionar lista

Ao acionar "Adicionar lista", abre-se a janela "Lista" com:

- campo "Nome da lista", vazio;
- seletor "Posição no quadro", com as opções de 1 a N+1, onde N é a quantidade atual de listas, e com N+1 (final do quadro) selecionado;
- uma pré-visualização da ordem resultante: todas as listas do quadro na ordem que terão depois de salvar, com a lista nova destacada na posição escolhida e exibindo o nome digitado, ou "Nova lista" enquanto o nome estiver vazio;
- botões "Cancelar" e "Salvar lista".

A pré-visualização acompanha, sem necessidade de salvar, cada alteração de nome e de posição. Ela serve só para leitura: não é possível reordenar arrastando itens dentro dela.

Ao salvar com dados válidos, a lista é criada vazia na posição escolhida, a janela fecha e a lista aparece no quadro nessa posição. As listas que estavam naquela posição ou depois dela avançam uma posição, mantendo a ordem relativa entre si.

Ao salvar com nome inválido, nada é criado, a janela permanece aberta com os dados preenchidos e a mensagem aparece junto ao campo de nome.

Cancelar, o botão de fechar, a tecla Esc e o clique fora da janela descartam a criação.

### 2.3 Editar lista: renomear e reordenar

Ao acionar editar em uma lista, abre-se a mesma janela "Lista" com:

- "Nome da lista" preenchido com o nome atual;
- "Posição no quadro" com as opções de 1 a N e a posição atual da lista selecionada;
- a pré-visualização da ordem resultante, com a lista editada destacada;
- botões "Cancelar" e "Salvar lista".

Na mesma janela, o usuário pode alterar só o nome, só a posição ou ambos, e salvar uma única vez.

Ao salvar com dados válidos:

- o nome passa a ser o novo;
- se a posição mudou, a lista é movida para a nova posição, e as listas entre a posição antiga e a nova se deslocam uma posição para preencher o espaço, mantendo a ordem relativa entre si;
- a janela fecha e o quadro exibe o resultado.

Salvar sem ter alterado nada é aceito e não produz erro nem muda a ordem.

Ao salvar com nome inválido, nada é alterado (nem o nome, nem a posição), a janela permanece aberta e a mensagem aparece junto ao campo.

Cancelar, fechar, Esc ou clique fora descartam as alterações.

Editar ou mover uma lista não altera os cards que ela contém.

### 2.4 Excluir lista

Ao acionar excluir em uma lista **vazia**, abre-se uma janela de confirmação que:

- identifica a lista pelo nome, no título "Excluir a lista "{nome}"?";
- informa que a ação não pode ser desfeita;
- oferece "Cancelar" e "Excluir lista", este último destacado como ação destrutiva.

Ao confirmar, a lista é excluída, a janela fecha, a coluna desaparece do quadro e as listas à direita dela recuam uma posição. Ao cancelar, nada muda.

Ao acionar excluir em uma lista **que contém cards**, aplica-se RN11.

Não existe lixeira nem recuperação de lista excluída.

### 2.5 Feedback durante as operações

Durante a criação, a edição ou a exclusão, o botão de confirmação indica que a operação está em andamento e impede novo envio. Um duplo clique não cria duas listas nem aplica duas vezes a mesma movimentação ou exclusão.

---

## 3. Critérios de aceite (Given/When/Then)

Em todos os critérios, salvo indicação contrária, estou autenticado e sou o dono do quadro "Sprint", que contém as listas "A fazer" (1), "Em progresso" (2) e "Concluído" (3), todas vazias.

### Exibição

**CA01 — Listas na ordem**
- **Quando** abro o quadro "Sprint"
- **Então** vejo as colunas "A fazer", "Em progresso" e "Concluído", nessa ordem da esquerda para a direita, cada uma com seu nome, a quantidade "0" de cards e as ações de editar e excluir, e vejo "Adicionar lista" depois de "Concluído".

**CA02 — Quantidade de cards por lista**
- **Dado** que "Em progresso" contém 2 cards
- **Quando** abro o quadro
- **Então** o topo de "Em progresso" exibe a quantidade "2" e as demais listas exibem "0".

**CA03 — Quadro sem listas**
- **Dado** que o quadro "Vazio" não tem listas
- **Quando** abro o quadro "Vazio"
- **Então** vejo a mensagem "Este quadro ainda não tem listas. Adicione a primeira para começar." e a ação "Adicionar lista", e nenhum erro.

**CA04 — Ordem persistida**
- **Dado** que reordenei as listas
- **Quando** recarrego a página ou abro o quadro em outra aba
- **Então** as listas aparecem na ordem salva.

### Adicionar lista

**CA05 — Janela de adição com valores padrão**
- **Quando** aciono "Adicionar lista"
- **Então** a janela "Lista" abre com o nome vazio, o seletor de posição com as opções 1, 2, 3 e 4 e o valor 4 selecionado, e a pré-visualização mostra "A fazer", "Em progresso", "Concluído" e, destacada na quarta posição, "Nova lista".

**CA06 — Pré-visualização acompanha o formulário**
- **Dado** que a janela de adição está aberta
- **Quando** digito "Revisão" e escolho a posição 3
- **Então**, sem salvar, a pré-visualização mostra "A fazer", "Em progresso", "Revisão" (destacada) e "Concluído".

**CA07 — Adicionar no final**
- **Dado** que a janela de adição está aberta
- **Quando** informo "Arquivo", mantenho a posição 4 e salvo
- **Então** a janela fecha e o quadro mostra "A fazer", "Em progresso", "Concluído" e "Arquivo", com "Arquivo" vazia.

**CA08 — Adicionar no meio**
- **Dado** que a janela de adição está aberta
- **Quando** informo "Revisão", escolho a posição 3 e salvo
- **Então** o quadro mostra "A fazer", "Em progresso", "Revisão" e "Concluído", nessa ordem.

**CA09 — Adicionar no início**
- **Dado** que a janela de adição está aberta
- **Quando** informo "Backlog", escolho a posição 1 e salvo
- **Então** o quadro mostra "Backlog", "A fazer", "Em progresso" e "Concluído", nessa ordem.

**CA10 — Primeira lista de um quadro vazio**
- **Dado** que o quadro "Vazio" não tem listas
- **Quando** aciono "Adicionar lista", vejo o seletor apenas com a opção 1, informo "A fazer" e salvo
- **Então** o quadro "Vazio" passa a exibir a lista "A fazer" e a mensagem de quadro sem listas desaparece.

**CA11 — Nome obrigatório na adição**
- **Dado** que a janela de adição está aberta
- **Quando** salvo com o nome vazio ou só com espaços
- **Então** nenhuma lista é criada, a janela continua aberta e vejo "Campo obrigatório." junto ao nome.

**CA12 — Nome longo demais**
- **Dado** que a janela de adição está aberta
- **Quando** salvo com um nome de 51 caracteres
- **Então** nenhuma lista é criada e vejo "O nome da lista deve ter no máximo 50 caracteres." junto ao nome.

**CA13 — Espaços nas extremidades do nome**
- **Quando** adiciono uma lista com o nome "  Revisão  "
- **Então** a lista é criada com o nome "Revisão".

**CA14 — Nomes repetidos no mesmo quadro**
- **Quando** adiciono outra lista chamada "A fazer"
- **Então** a lista é criada, e o quadro passa a ter duas listas distintas com esse nome.

**CA15 — Cancelar adição**
- **Dado** que a janela de adição está aberta e preenchida
- **Quando** aciono "Cancelar", o botão de fechar, a tecla Esc ou clico fora da janela
- **Então** a janela fecha, nenhuma lista é criada e, ao reabri-la, ela volta aos valores padrão do CA05.

**CA16 — Duplo envio na adição**
- **Dado** que a janela de adição está preenchida com dados válidos
- **Quando** aciono "Salvar lista" duas vezes seguidas
- **Então** exatamente uma lista é criada.

**CA17 — Contagem na listagem de quadros**
- **Dado** que adicionei uma lista ao quadro "Sprint"
- **Quando** volto para "Meus quadros"
- **Então** o cartão de "Sprint" informa "4 listas".

### Editar lista

**CA18 — Janela de edição preenchida**
- **Quando** aciono editar em "Em progresso"
- **Então** a janela "Lista" abre com o nome "Em progresso", o seletor de posição com as opções 1, 2 e 3 e o valor 2 selecionado, e a pré-visualização mostra a ordem atual com "Em progresso" destacada.

**CA19 — Renomear**
- **Dado** que a janela de edição de "Em progresso" está aberta
- **Quando** altero o nome para "Fazendo" e salvo
- **Então** a janela fecha e o quadro mostra "A fazer", "Fazendo" e "Concluído", na mesma ordem.

**CA20 — Mover para a direita**
- **Dado** que a janela de edição de "A fazer" está aberta
- **Quando** escolho a posição 3 e salvo
- **Então** o quadro mostra "Em progresso", "Concluído" e "A fazer", nessa ordem.

**CA21 — Mover para a esquerda**
- **Dado** que a janela de edição de "Concluído" está aberta
- **Quando** escolho a posição 1 e salvo
- **Então** o quadro mostra "Concluído", "A fazer" e "Em progresso", nessa ordem.

**CA22 — Renomear e mover de uma vez**
- **Dado** que a janela de edição de "A fazer" está aberta
- **Quando** altero o nome para "Backlog", escolho a posição 2 e salvo
- **Então** o quadro mostra "Em progresso", "Backlog" e "Concluído", nessa ordem.

**CA23 — Pré-visualização na edição**
- **Dado** que a janela de edição de "A fazer" está aberta
- **Quando** escolho a posição 3, sem salvar
- **Então** a pré-visualização mostra "Em progresso", "Concluído" e "A fazer" (destacada), e o quadro ao fundo continua na ordem original.

**CA24 — Salvar sem alterações**
- **Dado** que a janela de edição de "Em progresso" está aberta
- **Quando** salvo sem alterar nada
- **Então** a janela fecha sem erro e o quadro continua igual.

**CA25 — Nome inválido na edição não altera nada**
- **Dado** que a janela de edição de "A fazer" está aberta
- **Quando** apago o nome, escolho a posição 3 e salvo
- **Então** vejo "Campo obrigatório." junto ao nome, a janela continua aberta e, ao cancelar, o quadro continua com "A fazer" na posição 1.

**CA26 — Cancelar edição**
- **Dado** que a janela de edição de "A fazer" está aberta e alterei nome e posição
- **Quando** cancelo, fecho, pressiono Esc ou clico fora da janela
- **Então** a lista continua chamada "A fazer" na posição 1.

**CA27 — Edição preserva os cards**
- **Dado** que "A fazer" contém 3 cards
- **Quando** renomeio "A fazer" e a movo para a posição 3
- **Então** a lista continua com os mesmos 3 cards.

### Excluir lista

**CA28 — Confirmação de exclusão de lista vazia**
- **Quando** aciono excluir em "Em progresso", que está vazia
- **Então** vejo a janela com o título "Excluir a lista "Em progresso"?", a informação de que a ação não pode ser desfeita e os botões "Cancelar" e "Excluir lista".

**CA29 — Excluir lista vazia**
- **Dado** que a janela de confirmação de "Em progresso" está aberta
- **Quando** confirmo
- **Então** a janela fecha e o quadro mostra "A fazer" e "Concluído", com "Concluído" agora na posição 2.

**CA30 — Posições após exclusão**
- **Dado** que excluí "A fazer"
- **Quando** aciono "Adicionar lista"
- **Então** o seletor de posição oferece as opções 1, 2 e 3, e editar "Em progresso" mostra a posição 1 selecionada.

**CA31 — Cancelar exclusão**
- **Dado** que a janela de confirmação de "Em progresso" está aberta
- **Quando** cancelo, fecho, pressiono Esc ou clico fora da janela
- **Então** "Em progresso" continua no quadro, na posição 2.

**CA32 — Duplo envio na exclusão**
- **Dado** que a janela de confirmação de "Em progresso" está aberta
- **Quando** aciono "Excluir lista" duas vezes seguidas
- **Então** "Em progresso" é excluída uma única vez, nenhuma outra lista é afetada e nenhuma mensagem de erro é exibida.

**CA33 — Lista com cards não é excluída (enquanto não houver RF05)**
- **Dado** que "Em progresso" contém 2 cards
- **Quando** aciono excluir em "Em progresso"
- **Então** nenhuma lista nem card é excluído e vejo a mensagem "Esta lista contém cards e não pode ser excluída. Mova ou exclua os cards antes.".

**CA34 — Excluir a última lista restante**
- **Dado** que o quadro "Solo" tem apenas a lista vazia "Única"
- **Quando** excluo "Única"
- **Então** o quadro "Solo" passa a exibir o estado de quadro sem listas do CA03.

### Proteção

**CA35 — Listas de quadro de outra conta**
- **Dado** que a conta B possui o quadro "Beta" com a lista "X"
- **Quando**, autenticado como A, tento criar, editar, mover ou excluir listas de "Beta" por qualquer meio
- **Então** a operação é recusada com "Quadro não encontrado.", e "Beta" e suas listas permanecem inalterados.

**CA36 — Lista de outro quadro**
- **Dado** que possuo os quadros "Sprint" e "Outro", e "Outro" tem a lista "Y"
- **Quando** tento editar, mover ou excluir "Y" como se ela pertencesse a "Sprint"
- **Então** a operação é recusada com "Lista não encontrada.", e "Y" e as listas de "Sprint" permanecem inalteradas.

**CA37 — Sessão expirada durante uma operação**
- **Dado** que a janela de adição, edição ou exclusão está aberta e minha sessão expirou
- **Quando** confirmo a operação
- **Então** a operação não é executada e o sistema segue o comportamento de sessão expirada do RF01.

---

## 4. Regras de negócio e restrições

**RN01 — Pertencimento.** Toda lista pertence a exatamente um quadro, definido na criação. Uma lista nunca muda de quadro.

**RN02 — Acesso.** Só quem tem acesso ao quadro (RF02, RN02) pode ver, criar, editar, mover e excluir as listas dele. Para quem não tem acesso, o quadro e suas listas são indistinguíveis de inexistentes (RF02, RN03).

**RN03 — Nome.** Obrigatório. Espaços nas extremidades são removidos antes de validar e salvar; espaços internos são preservados. Após a remoção, deve ter entre 1 e 50 caracteres. Qualquer caractere é aceito e é exibido como texto literal. A contagem de caracteres usa a mesma regra adotada para o nome do quadro no RF02.

**RN04 — Nomes não são únicos.** Um quadro pode ter várias listas com o mesmo nome. Listas são distinguidas por identidade, não por nome.

**RN05 — Posições contíguas.** Em qualquer momento, as posições das N listas de um quadro são exatamente 1, 2, …, N. Nenhuma operação pode deixar lacuna, repetição ou posição fora desse intervalo, inclusive quando operações do mesmo quadro chegam ao mesmo tempo.

**RN06 — Inserção.** Criar uma lista na posição P (1 ≤ P ≤ N+1) faz as listas das posições P a N avançarem uma posição. A ordem relativa das demais listas não muda.

**RN07 — Movimentação.** Mover uma lista da posição A para a posição B (1 ≤ B ≤ N):
- se B > A, as listas das posições A+1 a B recuam uma posição;
- se B < A, as listas das posições B a A−1 avançam uma posição;
- se B = A, nada muda.

A ordem relativa das demais listas não muda.

**RN08 — Remoção.** Excluir a lista da posição P faz as listas das posições P+1 a N recuarem uma posição.

**RN09 — Posição fora do intervalo.** Se a posição solicitada for maior que o máximo válido no momento em que a operação é processada (N+1 na criação, N na edição), a lista vai para a última posição válida. Uma posição menor que 1 ou que não seja um número inteiro é recusada sem alterar nada. A primeira situação acontece quando outra aba removeu listas; a segunda só acontece por manipulação da requisição.

**RN10 — Atomicidade.** Cada criação, edição ou exclusão, incluindo o deslocamento das demais listas, acontece por completo ou não acontece. Nunca fica visível um estado intermediário com posições inconsistentes.

**RN11 — Exclusão de lista com cards (provisória até o RF05).** Uma lista que contém ao menos um card não pode ser excluída. A verificação é feita no momento da exclusão, e não com base no que a tela mostrava: se a lista recebeu cards depois que a janela de confirmação foi aberta, a exclusão é recusada com a mesma mensagem do CA33. O RF05 substituirá esta regra.

**RN12 — Exclusão exige confirmação.** Nenhuma lista é excluída sem confirmação explícita.

**RN13 — Campos editáveis.** Só nome e posição podem ser alterados. Quadro de origem e data de criação são imutáveis.

**RN14 — Sem limite de quantidade.** Não há quantidade máxima de listas por quadro neste requisito.

**RN15 — Exclusão idempotente para o usuário.** Pedir a exclusão de uma lista que não existe mais no quadro, por exemplo por ter sido excluída em outra aba, não gera erro visível: a lista some da tela.

**RN16 — Contagens do quadro.** Criar ou excluir listas altera a quantidade de listas exibida no cartão do quadro em "Meus quadros" (RF02, RN10) na próxima vez que a listagem for carregada.

---

## 5. Casos de borda e condições de erro

### 5.1 Entrada de dados

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB01 | Nome com 1 caractere | Aceito. |
| CB02 | Nome com exatamente 50 caracteres após remover espaços das extremidades | Aceito. |
| CB03 | Nome com 51 caracteres ou mais após remover espaços das extremidades | Recusado com a mensagem de limite. |
| CB04 | Nome com acentos, emojis ou símbolos | Aceito e exibido como digitado. |
| CB05 | Nome contendo marcação HTML ou trecho de script | Salvo e exibido como texto literal, nunca interpretado. |
| CB06 | Nome com vários espaços internos seguidos | Preservado como digitado. |
| CB07 | Posição ausente na criação, enviada por manipulação da requisição | Tratada como final do quadro (N+1). |
| CB08 | Posição ausente na edição, enviada por manipulação da requisição | Posição atual mantida; só o nome é aplicado. |
| CB09 | Posição 0, negativa, fracionária ou não numérica | Operação recusada; nada é criado ou alterado. |
| CB10 | Tentativa de mudar a lista de quadro, ou a data de criação, por manipulação da requisição | Valores ignorados; só nome e posição são considerados. |
| CB11 | Nome muito longo colado no campo | O campo aceita o texto e a validação do limite informa o erro ao salvar; o texto não é cortado silenciosamente. |

### 5.2 Concorrência e estado desatualizado

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB12 | Duas abas adicionam listas no mesmo quadro ao mesmo tempo | Ambas são criadas, com posições contíguas e sem repetição (RN05). Cada aba exibe a ordem salva depois da própria operação. |
| CB13 | O usuário escolhe a posição 5 na aba A, mas outra aba excluiu listas e o quadro agora tem 2 | A operação usa a última posição válida (RN09) e a aba A passa a exibir a ordem salva. |
| CB14 | A lista foi excluída em outra aba e o usuário tenta editá-la ou movê-la | Mensagem "Lista não encontrada."; a janela fecha e a lista some da tela. |
| CB15 | A lista foi excluída em outra aba e o usuário confirma a exclusão dela | Tratado como sucesso (RN15); a lista some da tela. |
| CB16 | A lista foi renomeada ou movida em outra aba e o usuário salva uma edição na aba desatualizada | A última edição salva prevalece para o nome. A posição escolhida é aplicada sobre a ordem atual salva, e não sobre a ordem que a aba desatualizada mostrava. Nenhum erro é exibido, e a tela passa a exibir a ordem salva. |
| CB17 | Uma operação sobre listas é feita em um quadro excluído em outra aba | Mensagem "Quadro não encontrado." com caminho para voltar a "Meus quadros" (RF02, CB14). |
| CB18 | Após qualquer operação, a ordem salva difere da ordem que a tela mostrava por causa de outra aba | A tela passa a exibir a ordem salva do quadro inteiro, e não apenas a lista afetada. |

### 5.3 Falhas

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CE01 | Falha de comunicação ao adicionar ou editar | A janela permanece aberta com os dados preenchidos e a mensagem genérica; o quadro não muda. |
| CE02 | Falha de comunicação ao excluir | A janela de confirmação permanece aberta com a mensagem genérica; a lista continua no quadro. |
| CE03 | Falha no meio do deslocamento das posições | Nada é alterado (RN10) e a mensagem genérica é exibida. |
| CE04 | Erro inesperado em qualquer operação | A mensagem não revela detalhes internos. |

### 5.4 Mensagens ao usuário

A redação pode variar desde que o significado seja preservado e a mesma situação produza sempre a mesma mensagem. Mensagens de sessão seguem o RF01; mensagens de quadro seguem o RF02.

| Situação | Mensagem |
| --- | --- |
| Nome vazio | "Campo obrigatório." |
| Nome acima de 50 caracteres | "O nome da lista deve ter no máximo 50 caracteres." |
| Posição inválida | "Selecione uma posição válida." |
| Lista inexistente ou de outro quadro | "Lista não encontrada." |
| Quadro sem listas | "Este quadro ainda não tem listas. Adicione a primeira para começar." |
| Título da confirmação de exclusão | "Excluir a lista "{nome}"?" |
| Corpo da confirmação de exclusão | "Esta ação não pode ser desfeita." |
| Lista com cards (RN11) | "Esta lista contém cards e não pode ser excluída. Mova ou exclua os cards antes." |
| Falha de comunicação ou erro inesperado | "Não foi possível concluir a operação. Tente novamente." |

---

## 6. Fora de escopo

- reordenar listas arrastando, no quadro ou na pré-visualização da janela;
- mover os cards para outra lista ou excluí-los junto com a lista (RF05);
- criar, editar, mover e excluir cards, e exibir o conteúdo dos cards (RF04);
- mover listas entre quadros, copiar listas, arquivar ou restaurar listas;
- limite de cards por lista, cor de lista e recolher ou expandir colunas;
- restrições por papel de membro (RF07);
- etiquetas, filtros e ordenação de cards (RF08, RF10);
- atualização em tempo real entre abas ou dispositivos: outras abas só refletem mudanças ao recarregar ou ao executar uma operação (CB18).
