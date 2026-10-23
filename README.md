# RR Aeronaves

Aplicação de controle de estoque e movimentações. A interface mantém a identidade visual do projeto e é construída com Vite, React e TypeScript.

## Publicar a interface no GitHub Pages

1. Envie este projeto para um repositório GitHub usando a branch `main`.
2. No repositório, abra **Settings → Pages** e escolha **GitHub Actions** como fonte de publicação.
3. Se a API estiver hospedada em outro endereço, abra **Settings → Secrets and variables → Actions → Variables** e crie `VITE_API_URL` com a URL base da API, por exemplo `https://api.seudominio.com`. Não coloque a URL do banco PostgreSQL aqui.
4. Envie um commit para `main` ou execute o workflow **Deploy to GitHub Pages** na aba Actions.

O workflow compila a aplicação com o caminho correto do repositório, publica `dist/client` e configura uma página de fallback para as rotas do React.

## Banco de dados e API

GitHub Pages serve apenas arquivos estáticos. Ele não executa `worker/index.js` e não conecta diretamente ao PostgreSQL. A aplicação precisa de uma API HTTPS hospedada separadamente, com `DATABASE_URL` e `JWT_SECRET` configurados como segredos do ambiente dessa API. Nunca use `VITE_` para guardar credenciais: valores `VITE_` ficam públicos no JavaScript do navegador.

Para funcionar a partir do domínio `*.github.io`, a API deve estar acessível publicamente por HTTPS e permitir esse domínio em sua configuração de CORS. Sem `VITE_API_URL`, o app usa `/api`, que só funciona quando frontend e API são servidos pela mesma origem.

## Rodar localmente

```bash
npm ci
npm run dev
```

Para compilar somente os arquivos estáticos:

```bash
npm run build:client
```
