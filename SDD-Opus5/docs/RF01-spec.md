# RF01 — Cadastro, autenticação e sessão persistente

**Requisito:** RF01 — Cadastro, autenticação e login de usuários, com manutenção de sessão persistente.
**História de usuário:** HU01 — Como visitante, eu quero me cadastrar e fazer login no sistema, para que eu acesse meus quadros de forma segura e persistente entre sessões.

Telas de referência no protótipo: `prototipo/paginas/criar-conta.png`, `prototipo/paginas/tela-login.png`, `prototipo/paginas/meus-quadros.png` (cabeçalho com identificação do usuário logado).

---

## 1. Visão geral

O sistema deve permitir que uma pessoa sem conta crie uma conta própria informando nome, e-mail e senha; que uma pessoa com conta se autentique informando e-mail e senha; e que, uma vez autenticada, permaneça autenticada ao navegar entre páginas, ao recarregar a página e — quando ela optar por isso no momento do login — ao fechar e reabrir o navegador.

O sistema também deve permitir que a pessoa encerre a própria sessão de forma explícita, e deve impedir o acesso a qualquer área autenticada por quem não possui sessão válida.

### Papéis envolvidos

| Papel | Definição |
| --- | --- |
| Visitante | Pessoa sem sessão ativa. Só acessa as páginas de login e de criação de conta. |
| Usuário autenticado | Pessoa com sessão ativa e válida. Acessa as áreas internas do sistema. |

### Conceitos

| Termo | Definição |
| --- | --- |
| Conta | Registro único de uma pessoa no sistema, identificado pelo e-mail. |
| Sessão | Estado de autenticação de uma conta em um dispositivo/navegador específico, com prazo de validade definido. |
| Sessão persistente | Sessão que continua válida depois que o navegador é fechado e reaberto. |
| Sessão de curta duração | Sessão que deixa de ser válida quando o navegador é fechado. |
| Área autenticada | Qualquer página ou operação que exija sessão válida (tudo que não seja login, criação de conta e páginas públicas de erro). |

---

## 2. Comportamento esperado

### 2.1 Criação de conta

O visitante acessa a página de criação de conta e informa nome, e-mail, senha e confirmação de senha. Ao confirmar, o sistema valida os dados informados:

- Se todos os dados forem válidos e o e-mail ainda não estiver em uso, o sistema cria a conta, autentica a pessoa imediatamente (sem exigir um login manual em seguida) e a leva para a área autenticada inicial.
- Se algum dado for inválido, o sistema não cria a conta e exibe, junto ao campo correspondente, a mensagem que descreve o problema. Os dados já digitados permanecem no formulário, exceto os campos de senha, que são limpos.
- O sistema exibe todos os erros de validação detectados de uma só vez, e não um por vez.

A sessão criada logo após o cadastro é uma sessão persistente.

A página de criação de conta oferece um caminho explícito para a página de login, destinado a quem já possui conta.

### 2.2 Login

O visitante acessa a página de login e informa e-mail e senha. A página também apresenta a opção "Manter-me conectado neste dispositivo", que determina a duração da sessão e vem marcada por padrão.

- Se o e-mail corresponder a uma conta existente e a senha estiver correta, o sistema autentica a pessoa e a leva para a área autenticada.
- Se o e-mail não corresponder a nenhuma conta, ou se a senha estiver incorreta, o sistema recusa o login e exibe uma única mensagem de erro, idêntica nos dois casos, sem indicar qual das duas informações está errada.
- Após uma tentativa recusada, o e-mail digitado permanece no formulário e o campo de senha é limpo.

A página de login oferece um caminho explícito para a página de criação de conta.

### 2.3 Manutenção da sessão

Enquanto a sessão for válida, o usuário permanece autenticado:

- ao navegar entre páginas da área autenticada;
- ao recarregar a página atual;
- ao abrir o sistema diretamente por uma URL da área autenticada;
- ao fechar e reabrir o navegador, **se e somente se** a sessão for persistente.

Uma sessão de curta duração deixa de valer quando o navegador é fechado; ao reabrir o sistema, a pessoa é tratada como visitante.

Em qualquer página da área autenticada, o sistema exibe a identificação do usuário autenticado (nome), de modo que a pessoa consiga confirmar com qual conta está conectada.

Sessões são independentes por dispositivo/navegador: autenticar-se em um novo dispositivo não encerra as sessões já existentes em outros, e encerrar a sessão em um dispositivo não afeta os demais.

