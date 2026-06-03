# KiPedido

KiPedido é uma base de software operacional para restaurantes que usam tablets nas mesas para registrar pedidos sem depender do garçom. O fluxo inicial cobre tablet da mesa, cozinha, caixa e administração.

## Stack

- Backend: Laravel API
- Autenticação administrativa: Laravel Sanctum
- Frontend: React + TypeScript + Vite
- Banco: MySQL ou PostgreSQL em produção; SQLite pode ser usado para desenvolvimento rápido
- Arquitetura: frontend e backend separados

## Estrutura

```txt
KiPedido/
├── backend/
└── frontend/
```

## Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Para usar MySQL ou PostgreSQL, ajuste no `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kipedido
DB_USERNAME=root
DB_PASSWORD=
```

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

O frontend usa `VITE_API_URL=http://localhost:8000/api` por padrão.

## Usuário Admin De Teste

```txt
Email: admin@kipedido.local
Senha: KiPedido@123
Role: admin
```

Essas credenciais são apenas para desenvolvimento local e são criadas pelo seeder.

## Módulos

- Tablet/Mesa: cardápio, carrinho, envio de pedido, status, chamar garçom e pedir conta.
- Cozinha: fila de pedidos, itens, observações e atualização de status.
- Caixa: mesas abertas, conta da mesa, desconto, pagamento e liberação.
- Admin: login, mesas, categorias, produtos, usuários, configurações, relatórios e logs.

## Rotas Iniciais Da API

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/admin/tables`
- `GET /api/tablet/{token}/menu`
- `POST /api/tablet/{token}/orders`
- `GET /api/kitchen/orders`
- `PATCH /api/kitchen/orders/{id}/status`
- `GET /api/cashier/tables`
- `POST /api/cashier/tables/{id}/close`

## Validação

```bash
cd backend
php artisan migrate:fresh --seed
php artisan test

cd ../frontend
npm run build
```

## GitHub

Se o GitHub CLI estiver autenticado:

```bash
gh repo create JoaoVG-Dev/KiPedido --public --source=. --remote=origin --push
```

Se precisar criar manualmente:

```bash
git remote add origin https://github.com/JoaoVG-Dev/KiPedido.git
git branch -M main
git push -u origin main
```

## Roadmap

- PWA instalável para tablets e PCs.
- Tempo real com Laravel Reverb.
- Impressão térmica para cozinha e caixa.
- Permissões mais granulares por perfil.
- Relatórios operacionais e financeiros.
- Aplicativo desktop com Electron ou Tauri.
