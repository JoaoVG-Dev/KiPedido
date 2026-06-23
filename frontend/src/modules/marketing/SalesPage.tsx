import {
  ArrowRight,
  BarChart3,
  BellRing,
  Check,
  ChefHat,
  ChevronRight,
  CircleCheckBig,
  CircleX,
  Cloud,
  Coffee,
  CreditCard,
  Database,
  FileBarChart,
  LayoutDashboard,
  ListChecks,
  MessageCircle,
  MonitorSmartphone,
  PackageCheck,
  Pizza,
  QrCode,
  ReceiptText,
  Rocket,
  Server,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Store,
  TabletSmartphone,
  Utensils,
  Users,
  WalletCards,
  Zap,
} from 'lucide-react'
import { usePageTitle } from '../../hooks/usePageTitle'

const salesContactMessage = 'Olá! Tenho interesse em adquirir o KiPedido para o meu estabelecimento. Gostaria de conversar sobre a implantação do sistema.'

function buildSalesContactUrl(value: string | undefined) {
  if (!value?.trim()) return null

  try {
    const url = new URL(value.trim())

    if (!['https:', 'mailto:', 'tel:'].includes(url.protocol)) return null

    const isWhatsApp = ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(url.hostname)
    if (isWhatsApp && !url.searchParams.has('text')) {
      url.searchParams.set('text', salesContactMessage)
    }

    return url.toString()
  } catch {
    return null
  }
}

const salesContactUrl = buildSalesContactUrl(import.meta.env.VITE_SALES_CONTACT_URL)

const heroBenefits = [
  'Menos erros ao registrar pedidos',
  'Mais agilidade no atendimento',
  'Salão, cozinha e caixa organizados',
]

const audiences = [
  {
    icon: Utensils,
    title: 'Restaurantes',
    description: 'Organize mesas, comandas e setores em uma operação integrada.',
  },
  {
    icon: Pizza,
    title: 'Pizzarias e hamburguerias',
    description: 'Envie itens e observações para a produção com mais clareza.',
  },
  {
    icon: Coffee,
    title: 'Cafeterias e lanchonetes',
    description: 'Ganhe velocidade em operações de alto giro e atendimento rápido.',
  },
  {
    icon: ShoppingBasket,
    title: 'Outros negócios de alimentação',
    description: 'Adapte produtos, categorias, mesas e usuários à sua rotina.',
  },
]

const painPoints = [
  'Pedidos anotados errado ou digitados mais de uma vez',
  'Cliente esperando para chamar a equipe e fazer o pedido',
  'Comunicação confusa entre salão e cozinha',
  'Fechamento de conta manual e sujeito a conferências',
  'Dificuldade para saber quais mesas e pedidos precisam de atenção',
]

const modules = [
  {
    icon: TabletSmartphone,
    eyebrow: 'Tablet ou QR Code',
    title: 'Pedido digital na mesa',
    description: 'O cliente consulta o cardápio, escolhe itens, adiciona observações e envia o pedido sem ruído na anotação.',
    features: ['Cardápio por categorias', 'Carrinho e observações', 'Chamar garçom e pedir conta'],
    tone: 'orange',
  },
  {
    icon: ChefHat,
    eyebrow: 'Painel da cozinha',
    title: 'Produção organizada por status',
    description: 'A cozinha recebe mesa, itens e observações em uma fila visual preparada para acompanhar cada etapa do pedido.',
    features: ['Recebido, preparando e pronto', 'Observações em destaque', 'Impressão de comanda'],
    tone: 'dark',
  },
  {
    icon: WalletCards,
    eyebrow: 'Painel do caixa',
    title: 'Conta clara e fechamento ágil',
    description: 'Consumo, taxa de serviço, desconto e pagamentos ficam reunidos para facilitar a conferência e liberar a mesa.',
    features: ['Resumo da conta', 'Pagamentos parciais', 'Recibo e liberação da mesa'],
    tone: 'green',
  },
  {
    icon: LayoutDashboard,
    eyebrow: 'Administração',
    title: 'Controle central da operação',
    description: 'A gestão acompanha o salão e administra a estrutura que mantém o atendimento funcionando todos os dias.',
    features: ['Mesas e tokens', 'Categorias e produtos', 'Configurações do restaurante'],
    tone: 'blue',
  },
  {
    icon: FileBarChart,
    eyebrow: 'Relatórios',
    title: 'Informação para decidir melhor',
    description: 'Vendas diárias, produtos mais pedidos e uso das mesas ajudam a enxergar a operação com mais contexto.',
    features: ['Vendas por pagamento', 'Ranking de produtos', 'Histórico de mesas'],
    tone: 'green',
  },
  {
    icon: Users,
    eyebrow: 'Equipe e segurança',
    title: 'Acesso certo para cada função',
    description: 'Perfis de administração, gerência, cozinha e caixa mantêm cada profissional focado no seu painel.',
    features: ['Perfis por função', 'Logs operacionais', 'Acesso autenticado'],
    tone: 'orange',
  },
]

