import { BadgeDollarSign, CreditCard, Percent, ReceiptText, RefreshCw, Unlock, Utensils } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ApiStateMessage, StateMessage } from '../../components/shared/StateMessage'
import { MetricCard } from '../../components/shared/MetricCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApiQuery } from '../../hooks/useApiQuery'
import { usePageTitle } from '../../hooks/usePageTitle'
import { apiGet, apiPost } from '../../services/api'
import { formatCurrency } from '../../services/format'
import type { ApiPayment, ApiRestaurantTable, TableBillResponse, TableStatus } from '../../types'
import { useState } from 'react'

const statusLabel: Record<TableStatus, string> = {
  available: 'Livre',
  occupied: 'Ocupada',
  waiting_payment: 'Conta solicitada',
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
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Caixa</span>
          <h1>Fechamento de mesas</h1>
        </div>
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
    <section className={embedded ? 'panel' : 'page-stack'}>
      {!embedded ? (
        <header className="page-header">
          <div>
            <span className="eyebrow">Mesas</span>
            <h1>Consumo por mesa</h1>
          </div>
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
        <Link className="cashier-table-card" to={`/cashier/tables/${table.id}`} key={table.id}>
          <div>
            <strong>{table.name}</strong>
            <StatusBadge label={statusLabel[table.status]} tone={statusTone[table.status]} />
          </div>
          <span>{table.active_session ? `Sessão ${table.active_session.status}` : 'Sem sessão aberta'}</span>
          <strong>{formatCurrency(table.active_session?.total_amount)}</strong>
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
    <section className="page-stack">
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

      <div className="content-grid">
        <section className="panel bill-breakdown">
          <h2>Conta</h2>
          {billQuery.isLoading ? <StateMessage title="Calculando consumo..." tone="loading" /> : null}
          {billQuery.error ? <StateMessage title={billQuery.error.message} tone="empty" /> : null}
          {billQuery.data ? (
            <>
              <div><span>Subtotal</span><strong>{formatCurrency(billQuery.data.subtotal)}</strong></div>
              <div><span>Taxa de serviço</span><strong>{formatCurrency(billQuery.data.service_fee_amount)}</strong></div>
              <div><span>Desconto</span><strong>{formatCurrency(billQuery.data.discount_amount)}</strong></div>
              <div><span>Total</span><strong>{formatCurrency(billQuery.data.total_amount)}</strong></div>
            </>
          ) : null}
        </section>

        <section className="panel cashier-actions">
          <button className="secondary-button" type="button">
            <Percent size={18} />
            Aplicar desconto
          </button>
          <button className="primary-button" type="button" disabled={!billQuery.data} onClick={() => void closeTable()}>
            <ReceiptText size={18} />
            Marcar como pago
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
    </section>
  )
}
