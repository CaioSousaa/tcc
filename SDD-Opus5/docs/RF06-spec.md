# RF06 — Checklist do card e progresso

**Requisito:** RF06 — Criação de checklists dentro de um card, com itens marcáveis como concluídos e cálculo automático do percentual de progresso exibido no próprio card.
**História de usuário:** HU06 — Como responsável por um card, eu quero adicionar checklists com itens marcáveis, para que eu visualize o progresso da tarefa diretamente no card.

**Depende de:**
- **RF01:** sessão e sessão expirada;
- **RF02:** acesso ao quadro e "Quadro não encontrado.";
- **RF04:** cards, janela do card, face do card e "Card não encontrado.";
- **RF05:** exclusão de lista com cards (mover ou excluir em cascata).

As regras desses requisitos valem aqui sem repetição.

Telas de referência no protótipo: `prototipo/modais/detalhe-card.png` (seção "Checklist" da janela do card) e `prototipo/paginas/quadro.png` (barra de progresso e contagem na face do card).

---

## 1. Visão geral

Cada card pode ter uma checklist: uma lista ordenada de itens de texto, cada um marcável como concluído ou não. O sistema calcula automaticamente o progresso da checklist e o exibe:
- na janela do card, com a contagem, o percentual e uma barra;
- na face do card, dentro da lista, com a contagem e uma barra, sem precisar abrir o card.

O usuário com acesso ao quadro pode, na janela do card:
- adicionar itens;
- marcar e desmarcar itens como concluídos;
- editar o texto de um item;
- excluir itens.

### Conceitos

| Termo | Definição |
| --- | --- |
| Checklist | Conjunto ordenado de itens de um card. Cada card tem **exatamente uma** checklist, que começa vazia. "Adicionar checklist" significa adicionar o primeiro item. |
| Item | Entrada da checklist, com texto e estado (concluído ou não concluído). Pertence a exatamente um card. |
| Total | Quantidade de itens da checklist do card. |
| Concluídos | Quantidade de itens marcados como concluídos. |
| Progresso | Percentual `concluídos ÷ total × 100`, **arredondado para baixo** até o inteiro. Só existe quando o total é maior que zero. |
| Checklist completa | Checklist com total maior que zero e todos os itens concluídos (progresso 100%). |

### Salvamento imediato

As ações da checklist (adicionar, marcar, desmarcar, editar texto e excluir item) são **salvas no momento em que são feitas**, independentemente do botão "Salvar card" do RF04. Por isso:
- fechar a janela do card sem salvar descarta só as alterações pendentes de título, descrição, lista e posição (RF04, CA24), nunca as ações de checklist já feitas;
- "Salvar card" não envia nem altera a checklist.

### Relação com outros requisitos

- **RF04:** a janela e a face do card ganham os elementos da checklist. Mover o card entre listas ou posições preserva a checklist, e excluir o card exclui a checklist.
- **RF05:** mover os cards de uma lista excluída preserva a checklist de cada card; excluir em cascata exclui a checklist junto.
- **RF07:** até existirem papéis, "usuário com acesso ao quadro" é o dono. O RF07 definirá quais papéis podem alterar checklists.
- **RF10:** o prazo do card não depende do progresso da checklist.

---

## 2. Comportamento esperado

### 2.1 Seção "Checklist" na janela do card

Na janela do card, abaixo da "Descrição", aparece a seção **"Checklist"**. Ela é carregada junto com o card, e o seu estado de carregamento e de erro é o da janela do card (RF04).

**Com pelo menos um item**, a seção exibe:
- no cabeçalho, o título "Checklist" e o texto **"{concluídos}/{total} concluídos · {progresso}%"**, por exemplo "2/4 concluídos · 50%";
- uma barra de progresso preenchida na proporção do progresso;
- os itens, na ordem em que foram adicionados, cada um com:
  - uma caixa de marcação;
  - o texto do item, riscado quando o item está concluído;
  - a ação de excluir o item;
- ao final, a ação **"+ Adicionar item"**.

**Sem itens**, a seção exibe o título "Checklist", o texto "Nenhum item ainda." e a ação "+ Adicionar item". Não há barra, contagem nem percentual.

### 2.2 Adicionar item

Ao acionar "+ Adicionar item", aparece no final da seção um campo **"Texto do item"** já focado, com os botões "Adicionar" e "Cancelar".

