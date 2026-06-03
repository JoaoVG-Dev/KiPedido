import { BellRing, Check, Clock3, Flame, ListChecks, PackageCheck, XCircle } from 'lucide-react'
import { useState } from 'react'
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

const kitchenColumns: Array<{
  status: ApiOrder['status']
  title: string
  description: string
}> = [
  { status: 'received', title: 'Recebidos', description: 'Entraram agora' },
  { status: 'preparing', title: 'Em preparo', description: 'Na produção' },
  { status: 'ready', title: 'Prontos', description: 'Aguardando entrega' },
  { status: 'delivered', title: 'Entregues', description: 'Finalizados' },
  { status: 'cancelled', title: 'Cancelados', description: 'Fora da produção' },
]

export function KitchenDashboard() {
  usePageTitle('Cozinha')
  const query = useApiQuery(() => apiGet<PaginatedResponse<ApiOrder>>('/kitchen/orders?status=all'), [])
  const orders = query.data?.data ?? []

  return (
    <section className="page-stack kitchen-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Cozinha</span>
          <h1>Fila de preparo</h1>
        </div>
        <button className="alert-button" type="button" onClick={() => void query.reload()}>
          <BellRing size={20} />
          Atualizar pedidos
        </button>
      </header>

      <div className="metrics-grid">
        <MetricCard icon={Clock3} label="Recebidos" value={String(countStatus(orders, 'received'))} detail="aguardando início" />
        <MetricCard icon={Flame} label="Em preparo" value={String(countStatus(orders, 'preparing'))} detail="na cozinha" />
        <MetricCard icon={Check} label="Prontos" value={String(countStatus(orders, 'ready'))} detail="aguardando entrega" />
      </div>

      <KitchenOrdersBoard query={query} />
    </section>
  )
}

export function KitchenOrdersPage() {
  usePageTitle('Pedidos da cozinha')
  const query = useApiQuery(() => apiGet<PaginatedResponse<ApiOrder>>('/kitchen/orders?status=all'), [])

  return (
    <section className="page-stack kitchen-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Pedidos</span>
          <h1>Painel da cozinha</h1>
        </div>
        <button className="secondary-button" type="button" onClick={() => void query.reload()}>
          <ListChecks size={18} />
          Atualizar
        </button>
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
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  async function updateStatus(order: ApiOrder, status: ApiOrder['status']) {
    setUpdatingId(order.id)

    try {
      await apiPatch(`/kitchen/orders/${order.id}/status`, { status })
      await query.reload()
    } finally {
      setUpdatingId(null)
    }
  }

  if (query.isLoading) {
    return <StateMessage title="Carregando pedidos da cozinha..." tone="loading" />
  }

  if (query.error) {
    return <ApiStateMessage error={query.error} />
  }

  if (orders.length === 0) {
    return <StateMessage title="Nenhum pedido no momento." description="Novos pedidos enviados pelo tablet aparecerão aqui." />
  }

  return (
    <div className="kitchen-board kitchen-board--kanban">
      {kitchenColumns.map((column) => {
        const columnOrders = orders.filter((order) => order.status === column.status)

        return (
          <section className={`kitchen-lane kitchen-lane--${column.status}`} key={column.status}>
            <div className="kitchen-lane__header">
              <div>
                <h2>{column.title}</h2>
                <span>{column.description}</span>
              </div>
              <strong>{columnOrders.length}</strong>
            </div>

            {columnOrders.length === 0 ? (
              <div className="kitchen-empty">Nenhum pedido.</div>
            ) : (
              columnOrders.map((order) => (
                <KitchenOrderCard order={order} updating={updatingId === order.id} onUpdate={updateStatus} key={order.id} />
              ))
            )}
          </section>
        )
      })}
    </div>
  )
}

function KitchenOrderCard({
  order,
  updating,
  onUpdate,
}: {
  order: ApiOrder
  updating: boolean
  onUpdate: (order: ApiOrder, status: ApiOrder['status']) => Promise<void>
}) {
  return (
    <article className="kitchen-card">
      <div className="kitchen-card__header">
        <div>
          <span>{order.code}</span>
          <h2>{order.table?.name ?? `Mesa ${order.table_id}`}</h2>
        </div>
        <StatusBadge label={kitchenStatusLabel[order.status]} tone={kitchenStatusTone[order.status]} />
      </div>

      <div className="compact-meta">
        <span><Clock3 size={16} /> {formatDateTime(order.sent_at)}</span>
        <span><PackageCheck size={16} /> {(order.items ?? []).length} item{(order.items ?? []).length === 1 ? '' : 's'}</span>
      </div>

      <div className="kitchen-card__items">
        {(order.items ?? []).map((item) => (
          <div className={item.notes ? 'kitchen-item kitchen-item--note' : 'kitchen-item'} key={`${order.id}-${item.id}`}>
            <strong>{item.quantity}x {item.product_name}</strong>
            {item.notes ? <small>{item.notes}</small> : null}
          </div>
        ))}
      </div>

      <div className="kitchen-actions">
        {order.status === 'received' ? (
          <>
            <button className="primary-button" type="button" disabled={updating} onClick={() => void onUpdate(order, 'preparing')}>
              <Flame size={18} />
              Iniciar preparo
            </button>
            <button className="secondary-button" type="button" disabled={updating} onClick={() => void onUpdate(order, 'cancelled')}>
              <XCircle size={18} />
              Cancelar
            </button>
          </>
        ) : null}

        {order.status === 'preparing' ? (
          <>
            <button className="primary-button" type="button" disabled={updating} onClick={() => void onUpdate(order, 'ready')}>
              <Check size={18} />
              Marcar pronto
            </button>
            <button className="secondary-button" type="button" disabled={updating} onClick={() => void onUpdate(order, 'cancelled')}>
              <XCircle size={18} />
              Cancelar
            </button>
          </>
        ) : null}

        {order.status === 'ready' ? (
          <button className="primary-button" type="button" disabled={updating} onClick={() => void onUpdate(order, 'delivered')}>
            <PackageCheck size={18} />
            Entregue
          </button>
        ) : null}
      </div>
    </article>
  )
}

function countStatus(orders: ApiOrder[], status: ApiOrder['status']) {
  return orders.filter((order) => order.status === status).length
}
