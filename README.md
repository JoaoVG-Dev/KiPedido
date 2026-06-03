# KiPedido

KiPedido e um software operacional para restaurantes que usam tablets nas mesas para registrar pedidos. A base atual conecta o frontend React a uma API Laravel real, com autenticacao administrativa por Sanctum e fluxos iniciais para tablet, cozinha, caixa e administracao.

## URLs Locais

```txt
Frontend:
http://127.0.0.1:5173

Backend:
http://127.0.0.1:8000

Health check:
http://127.0.0.1:8000/api/health
```

## Stack

- Backend: Laravel API + Sanctum
- Frontend: React + TypeScript + Vite
- Banco: MySQL ou PostgreSQL em ambiente real; SQLite pode ser usado para desenvolvimento local rapido
- Arquitetura: frontend e backend separados em `backend/` e `frontend/`

## Estrutura

```txt
KiPedido/
├── backend/
└── frontend/
```

## Como Instalar O Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000
```

Configuracao local esperada no `backend/.env`:

```env
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://127.0.0.1:5173
SANCTUM_STATEFUL_DOMAINS=127.0.0.1:5173,localhost:5173
SESSION_DOMAIN=127.0.0.1
```

## Como Instalar O Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev -- --host 127.0.0.1 --port 5173
```

Configuracao local esperada no `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## Usuario Admin De Teste

```txt
Email: admin@kipedido.local
Senha: KiPedido@123
Role: admin
```

As credenciais acima sao criadas apenas pelo seeder local.

## Mesa De Teste Para Tablet

O seeder cria 10 mesas com tokens previsiveis para desenvolvimento. Use:

```txt
Token: mesa-01-teste
URL: http://127.0.0.1:5173/tablet/mesa-01-teste
API menu: http://127.0.0.1:8000/api/tablet/mesa-01-teste/menu
```

## Modulos

- Admin: login, dashboard, mesas, categorias, produtos, usuarios, configuracoes, relatorios e logs.
- Tablet/Mesa: menu por token, carrinho local, envio real de pedido, pedidos da sessao, chamar garcom e pedir conta.
- Cozinha: pedidos reais, itens, observacoes e alteracao de status.
- Caixa: mesas reais, calculo da conta, fechamento por pagamento e liberacao da mesa.

## Experiencia Responsiva

A interface atual foi organizada para uso operacional em desktop, tablet e celular.

- Tablet: header com mesa/status, categorias navegaveis, cards grandes de produto, carrinho com observacoes por item e resumo fixo quando houver itens.
- Cozinha: quadro por status com cards grandes, observacoes em destaque e botoes de transicao de preparo.
- Caixa: grade responsiva de mesas, total destacado, detalhe da conta e lista de pedidos/itens em cards.
- Admin: sidebar em desktop, navegacao adaptada em telas pequenas e tabelas que viram cards no mobile.

Tamanhos recomendados para conferencia manual:

```txt
360px, 390px, 430px, 768px, 1024px e 1280px+
```

## Rotas Principais Da API

### Publicas

- `GET /api/health`
- `GET /api/tablet/{token}/menu`
- `GET /api/tablet/{token}/session`
- `POST /api/tablet/{token}/orders`
- `GET /api/tablet/{token}/orders`
- `POST /api/tablet/{token}/call-waiter`
- `POST /api/tablet/{token}/request-bill`

### Autenticadas

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/admin/dashboard`
- `GET /api/admin/tables`
- `GET /api/admin/categories`
- `GET /api/admin/products`
- `GET /api/admin/users`
- `GET /api/admin/logs`
- `GET /api/kitchen/orders`
- `PATCH /api/kitchen/orders/{id}/status`
- `GET /api/cashier/tables`
- `GET /api/cashier/tables/{id}/bill`
- `POST /api/cashier/tables/{id}/close`
- `POST /api/cashier/tables/{id}/release`

## Fluxo Manual Recomendado

1. Acesse `http://127.0.0.1:5173/admin/login`.
2. Entre com `admin@kipedido.local` e `KiPedido@123`.
3. Confira Admin, Mesas, Categorias e Produtos carregando dados reais.
4. Acesse `http://127.0.0.1:5173/tablet/mesa-01-teste/cardapio`.
5. Adicione um produto ao carrinho e envie o pedido.
6. Acesse `/kitchen/orders`, altere o status do pedido.
7. Acesse `/cashier/tables/1`, feche a conta e libere a mesa.

## Validacao

```bash
cd backend
php artisan test

cd ../frontend
npm run build
```

## Roadmap

- PWA instalavel para tablets e PCs.
- Tempo real com Laravel Reverb.
- Impressao termica para cozinha e caixa.
- Permissoes mais granulares por perfil.
- Relatorios operacionais e financeiros.
- Aplicativo desktop com Electron ou Tauri.