- Confirmar com texto válido, pelo botão ou pela tecla Enter, adiciona o item **no final** da checklist, **não concluído**. O campo continua aberto, vazio e focado, pronto para o próximo item.
- Confirmar com texto inválido não adiciona nada; o texto digitado permanece e a mensagem aparece junto ao campo.
- "Cancelar" ou a tecla Esc fecham o campo e descartam o texto. Nesse caso, a tecla Esc fecha só o campo, e não a janela do card.

Um novo item atualiza imediatamente a contagem, o percentual e a barra da seção e da face do card.

### 2.3 Marcar e desmarcar

Clicar na caixa de marcação de um item, ou no texto do item, alterna o estado entre concluído e não concluído.
- A mudança é salva imediatamente.
- O texto passa a aparecer riscado, ou deixa de aparecer.
- Contagem, percentual e barra são atualizados na seção e na face do card.

O pedido registra o **estado desejado** ("concluído" ou "não concluído") que o usuário viu ao clicar, e não uma inversão cega. Assim, dois pedidos iguais seguidos deixam o item no mesmo estado.

### 2.4 Editar o texto de um item

Clicar no botão de editar de um item (ícone de lápis, exibido ao lado do texto) troca o texto por um campo preenchido com o texto atual, com os botões "Salvar" e "Cancelar".
- Confirmar com texto válido, pelo botão ou por Enter, salva o novo texto e volta à exibição normal.
- O estado concluído e a posição do item não mudam.
- Confirmar com texto inválido mantém o campo aberto com a mensagem.
- "Cancelar" ou Esc descartam a edição.

Só um item fica em edição por vez. Abrir a edição de outro item, ou o campo de adicionar item, descarta a edição em andamento.

### 2.5 Excluir item

A ação de excluir de um item o remove imediatamente, **sem pedir confirmação**. Contagem, percentual e barra são atualizados. Se o último item for excluído, a seção volta ao estado sem itens e a face do card deixa de mostrar progresso.

### 2.6 Progresso na face do card

Na face do card, abaixo do título:
- **Total maior que zero:** barra de progresso e o texto "{concluídos}/{total}", por exemplo "1/4".
- **Checklist completa:** a barra fica totalmente preenchida e em cor de concluído (verde), e o texto continua no formato "{total}/{total}".
- **Sem itens:** nada é exibido.

A barra da face tem nome acessível no formato "Checklist: {concluídos} de {total} itens concluídos ({progresso}%)".

A face reflete toda ação de checklist feita na janela assim que a ação é salva, sem recarregar a página e sem fechar a janela.

### 2.7 Feedback e bloqueio de envio repetido

- Enquanto um item está sendo adicionado ou editado, o botão de confirmação indica andamento e impede novo envio.
- Enquanto a marcação de um item ou a sua exclusão é processada, os controles daquele item ficam indisponíveis. Os demais itens continuam utilizáveis.
- Um duplo clique em "Adicionar" ou dois Enter seguidos não criam dois itens.
- Um duplo clique rápido na caixa de marcação resulta em uma única alternância.

---

## 3. Critérios de aceite (Given/When/Then)

Salvo indicação contrária, estou autenticado, sou o dono do quadro "Sprint" e estou com a janela do card "Refatorar filtros", da lista "Em progresso", aberta. A checklist tem, nesta ordem:
- "Extrair hook" (concluído);
- "Persistir filtro na URL" (concluído);
- "Cobrir com testes" (não concluído);
- "Revisar acessibilidade" (não concluído).

### Exibição

**CA01 — Seção com itens**
- **Então** a seção "Checklist" exibe "2/4 concluídos · 50%", a barra preenchida pela metade e os quatro itens nessa ordem, com os dois primeiros marcados e riscados.

**CA02 — Seção sem itens**
- **Dado** que o card "Novo" não tem itens
- **Quando** abro a janela de "Novo"
- **Então** a seção "Checklist" exibe "Nenhum item ainda." e "+ Adicionar item", sem barra, contagem ou percentual.

**CA03 — Face do card com progresso**
- **Quando** olho a face de "Refatorar filtros" no quadro
- **Então** ela exibe a barra com metade preenchida e o texto "2/4".

**CA04 — Face do card sem itens**
- **Dado** que o card "Novo" não tem itens
- **Então** a face de "Novo" não exibe barra nem contagem.