const commercialBenefits = [
  {
    icon: Zap,
    title: 'Atendimento mais rápido',
    description: 'O cliente pode iniciar o pedido sem esperar uma nova passagem da equipe pela mesa.',
  },
  {
    icon: CircleCheckBig,
    title: 'Menos erros no pedido',
    description: 'Itens e observações chegam à cozinha exatamente como foram registrados no cardápio.',
  },
  {
    icon: BellRing,
    title: 'Setores mais alinhados',
    description: 'Salão, cozinha e caixa acompanham o mesmo fluxo em vez de depender de recados soltos.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Experiência moderna',
    description: 'Uma interface profissional para clientes e equipe em tablets, celulares e computadores.',
  },
  {
    icon: BarChart3,
    title: 'Controle da operação',
    description: 'Mesas, pedidos, produtos, usuários e relatórios ficam reunidos em um único sistema.',
  },
  {
    icon: ReceiptText,
    title: 'Conta mais transparente',
    description: 'O caixa visualiza consumo, taxas, descontos e pagamentos antes de liberar a mesa.',
  },
]

const steps = [
  {
    number: '01',
    icon: QrCode,
    title: 'Cliente pede',
    description: 'A mesa acessa o cardápio pelo tablet ou QR Code, escolhe os itens e envia a comanda.',
  },
  {
    number: '02',
    icon: ChefHat,
    title: 'Cozinha recebe',
    description: 'O pedido entra no painel com mesa, itens, observações e status de produção.',
  },
  {
    number: '03',
    icon: CreditCard,
    title: 'Caixa fecha',
    description: 'O consumo é calculado, o pagamento é registrado e a mesa pode ser liberada.',
  },
  {
    number: '04',
    icon: Settings,
    title: 'Admin gerencia',
    description: 'A gestão acompanha a operação e administra mesas, cardápio, equipe e relatórios.',
  },
]

const acquisitionSteps = [
  {
    icon: MessageCircle,
    number: '01',
    title: 'O restaurante entra em contato',
    description: 'Conte qual é o tipo de estabelecimento e o que você deseja organizar na operação.',
  },
  {
    icon: ListChecks,
    number: '02',
    title: 'A operação é entendida',
    description: 'Mesas, setores, produtos, equipe e fluxo de atendimento entram no levantamento da implantação.',
  },
  {
    icon: Settings,
    number: '03',
    title: 'O KiPedido é configurado',
    description: 'A estrutura inicial do painel é preparada para refletir a rotina do estabelecimento.',
  },
  {
    icon: Rocket,
    number: '04',
    title: 'A equipe começa a usar',
    description: 'Tablet, cozinha, caixa e administração passam a trabalhar no mesmo fluxo.',
  },
]

const trustItems = [
  { icon: CircleCheckBig, title: 'Fluxo validado', description: 'Pedido, cozinha, conta e liberação cobertos por testes.' },
  { icon: MonitorSmartphone, title: 'Painel responsivo', description: 'Experiência preparada para tablet, celular e computador.' },
  { icon: PackageCheck, title: 'Pronto para deploy', description: 'Build de produção e variáveis documentadas.' },
  { icon: Server, title: 'Backend Laravel', description: 'API, autenticação, regras operacionais e segurança.' },
  { icon: Cloud, title: 'Frontend React + Vercel', description: 'SPA pública e painéis internos com deploy independente.' },
  { icon: Database, title: 'Neon/Postgres', description: 'Banco PostgreSQL preparado para conexão segura em produção.' },
]

