# Contexto Geral e Regras da Seção

1 - Toda task pedida deve ser implementada completa: back-end e front-end juntos.

2 - Protótipo de referência (inspiração de UI/UX): /prototipo

3 - Role do agente: implementar o que foi solicitado. Pode executar tsc e npm run build para verificar erros de importação ou dependências faltantes — pode corrigir só esses tipos de erro. Não execute testes da aplicação, endpoints ou fluxo de api (back-end + front-end).

4 - Qualquer dependência nova necessária pra task deve ser instalada (npm install), nunca só assumida ou deixada de fora, vale para back e front.

5 - Banco de dados que será usado: use PostgreSQL (subida via docker-compose.yml na raiz do back-end, credenciais no .env local) com TypeORM como ORM.
