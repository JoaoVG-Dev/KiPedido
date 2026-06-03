import { BellRing, CheckCircle2, Minus, Plus, ReceiptText, Send, ShoppingCart } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ApiStateMessage, StateMessage } from '../../components/shared/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApiQuery } from '../../hooks/useApiQuery'
import { usePageTitle } from '../../hooks/usePageTitle'
import { apiGet, apiPost } from '../../services/api'
import { formatCurrency, formatDateTime } from '../../services/format'
import type {
  ApiOrder,
  ApiProduct,
  ApiServiceCall,
  TabletMenuResponse,
  TabletOrdersResponse,
  TabletSessionResponse,
} from '../../types'
import { useState } from 'react'

type CartItem = {
  product_id: number
  product_name: string
  unit_price: number
  quantity: number
  notes?: string
}

function cartKey(token: string) {
  return `kipedido.cart.${token}`
}

function readCart(token: string): CartItem[] {
  const stored = localStorage.getItem(cartKey(token))
  return stored ? JSON.parse(stored) as CartItem[] : []
}

function writeCart(token: string, items: CartItem[]) {
  localStorage.setItem(cartKey(token), JSON.stringify(items))
}

function useTabletToken() {
  return useParams().token ?? 'mesa-01-teste'
}

function useCart(token: string) {
  const [items, setItems] = useState<CartItem[]>(() => readCart(token))

  function update(nextItems: CartItem[]) {
    setItems(nextItems)
    writeCart(token, nextItems)
  }

  function add(product: ApiProduct) {
    const existing = items.find((item) => item.product_id === product.id)
    const nextItems = existing
      ? items.map((item) => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...items, {
        product_id: product.id,
        product_name: product.name,
        unit_price: Number(product.price),
        quantity: 1,
      }]

    update(nextItems)
  }

  function setQuantity(productId: number, quantity: number) {
    update(items
      .map((item) => item.product_id === productId ? { ...item, quantity } : item)
      .filter((item) => item.quantity > 0))
  }

  function clear() {
    update([])
  }

  return { items, add, setQuantity, clear }
}