function PrimarySalesCta({ compact = false, label }: { compact?: boolean; label?: string }) {
  const className = compact ? 'sales-button sales-button--compact' : 'sales-button'
  const buttonLabel = label ?? (compact ? 'Quero adquirir' : 'Quero adquirir o KiPedido')

  return (
    <a
      className={className}
      data-sales-cta="acquisition"
      href={salesContactUrl ?? '#adquirir'}
      rel={salesContactUrl ? 'noreferrer' : undefined}
      target={salesContactUrl?.startsWith('https:') ? '_blank' : undefined}
    >
      {buttonLabel}
      <ArrowRight size={compact ? 17 : 19} />
    </a>
  )
}

function ImplementationCta() {
  return <PrimarySalesCta label="Falar sobre implantação" />
}

function ProductPreview() {
  return (
    <div className="sales-preview" aria-label="Prévia demonstrativa dos painéis do KiPedido">
      <div className="sales-preview__glow" />
      <div className="sales-preview__window">
        <header className="sales-preview__topbar">
          <div className="sales-preview__brand">
            <span>K</span>
            <strong>KiPedido</strong>
          </div>
          <div className="sales-preview__topbar-meta">
            <span className="sales-live-dot" />
            Prévia do produto
          </div>
        </header>

        <div className="sales-preview__body">
          <aside className="sales-preview__sidebar" aria-hidden="true">
            <span className="is-active"><LayoutDashboard size={16} /></span>
            <span><Utensils size={16} /></span>
            <span><ChefHat size={16} /></span>
            <span><BarChart3 size={16} /></span>
          </aside>

          <div className="sales-preview__content">
            <div className="sales-preview__heading">
              <div>
                <small>Painel operacional</small>
                <strong>Todos os setores no mesmo fluxo</strong>
              </div>
              <span><Sparkles size={14} /> Demonstração</span>
            </div>

            <div className="sales-metrics">
              <article>
                <span>Controle de mesas</span>
                <strong>Mapa visual</strong>
                <small>Livre • ocupada • conta</small>
              </article>
              <article>
                <span>Fila da cozinha</span>
                <strong>Por status</strong>
                <small>Recebido • preparo • pronto</small>
              </article>
              <article>
                <span>Gestão</span>
                <strong>Visão central</strong>
                <small>Pedidos • produtos • relatórios</small>
              </article>
            </div>

            <div className="sales-operations">
              <section>
                <header>
                  <div>
                    <small>Cozinha</small>
                    <strong>Pedidos em produção</strong>
                  </div>
                  <span>Fluxo do pedido</span>
                </header>
                <div className="sales-order-row">
                  <span className="sales-order-row__table">07</span>
                  <div><strong>Pedido da mesa</strong><small>Itens e observações</small></div>
                  <span className="sales-status sales-status--orange">Preparando</span>
                </div>
                <div className="sales-order-row">
                  <span className="sales-order-row__table">12</span>
                  <div><strong>Pedido da mesa</strong><small>Pronto para servir</small></div>
                  <span className="sales-status sales-status--green">Pronto</span>
                </div>
                <div className="sales-order-row">
                  <span className="sales-order-row__table">03</span>
                  <div><strong>Pedido da mesa</strong><small>Entrada confirmada</small></div>
                  <span className="sales-status sales-status--muted">Recebido</span>
                </div>
              </section>

              <section className="sales-tables-card">
                <header>
                  <div>
                    <small>Salão</small>
                    <strong>Status das mesas</strong>
                  </div>
                </header>
                <div className="sales-table-grid">
                  <span className="is-occupied">01<small>Ocupada</small></span>
                  <span className="is-free">02<small>Livre</small></span>
                  <span className="is-paying">03<small>Conta</small></span>
                  <span className="is-occupied">04<small>Ocupada</small></span>
                  <span className="is-free">05<small>Livre</small></span>
                  <span className="is-occupied">06<small>Ocupada</small></span>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className="sales-preview__floating sales-preview__floating--top">
        <span><Zap size={18} /></span>
        <div><strong>Pedido recebido</strong><small>Mesa identificada</small></div>
      </div>
      <div className="sales-preview__floating sales-preview__floating--bottom">
        <span><CircleCheckBig size={18} /></span>
        <div><strong>Conta fechada</strong><small>Mesa liberada</small></div>
      </div>
    </div>
  )
}

