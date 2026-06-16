import { BellRing, CheckCircle2, Minus, Plus, ReceiptText, Send, ShoppingCart } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatCurrency, products } from '../../services/mockData'

export function TabletHomePage() {
  usePageTitle('Mesa')
  const { token = 'mesa-demo' } = useParams()

  return (
    <section className="tablet-home">
      <div>
        <span className="eyebrow">Bem-vindo</span>
        <h1>Mesa 01</h1>
        <p>Escolha seus itens, acompanhe o preparo e peça a conta pelo tablet.</p>
      </div>
      <div className="tablet-actions">
        <Link className="tablet-action tablet-action--primary" to={`/tablet/${token}/cardapio`}>
          <ShoppingCart size={30} />
          Ver cardápio
        </Link>
        <Link className="tablet-action" to={`/tablet/${token}/conta`}>
          <ReceiptText size={30} />
          Pedir conta
        </Link>
        <button className="tablet-action" type="button">
          <BellRing size={30} />
          Chamar garçom
        </button>
      </div>
    </section>
  )
}

export function TabletMenuPage() {
  usePageTitle('Cardápio')

  return (
    <section className="tablet-page">
      <header className="tablet-page__header">
        <div>
          <span className="eyebrow">Cardápio digital</span>
          <h1>Escolha seu pedido</h1>
        </div>
      </header>

      <div className="menu-grid">
        {products.filter((product) => product.isAvailable).map((product) => (
          <article className="menu-item" key={product.id}>
            <div className="menu-item__image">{product.category.slice(0, 2).toUpperCase()}</div>
            <div className="menu-item__content">
              <span>{product.category}</span>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <div className="menu-item__footer">
                <strong>{formatCurrency(product.price)}</strong>
                <button className="icon-button icon-button--large" type="button" title="Adicionar ao carrinho">
                  <Plus size={26} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function TabletCartPage() {
  usePageTitle('Carrinho')

  return (
    <section className="tablet-page">
      <header className="tablet-page__header">
        <div>
          <span className="eyebrow">Carrinho</span>
          <h1>Revise seu pedido</h1>
        </div>
      </header>

      <section className="cart-panel">
        <article className="cart-row">
          <div>
            <strong>Bolinho de queijo</strong>
            <small>Sem pimenta</small>
          </div>
          <div className="stepper">
            <button type="button" title="Diminuir"><Minus size={20} /></button>
            <span>1</span>
            <button type="button" title="Aumentar"><Plus size={20} /></button>
          </div>
          <strong>{formatCurrency(28.9)}</strong>
        </article>
        <article className="cart-row">
          <div>
            <strong>Suco natural</strong>
            <small>Laranja</small>
          </div>
          <div className="stepper">
            <button type="button" title="Diminuir"><Minus size={20} /></button>
            <span>2</span>
            <button type="button" title="Aumentar"><Plus size={20} /></button>
          </div>
          <strong>{formatCurrency(24)}</strong>
        </article>
        <div className="cart-total">
          <span>Total parcial</span>
          <strong>{formatCurrency(52.9)}</strong>
        </div>
        <button className="primary-button primary-button--wide" type="button">
          <Send size={20} />
          Enviar pedido
        </button>
      </section>
    </section>
  )
}

export function TabletOrdersPage() {
  usePageTitle('Pedidos')

  return (
    <section className="tablet-page">
      <header className="tablet-page__header">
        <div>
          <span className="eyebrow">Acompanhamento</span>
          <h1>Seus pedidos</h1>
        </div>
      </header>

      <div className="order-timeline">
        <article>
          <CheckCircle2 size={22} />
          <div>
            <strong>Pedido recebido</strong>
            <small>KP240612391 às 12:39</small>
          </div>
          <StatusBadge label="Em preparo" tone="info" />
        </article>
        <article>
          <CheckCircle2 size={22} />
          <div>
            <strong>Sobremesa</strong>
            <small>KP240612422 às 12:42</small>
          </div>
          <StatusBadge label="Pronto" tone="success" />
        </article>
      </div>
    </section>
  )
}

export function TabletBillPage() {
  usePageTitle('Conta')

  return (
    <section className="tablet-page">
      <header className="tablet-page__header">
        <div>
          <span className="eyebrow">Fechamento</span>
          <h1>Resumo da conta</h1>
        </div>
      </header>

      <section className="bill-panel">
        <div><span>Subtotal</span><strong>{formatCurrency(132.4)}</strong></div>
        <div><span>Taxa de serviço</span><strong>{formatCurrency(13.24)}</strong></div>
        <div><span>Total</span><strong>{formatCurrency(145.64)}</strong></div>
        <button className="primary-button primary-button--wide" type="button">
          <ReceiptText size={20} />
          Pedir conta
        </button>
      </section>
    </section>
  )
}
