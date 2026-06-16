import {
  ArrowRight,
  BellRing,
  ChefHat,
  ClipboardList,
  Clock3,
  MessageSquareText,
  Minus,
  Plus,
  ReceiptText,
  Send,
  ShoppingCart,
  Trash2,
  Utensils,
  WalletCards,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MoneyValue } from '../../components/shared/MoneyValue'
import { ApiStateMessage, StateMessage } from '../../components/shared/StateMessage'
import { CategoryChips } from '../../components/tablet/CategoryChips'
import { FloatingCartButton } from '../../components/tablet/FloatingCartButton'
import { OrderStatusTimeline } from '../../components/tablet/OrderStatusTimeline'
import { ProductCard } from '../../components/tablet/ProductCard'
import { TabletHero } from '../../components/tablet/TabletHero'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApiQuery } from '../../hooks/useApiQuery'
import { usePageTitle } from '../../hooks/usePageTitle'
import { apiGet, apiPost } from '../../services/api'
import { formatCurrency } from '../../services/format'
import type {
  ApiOrder,
  ApiProduct,
  ApiServiceCall,
  TableStatus,
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

const tableStatusLabel: Record<TableStatus, string> = {
  available: 'Livre',
  occupied: 'Mesa aberta',
  waiting_payment: 'Conta solicitada',
  closed: 'Fechada',
  inactive: 'Inativa',
}

function tableStatusTone(status: TableStatus) {
  return status === 'waiting_payment' ? 'warning' : status === 'occupied' ? 'info' : status === 'inactive' ? 'danger' : 'success'
}

function cartKey(token: string) {
  return `kipedido.cart.${token}`
}

function readCart(token: string): CartItem[] {
  const stored = localStorage.getItem(cartKey(token))

  if (!stored) {
    return []
  }

  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed as CartItem[] : []
  } catch {
    return []
  }
}

function writeCart(token: string, items: CartItem[]) {
  localStorage.setItem(cartKey(token), JSON.stringify(items))
}

function useTabletToken() {
  return useParams().token ?? 'mesa-01-teste'
}