**CA05 — Checklist completa na face**
- **Dado** que o card "Pronto" tem 5 itens, todos concluídos
- **Então** a face de "Pronto" exibe a barra totalmente preenchida na cor de concluído e o texto "5/5".

**CA06 — Arredondamento para baixo**
- **Dado** que um card tem 3 itens, 2 concluídos
- **Quando** abro a janela do card
- **Então** a seção exibe "2/3 concluídos · 66%".

**CA07 — Progresso persistido**
- **Dado** que marquei, desmarquei, adicionei e excluí itens
- **Quando** recarrego a página e reabro o card, ou abro o quadro em outra aba
- **Então** a checklist, a contagem e a face exibem o estado salvo.

### Adicionar

**CA08 — Adicionar item**
- **Quando** aciono "+ Adicionar item", digito "Atualizar docs" e aciono "Adicionar"
- **Então** "Atualizar docs" aparece como quinto item, não concluído, a seção exibe "2/5 concluídos · 40%", a face do card exibe "2/5" e o campo continua aberto, vazio e focado.

**CA09 — Adicionar vários com Enter**
- **Dado** que o campo de adicionar item está aberto
- **Quando** digito "A" e pressiono Enter, depois digito "B" e pressiono Enter
- **Então** "A" e "B" aparecem, nessa ordem, no final da checklist.

**CA10 — Primeiro item de um card**
- **Dado** que a janela do card "Novo", sem itens, está aberta
- **Quando** adiciono o item "Começar"
- **Então** a seção passa a exibir "0/1 concluídos · 0%" com a barra vazia, e a face de "Novo" passa a exibir "0/1".

**CA11 — Texto obrigatório**
- **Dado** que o campo de adicionar item está aberto
- **Quando** confirmo vazio ou só com espaços
- **Então** nenhum item é adicionado e vejo "Campo obrigatório." junto ao campo.

**CA12 — Texto longo demais**
- **Quando** confirmo um item com 201 caracteres
- **Então** nenhum item é adicionado, o texto permanece no campo e vejo "O item deve ter no máximo 200 caracteres.".

**CA13 — Normalização do texto**
- **Quando** adiciono o item "  Revisar   PR  " ou o texto colado "Linha 1", quebra de linha, "Linha 2"
- **Então** os itens são salvos como "Revisar   PR" e "Linha 1 Linha 2".

**CA14 — Cancelar adição**
- **Dado** que o campo de adicionar item está aberto com o texto "Rascunho"
- **Quando** aciono "Cancelar" ou pressiono Esc
- **Então** o campo fecha, nenhum item é adicionado e a janela do card continua aberta.

**CA15 — Duplo envio**
- **Dado** que o campo de adicionar item contém "Único"
- **Quando** aciono "Adicionar" duas vezes seguidas, ou pressiono Enter duas vezes seguidas
- **Então** exatamente um item "Único" é adicionado.

**CA16 — Textos repetidos**
- **Quando** adiciono outro item "Extrair hook"
- **Então** o item é adicionado, e a checklist passa a ter dois itens distintos com esse texto.

### Marcar e desmarcar

**CA17 — Marcar**
- **Quando** marco "Cobrir com testes"
- **Então** o item aparece marcado e riscado, a seção exibe "3/4 concluídos · 75%" e a face exibe "3/4".

**CA18 — Desmarcar**
- **Quando** desmarco "Extrair hook"
- **Então** o item deixa de aparecer riscado, a seção exibe "1/4 concluídos · 25%" e a face exibe "1/4".

**CA19 — Completar a checklist**
- **Quando** marco "Cobrir com testes" e "Revisar acessibilidade"
- **Então** a seção exibe "4/4 concluídos · 100%" e a face exibe "4/4" com a barra cheia na cor de concluído.

**CA20 — Marcar pelo texto**
- **Quando** clico no texto "Revisar acessibilidade"
- **Então** o item é marcado, como no CA17.

**CA21 — Duplo clique na marcação**
- **Quando** clico duas vezes rapidamente na caixa de "Cobrir com testes"
- **Então** o item termina marcado, e a seção exibe "3/4 concluídos · 75%".

### Editar

**CA22 — Editar texto**
- **Quando** aciono editar em "Cobrir com testes", altero para "Cobrir com testes de unidade" e salvo
- **Então** o item exibe o novo texto, continua não concluído e na mesma posição, e a contagem não muda.