### 2.4 Encerramento de sessão

O usuário autenticado pode encerrar a sessão de forma explícita a partir da área autenticada. Ao fazê-lo, o sistema invalida a sessão daquele dispositivo, leva a pessoa para a página de login e passa a tratá-la como visitante. Depois disso, voltar à página anterior pelo histórico do navegador não deve restaurar o acesso à área autenticada.

### 2.5 Proteção de acesso

- Visitante que tenta acessar qualquer página da área autenticada é redirecionado para a página de login. Após autenticar-se com sucesso, é levado para a página que tentou acessar originalmente.
- Usuário autenticado que acessa a página de login ou a de criação de conta é redirecionado para a área autenticada inicial, sem precisar autenticar-se de novo.
- Quando a sessão expira ou deixa de ser válida, a próxima ação que exija autenticação falha de forma controlada: o sistema informa que a sessão expirou e leva a pessoa para a página de login.

### 2.6 Feedback durante as operações

Durante o processamento de um cadastro ou de um login, o sistema indica que a operação está em andamento e impede o envio repetido do mesmo formulário, de modo que um duplo clique no botão não resulte em duas tentativas de cadastro ou de login.

---

## 3. Critérios de aceite (Given/When/Then)

### Criação de conta

**CA01 — Cadastro com dados válidos**
- **Dado** que sou um visitante na página de criação de conta e que não existe conta com o e-mail `ana@empresa.com`
- **Quando** eu informo nome `Ana Lima`, e-mail `ana@empresa.com`, senha `senha12345` e confirmação `senha12345` e confirmo
- **Então** a conta é criada, eu fico autenticado imediatamente, sou levado para a área autenticada inicial e meu nome aparece identificado na interface.

**CA02 — Cadastro com e-mail já cadastrado**
- **Dado** que já existe uma conta com o e-mail `ana@empresa.com`
- **Quando** eu tento criar uma conta com o e-mail `ana@empresa.com`
- **Então** nenhuma conta nova é criada, permaneço como visitante na página de criação de conta e recebo a mensagem de que já existe uma conta com esse e-mail.

**CA03 — E-mail já cadastrado com diferença de maiúsculas/minúsculas**
- **Dado** que já existe uma conta com o e-mail `ana@empresa.com`
- **Quando** eu tento criar uma conta com o e-mail `Ana@Empresa.com`
- **Então** o cadastro é recusado com a mesma mensagem de e-mail já cadastrado.

**CA04 — E-mail com formato inválido**
- **Dado** que sou um visitante na página de criação de conta
- **Quando** eu informo o e-mail `ana@` e confirmo
- **Então** a conta não é criada e recebo, junto ao campo de e-mail, a mensagem de que o e-mail é inválido.

**CA05 — Senha curta demais**
- **Quando** eu informo uma senha com 7 caracteres e confirmo
- **Então** a conta não é criada e recebo, junto ao campo de senha, a mensagem de que a senha deve ter no mínimo 8 caracteres.

**CA06 — Confirmação de senha diferente**
- **Quando** eu informo senha `senha12345` e confirmação `senha54321` e confirmo
- **Então** a conta não é criada e recebo, junto ao campo de confirmação, a mensagem de que as senhas não coincidem.

**CA07 — Campos obrigatórios vazios**
- **Quando** eu confirmo o formulário com nome, e-mail, senha e confirmação vazios
- **Então** a conta não é criada e recebo, ao mesmo tempo, uma mensagem de obrigatoriedade em cada um dos quatro campos.

**CA08 — Nome com espaços em excesso**
- **Quando** eu informo o nome `  Ana Lima  ` com os demais dados válidos e confirmo
- **Então** a conta é criada e meu nome é exibido como `Ana Lima`, sem os espaços nas extremidades.

### Login

**CA09 — Login com credenciais corretas**
- **Dado** que existe uma conta com e-mail `ana@empresa.com` e senha `senha12345`
- **Quando** eu informo essas credenciais na página de login e confirmo
- **Então** fico autenticado e sou levado para a área autenticada inicial.

**CA10 — Login com e-mail em outra caixa**
- **Dado** que existe uma conta com e-mail `ana@empresa.com`
- **Quando** eu faço login com `ANA@EMPRESA.COM` e a senha correta
- **Então** o login é aceito e acesso a mesma conta.

