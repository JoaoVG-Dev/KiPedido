import { BadgeDollarSign, CreditCard, Percent, Printer, ReceiptText, RefreshCw, Unlock, Utensils } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BillSummaryCard } from '../../components/cashier/BillSummaryCard'
import { TableStatusCard } from '../../components/cashier/TableStatusCard'
import { cashierTableStatusLabel, cashierTableStatusTone } from '../../components/cashier/tableStatusMeta'
import { MetricCard } from '../../components/shared/MetricCard'
import { PageHeader } from '../../components/shared/PageHeader'
import { ApiStateMessage, StateMessage } from '../../components/shared/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApiQuery } from '../../hooks/useApiQuery'
import { usePageTitle } from '../../hooks/usePageTitle'
import { apiGet, apiPost } from '../../services/api'
import { formatCurrency, formatDateTime } from '../../services/format'
import { printArea } from '../../services/print'
import type { ApiOrder, ApiPayment, ApiRestaurantTable, StatusTone, TableBillResponse } from '../../types'

export function CashierDashboard() {
  usePageTitle('Caixa')
  const query = useApiQuery(() => apiGet<ApiRestaurantTable[]>('/cashier/tables'), [])
  const tables = query.data ?? []
  const openTables = tables.filter((table) => ['occupied', 'waiting_payment'].includes(table.status))
  const waitingPayment = tables.filter((table) => table.status === 'waiting_payment')
  const amountToReceive = openTables.reduce((sum, table) => sum + Number(table.active_session?.total_amount ?? 0), 0)

  return (
    <section className="page-stack cashier-page">
      <PageHeader
        eyebrow="Caixa"
        title="Fechamento de mesas"
        description="Acompanhe consumo aberto, mesas aguardando pagamento e liberação para o salão."
        actions={(
          <button className="secondary-button" type="button" onClick={() => void query.reload()}>
            <RefreshCw size={18} />
            Atualizar
          </button>
        )}
      />

      <div className="metrics-grid">
        <MetricCard icon={Utensils} label="Mesas abertas" value={String(openTables.length)} detail={`${waitingPayment.length} pediu conta`} tone="info" />
        <MetricCard icon={BadgeDollarSign} label="A receber" value={formatCurrency(amountToReceive)} detail="consumo aberto" tone="warning" />
        <MetricCard icon={CreditCard} label="Mesas livres" value={String(tables.filter((table) => table.status === 'available').length)} detail="disponíveis agora" tone="success" />
      </div>

      <CashierTablesPanel query={query} />
    </section>
  )
}

export function CashierTablesPage({ embedded = false }: { embedded?: boolean }) {
  usePageTitle('Mesas do caixa')
  const query = useApiQuery(() => apiGet<ApiRestaurantTable[]>('/cashier/tables'), [])

  return (
    <section className={embedded ? 'panel cashier-page-panel' : 'page-stack cashier-page'}>
      {!embedded ? (
        <PageHeader
          eyebrow="Mesas"
          title="Consumo por mesa"
          description="Veja status, total atual e abra o fechamento de qualquer mesa."
          actions={(
            <button className="secondary-button" type="button" onClick={() => void query.reload()}>
              <RefreshCw size={18} />
              Atualizar
            </button>
          )}
        />
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
        <TableStatusCard table={table} key={table.id} />
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
  const printId = `cashier-table-${id}`
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
    <section className="page-stack cashier-page printable-area" data-print-id={printId}>
      <PageHeader
        eyebrow="Fechamento"
        title={table?.name ?? `Mesa ${id}`}
        description="Confira o recibo, os pedidos da sessão e finalize o pagamento."
        actions={table ? <StatusBadge label={cashierTableStatusLabel[table.status]} tone={cashierTableStatusTone[table.status]} /> : null}
      />

      {tableQuery.isLoading ? <StateMessage title="Carregando mesa..." tone="loading" /> : null}
      {tableQuery.error ? <ApiStateMessage error={tableQuery.error} /> : null}
      {success ? <StateMessage title={success} tone="success" /> : null}
      {actionError ? <StateMessage title={actionError} tone="error" /> : null}

      <div className="cashier-detail-grid">
        <BillSummaryCard bill={billQuery.data} isLoading={billQuery.isLoading} error={billQuery.error} />

        <section className="panel cashier-actions no-print">
          <span className="eyebrow">Ações do caixa</span>
          <h2>Finalizar atendimento</h2>
          <button className="secondary-button" type="button" disabled>
            <Percent size={18} />
            Aplicar desconto
          </button>
          <button className="secondary-button no-print" type="button" disabled={!billQuery.data} onClick={() => printArea(printId, 'cashier')}>
            <Printer size={18} />
            Imprimir recibo
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

      <section className="panel cashier-orders-panel">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Consumo</span>
            <h2>Pedidos da sessão</h2>
          </div>
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
              <small>{order.sent_at ? formatDateTime(order.sent_at) : 'Horário em processamento'}</small>
            </div>
            <StatusBadge label={orderStatusLabel(order.status)} tone={orderStatusTone(order.status)} />
          </div>
          <div className="cashier-order-items">
            {(order.items ?? []).map((item) => (
              <div key={item.id}>
                <span>
                  <strong>{item.quantity}x {item.product_name}</strong>
                  {item.notes ? <small>{item.notes}</small> : null}
                </span>
                <strong>{formatCurrency(item.total_price)}</strong>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
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

function orderStatusTone(status: ApiOrder['status']): StatusTone {
  const tones: Record<ApiOrder['status'], StatusTone> = {
    received: 'warning',
    preparing: 'info',
    ready: 'success',
    delivered: 'neutral',
    cancelled: 'danger',
  }

  return tones[status]
}