**CA23 — Editar item concluído**
- **Quando** edito "Extrair hook" para "Extrair hook useLabelFilter"
- **Então** o item continua concluído e riscado.

**CA24 — Texto inválido na edição**
- **Quando** apago todo o texto de "Extrair hook" e salvo
- **Então** o campo continua aberto com "Campo obrigatório." e, ao cancelar, o item continua "Extrair hook".

**CA25 — Cancelar edição**
- **Quando** aciono editar em "Extrair hook", altero o texto e pressiono Esc
- **Então** a edição fecha, o item continua "Extrair hook" e a janela do card continua aberta.

**CA26 — Uma edição por vez**
- **Dado** que estou editando "Extrair hook" com texto alterado
- **Quando** aciono editar em "Cobrir com testes"
- **Então** a edição de "Extrair hook" é descartada sem salvar, e só "Cobrir com testes" fica em edição.

### Excluir

**CA27 — Excluir item**
- **Quando** excluo "Persistir filtro na URL"
- **Então** o item desaparece sem pedido de confirmação, a seção exibe "1/3 concluídos · 33%" e a face exibe "1/3".

**CA28 — Excluir o último item**
- **Dado** que o card "Único item" tem apenas "Fazer", não concluído
- **Quando** excluo "Fazer"
- **Então** a seção exibe "Nenhum item ainda." e a face do card deixa de exibir progresso.

### Independência do "Salvar card"

**CA29 — Fechar sem salvar mantém a checklist**
- **Dado** que alterei o título do card sem salvar e marquei "Cobrir com testes"
- **Quando** fecho a janela sem salvar
- **Então** o título continua o original e "Cobrir com testes" continua marcado.

**CA30 — Salvar card não altera a checklist**
- **Dado** que marquei "Cobrir com testes"
- **Quando** altero a descrição e aciono "Salvar card"
- **Então** a descrição é salva e a checklist continua com "3/4 concluídos".

### Card movido ou excluído

**CA31 — Mover card preserva a checklist**
- **Quando** movo "Refatorar filtros" para "Concluído" (RF04)
- **Então**, em "Concluído", a face exibe "2/4", e a janela mostra os mesmos quatro itens com os mesmos estados.

**CA32 — Lista excluída movendo cards**
- **Quando** excluo a lista "Em progresso" movendo os cards para "Concluído" (RF05)
- **Então** "Refatorar filtros" mantém a checklist com "2/4".

**CA33 — Card excluído**
- **Dado** que excluí "Refatorar filtros" (RF04) ou a lista "Em progresso" em cascata (RF05)
- **Quando** tento alterar qualquer item daquela checklist por qualquer meio
- **Então** recebo "Card não encontrado." e nenhum item existe mais.

### Proteção e concorrência

**CA34 — Quadro de outra conta**
- **Dado** que a conta B possui o quadro "Beta", com o card "K" e seus itens
- **Quando**, autenticado como A, tento ler, adicionar, marcar, editar ou excluir itens de "K" por qualquer meio
- **Então** a operação é recusada com "Quadro não encontrado." e nada muda.

**CA35 — Item de outro card**
- **Dado** que o item "X" pertence ao card "Outro", do mesmo quadro ou de outro quadro meu
- **Quando** tento marcar, editar ou excluir "X" como se ele pertencesse a "Refatorar filtros"
- **Então** a operação é recusada com "Item não encontrado." e nada muda nos dois cards.

**CA36 — Item excluído em outra aba**
- **Dado** que excluí "Revisar acessibilidade" em outra aba
- **Quando** marco, edito ou excluo "Revisar acessibilidade" nesta aba
- **Então**:
  - ao marcar ou editar, vejo "Item não encontrado." e a checklist desta aba passa a refletir o estado salvo;
  - ao excluir, o item simplesmente some, sem erro.

**CA37 — Marcações iguais em duas abas**
- **Dado** que duas abas mostram "Cobrir com testes" não concluído
- **Quando** marco o item nas duas abas
- **Então** o item termina concluído, e a checklist tem "3/4 concluídos".

**CA38 — Card excluído com a janela aberta**
- **Dado** que excluí o card "Refatorar filtros" em outra aba
- **Quando** tento adicionar, marcar, editar ou excluir um item nesta aba
- **Então** a janela do card fecha com o aviso "Card não encontrado." e o quadro é recarregado (RF04, CB15).

