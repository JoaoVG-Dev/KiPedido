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
|-- backend/
`-- frontend/
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

### Nota Para Este PC Windows

Neste ambiente local, as extensoes `pdo_sqlite` e `sqlite3` existem na instalacao do PHP, mas estao desabilitadas no `php.ini`. Para usar SQLite sem alterar a configuracao global do computador, rode os comandos Artisan com as extensoes habilitadas na propria chamada:

```powershell
cd C:\Users\DevJo\Documents\GitHub\KiPedido\backend
php -d extension=pdo_sqlite -d extension=sqlite3 artisan migrate:fresh --seed
php -d extension=pdo_sqlite -d extension=sqlite3 artisan test
```

Para servir o backend com SQLite neste PC, use o servidor embutido do PHP a partir de `backend/public`:

```powershell
cd C:\Users\DevJo\Documents\GitHub\KiPedido\backend\public
php -d extension=pdo_sqlite -d extension=sqlite3 -S 127.0.0.1:8000 ..\vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php
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

No PowerShell deste PC, caso `npm` seja bloqueado por politica de execucao de scripts, use `npm.cmd`:

```powershell
cd C:\Users\DevJo\Documents\GitHub\KiPedido\frontend
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5173
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

O fluxo real de tablet deve iniciar em `/tablet`, onde o usuario informa o token da mesa ou acessa a rota por QR code. O seeder cria 10 mesas com tokens previsiveis para desenvolvimento. Use:

```txt
Entrada neutra: http://127.0.0.1:5173/tablet
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

- Tablet: experiencia de cardapio digital premium, header com acoes rapidas, hero de mesa, categorias em chips, cards de produto fortes, carrinho com aspecto de bottom sheet e timeline de pedidos.
- Cozinha: painel operacional escuro, colunas por status, cards de pedido com mesa e observacoes em destaque e botoes de transicao de preparo.
- Caixa: grade visual de mesas, status fortes, recibo da conta, resumo financeiro e pedidos da sessao em cards.
- Admin: sidebar mais marcante, headers profissionais, metricas com tons por contexto e tabelas responsivas com acabamento visual.

## Identidade Visual

A fase visual atual reposiciona o KiPedido como produto comercial para restaurante:

- Paleta principal em laranja/coral com grafite operacional, off-white quente e cores funcionais para sucesso, alerta, erro e informacao.
- Cards, botoes, badges, estados e metricas foram padronizados em `frontend/src/index.css`.
- Componentes visuais reutilizaveis foram adicionados para tablet, cozinha e caixa sem substituir a integracao com a API real.
- A prioridade visual e o uso em tablet de mesa, mas cozinha, caixa e admin tambem receberam acabamento de produto.

## Nota Da Fase Premium

A fase premium atual consolidou o Tablet como experiencia principal e alinhou Cozinha, Caixa e Admin ao mesmo padrao visual, mantendo os fluxos operacionais existentes:

- Tablet: cardapio, carrinho, pedidos, conta e acoes rapidas com foco em uso real na mesa.
- Cozinha: board de producao com colunas por status, cards mais legiveis, horarios, observacoes, itens e acoes de preparo.
- Caixa: mapa de mesas e tela de fechamento com leitura de PDV, recibo da conta, pedidos, totais e liberacao da mesa.
- Admin: dashboard, tabelas, produtos, configuracoes, relatorios e logs com hierarquia visual mais profissional.
- Sistema visual: tokens, cards, botoes, badges, inputs, tabelas e estados centralizados principalmente em `frontend/src/index.css`.

Antes de publicar uma nova etapa visual, valide backend, lint, typecheck, build e uma passada responsiva nos principais tamanhos de uso.

## Nota Da Fase Produto/PWA

A fase atual aproxima o KiPedido de uma operacao instalavel em restaurante:

- PWA: manifest, metadados, icones e service worker simples para permitir instalacao em navegadores/tablets compativeis.
- PWA de producao: o manifesto abre `/tablet`, sem token fixo de mesa de teste. Tokens reais devem ser distribuidos por QR code ou informados na tela de vinculo.
- Tablet: estados de mesa mais claros e bloqueio visual de novos pedidos quando a conta ja foi solicitada ou a mesa nao esta disponivel.
- Impressao simples: cozinha pode imprimir a comanda do pedido e caixa pode imprimir o recibo/conta via `window.print`, sem integracao com impressora termica ainda.
- Admin: resumos operacionais, CRUD de mesas/categorias/produtos, ativacao/pausa de produtos, exportacao simples de relatorios, filtros em listas e configuracoes basicas editaveis do restaurante.
- Financeiro: pagamentos parciais registram apenas o valor aplicado em cada transacao; troco fica separado e dashboard/relatorios somam receita real sem duplicar contas divididas.

Esta fase nao adiciona pagamento real, multi-tenant, integracao fiscal ou CRUD completo de usuarios. O backend atual expoe usuarios como listagem administrativa.

Tamanhos recomendados para conferencia manual:

```txt
360px, 390px, 430px, 768px, 820px, 1024px, 1180px e 1280px+
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
npm run lint
npx tsc -b
npm run build
```

No PowerShell deste PC:

```powershell
cd C:\Users\DevJo\Documents\GitHub\KiPedido\backend
php -d extension=pdo_sqlite -d extension=sqlite3 artisan test

cd C:\Users\DevJo\Documents\GitHub\KiPedido\frontend
npm.cmd run lint
npx.cmd tsc -b
npm.cmd run build
```

Observacao: `npm.cmd run build` e `npm.cmd run dev` podem falhar neste Windows com a mensagem de que uma politica de Controle de Aplicativo bloqueou o arquivo nativo do Rolldown usado pelo Vite (`@rolldown/binding-win32-x64-msvc`). Isso e uma limitacao local do ambiente antes do bundle da aplicacao. Quando isso ocorrer, valide o frontend com `npm.cmd run lint` e `npx.cmd tsc -b`, ou rode o build em um ambiente onde esse binario nativo seja permitido.

## Roadmap

- PWA instalavel para tablets e PCs.
- Tempo real com Laravel Reverb.
- Impressao termica para cozinha e caixa.
- Permissoes mais granulares por perfil.
- Relatorios operacionais e financeiros.
- Aplicativo desktop com Electron ou Tauri.