export function SalesPage() {
  usePageTitle('Sistema de pedidos e gestão para restaurantes')

  return (
    <div className="sales-page">
      <header className="sales-header">
        <a className="sales-brand" href="#inicio" aria-label="KiPedido - início">
          <span className="sales-brand__mark">K</span>
          <span><strong>KiPedido</strong><small>Seu restaurante em movimento</small></span>
        </a>

        <nav className="sales-nav" aria-label="Navegação principal">
          <a href="#para-quem">Para quem</a>
          <a href="#solucao">Solução</a>
          <a href="#recursos">Recursos</a>
          <a href="#implantacao">Implantação</a>
          <a href="#adquirir">Como adquirir</a>
        </nav>

        <div className="sales-header__actions">
          <PrimarySalesCta compact />
        </div>
      </header>

      <main>
        <section className="sales-hero" id="inicio">
          <div className="sales-hero__copy">
            <div className="sales-pill">
              <Sparkles size={15} />
              Sistema comercial para operações de food service
            </div>
            <h1>
              Pedidos certos.<br />
              Equipe alinhada.<br />
              <span>Operação no controle.</span>
            </h1>
            <p className="sales-hero__lead">
              O KiPedido é um sistema de pedidos e gestão para restaurantes que conecta o atendimento da mesa, a produção da cozinha, o fechamento do caixa e o controle administrativo.
            </p>

            <div className="sales-hero__actions">
              <PrimarySalesCta />
              <a className="sales-button sales-button--secondary" href="#como-funciona">
                Ver como funciona
                <ChevronRight size={19} />
              </a>
            </div>

            <ul className="sales-benefit-list" aria-label="Principais benefícios do KiPedido">
              {heroBenefits.map((benefit) => (
                <li key={benefit}><span><Check size={14} /></span>{benefit}</li>
              ))}
            </ul>
          </div>

          <ProductPreview />
        </section>

        <section className="sales-trust-strip" aria-label="Pilares do produto">
          <div><ShieldCheck size={23} /><span><strong>Acesso seguro</strong><small>Token exclusivo por mesa</small></span></div>
          <div><Smartphone size={23} /><span><strong>Responsivo e instalável</strong><small>Tablet, celular ou computador</small></span></div>
          <div><Zap size={23} /><span><strong>Operação integrada</strong><small>Salão, cozinha e caixa conectados</small></span></div>
          <div><BarChart3 size={23} /><span><strong>Gestão centralizada</strong><small>Indicadores e histórico operacional</small></span></div>
        </section>

        <section className="sales-section sales-audience" id="para-quem">
          <div className="sales-section__intro sales-section__intro--center">
            <span className="sales-kicker">Feito para quem serve bem</span>
            <h2>Uma base flexível para diferentes operações de alimentação.</h2>
            <p>O KiPedido foi pensado para negócios que atendem em mesas e precisam coordenar pedidos, produção, recebimento e gestão interna.</p>
          </div>
          <div className="sales-audience__grid">
            {audiences.map((audience) => (
              <article key={audience.title}>
                <span><audience.icon size={22} /></span>
                <h3>{audience.title}</h3>
                <p>{audience.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="sales-section sales-problem" id="solucao">
          <div className="sales-section__intro">
            <span className="sales-kicker">Problemas que viram custo</span>
            <h2>Quando a informação se perde, o atendimento inteiro sente.</h2>
            <p>Erros de anotação, demora e desencontro entre setores prejudicam a experiência do cliente e deixam a equipe apagando incêndios.</p>
          </div>

          <div className="sales-problem__comparison">
            <article className="sales-comparison-card sales-comparison-card--before">
              <span className="sales-comparison-card__label">Rotina desconectada</span>
              <h3>Ruído que custa tempo</h3>
              <ul>
                {painPoints.map((painPoint) => (
                  <li key={painPoint}><span><CircleX size={14} /></span>{painPoint}</li>
                ))}
              </ul>
            </article>
            <div className="sales-comparison-arrow"><ArrowRight size={24} /></div>
            <article className="sales-comparison-card sales-comparison-card--after">
              <span className="sales-comparison-card__label">Operação com KiPedido</span>
              <h3>Um fluxo que trabalha junto</h3>
              <ul>
                <li><span><Check size={14} /></span>Pedido digital direto para a cozinha</li>
                <li><span><Check size={14} /></span>Status claro em cada etapa de produção</li>
                <li><span><Check size={14} /></span>Mesas e comandas organizadas no painel</li>
                <li><span><Check size={14} /></span>Conta consolidada para o fechamento</li>
                <li><span><Check size={14} /></span>Gestão apoiada por dados da operação</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="sales-flow" id="como-funciona">
          <div className="sales-flow__header">
            <div>
              <span className="sales-kicker sales-kicker--light">Do pedido ao controle da operação</span>
              <h2>Quatro etapas.<br />Um único fluxo de trabalho.</h2>
            </div>
            <p>O KiPedido entrega a informação certa para cada área e acompanha a jornada completa da mesa.</p>
          </div>

          <div className="sales-flow__steps">
            {steps.map((step) => (
              <article key={step.number}>
                <span className="sales-flow__number">{step.number}</span>
                <div className="sales-flow__icon"><step.icon size={23} /></div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="sales-section sales-modules" id="recursos">
          <div className="sales-section__intro sales-section__intro--center">
            <span className="sales-kicker">O painel que acompanha sua rotina</span>
            <h2>Do cardápio à gestão,<br />cada módulo tem uma função clara.</h2>
            <p>As telas foram desenhadas para o contexto de quem usa, sem transformar a rotina do restaurante em um software complicado.</p>
          </div>

          <div className="sales-modules__grid">
            {modules.map((module) => (
              <article className={`sales-module-card sales-module-card--${module.tone}`} key={module.title}>
                <div className="sales-module-card__icon"><module.icon size={25} /></div>
                <span>{module.eyebrow}</span>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <ul>
                  {module.features.map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="sales-benefits">
          <div className="sales-benefits__intro">
            <span className="sales-kicker">Benefícios para a operação real</span>
            <h2>Mais clareza para a equipe. Mais fluidez para o cliente.</h2>
            <p>O KiPedido organiza o caminho da informação para que cada profissional saiba o que precisa fazer e a mesa seja atendida com mais consistência.</p>
          </div>
          <div className="sales-benefits__grid">
            {commercialBenefits.map((benefit) => (
              <article key={benefit.title}>
                <span><benefit.icon size={21} /></span>
                <div><h3>{benefit.title}</h3><p>{benefit.description}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="sales-section sales-implementation" id="implantacao">
          <div className="sales-implementation__content">
            <span className="sales-kicker">Implantação configurada para o restaurante</span>
            <h2>Uma estrutura profissional, pronta para receber sua operação.</h2>
            <p>Mesas, cardápio, usuários e configurações podem ser preparados para a rotina do estabelecimento. A equipe acessa os painéis em dispositivos compatíveis, sem depender de um aplicativo nativo para começar.</p>
            <ul>
              <li><Check size={15} />Uso em tablets, celulares e computadores</li>
              <li><Check size={15} />Frontend React publicável na Vercel</li>
              <li><Check size={15} />API Laravel em hospedagem PHP</li>
              <li><Check size={15} />Banco Neon/Postgres com conexão segura</li>
            </ul>
            <ImplementationCta />
          </div>

          <div className="sales-implementation__architecture" aria-label="Arquitetura de implantação do KiPedido">
            <article className="is-highlighted">
              <span><Cloud size={24} /></span>
              <div><small>Experiência web</small><strong>React na Vercel</strong><p>Landing, tablet e painéis responsivos.</p></div>
            </article>
            <div className="sales-implementation__connector"><ArrowRight size={19} /></div>
            <article>
              <span><Server size={24} /></span>
              <div><small>Regras do sistema</small><strong>API Laravel em host PHP</strong><p>Autenticação, pedidos, caixa e gestão.</p></div>
            </article>
            <div className="sales-implementation__connector"><ArrowRight size={19} /></div>
            <article>
              <span><Database size={24} /></span>
              <div><small>Dados da operação</small><strong>Neon/Postgres</strong><p>Persistência segura em PostgreSQL.</p></div>
            </article>
          </div>
        </section>

        <section className="sales-acquisition" id="adquirir">
          <div className="sales-acquisition__intro">
            <span className="sales-kicker sales-kicker--light">Como adquirir o KiPedido</span>
            <h2>Uma implantação orientada pela realidade do seu restaurante.</h2>
            <p>Não existe checkout automático ou pacote genérico: o próximo passo é conversar sobre a operação e preparar o painel com responsabilidade.</p>
          </div>

          <div className="sales-acquisition__steps">
            {acquisitionSteps.map((step) => (
              <article key={step.number}>
                <span className="sales-acquisition__number">{step.number}</span>
                <div className="sales-acquisition__icon"><step.icon size={22} /></div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>

          <div className={`sales-contact-panel ${salesContactUrl ? 'sales-contact-panel--available' : 'sales-contact-panel--unavailable'}`} role="status">
            <div className="sales-contact-panel__icon">
              {salesContactUrl ? <MessageCircle size={25} /> : <Settings size={25} />}
            </div>
            <div className="sales-contact-panel__copy">
              <span>{salesContactUrl ? 'Canal comercial disponível' : 'Canal comercial em configuração'}</span>
              <h3>{salesContactUrl ? 'Fale sobre sua operação e solicite a implantação.' : 'O contato de vendas ainda não foi publicado.'}</h3>
              <p>
                {salesContactUrl
                  ? 'Use o canal oficial para contar sobre seu estabelecimento, tirar dúvidas e alinhar os próximos passos.'
                  : 'Para ativar a aquisição, configure VITE_SALES_CONTACT_URL no ambiente do frontend. Até lá, nenhum botão direciona para login, demonstração ou contato não verificado.'}
              </p>
            </div>
            {salesContactUrl ? <PrimarySalesCta label="Falar com vendas" /> : <span className="sales-contact-panel__badge">Contato indisponível no momento</span>}
          </div>
        </section>

        <section className="sales-section sales-confidence">
          <div className="sales-confidence__header">
            <div>
              <span className="sales-kicker">Tecnologia e produto</span>
              <h2>Uma base técnica verificável.</h2>
            </div>
            <p>Conheça os fundamentos que já fazem parte do produto e sustentam uma implantação profissional.</p>
          </div>
          <div className="sales-confidence__grid">
            {trustItems.map((item) => (
              <article key={item.title}>
                <span><item.icon size={22} /></span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="sales-section sales-ready">
          <div className="sales-ready__illustration" aria-hidden="true">
            <div className="sales-ready__orbit sales-ready__orbit--one" />
            <div className="sales-ready__orbit sales-ready__orbit--two" />
            <span className="sales-ready__center"><Store size={36} /></span>
            <span className="sales-ready__node sales-ready__node--one"><TabletSmartphone size={22} /></span>
            <span className="sales-ready__node sales-ready__node--two"><ChefHat size={22} /></span>
            <span className="sales-ready__node sales-ready__node--three"><WalletCards size={22} /></span>
          </div>
          <div className="sales-ready__copy">
            <span className="sales-kicker">Para donos e gestores de food service</span>
            <h2>Modernize o atendimento sem perder o controle da operação.</h2>
            <p>Solicite a implantação do KiPedido para o seu restaurante e conte como sua equipe organiza pedidos, cozinha, caixa e administração.</p>
            <div className="sales-ready__actions">
              <PrimarySalesCta label="Solicitar implantação" />
              <a className="sales-ready__login" href="#implantacao">Entender a implantação <ArrowRight size={17} /></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="sales-footer">
        <div className="sales-brand sales-brand--footer">
          <span className="sales-brand__mark">K</span>
          <span><strong>KiPedido</strong><small>Seu restaurante em movimento</small></span>
        </div>
        <p>Sistema de pedidos e gestão para operações de alimentação.</p>
        <nav aria-label="Links do produto">
          <a href="#para-quem">Para quem</a>
          <a href="#recursos">Recursos</a>
          <a href="#implantacao">Implantação</a>
          <a href="#adquirir">Adquirir KiPedido</a>
        </nav>
      </footer>
    </div>
  )
}