function itemLabel(count: number) {
  return count === 1 ? '1 item' : `${count} itens`
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
      <TabletHero
        eyebrow="Experiência da mesa"
        title={`Olá, ${data?.table.name ?? 'Mesa'}`}
        description="Escolha pratos, revise a comanda e envie tudo direto para a cozinha. Se precisar de atendimento, o garçom também fica a um toque."
        meta={(
          <div className="compact-meta">
            <span><Utensils size={16} /> Cardápio digital premium</span>
            <span><Clock3 size={16} /> Pedido enviado em tempo real</span>
          </div>
        )}
        actions={(
          <>
            <Link className="primary-button" to={`/tablet/${token}/cardapio`}>
              <ShoppingCart size={20} />
              Abrir cardápio
            </Link>
            <Link className="secondary-button secondary-button--on-dark" to={`/tablet/${token}/pedidos`}>
              <ClipboardList size={20} />
              Ver pedidos
            </Link>
          </>
        )}
      />

      <div className="tablet-session-card operational-card">
        <div>
          <span className="eyebrow">Sessão da mesa</span>
          <h2>{data?.session ? 'Consumo aberto' : 'Pronto para pedir'}</h2>
          <p>{data?.session ? 'Acompanhe pedidos, revise sua conta e solicite o fechamento por aqui.' : 'Abra o cardápio para iniciar seu pedido.'}</p>
        </div>
        {data?.table.status ? <StatusBadge label={tableStatusLabel[data.table.status]} tone={tableStatusTone(data.table.status)} /> : null}
      </div>

      {isLoading ? <StateMessage title="Carregando dados da mesa..." tone="loading" /> : null}
      {error ? <ApiStateMessage error={error} /> : null}
      {success ? <StateMessage title={success} tone="success" /> : null}
      {actionError ? <StateMessage title={actionError} tone="error" /> : null}

      <div className="tablet-actions">
        <Link className="tablet-action tablet-action--primary" to={`/tablet/${token}/cardapio`}>
          <ShoppingCart size={34} />
          <span>Ver cardápio</span>
          <small>Escolher produtos e montar a comanda</small>
        </Link>
        <Link className="tablet-action" to={`/tablet/${token}/pedidos`}>
          <ChefHat size={34} />
          <span>Meus pedidos</span>
          <small>Acompanhar preparo, entrega e histórico</small>
        </Link>
        <Link className="tablet-action" to={`/tablet/${token}/conta`}>
          <WalletCards size={34} />
          <span>Resumo da conta</span>
          <small>Ver consumo e solicitar fechamento</small>
        </Link>
        <button className="tablet-action tablet-action--service" type="button" onClick={() => void callWaiter()}>
          <BellRing size={34} />
          <span>Chamar garçom</span>
          <small>Solicitar atendimento sem sair da mesa</small>
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
  const selectedCategory = selectedCategoryId ? categories.find((category) => category.id === selectedCategoryId) ?? null : null
  const visibleCategories = selectedCategory ? [selectedCategory] : categories
  const productsCount = categories.reduce((sum, category) => sum + (category.products?.length ?? 0), 0)
  const availableProductsCount = categories.reduce((sum, category) => sum + (category.products ?? []).filter((product) => product.is_available !== false).length, 0)

  return (
    <section className="tablet-page tablet-menu-page">
      <TabletHero
        eyebrow="Cardápio digital"
        title={data?.table.name ? `Pedido da ${data.table.name}` : 'Escolha seu pedido'}
        description="Toque nos pratos, revise o carrinho e envie tudo direto para a cozinha. O total fica sempre visível enquanto você navega."
        meta={(
          <div className="compact-meta">
            <span><Utensils size={16} /> {categories.length} categoria{categories.length === 1 ? '' : 's'}</span>
            <span><ShoppingCart size={16} /> {itemLabel(cart.count)} no carrinho</span>
          </div>
        )}
        actions={(
          <Link className="secondary-button tablet-cart-link secondary-button--on-dark" to={`/tablet/${token}/carrinho`}>
            <ShoppingCart size={20} />
            {formatCurrency(cart.total)}
          </Link>
        )}
      />

      {isLoading ? <StateMessage title="Carregando cardápio..." tone="loading" /> : null}
      {error ? <ApiStateMessage error={error} /> : null}
      {!isLoading && !error && productsCount === 0 ? <StateMessage title="Nenhum produto disponível no momento." /> : null}

      <div className="tablet-service-strip" aria-label="Resumo do cardápio">
        <article>
          <span>Mesa</span>
          <strong>{data?.table.name ?? 'Carregando'}</strong>
        </article>
        <article>
          <span>Disponíveis agora</span>
          <strong>{availableProductsCount} itens</strong>
        </article>
        <article>
          <span>Comanda</span>
          <strong>{itemLabel(cart.count)}</strong>
        </article>
      </div>

      <CategoryChips categories={categories} selectedCategoryId={selectedCategoryId} onSelect={setSelectedCategoryId} />

      <div className="tablet-menu-sections">
        {visibleCategories.map((category) => (
          <section className="menu-category" key={category.id}>
            <div className="menu-category__header">
              <div>
                <span className="eyebrow">{selectedCategory ? 'Categoria selecionada' : 'Escolha por categoria'}</span>
                <h2>{category.name}</h2>
                {category.description ? <p>{category.description}</p> : null}
              </div>
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

      <FloatingCartButton to={`/tablet/${token}/carrinho`} count={cart.count} total={cart.total} />
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
          <h1>Revise sua comanda</h1>
          <p>Confira quantidades, observações e total antes de enviar para a cozinha.</p>
        </div>
        <MoneyValue value={cart.total} label="Total parcial" emphasis />
      </header>

      {success ? (
        <StateMessage
          title={success}
          description="Você pode acompanhar o status em Meus pedidos."
          tone="success"
          action={{ to: `/tablet/${token}/pedidos`, label: 'Acompanhar' }}
        />
      ) : null}
      {error ? <StateMessage title={error} tone="error" /> : null}

      <section className="cart-panel cart-panel--sheet">
        {cart.items.length === 0 ? (
          <StateMessage
            title="Sua comanda está vazia."
            description="Abra o cardápio para escolher os itens que deseja pedir."
            action={{ to: `/tablet/${token}/cardapio`, label: 'Ver cardápio' }}
          />
        ) : null}
        {cart.items.map((item) => (
          <article className="cart-row cart-row--detailed" key={item.product_id}>
            <div className="cart-row__main">
              <div className="cart-row__title">
                <span>{item.quantity}x</span>
                <strong>{item.product_name}</strong>
              </div>
              <small>{formatCurrency(item.unit_price)} por unidade</small>
              <label className="cart-note">
                <span><MessageSquareText size={17} /> Observação para a cozinha</span>
                <textarea value={item.notes ?? ''} onChange={(event) => cart.setNotes(item.product_id, event.target.value)} placeholder="Ex: sem cebola, carne ao ponto, molho à parte..." />
                <small>Essa observação acompanha o item no pedido enviado.</small>
              </label>
            </div>
            <div className="cart-row__controls">
              <div className="stepper" aria-label={`Quantidade de ${item.product_name}`}>
                <button type="button" title="Diminuir" onClick={() => cart.setQuantity(item.product_id, item.quantity - 1)}><Minus size={20} /></button>
                <span>{item.quantity}</span>
                <button type="button" title="Aumentar" onClick={() => cart.setQuantity(item.product_id, item.quantity + 1)}><Plus size={20} /></button>
              </div>
              <button className="secondary-button cart-remove-button" type="button" onClick={() => cart.setQuantity(item.product_id, 0)}>
                <Trash2 size={18} />
                Remover
              </button>
            </div>
            <MoneyValue value={item.unit_price * item.quantity} label="Subtotal" />
          </article>
        ))}
        <div className="cart-total">
          <span>Total parcial</span>
          <strong>{formatCurrency(cart.total)}</strong>
        </div>
        <button className="primary-button primary-button--wide send-order-button" type="button" disabled={cart.items.length === 0 || isSending} onClick={() => void sendOrder()}>
          <Send size={22} />
          {isSending ? 'Enviando...' : 'Enviar pedido para a cozinha'}
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
          <h1>Meus pedidos</h1>
          <p>Veja o andamento de cada pedido enviado para a cozinha.</p>
        </div>
      </header>

      {isLoading ? <StateMessage title="Carregando pedidos..." tone="loading" /> : null}
      {error ? <ApiStateMessage error={error} /> : null}
      {!isLoading && !error && orders.length === 0 ? (
        <StateMessage
          title="Nenhum pedido enviado nesta sessão."
          description="Quando você enviar uma comanda, o status aparece aqui."
          action={{ to: `/tablet/${token}/cardapio`, label: 'Abrir cardápio' }}
        />
      ) : null}

      <OrderStatusTimeline orders={orders} />
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

  const billRows = data?.bill ? [
    ['Subtotal', data.bill.subtotal],
    ['Taxa de serviço', data.bill.service_fee_amount],
    ['Desconto', data.bill.discount_amount],
  ] as const : []
  const billOrders = data?.bill?.session.orders ?? []
  const billItemsCount = billOrders.reduce((sum, order) => sum + (order.items ?? []).reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
  const isBillRequested = data?.table.status === 'waiting_payment' || success !== null

  return (
    <section className="tablet-page tablet-bill-page">
      <header className="tablet-page__header">
        <div>
          <span className="eyebrow">Fechamento</span>
          <h1>Resumo da conta</h1>
          <p>Confira o consumo da mesa e solicite o fechamento quando estiver pronto.</p>
        </div>
        {data?.bill ? <MoneyValue value={data.bill.total_amount} label={`${itemLabel(billItemsCount)} consumido${billItemsCount === 1 ? '' : 's'}`} emphasis /> : null}
      </header>

      {isLoading ? <StateMessage title="Carregando conta..." tone="loading" /> : null}
      {error ? <ApiStateMessage error={error} /> : null}
      {success ? <StateMessage title={success} description="O caixa foi avisado que a mesa deseja fechar." tone="success" /> : null}
      {actionError ? <StateMessage title={actionError} tone="error" /> : null}

      <section className="bill-panel bill-panel--receipt">
        {!isLoading && !error && !data?.bill ? <StateMessage title="A mesa ainda não possui consumo aberto." description="Envie um pedido para iniciar a sessão." action={{ to: `/tablet/${token}/cardapio`, label: 'Ver cardápio' }} /> : null}
        {data?.bill ? (
          <>
            {billOrders.length > 0 ? (
              <div className="bill-consumption">
                <div className="bill-consumption__header">
                  <span>Itens consumidos</span>
                  <strong>{billOrders.length} pedido{billOrders.length === 1 ? '' : 's'}</strong>
                </div>
                {billOrders.map((order) => (
                  <article className="bill-consumption__order" key={order.id}>
                    <strong>{order.code}</strong>
                    {(order.items ?? []).map((item) => (
                      <div key={item.id}>
                        <span>{item.quantity}x {item.product_name}</span>
                        <strong>{formatCurrency(item.total_price)}</strong>
                      </div>
                    ))}
                  </article>
                ))}
              </div>
            ) : null}
            <div className="bill-summary-list">
              {billRows.map(([label, value]) => (
                <div key={label}><span>{label}</span><strong>{formatCurrency(value)}</strong></div>
              ))}
              <div className="bill-panel__total"><span>Total</span><strong>{formatCurrency(data.bill.total_amount)}</strong></div>
            </div>
          </>
        ) : null}
        <button className="primary-button primary-button--wide send-order-button" type="button" disabled={!data?.bill || isBillRequested} onClick={() => void requestBill()}>
          {isBillRequested ? <ArrowRight size={22} /> : <ReceiptText size={22} />}
          {isBillRequested ? 'Conta solicitada' : 'Pedir conta'}
        </button>
      </section>
    </section>
  )
}