export function TabletHomePage() {
  usePageTitle('Mesa')
  const token = useTabletToken()
  const { data, error, isLoading } = useApiQuery(() => apiGet<TabletSessionResponse>(`/tablet/${token}/session`, { auth: false }), [token])
  const [success, setSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function callWaiter() {
    setActionError(null)
    setSuccess(null)

    try {
      await apiPost<ApiServiceCall>(`/tablet/${token}/call-waiter`, {}, { auth: false })
      setSuccess('Garçom chamado com sucesso.')
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Erro ao chamar garçom.')
    }
  }

  return (
    <section className="tablet-home">
      <div>
        <span className="eyebrow">Bem-vindo</span>
        <h1>{data?.table.name ?? 'Mesa'}</h1>
        <p>Escolha seus itens, acompanhe o preparo e peça a conta pelo tablet.</p>
      </div>

      {isLoading ? <StateMessage title="Carregando dados da mesa..." tone="loading" /> : null}
      {error ? <ApiStateMessage error={error} /> : null}
      {success ? <StateMessage title={success} tone="success" /> : null}
      {actionError ? <StateMessage title={actionError} tone="error" /> : null}

      <div className="tablet-actions">
        <Link className="tablet-action tablet-action--primary" to={`/tablet/${token}/cardapio`}>
          <ShoppingCart size={30} />
          Ver cardápio
        </Link>
        <Link className="tablet-action" to={`/tablet/${token}/conta`}>
          <ReceiptText size={30} />
          Pedir conta
        </Link>
        <button className="tablet-action" type="button" onClick={() => void callWaiter()}>
          <BellRing size={30} />
          Chamar garçom
        </button>
      </div>
    </section>
  )
}

export function TabletMenuPage() {
  usePageTitle('Cardápio')
  const token = useTabletToken()
  const cart = useCart(token)
  const { data, error, isLoading } = useApiQuery(() => apiGet<TabletMenuResponse>(`/tablet/${token}/menu`, { auth: false }), [token])
  const products = data?.categories.flatMap((category) => category.products ?? []) ?? []

  return (
    <section className="tablet-page">
      <header className="tablet-page__header">
        <div>
          <span className="eyebrow">Cardápio digital</span>
          <h1>{data?.table.name ? `Pedido da ${data.table.name}` : 'Escolha seu pedido'}</h1>
        </div>
      </header>

      {isLoading ? <StateMessage title="Carregando cardápio..." tone="loading" /> : null}
      {error ? <ApiStateMessage error={error} /> : null}
      {!isLoading && !error && products.length === 0 ? <StateMessage title="Nenhum produto disponível no momento." /> : null}

      <div className="menu-grid">
        {products.map((product) => (
          <article className="menu-item" key={product.id}>
            <div className="menu-item__image">{(product.category?.name ?? 'Produto').slice(0, 2).toUpperCase()}</div>
            <div className="menu-item__content">
              <span>{product.category?.name ?? 'Cardápio'}</span>
              <h2>{product.name}</h2>
              <p>{product.description ?? 'Sem descrição.'}</p>
              <div className="menu-item__footer">
                <strong>{formatCurrency(product.price)}</strong>
                <button className="icon-button icon-button--large" type="button" title="Adicionar ao carrinho" onClick={() => cart.add(product)}>
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
  const token = useTabletToken()
  const cart = useCart(token)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const total = cart.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

  async function sendOrder() {
    setSuccess(null)
    setError(null)
    setIsSending(true)

    try {
      await apiPost<ApiOrder>(`/tablet/${token}/orders`, {
        items: cart.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          notes: item.notes,
        })),
      }, { auth: false })
      cart.clear()
      setSuccess('Pedido enviado com sucesso.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro ao enviar pedido.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="tablet-page">
      <header className="tablet-page__header">
        <div>
          <span className="eyebrow">Carrinho</span>
          <h1>Revise seu pedido</h1>
        </div>
      </header>

      {success ? <StateMessage title={success} tone="success" /> : null}
      {error ? <StateMessage title={error} tone="error" /> : null}

      <section className="cart-panel">
        {cart.items.length === 0 ? <StateMessage title="Seu carrinho está vazio." /> : null}
        {cart.items.map((item) => (
          <article className="cart-row" key={item.product_id}>
            <div>
              <strong>{item.product_name}</strong>
              <small>{formatCurrency(item.unit_price)}</small>
            </div>
            <div className="stepper">
              <button type="button" title="Diminuir" onClick={() => cart.setQuantity(item.product_id, item.quantity - 1)}><Minus size={20} /></button>
              <span>{item.quantity}</span>
              <button type="button" title="Aumentar" onClick={() => cart.setQuantity(item.product_id, item.quantity + 1)}><Plus size={20} /></button>
            </div>
            <strong>{formatCurrency(item.unit_price * item.quantity)}</strong>
          </article>
        ))}
        <div className="cart-total">
          <span>Total parcial</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <button className="primary-button primary-button--wide" type="button" disabled={cart.items.length === 0 || isSending} onClick={() => void sendOrder()}>
          <Send size={20} />
          {isSending ? 'Enviando...' : 'Enviar pedido'}
        </button>
      </section>
    </section>
  )
}

export function TabletOrdersPage() {
  usePageTitle('Pedidos')
  const token = useTabletToken()
  const { data, error, isLoading } = useApiQuery(() => apiGet<TabletOrdersResponse>(`/tablet/${token}/orders`, { auth: false }), [token])
  const orders = data?.orders ?? []

  return (
    <section className="tablet-page">
      <header className="tablet-page__header">
        <div>
          <span className="eyebrow">Acompanhamento</span>
          <h1>Seus pedidos</h1>
        </div>
      </header>

      {isLoading ? <StateMessage title="Carregando pedidos..." tone="loading" /> : null}
      {error ? <ApiStateMessage error={error} /> : null}
      {!isLoading && !error && orders.length === 0 ? <StateMessage title="Nenhum pedido enviado nesta sessão." /> : null}

      <div className="order-timeline">
        {orders.map((order) => (
          <article key={order.id}>
            <CheckCircle2 size={22} />
            <div>
              <strong>{order.code}</strong>
              <small>{formatDateTime(order.sent_at)}</small>
            </div>
            <StatusBadge label={orderStatusLabel(order.status)} tone={orderStatusTone(order.status)} />
          </article>
        ))}
      </div>
    </section>
  )
}

export function TabletBillPage() {
  usePageTitle('Conta')
  const token = useTabletToken()
  const { data, error, isLoading, reload } = useApiQuery(() => apiGet<TabletSessionResponse>(`/tablet/${token}/session`, { auth: false }), [token])
  const [success, setSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function requestBill() {
    setSuccess(null)
    setActionError(null)

    try {
      await apiPost<ApiServiceCall>(`/tablet/${token}/request-bill`, {}, { auth: false })
      setSuccess('Conta solicitada com sucesso.')
      await reload()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Erro ao pedir conta.')
    }
  }

  return (
    <section className="tablet-page">
      <header className="tablet-page__header">
        <div>
          <span className="eyebrow">Fechamento</span>
          <h1>Resumo da conta</h1>
        </div>
      </header>

      {isLoading ? <StateMessage title="Carregando conta..." tone="loading" /> : null}
      {error ? <ApiStateMessage error={error} /> : null}
      {success ? <StateMessage title={success} tone="success" /> : null}
      {actionError ? <StateMessage title={actionError} tone="error" /> : null}

      <section className="bill-panel">
        {!data?.bill ? <StateMessage title="A mesa ainda não possui consumo aberto." /> : null}
        {data?.bill ? (
          <>
            <div><span>Subtotal</span><strong>{formatCurrency(data.bill.subtotal)}</strong></div>
            <div><span>Taxa de serviço</span><strong>{formatCurrency(data.bill.service_fee_amount)}</strong></div>
            <div><span>Desconto</span><strong>{formatCurrency(data.bill.discount_amount)}</strong></div>
            <div><span>Total</span><strong>{formatCurrency(data.bill.total_amount)}</strong></div>
          </>
        ) : null}
        <button className="primary-button primary-button--wide" type="button" onClick={() => void requestBill()}>
          <ReceiptText size={20} />
          Pedir conta
        </button>
      </section>
    </section>
  )
}

function orderStatusLabel(status: ApiOrder['status']) {
  return {
    received: 'Recebido',
    preparing: 'Em preparo',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  }[status]
}

function orderStatusTone(status: ApiOrder['status']) {
  return {
    received: 'warning',
    preparing: 'info',
    ready: 'success',
    delivered: 'neutral',
    cancelled: 'danger',
  }[status] as 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}
