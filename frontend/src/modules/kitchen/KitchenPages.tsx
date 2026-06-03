import { BellRing, Check, Clock3, Flame, ListChecks } from 'lucide-react'
import { useState } from 'react'
import { KitchenStatusColumn } from '../../components/kitchen/KitchenStatusColumn'
import { MetricCard } from '../../components/shared/MetricCard'
import { PageHeader } from '../../components/shared/PageHeader'
import { ApiStateMessage, StateMessage } from '../../components/shared/StateMessage'
import { useApiQuery } from '../../hooks/useApiQuery'
import { usePageTitle } from '../../hooks/usePageTitle'
import { apiGet, apiPatch } from '../../services/api'
import type { ApiOrder, PaginatedResponse } from '../../types'

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
      <PageHeader
        eyebrow="Cozinha ao vivo"
        title="Fila de preparo"
        description="Pedidos organizados por etapa, com alta legibilidade para monitor, balcão ou tablet."
        actions={(
          <button className="alert-button" type="button" onClick={() => void query.reload()}>
            <BellRing size={20} />
            Atualizar pedidos
          </button>
        )}
      />

      <div className="metrics-grid">
        <MetricCard icon={Clock3} label="Recebidos" value={String(countStatus(orders, 'received'))} detail="aguardando início" tone="warning" />
        <MetricCard icon={Flame} label="Em preparo" value={String(countStatus(orders, 'preparing'))} detail="na cozinha" tone="info" />
        <MetricCard icon={Check} label="Prontos" value={String(countStatus(orders, 'ready'))} detail="aguardando entrega" tone="success" />
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
      <PageHeader
        eyebrow="Pedidos"
        title="Painel da cozinha"
        description="Acompanhe o fluxo completo de recebidos, preparo, prontos, entregues e cancelados."
        actions={(
          <button className="secondary-button" type="button" onClick={() => void query.reload()}>
            <ListChecks size={18} />
            Atualizar
          </button>
        )}
      />
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
      {kitchenColumns.map((column) => (
        <KitchenStatusColumn
          status={column.status}
          title={column.title}
          description={column.description}
          orders={orders.filter((order) => order.status === column.status)}
          updatingId={updatingId}
          onUpdate={updateStatus}
          key={column.status}
        />
      ))}
    </div>
  )
}

function countStatus(orders: ApiOrder[], status: ApiOrder['status']) {
  return orders.filter((order) => order.status === status).length
}
