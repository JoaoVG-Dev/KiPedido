import { CheckCircle2, ChefHat, Clock3, PackageCheck, XCircle } from 'lucide-react'
import { StatusBadge } from '../ui/StatusBadge'
import { formatDateTime } from '../../services/format'
import type { ApiOrder, StatusTone } from '../../types'

const statusCopy: Record<ApiOrder['status'], { label: string; detail: string; tone: StatusTone; icon: typeof Clock3 }> = {
  received: { label: 'Recebido', detail: 'A cozinha ja recebeu seu pedido.', tone: 'warning', icon: Clock3 },
  preparing: { label: 'Em preparo', detail: 'Seu pedido esta sendo preparado.', tone: 'info', icon: ChefHat },
  ready: { label: 'Pronto', detail: 'Seu pedido esta pronto para entrega.', tone: 'success', icon: PackageCheck },
  delivered: { label: 'Entregue', detail: 'Pedido entregue na mesa.', tone: 'neutral', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', detail: 'Este pedido foi cancelado.', tone: 'danger', icon: XCircle },
}

type OrderStatusTimelineProps = {
  orders: ApiOrder[]
}

export function OrderStatusTimeline({ orders }: OrderStatusTimelineProps) {
  return (
    <div className="order-timeline">
      {orders.map((order) => {
        const copy = statusCopy[order.status]
        const Icon = copy.icon

        return (
          <article className="order-status-card" key={order.id}>
            <div className={`order-status-card__icon order-status-card__icon--${copy.tone}`} aria-hidden="true">
              <Icon size={23} />
            </div>
            <div className="order-status-card__body">
              <div className="order-status-card__title">
                <strong>{order.code}</strong>
                <StatusBadge label={copy.label} tone={copy.tone} />
              </div>
              <small>{order.sent_at ? formatDateTime(order.sent_at) : 'Horario em processamento'}</small>
              <span>{(order.items ?? []).map((item) => `${item.quantity}x ${item.product_name}`).join(', ')}</span>
              <em>{copy.detail}</em>
            </div>
          </article>
        )
      })}
    </div>
  )
}
