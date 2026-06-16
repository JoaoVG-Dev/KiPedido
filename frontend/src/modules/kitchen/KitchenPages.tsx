import { BellRing, Check, Clock3, Flame, ListChecks } from 'lucide-react'
import { ApiStateMessage, StateMessage } from '../../components/shared/StateMessage'
import { MetricCard } from '../../components/shared/MetricCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApiQuery } from '../../hooks/useApiQuery'
import { usePageTitle } from '../../hooks/usePageTitle'
import { apiGet, apiPatch } from '../../services/api'
import { formatDateTime } from '../../services/format'
import type { ApiOrder, PaginatedResponse } from '../../types'

const kitchenStatusLabel: Record<ApiOrder['status'], string> = {
  received: 'Recebido',
  preparing: 'Em preparo',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

const kitchenStatusTone: Record<ApiOrder['status'], 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  received: 'warning',
  preparing: 'info',
  ready: 'success',
  delivered: 'neutral',
  cancelled: 'danger',
}

export function KitchenDashboard() {
  usePageTitle('Cozinha')
  const query = useApiQuery(() => apiGet<PaginatedResponse<ApiOrder>>('/kitchen/orders'), [])
  const orders = query.data?.data ?? []

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Cozinha</span>
          <h1>Fila de preparo</h1>
        </div>
        <button className="alert-button" type="button">
          <BellRing size={20} />
          Alertas ativos
        </button>
      </header>

      <div className="metrics-grid">
        <MetricCard icon={Clock3} label="Recebidos" value={String(orders.filter((order) => order.status === 'received').length)} detail="aguardando início" />
        <MetricCard icon={Flame} label="Em preparo" value={String(orders.filter((order) => order.status === 'preparing').length)} detail="na cozinha" />
        <MetricCard icon={Check} label="Prontos" value={String(orders.filter((order) => order.status === 'ready').length)} detail="aguardando entrega" />
      </div>

      <KitchenOrdersBoard query={query} />
    </section>
  )
}

export function KitchenOrdersPage() {
  usePageTitle('Pedidos da cozinha')
  const query = useApiQuery(() => apiGet<PaginatedResponse<ApiOrder>>('/kitchen/orders'), [])

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Pedidos</span>
          <h1>Painel da cozinha</h1>
        </div>
      </header>
      <KitchenOrdersBoard query={query} />
    </section>
  )
}

type KitchenOrdersBoardProps = {
  query: ReturnType<typeof useApiQuery<PaginatedResponse<ApiOrder>>>
}

function KitchenOrdersBoard({ query }: KitchenOrdersBoardProps) {
  const orders = query.data?.data ?? []

  async function updateStatus(order: ApiOrder, status: ApiOrder['status']) {
    await apiPatch(`/kitchen/orders/${order.id}/status`, { status })
    await query.reload()
  }

  if (query.isLoading) {
    return <StateMessage title="Carregando pedidos da cozinha..." tone="loading" />
  }

  if (query.error) {
    return <ApiStateMessage error={query.error} />
  }

  if (orders.length === 0) {
    return <StateMessage title="Nenhum pedido ativo na cozinha." />
  }

  return (
    <div className="kitchen-board">
      {orders.map((order) => (
        <article className="kitchen-card" key={order.id}>
          <div className="kitchen-card__header">
            <div>
              <span>{order.code}</span>
              <h2>{order.table?.name ?? `Mesa ${order.table_id}`}</h2>
            </div>
            <StatusBadge label={kitchenStatusLabel[order.status]} tone={kitchenStatusTone[order.status]} />
          </div>
          <div className="kitchen-card__items">
            {(order.items ?? []).map((item) => (
              <div key={`${order.id}-${item.id}`}>
                <strong>{item.quantity}x {item.product_name}</strong>
                {item.notes ? <small>{item.notes}</small> : null}
              </div>
            ))}
          </div>
          <div className="kitchen-card__footer">
            <span><Clock3 size={16} /> {formatDateTime(order.sent_at)}</span>
            <select value={order.status} onChange={(event) => void updateStatus(order, event.target.value as ApiOrder['status'])}>
              {Object.entries(kitchenStatusLabel).map(([status, label]) => (
                <option value={status} key={status}>{label}</option>
              ))}
            </select>
            <button className="secondary-button" type="button" onClick={() => void query.reload()}>
              <ListChecks size={18} />
              Atualizar
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
