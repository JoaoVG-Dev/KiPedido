import { BadgeDollarSign, CreditCard, Percent, ReceiptText, RefreshCw, Unlock, Utensils } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MoneyValue } from '../../components/shared/MoneyValue'
import { ApiStateMessage, StateMessage } from '../../components/shared/StateMessage'
import { MetricCard } from '../../components/shared/MetricCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApiQuery } from '../../hooks/useApiQuery'
import { usePageTitle } from '../../hooks/usePageTitle'
import { apiGet, apiPost } from '../../services/api'
import { formatCurrency, formatDateTime } from '../../services/format'
import type { ApiOrder, ApiPayment, ApiRestaurantTable, TableBillResponse, TableStatus } from '../../types'

const statusLabel: Record<TableStatus, string> = {
  available: 'Livre',
  occupied: 'Ocupada',
  waiting_payment: 'Aguardando pagamento',
  closed: 'Fechada',
  inactive: 'Inativa',
}

const statusTone: Record<TableStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  available: 'success',
  occupied: 'info',
  waiting_payment: 'warning',
  closed: 'neutral',
  inactive: 'danger',
}

export function CashierDashboard() {
  usePageTitle('Caixa')
  const query = useApiQuery(() => apiGet<ApiRestaurantTable[]>('/cashier/tables'), [])
  const tables = query.data ?? []
  const openTables = tables.filter((table) => ['occupied', 'waiting_payment'].includes(table.status))
  const amountToReceive = openTables.reduce((sum, table) => sum + Number(table.active_session?.total_amount ?? 0), 0)

  return (
    <section className="page-stack cashier-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Caixa</span>
          <h1>Fechamento de mesas</h1>
        </div>
        <button className="secondary-button" type="button" onClick={() => void query.reload()}>
          <RefreshCw size={18} />
          Atualizar
        </button>
      </header>

      <div className="metrics-grid">
        <MetricCard icon={Utensils} label="Mesas abertas" value={String(openTables.length)} detail={`${tables.filter((table) => table.status === 'waiting_payment').length} pediu conta`} />
        <MetricCard icon={BadgeDollarSign} label="A receber" value={formatCurrency(amountToReceive)} detail="consumo aberto" />
        <MetricCard icon={CreditCard} label="Mesas livres" value={String(tables.filter((table) => table.status === 'available').length)} detail="disponíveis agora" />
      </div>

      <CashierTablesPanel query={query} />
    </section>
  )
}

export function CashierTablesPage({ embedded = false }: { embedded?: boolean }) {
  usePageTitle('Mesas do caixa')
  const query = useApiQuery(() => apiGet<ApiRestaurantTable[]>('/cashier/tables'), [])

  return (
    <section className={embedded ? 'panel' : 'page-stack cashier-page'}>
      {!embedded ? (
        <header className="page-header">
          <div>
            <span className="eyebrow">Mesas</span>
            <h1>Consumo por mesa</h1>
          </div>
          <button className="secondary-button" type="button" onClick={() => void query.reload()}>
            <RefreshCw size={18} />
            Atualizar
          </button>
        </header>
      ) : null}
      <CashierTablesPanel query={query} />
    </section>
  )
}

type CashierTablesQuery = {
  data: ApiRestaurantTable[] | null
  error: Error | null
  isLoading: boolean
  reload: () => Promise<void>
}

function CashierTablesPanel({ query }: { query: CashierTablesQuery }) {
  const tables = query.data ?? []

  if (query.isLoading) {
    return <StateMessage title="Carregando mesas do caixa..." tone="loading" />
  }

  if (query.error) {
    return <ApiStateMessage error={query.error} />
  }

  if (tables.length === 0) {
    return <StateMessage title="Nenhuma mesa cadastrada." />
  }

  return (
    <div className="cashier-grid">
      {tables.map((table) => (
        <Link className={`cashier-table-card cashier-table-card--${table.status}`} to={`/cashier/tables/${table.id}`} key={table.id}>
          <div className="cashier-table-card__header">
            <strong>{table.name}</strong>
            <StatusBadge label={statusLabel[table.status]} tone={statusTone[table.status]} />
          </div>
          <span>{table.active_session ? `Sessão ${table.active_session.status}` : 'Sem sessão aberta'}</span>
          <MoneyValue value={table.active_session?.total_amount} label="Total da mesa" emphasis={table.status !== 'available'} />
          <span className="cashier-table-card__action">Ver detalhes</span>
        </Link>
      ))}
    </div>
  )
}

