import { BellRing, CheckCircle2, Clock3, Minus, Plus, ReceiptText, Send, ShoppingCart, Utensils } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MoneyValue } from '../../components/shared/MoneyValue'
import { ApiStateMessage, StateMessage } from '../../components/shared/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApiQuery } from '../../hooks/useApiQuery'
import { usePageTitle } from '../../hooks/usePageTitle'
import { apiGet, apiPost } from '../../services/api'
import { formatCurrency, formatDateTime } from '../../services/format'
import type {
  ApiCategory,
  ApiOrder,
  ApiProduct,
  ApiServiceCall,
  TabletMenuResponse,
  TabletOrdersResponse,
  TabletSessionResponse,
} from '../../types'

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

  function setNotes(productId: number, notes: string) {
    update(items.map((item) => item.product_id === productId ? { ...item, notes } : item))
  }

  function clear() {
    update([])
  }

  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)

  return { items, count, total, add, setQuantity, setNotes, clear }
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
      <div className="tablet-hero operational-card">
        <span className="eyebrow">Bem-vindo ao KiPedido</span>
        <h1>{data?.table.name ?? 'Mesa'}</h1>
        <p>Escolha seus pratos, acompanhe o preparo e peça ajuda quando precisar.</p>
        <div className="compact-meta">
          <span><Utensils size={16} /> Cardápio digital</span>
          <span><Clock3 size={16} /> Pedido direto para a cozinha</span>
        </div>
      </div>

      {isLoading ? <StateMessage title="Carregando dados da mesa..." tone="loading" /> : null}
      {error ? <ApiStateMessage error={error} /> : null}
      {success ? <StateMessage title={success} tone="success" /> : null}
      {actionError ? <StateMessage title={actionError} tone="error" /> : null}

      <div className="tablet-actions">
        <Link className="tablet-action tablet-action--primary" to={`/tablet/${token}/cardapio`}>
          <ShoppingCart size={34} />
          <span>Ver cardápio</span>
          <small>Adicionar itens ao pedido</small>
        </Link>
        <Link className="tablet-action" to={`/tablet/${token}/conta`}>
          <ReceiptText size={34} />
          <span>Pedir conta</span>
          <small>Ver resumo do consumo</small>
        </Link>
        <button className="tablet-action" type="button" onClick={() => void callWaiter()}>
          <BellRing size={34} />
          <span>Chamar garçom</span>
          <small>Solicitar atendimento</small>
        </button>
      </div>
    </section>
  )
}

