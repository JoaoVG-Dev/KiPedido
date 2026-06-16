import { BellRing, Check, Clock3, Flame, ListChecks } from 'lucide-react'
import { MetricCard } from '../../components/shared/MetricCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { usePageTitle } from '../../hooks/usePageTitle'
import { kitchenOrders } from '../../services/mockData'
import type { KitchenOrder } from '../../types'

const kitchenStatusLabel: Record<KitchenOrder['status'], string> = {
  received: 'Recebido',
  preparing: 'Em preparo',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

const kitchenStatusTone: Record<KitchenOrder['status'], 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  received: 'warning',
  preparing: 'info',
  ready: 'success',
  delivered: 'neutral',
  cancelled: 'danger',
}

export function KitchenDashboard() {
  usePageTitle('Cozinha')

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
        <MetricCard icon={Clock3} label="Aguardando" value="1" detail="novo pedido" />
        <MetricCard icon={Flame} label="Em preparo" value="1" detail="tempo médio 14 min" />
        <MetricCard icon={Check} label="Prontos" value="1" detail="aguardando entrega" />
      </div>

      <KitchenOrdersBoard compact />
    </section>
  )
}

export function KitchenOrdersPage() {
  usePageTitle('Pedidos da cozinha')

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Pedidos</span>
          <h1>Painel da cozinha</h1>
        </div>
      </header>
      <KitchenOrdersBoard />
    </section>
  )
}

function KitchenOrdersBoard({ compact = false }: { compact?: boolean }) {
  const visibleOrders = compact ? kitchenOrders.slice(0, 3) : kitchenOrders

  return (
    <div className="kitchen-board">
      {visibleOrders.map((order) => (
        <article className="kitchen-card" key={order.id}>
          <div className="kitchen-card__header">
            <div>
              <span>{order.code}</span>
              <h2>{order.table}</h2>
            </div>
            <StatusBadge label={kitchenStatusLabel[order.status]} tone={kitchenStatusTone[order.status]} />
          </div>
          <div className="kitchen-card__items">
            {order.items.map((item) => (
              <div key={`${order.id}-${item.name}`}>
                <strong>{item.quantity}x {item.name}</strong>
                {item.notes ? <small>{item.notes}</small> : null}
              </div>
            ))}
          </div>
          <div className="kitchen-card__footer">
            <span><Clock3 size={16} /> {order.sentAt}</span>
            <button className="secondary-button" type="button">
              <ListChecks size={18} />
              Atualizar
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