**CA11 — Senha incorreta**
- **Dado** que existe uma conta com e-mail `ana@empresa.com`
- **Quando** eu faço login com essa conta e a senha `senhaerrada`
- **Então** o login é recusado, permaneço como visitante e recebo a mensagem genérica de e-mail ou senha inválidos.

**CA12 — E-mail inexistente**
- **Dado** que não existe conta com o e-mail `ninguem@empresa.com`
- **Quando** eu faço login com esse e-mail e qualquer senha
- **Então** o login é recusado com exatamente a mesma mensagem e o mesmo comportamento visual do critério CA11.

**CA13 — Senha é sensível a maiúsculas e minúsculas**
- **Dado** que a senha da conta é `senha12345`
- **Quando** eu faço login com `SENHA12345`
- **Então** o login é recusado com a mensagem genérica de credenciais inválidas.

**CA14 — Campos de login vazios**
- **Quando** eu confirmo o formulário de login sem preencher e-mail e senha
- **Então** nenhuma tentativa de autenticação é feita e recebo mensagem de obrigatoriedade em ambos os campos.

### Sessão

**CA15 — Sessão sobrevive ao recarregamento**
- **Dado** que estou autenticado na área autenticada
- **Quando** eu recarrego a página
- **Então** continuo autenticado, na mesma página, sem passar pela tela de login.

**CA16 — Sessão persistente sobrevive ao fechamento do navegador**
- **Dado** que fiz login com a opção "Manter-me conectado neste dispositivo" marcada
- **Quando** eu fecho o navegador, reabro e acesso o sistema dentro do prazo de validade da sessão
- **Então** continuo autenticado e sou levado direto para a área autenticada, sem passar pela tela de login.

**CA17 — Sessão de curta duração não sobrevive ao fechamento do navegador**
- **Dado** que fiz login com a opção "Manter-me conectado neste dispositivo" desmarcada
- **Quando** eu fecho o navegador, reabro e acesso o sistema
- **Então** sou tratado como visitante e levado para a página de login.

**CA18 — Sessão criada pelo cadastro é persistente**
- **Dado** que acabei de criar minha conta
- **Quando** eu fecho o navegador, reabro e acesso o sistema dentro do prazo de validade da sessão
- **Então** continuo autenticado.

**CA19 — Sessão expirada**
- **Dado** que possuo uma sessão cujo prazo de validade já terminou
- **Quando** eu acesso uma página da área autenticada ou executo uma ação que exija autenticação
- **Então** a ação não é executada, sou informado de que a sessão expirou e sou levado para a página de login.

**CA20 — Sessões independentes entre dispositivos**
- **Dado** que estou autenticado na mesma conta nos dispositivos A e B
- **Quando** eu encerro a sessão no dispositivo A
- **Então** continuo autenticado no dispositivo B.

**CA21 — Encerramento explícito da sessão**
- **Dado** que estou autenticado
- **Quando** eu encerro a sessão
- **Então** sou levado para a página de login, passo a ser tratado como visitante e voltar pelo histórico do navegador não me devolve o acesso à área autenticada.

**CA22 — Identificação do usuário autenticado**
- **Dado** que estou autenticado com a conta de nome `Ana Lima`
- **Quando** eu estou em qualquer página da área autenticada
- **Então** vejo `Ana Lima` identificado na interface.

### Proteção de acesso

**CA23 — Visitante bloqueado na área autenticada**
- **Dado** que sou um visitante
- **Quando** eu acesso diretamente a URL de uma página da área autenticada
- **Então** sou redirecionado para a página de login e o conteúdo da página protegida não é exibido em momento algum.

**CA24 — Retorno à página originalmente pedida**
- **Dado** que, como visitante, fui redirecionado para o login ao tentar acessar uma página específica da área autenticada
- **Quando** eu me autentico com sucesso
- **Então** sou levado para aquela página, e não para a área autenticada inicial.

**CA25 — Usuário autenticado nas páginas de visitante**
- **Dado** que estou autenticado
- **Quando** eu acesso a página de login ou a de criação de conta
- **Então** sou redirecionado para a área autenticada inicial sem precisar me autenticar de novo.

**CA26 — Dados são isolados por conta**
- **Dado** que existem as contas A e B
- **Quando** estou autenticado como A
- **Então** toda página e operação da área autenticada opera sobre os dados da conta A, e nenhum dado exclusivo da conta B é exibido.