**CA39 — Sessão expirada**
- **Dado** que minha sessão expirou com a janela aberta
- **Quando** executo qualquer ação de checklist
- **Então** nada é alterado e o sistema segue o comportamento de sessão expirada do RF01.

---

## 4. Regras de negócio e restrições

**RN01 — Uma checklist por card.** Todo card tem exatamente uma checklist, inicialmente vazia. Ela não tem nome próprio e não pode ser excluída separadamente do card; esvaziá-la equivale a não ter itens.

**RN02 — Pertencimento.** Todo item pertence a exatamente um card, definido na criação, e nunca muda de card. Mover o card leva todos os seus itens junto (RF04, RF05).

**RN03 — Acesso.** Só quem tem acesso ao quadro do card pode ler e alterar os itens. Para quem não tem acesso, o quadro, o card e os itens são indistinguíveis de inexistentes.

**RN04 — Texto do item.**
- Obrigatório.
- Cada quebra de linha é substituída por um espaço.
- Espaços nas extremidades são removidos; espaços internos são preservados.
- Depois disso, deve ter entre 1 e 200 caracteres, contados pela mesma regra dos nomes e títulos dos requisitos anteriores.
- É exibido como texto literal.

**RN05 — Textos não são únicos.** Uma checklist pode ter vários itens com o mesmo texto.

**RN06 — Ordem.** Os itens aparecem na ordem de adição, e um novo item entra sempre no final. Editar o texto ou o estado não altera a ordem. Excluir um item não altera a ordem relativa dos demais.

**RN07 — Estado inicial.** Todo item nasce não concluído.

**RN08 — Marcação por estado desejado.** Marcar ou desmarcar define explicitamente o estado do item como concluído ou não concluído. Definir o estado que o item já tem é aceito e não produz erro nem mudança.

**RN09 — Progresso.**
- `progresso = ⌊concluídos × 100 ÷ total⌋`, com total > 0.
- Só é 100% quando todos os itens estão concluídos, e só é 0% quando nenhum está.
- Com total 0, não há progresso: nada é exibido na face e a seção mostra "Nenhum item ainda.".

**RN10 — Coerência.** A contagem, o percentual e a barra exibidos na seção e na face do card são sempre calculados a partir dos itens salvos do próprio card, e nunca ficam divergentes entre si após uma ação do próprio usuário.

**RN11 — Salvamento imediato e independente.**
- Cada ação de checklist é salva individualmente, no momento em que é feita.
- Ações de checklist não dependem do "Salvar card", nem o afetam.
- Fechar a janela do card não desfaz ações de checklist.

**RN12 — Atomicidade.** Cada ação altera um único item (ou cria um) por completo ou não altera nada.

**RN13 — Exclusão sem confirmação.** Excluir um item não pede confirmação. Não existe desfazer nem recuperação de item excluído.

**RN14 — Exclusão idempotente.** Pedir a exclusão de um item que não existe mais no card não gera erro visível.

**RN15 — Exclusão junto com o card.** Excluir o card (RF04), ou a lista do card em cascata (RF05), exclui todos os seus itens na mesma operação.

**RN16 — Limite de itens.** Uma checklist pode ter no máximo 100 itens. Com 100 itens, adicionar outro é recusado com "A checklist pode ter no máximo 100 itens.". A ação "+ Adicionar item" continua visível, e a recusa acontece ao confirmar.

**RN17 — Sem efeito em outras contagens.** Itens de checklist não entram na quantidade de cards das listas nem nas contagens de "Meus quadros".

---

## 5. Casos de borda e condições de erro

