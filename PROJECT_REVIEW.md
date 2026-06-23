# Revisao tecnica do KiPedido

Revisao executada em 21/06/2026 sobre backend Laravel, frontend React, banco, seguranca, operacao e deploy.

## Resumo executivo

O KiPedido ja e um MVP operacional consistente para **um restaurante**. Os fluxos de mesa, cozinha, caixa e administracao usam API e banco reais; as regras financeiras principais possuem testes; e a interface cobre desktop, tablet e celular.

A base esta adequada para uma implantacao piloto, desde que o backend, o banco Neon e o storage de imagens sejam provisionados e o checklist de producao seja cumprido. Ainda nao esta pronta para ser vendida como SaaS multi-restaurante sem uma etapa adicional de arquitetura, onboarding e cobranca.

## O que esta bem resolvido

- Separacao clara entre API Laravel e SPA React.
- Autenticacao por Sanctum e autorizacao por perfis (`admin`, `manager`, `kitchen`, `cashier`).
- Fluxo completo de pedido: mesa, cozinha, fechamento e liberacao.
- Calculos de conta, desconto, taxa de servico, pagamentos parciais e troco cobertos por testes.
- Tokens de mesa com regeneracao, revogacao e bloqueio de mesa fechada/em pagamento.
- CRUD operacional de mesas, categorias e produtos.
- Dashboard, relatorios basicos e logs de acoes.
- Experiencia responsiva e PWA instalavel.
- Build de producao, lint e TypeScript sem erros no momento da revisao.

## Melhorias feitas nesta etapa

- Landing page comercial na rota `/`, com apresentacao do produto e CTAs configuraveis.
- Configuracao de build/rewrite/headers para publicar a SPA na Vercel.
- PostgreSQL/Neon como configuracao de producao, com SSL e suporte a `DB_URL` ou `DATABASE_URL`.
- CORS para multiplos dominios e previews controlados por expressao regular.
- Rate limit no login e nas rotas publicas do tablet.
- Upload de produtos preparado para disco S3 e URL de imagem fornecida pela API.
- Driver S3 adicionado ao Composer e dependencias auditadas sem advisories conhecidos.
- Documentacao de deploy, variaveis, migracoes e checklist de producao.
- Metadados basicos de SEO e compartilhamento da pagina comercial.

## Lacunas prioritarias antes de producao

### P0 - necessarias para publicar

1. **Provisionar infraestrutura real:** criar Neon, host PHP da API, bucket S3, dominios e segredos. O repositorio esta configurado, mas credenciais nao devem ser gravadas no codigo.
2. **Criar administrador de producao:** o seeder possui credenciais previsiveis para desenvolvimento e nao deve ser executado em producao.
3. **Validar no Postgres real:** os testes automatizados usam SQLite. Rode todas as migracoes e o ciclo completo em um branch/database de staging no Neon.
4. **Configurar observabilidade:** erros, logs centralizados, uptime e alertas ainda dependem da plataforma de hospedagem.
5. **Definir backup e recuperacao:** confirmar PITR/retencao do Neon e politica do bucket de imagens.

### P1 - recomendadas para um piloto confiavel

1. **Atualizacao em tempo real:** cozinha, caixa e acompanhamento da mesa dependem de recarga manual. Adotar polling controlado ou eventos (SSE/WebSocket/Reverb).
2. **Gestao de usuarios:** o admin apenas lista usuarios; faltam criar, editar, desativar, redefinir senha e revogar sessoes.
3. **Testes de frontend/E2E:** nao ha suite automatizada para login, pedido, cozinha e fechamento no navegador.
4. **Notificacoes operacionais:** chamadas de garcom sao registradas, mas falta uma central de atendimento com assumir/resolver e alertas claros.
5. **Impressao de producao:** a impressao atual usa o navegador; impressora termica e fila de impressao ainda exigem integracao.
6. **Politica de cancelamento/estorno:** os estados existem parcialmente, mas faltam permissoes e trilha financeira completa para excecoes.

### P2 - necessarias para transformar em SaaS

1. **Multi-tenancy:** as tabelas nao possuem `restaurant_id`; hoje todos os dados pertencem a uma unica operacao.
2. **Onboarding e cobranca:** faltam cadastro do restaurante, escolha de plano, assinatura, limites e bloqueio por inadimplencia.
3. **Fiscal e pagamentos online:** nao ha NFC-e/SAT, conciliacao, adquirente ou pagamento pelo cliente.
4. **Analytics avancado:** filtros por periodo, ticket medio, tempo de preparo, cancelamentos, CMV e exportacoes completas.
5. **LGPD:** formalizar retencao, exclusao, termos, politica de privacidade e processo de atendimento ao titular.

## Riscos tecnicos observados

- A Vercel nao possui runtime PHP oficial; o frontend pode ficar na Vercel, mas a API Laravel deve usar hospedagem PHP apropriada.
- O token administrativo fica em `localStorage`; uma politica CSP e revisao continua contra XSS sao importantes. Uma evolucao possivel e usar cookie `HttpOnly` com dominio bem definido.
- Imagens antigas gravadas no disco `public` precisam ser migradas para o bucket ao trocar `PRODUCT_IMAGES_DISK` para `s3`.
- O service worker oferece shell offline, mas a API e os dados operacionais continuam exigindo internet.
- O bundle frontend ainda e unico; lazy loading por modulo pode reduzir o carregamento inicial quando o produto crescer.

## Evidencias da revisao

- Backend: **16 testes, 181 assercoes, todos aprovados**.
- Frontend: **ESLint aprovado**.
- Frontend: **TypeScript aprovado**.
- Frontend: **build Vite aprovado**.
- Composer: **sem advisories de seguranca conhecidos** depois da atualizacao das dependencias HTTP/S3.

Consulte `DEPLOY.md` para colocar a arquitetura em producao.