### Envio duplicado

**CA27 — Duplo envio do formulário**
- **Dado** que preenchi o formulário de cadastro ou de login com dados válidos
- **Quando** eu aciono o botão de confirmação duas vezes seguidas
- **Então** apenas uma tentativa é processada, e no caso do cadastro apenas uma conta é criada.

---

## 4. Regras de negócio e restrições

**RN01 — Unicidade do e-mail.** Não podem existir duas contas com o mesmo e-mail. A comparação de e-mails ignora maiúsculas e minúsculas: `ana@empresa.com` e `ANA@Empresa.com` são o mesmo e-mail.

**RN02 — Normalização do e-mail.** O e-mail é armazenado e exibido em letras minúsculas, sem espaços nas extremidades.

**RN03 — Formato do e-mail.** O e-mail deve ter formato válido: uma parte local não vazia, o caractere `@`, um domínio com ao menos um ponto e um sufixo com pelo menos dois caracteres. Tamanho máximo: 254 caracteres.

**RN04 — Nome.** Obrigatório. Após remover espaços das extremidades, deve ter entre 2 e 100 caracteres. É armazenado já sem esses espaços.

**RN05 — Senha.** Obrigatória, com no mínimo 8 e no máximo 100 caracteres. Não há exigência de composição (maiúsculas, dígitos ou símbolos). Espaços fazem parte da senha e não são removidos. A senha é sensível a maiúsculas e minúsculas.

**RN06 — Confirmação de senha.** No cadastro, a confirmação deve ser exatamente igual à senha. Ela existe apenas no formulário e não é um dado da conta.

**RN07 — Senha nunca é legível.** A senha não é armazenada de forma recuperável, não é exibida em tela, não aparece em mensagens de erro e não é devolvida por nenhuma consulta de dados da conta.

**RN08 — Erro de autenticação é genérico.** Quando o login falha por e-mail inexistente ou por senha incorreta, a mensagem apresentada e o tempo de resposta percebido são equivalentes, de modo que não seja possível descobrir se um e-mail está cadastrado a partir da tela de login.

**RN09 — Duração da sessão.** Uma sessão persistente vale por 30 dias a partir do login. Uma sessão de curta duração vale por 8 horas e, além disso, termina quando o navegador é fechado. Terminado o prazo, a sessão deixa de ser válida e não é renovada automaticamente.

**RN10 — Opção de persistência.** A escolha entre sessão persistente e de curta duração é feita no momento do login, pela opção "Manter-me conectado neste dispositivo", que vem marcada por padrão. A escolha vale apenas para a sessão criada naquele login. O cadastro sempre cria uma sessão persistente.

**RN11 — Escopo da sessão.** A sessão é válida para um dispositivo/navegador. A mesma conta pode ter várias sessões simultâneas em dispositivos diferentes, sem limite definido, e elas são independentes entre si.

**RN12 — Autenticação obrigatória.** Toda página e toda operação fora do cadastro, do login e das páginas públicas de erro exige sessão válida. A verificação da sessão é feita a cada operação, e não apenas na entrada da página.

**RN13 — Isolamento por conta.** Toda operação da área autenticada é executada no contexto da conta dona da sessão. A identidade do usuário é sempre derivada da sessão, nunca de um valor informado pelo cliente.

**RN14 — Conta identificada por e-mail.** O e-mail é a credencial de login. Uma conta criada não pode ser excluída nem ter o e-mail alterado dentro do escopo deste requisito.

**RN15 — Atomicidade do cadastro.** Ou a conta é criada e a sessão iniciada, ou nada é persistido. Não pode restar uma conta criada sem que a pessoa tenha sido autenticada, nem duas contas a partir de um único envio do formulário.

---

## 5. Casos de borda e condições de erro