export function CashierTableDetailPage() {
  usePageTitle('Detalhe da mesa')
  const { id = '1' } = useParams()
  const tableQuery = useApiQuery(() => apiGet<ApiRestaurantTable[]>('/cashier/tables'), [])
  const billQuery = useApiQuery(() => apiGet<TableBillResponse>(`/cashier/tables/${id}/bill`), [id])
  const table = tableQuery.data?.find((item) => String(item.id) === id)
  const orders = billQuery.data?.session.orders ?? []
  const [success, setSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function closeTable() {
    setSuccess(null)
    setActionError(null)

    try {
      const bill = billQuery.data
      await apiPost<ApiPayment>(`/cashier/tables/${id}/close`, {
        payment_method: 'pix',
        amount_paid: bill?.total_amount ?? 0,
      })
      setSuccess('Conta fechada com sucesso.')
      await tableQuery.reload()
      await billQuery.reload().catch(() => undefined)
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Erro ao fechar conta.')
    }
  }

  async function releaseTable() {
    setSuccess(null)
    setActionError(null)

    try {
      await apiPost<ApiRestaurantTable>(`/cashier/tables/${id}/release`)
      setSuccess('Mesa liberada com sucesso.')
      await tableQuery.reload()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Erro ao liberar mesa.')
    }
  }

  return (
    <section className="page-stack cashier-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Fechamento</span>
          <h1>{table?.name ?? `Mesa ${id}`}</h1>
        </div>
        {table ? <StatusBadge label={statusLabel[table.status]} tone={statusTone[table.status]} /> : null}
      </header>

      {tableQuery.isLoading ? <StateMessage title="Carregando mesa..." tone="loading" /> : null}
      {tableQuery.error ? <ApiStateMessage error={tableQuery.error} /> : null}
      {success ? <StateMessage title={success} tone="success" /> : null}
      {actionError ? <StateMessage title={actionError} tone="error" /> : null}

      <div className="cashier-detail-grid">
        <section className="panel bill-breakdown">
          <div className="panel__header">
            <h2>Conta</h2>
            {billQuery.data?.session.opened_at ? <span>{formatDateTime(billQuery.data.session.opened_at)}</span> : null}
          </div>
          {billQuery.isLoading ? <StateMessage title="Calculando consumo..." tone="loading" /> : null}
          {billQuery.error ? <StateMessage title={billQuery.error.message} tone="empty" /> : null}
          {billQuery.data ? (
            <>
              <div><span>Subtotal</span><strong>{formatCurrency(billQuery.data.subtotal)}</strong></div>
              <div><span>Taxa de serviço</span><strong>{formatCurrency(billQuery.data.service_fee_amount)}</strong></div>
              <div><span>Desconto</span><strong>{formatCurrency(billQuery.data.discount_amount)}</strong></div>
              <div className="bill-breakdown__total"><span>Total final</span><strong>{formatCurrency(billQuery.data.total_amount)}</strong></div>
            </>
          ) : null}
        </section>

        <section className="panel cashier-actions">
          <h2>Ações do caixa</h2>
          <button className="secondary-button" type="button" disabled>
            <Percent size={18} />
            Aplicar desconto
          </button>
          <button className="primary-button" type="button" disabled={!billQuery.data} onClick={() => void closeTable()}>
            <ReceiptText size={18} />
            Fechar conta como PIX
          </button>
          <button className="secondary-button" type="button" onClick={() => void releaseTable()}>
            <Unlock size={18} />
            Liberar mesa
          </button>
          <button className="secondary-button" type="button" onClick={() => { void tableQuery.reload(); void billQuery.reload() }}>
            <RefreshCw size={18} />
            Atualizar
          </button>
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <h2>Pedidos da sessão</h2>
          <span>{orders.length} pedido{orders.length === 1 ? '' : 's'}</span>
        </div>
        {orders.length === 0 ? <StateMessage title="Nenhum pedido ativo para esta mesa." /> : <OrderList orders={orders} />}
      </section>
    </section>
  )
}

function OrderList({ orders }: { orders: ApiOrder[] }) {
  return (
    <div className="cashier-order-list">
      {orders.map((order) => (
        <article className="cashier-order-card" key={order.id}>
          <div className="cashier-order-card__header">
            <div>
              <strong>{order.code}</strong>
              <small>{formatDateTime(order.sent_at)}</small>
            </div>
            <StatusBadge label={order.status} tone={order.status === 'cancelled' ? 'danger' : order.status === 'delivered' ? 'neutral' : 'info'} />
          </div>
          <div className="cashier-order-items">
            {(order.items ?? []).map((item) => (
              <div key={item.id}>
                <span>{item.quantity}x {item.product_name}</span>
                <strong>{formatCurrency(item.total_price)}</strong>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}
