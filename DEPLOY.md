# Deploy do KiPedido

O deploy de producao usa duas partes independentes:

- **Frontend React/Vite:** Vercel.
- **API Laravel:** um host com PHP 8.3+ e processo web persistente, conectado ao Neon Postgres.

> A Vercel nao oferece PHP entre os runtimes oficiais de Functions. Por isso, o `vercel.json` deste repositorio publica o frontend. A API Laravel deve usar um host PHP (Laravel Cloud, Railway, Render, Fly.io ou equivalente). Runtimes PHP comunitarios na Vercel podem funcionar, mas nao sao a base recomendada para a operacao do restaurante.

## 1. Criar o banco no Neon

1. Crie um projeto e um database chamado `kipedido` no Neon.
2. Copie a **pooled connection string**. O hostname normalmente contem `-pooler`.
3. Mantenha `sslmode=require` na URL.

Variaveis do backend:

```env
APP_NAME=KiPedido
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:CHAVE_GERADA_PELO_LARAVEL
APP_URL=https://api.seudominio.com

DB_CONNECTION=pgsql
DB_URL=postgresql://USUARIO:SENHA@HOST-pooler.REGIAO.aws.neon.tech/kipedido?sslmode=require
DB_SSLMODE=require

FRONTEND_URLS=https://seudominio.com,https://seu-projeto.vercel.app
# Opcional para previews. Troque "kipedido" pelo prefixo real do projeto.
CORS_ALLOWED_ORIGIN_PATTERNS=#^https://kipedido-[a-z0-9-]+\.vercel\.app$#

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
LOG_CHANNEL=stderr
LOG_LEVEL=warning
FILESYSTEM_DISK=local
PRODUCT_IMAGES_DISK=s3
```

O Laravel tambem aceita `DATABASE_URL` quando a plataforma injeta esse nome em vez de `DB_URL`.

No primeiro deploy da API:

```bash
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan migrate --force
```

Gere `APP_KEY` localmente com `php artisan key:generate --show` e cadastre o valor como segredo na plataforma. Nunca execute o seeder de demonstracao em producao, pois ele cria credenciais previsiveis.

## 2. Armazenamento de imagens

O disco local de hosts serverless/efemeros nao e permanente. Configure um bucket compativel com S3 antes de usar upload de imagens:

```env
PRODUCT_IMAGES_DISK=s3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=
AWS_BUCKET=
AWS_ENDPOINT=
AWS_URL=
AWS_USE_PATH_STYLE_ENDPOINT=false
```

## 3. Publicar o frontend na Vercel

1. Importe este repositorio na Vercel mantendo a raiz do projeto no diretorio do repositorio.
2. O arquivo `vercel.json` instala e compila `frontend/` e publica `frontend/dist`.
3. Cadastre as variaveis abaixo para Production e Preview:

```env
VITE_APP_NAME=KiPedido
VITE_API_URL=https://api.seudominio.com/api
VITE_SALES_CONTACT_URL=https://wa.me/5500000000000?text=Tenho%20interesse%20no%20KiPedido
```

`VITE_SALES_CONTACT_URL` pode apontar para WhatsApp, agenda ou formulario comercial. Em URLs do WhatsApp sem o parametro `text`, a landing adiciona uma mensagem profissional automaticamente. Sem a variavel, os CTAs levam para a secao interna de aquisicao e exibem o contato como indisponivel; nunca redirecionam para login ou demonstracao.

## 4. Dominio e validacao

Use, de preferencia:

- `seudominio.com` para a landing e o app na Vercel.
- `api.seudominio.com` para o Laravel.

Depois do DNS:

1. Atualize `APP_URL`, `FRONTEND_URLS` e `VITE_API_URL`.
2. Rode `curl https://api.seudominio.com/api/health`.
3. Abra a landing, o login e uma rota interna diretamente para validar o fallback SPA.
4. Teste um ciclo completo: pedido da mesa, cozinha, conta e liberacao no caixa.

## 5. Checklist de producao

- `APP_DEBUG=false` e `APP_ENV=production`.
- CORS restrito aos dominios reais.
- `APP_KEY` e credenciais apenas no cofre de segredos.
- Migrações executadas com `--force`.
- Storage S3 configurado para imagens.
- Backup/PITR do Neon confirmado.
- Monitoramento de erros e disponibilidade da API configurado.
- Usuario administrador real criado sem usar a senha do seeder.