### 5.1 Entrada de dados

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB01 | Campos enviados apenas com espaços em branco | Tratados como vazios: erro de obrigatoriedade. |
| CB02 | E-mail digitado com espaços nas extremidades | Espaços removidos antes da validação; o cadastro ou login prossegue normalmente. |
| CB03 | Nome com acentos, hífen, apóstrofo ou caracteres não latinos | Aceito e preservado exatamente como digitado (descontados os espaços das extremidades). |
| CB04 | Nome com 1 caractere ou com mais de 100 | Recusado, com a mensagem do limite correspondente. |
| CB05 | Senha com exatamente 8 caracteres | Aceita (o limite é inclusivo). |
| CB06 | Senha com mais de 100 caracteres | Recusada, com a mensagem do limite. |
| CB07 | Senha contendo espaços internos ou nas extremidades | Aceita; os espaços fazem parte da senha e devem ser exigidos no login. |
| CB08 | Nome ou senha contendo marcação HTML ou trechos de script | Armazenado como texto literal e exibido como texto, nunca interpretado. |
| CB09 | Dois cadastros simultâneos com o mesmo e-mail | Apenas um é criado; o outro é recusado com a mensagem de e-mail já cadastrado. |
| CB10 | Cadastro com e-mail válido no formato mas com 255 ou mais caracteres | Recusado, com a mensagem de e-mail inválido. |

### 5.2 Sessão

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CB11 | Sessão expira enquanto a página está aberta | Na primeira ação que exija autenticação, o sistema informa que a sessão expirou e leva à página de login; a ação não é executada. |
| CB12 | Credencial de sessão ausente, adulterada ou irreconhecível | Tratada como ausência de sessão: a pessoa é tratada como visitante e levada ao login. |
| CB13 | Encerramento de sessão já expirada ou inexistente | A operação não falha para o usuário: ele acaba na página de login, como visitante. |
| CB14 | Duas abas abertas e a sessão é encerrada em uma delas | A outra aba, na primeira ação que exija autenticação, também passa a tratar a pessoa como visitante. |
| CB15 | Uso do botão "voltar" do navegador após encerrar a sessão | Nenhum conteúdo da área autenticada é acessível; a pessoa é levada ao login. |
| CB16 | Login feito enquanto já existe uma sessão ativa no mesmo navegador | A nova sessão substitui a anterior naquele navegador, com a duração escolhida no novo login. |

### 5.3 Falhas de sistema

| # | Situação | Comportamento esperado |
| --- | --- | --- |
| CE01 | Falha de comunicação com o servidor durante cadastro ou login | Mensagem informando que não foi possível concluir a operação e convidando a tentar de novo; os dados digitados, exceto senhas, permanecem no formulário; nenhuma conta é criada. |
| CE02 | Falha ao persistir a conta depois de validar os dados | Nenhuma conta é criada, nenhuma sessão é iniciada e a pessoa recebe uma mensagem de erro genérica. |
| CE03 | Resposta demorada do servidor | O formulário permanece em estado de "processando", bloqueado para novos envios, até haver sucesso ou erro. |
| CE04 | Erro inesperado em qualquer operação | A mensagem exibida não revela detalhes internos do sistema (dados técnicos, consultas, caminhos de arquivo ou pilha de erro). |

### 5.4 Mensagens ao usuário

As mensagens abaixo definem o conteúdo que deve ser comunicado; a redação final pode variar desde que o significado seja preservado e que a mesma situação produza sempre a mesma mensagem.

| Situação | Mensagem |
| --- | --- |
| Campo obrigatório vazio | "Campo obrigatório." |
| E-mail em formato inválido | "Informe um e-mail válido." |
| E-mail já cadastrado | "Já existe uma conta com esse e-mail." |
| Senha curta demais | "A senha deve ter no mínimo 8 caracteres." |
| Confirmação diferente da senha | "As senhas não coincidem." |
| Nome fora dos limites de tamanho | "O nome deve ter entre 2 e 100 caracteres." |
| Credenciais inválidas no login | "E-mail ou senha inválidos." |
| Sessão expirada | "Sua sessão expirou. Entre novamente." |
| Falha de comunicação ou erro inesperado | "Não foi possível concluir a operação. Tente novamente." |

---

## 6. Fora de escopo

Os itens abaixo não fazem parte deste requisito e não devem ser implementados agora:

- recuperação e redefinição de senha esquecida;
- alteração de senha, de nome ou de e-mail por parte do usuário;
- verificação ou confirmação de e-mail;
- login por provedores externos e autenticação em duas etapas;
- bloqueio de conta, limite de tentativas de login e proteção contra automação (captcha);
- listagem e encerramento remoto das sessões ativas em outros dispositivos;
- exclusão ou desativação de conta;
- perfis, permissões e papéis de usuário (tratados no RF07);
- qualquer conteúdo específico da área autenticada além da identificação do usuário logado (tratado a partir do RF02).