### 5.1 Entrada de dados e manipulação

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB01 | Texto com 1 caractere | Aceito. |
| CB02 | Texto com exatamente 200 caracteres após normalização | Aceito. |
| CB03 | Texto com 201 caracteres ou mais após normalização | Recusado com a mensagem de limite; o texto não é cortado. |
| CB04 | Texto só com espaços e quebras de linha | Tratado como vazio: "Campo obrigatório.". |
| CB05 | Texto com acentos, emojis, símbolos, marcação HTML ou Markdown | Aceito e exibido como texto literal, nunca interpretado. |
| CB06 | Estado enviado com valor que não seja concluído ou não concluído, por manipulação | Recusado com "Valor inválido."; nada é alterado. |
| CB07 | Posição, estado inicial concluído ou card de destino enviados na criação, por manipulação | Ignorados: o item entra no final, não concluído, no card da operação. |
| CB08 | Tentativa de mover um item para outro card, por manipulação | Ignorada; só texto e estado podem ser alterados. |
| CB09 | Identificador de item malformado | "Item não encontrado."; nada é alterado. |
| CB10 | Checklist com 100 itens e pedido de adicionar mais um | Recusado com "A checklist pode ter no máximo 100 itens." (RN16). |
| CB11 | Checklist com 100 itens, todos concluídos | Progresso 100%; nada muda nas regras de exibição. |
| CB12 | Card com 1 item concluído | Seção "1/1 concluídos · 100%"; face "1/1" com barra cheia na cor de concluído. |

### 5.2 Concorrência e estado desatualizado

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB13 | Duas abas adicionam itens ao mesmo card ao mesmo tempo | Ambos são adicionados no final, sem perda nem duplicação; a ordem entre eles segue a ordem de processamento. |
| CB14 | Uma aba marca e outra desmarca o mesmo item | Prevalece o último pedido processado. Cada aba passa a exibir o estado salvo após a própria ação. |
| CB15 | Uma aba edita o texto e outra marca o mesmo item | As duas alterações são aplicadas, porque atingem campos diferentes. |
| CB16 | Duas abas editam o texto do mesmo item | Prevalece a última edição salva. |
| CB17 | Item excluído em outra aba e marcado ou editado nesta | "Item não encontrado."; a checklist desta aba passa a refletir o estado salvo (CA36). |
| CB18 | Item excluído em outra aba e excluído nesta | Tratado como sucesso (RN14). |
| CB19 | Card excluído ou lista excluída em cascata em outra aba, com a janela aberta nesta | CA38. |
| CB20 | Card movido para outra lista em outra aba, com a janela aberta nesta | As ações de checklist continuam funcionando normalmente; a face atualizada aparece na lista onde o card está. |
| CB21 | Quadro excluído em outra aba | "Quadro não encontrado." com caminho para "Meus quadros" (RF02). |
| CB22 | Após qualquer ação, a checklist salva difere da exibida por causa de outra aba | A seção e a face do card passam a exibir a checklist salva completa daquele card. |

### 5.3 Falhas

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CE01 | Falha de comunicação ao adicionar ou editar | O campo permanece aberto com o texto e a mensagem genérica; nada muda na checklist. |
| CE02 | Falha de comunicação ao marcar ou excluir | O item volta a exibir o estado anterior, e a mensagem genérica aparece na seção "Checklist". |
| CE03 | Erro inesperado | A mensagem não revela detalhes internos. |

### 5.4 Mensagens ao usuário

A redação pode variar desde que o significado seja preservado e a mesma situação produza sempre a mesma mensagem. Mensagens de sessão seguem o RF01; de quadro, o RF02; de card, o RF04.

| Situação | Mensagem |
| --- | --- |
| Título da seção | "Checklist" |
| Contagem e progresso na seção | "{concluídos}/{total} concluídos · {progresso}%" |
| Contagem na face do card | "{concluídos}/{total}" |
| Nome acessível da barra na face | "Checklist: {concluídos} de {total} itens concluídos ({progresso}%)" |
| Seção sem itens | "Nenhum item ainda." |
| Ação de adicionar | "+ Adicionar item" |
| Rótulo do campo | "Texto do item" |
| Texto vazio | "Campo obrigatório." |
| Texto acima de 200 caracteres | "O item deve ter no máximo 200 caracteres." |
| Limite de itens | "A checklist pode ter no máximo 100 itens." |
| Item inexistente ou de outro card | "Item não encontrado." |
| Estado inválido | "Valor inválido." |
| Falha de comunicação ou erro inesperado | "Não foi possível concluir a operação. Tente novamente." |

---

## 6. Fora de escopo

- várias checklists nomeadas no mesmo card;
- reordenar itens, arrastando ou por seleção de posição;
- converter item em card, mover item entre cards ou copiar checklists;
- responsável e prazo por item;
- ocultar itens concluídos;
- confirmação ao excluir item, desfazer e lixeira;
- modelos de checklist reutilizáveis;
- filtrar ou ordenar cards pelo progresso;
- atualização em tempo real entre abas ou dispositivos;
- restrições por papel de membro (RF07).