export function TabletMenuPage() {
  usePageTitle('Cardápio')
  const token = useTabletToken()
  const cart = useCart(token)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const { data, error, isLoading } = useApiQuery(() => apiGet<TabletMenuResponse>(`/tablet/${token}/menu`, { auth: false }), [token])
  const categories = data?.categories ?? []
  const visibleCategories = selectedCategoryId
    ? categories.filter((category) => category.id === selectedCategoryId)
    : categories
  const productsCount = categories.reduce((sum, category) => sum + (category.products?.length ?? 0), 0)

  return (
    <section className="tablet-page tablet-menu-page">
      <header className="tablet-page__header tablet-page__header--stacked">
        <div>
          <span className="eyebrow">Cardápio digital</span>
          <h1>{data?.table.name ? `Pedido da ${data.table.name}` : 'Escolha seu pedido'}</h1>
        </div>
        <Link className="secondary-button tablet-cart-link" to={`/tablet/${token}/carrinho`}>
          <ShoppingCart size={20} />
          {cart.count} item{cart.count === 1 ? '' : 's'}
        </Link>
      </header>

      {isLoading ? <StateMessage title="Carregando cardápio..." tone="loading" /> : null}
      {error ? <ApiStateMessage error={error} /> : null}
      {!isLoading && !error && productsCount === 0 ? <StateMessage title="Nenhum produto disponível no momento." /> : null}

      {categories.length > 0 ? (
        <div className="category-rail" aria-label="Categorias do cardápio">
          <button className={selectedCategoryId === null ? 'category-chip category-chip--active' : 'category-chip'} type="button" onClick={() => setSelectedCategoryId(null)}>
            Todos
          </button>
          {categories.map((category) => (
            <button
              className={selectedCategoryId === category.id ? 'category-chip category-chip--active' : 'category-chip'}
              type="button"
              onClick={() => setSelectedCategoryId(category.id)}
              key={category.id}
            >
              {category.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="tablet-menu-sections">
        {visibleCategories.map((category) => (
          <section className="menu-category" key={category.id}>
            <div className="menu-category__header">
              <h2>{category.name}</h2>
              <span>{category.products?.length ?? 0} opções</span>
            </div>
            <div className="menu-grid">
              {(category.products ?? []).map((product) => (
                <ProductCard category={category} product={product} onAdd={() => cart.add(product)} key={product.id} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {cart.count > 0 ? (
        <Link className="floating-cart-summary" to={`/tablet/${token}/carrinho`}>
          <span>{cart.count} item{cart.count === 1 ? '' : 's'} no carrinho</span>
          <strong>{formatCurrency(cart.total)}</strong>
          <ShoppingCart size={22} />
        </Link>
      ) : null}
    </section>
  )
}

function ProductCard({ category, product, onAdd }: { category: ApiCategory; product: ApiProduct; onAdd: () => void }) {
  return (
    <article className="menu-item" key={product.id}>
      <div className="menu-item__image">
        <span>{category.name.slice(0, 2).toUpperCase()}</span>
      </div>
      <div className="menu-item__content">
        <span>{category.name}</span>
        <h2>{product.name}</h2>
        <p>{product.description ?? 'Sem descrição.'}</p>
        <div className="menu-item__footer">
          <strong>{formatCurrency(product.price)}</strong>
          <button className="primary-button menu-add-button" type="button" onClick={onAdd}>
            <Plus size={22} />
            Adicionar
          </button>
        </div>
      </div>
    </article>
  )
}

export function TabletCartPage() {
  usePageTitle('Carrinho')
  const token = useTabletToken()
  const cart = useCart(token)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

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
    <section className="tablet-page tablet-cart-page">
      <header className="tablet-page__header">
        <div>
          <span className="eyebrow">Carrinho</span>
          <h1>Revise seu pedido</h1>
        </div>
        <MoneyValue value={cart.total} label="Total parcial" emphasis />
      </header>

      {success ? <StateMessage title={success} tone="success" /> : null}
      {error ? <StateMessage title={error} tone="error" /> : null}

      <section className="cart-panel">
        {cart.items.length === 0 ? <StateMessage title="Seu carrinho está vazio." description="Abra o cardápio para escolher os itens." /> : null}
        {cart.items.map((item) => (
          <article className="cart-row cart-row--detailed" key={item.product_id}>
            <div className="cart-row__main">
              <strong>{item.product_name}</strong>
              <small>{formatCurrency(item.unit_price)} por unidade</small>
              <label className="cart-note">
                Observação
                <textarea value={item.notes ?? ''} onChange={(event) => cart.setNotes(item.product_id, event.target.value)} placeholder="Ex: sem cebola, ponto da carne..." />
              </label>
            </div>
            <div className="stepper">
              <button type="button" title="Diminuir" onClick={() => cart.setQuantity(item.product_id, item.quantity - 1)}><Minus size={20} /></button>
              <span>{item.quantity}</span>
              <button type="button" title="Aumentar" onClick={() => cart.setQuantity(item.product_id, item.quantity + 1)}><Plus size={20} /></button>
            </div>
            <MoneyValue value={item.unit_price * item.quantity} />
          </article>
        ))}
        <div className="cart-total">
          <span>Total parcial</span>
          <strong>{formatCurrency(cart.total)}</strong>
        </div>
        <button className="primary-button primary-button--wide send-order-button" type="button" disabled={cart.items.length === 0 || isSending} onClick={() => void sendOrder()}>
          <Send size={22} />
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
          <article className="order-status-card" key={order.id}>
            <CheckCircle2 size={24} />
            <div>
              <strong>{order.code}</strong>
              <small>{formatDateTime(order.sent_at)}</small>
              <span>{(order.items ?? []).map((item) => `${item.quantity}x ${item.product_name}`).join(', ')}</span>
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

  const billRows = useMemo(() => data?.bill ? [
    ['Subtotal', data.bill.subtotal],
    ['Taxa de serviço', data.bill.service_fee_amount],
    ['Desconto', data.bill.discount_amount],
  ] as const : [], [data?.bill])

  return (
    <section className="tablet-page tablet-bill-page">
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
        {!data?.bill ? <StateMessage title="A mesa ainda não possui consumo aberto." description="Envie um pedido para iniciar a sessão." /> : null}
        {data?.bill ? (
          <>
            {billRows.map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{formatCurrency(value)}</strong></div>
            ))}
            <div className="bill-panel__total"><span>Total</span><strong>{formatCurrency(data.bill.total_amount)}</strong></div>
          </>
        ) : null}
        <button className="primary-button primary-button--wide send-order-button" type="button" onClick={() => void requestBill()}>
          <ReceiptText size={22} />
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
