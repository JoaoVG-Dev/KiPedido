import { Check, Clock3, Flame, PackageCheck, Printer, ReceiptText, StickyNote, XCircle } from 'lucide-react'
import { StatusBadge } from '../ui/StatusBadge'
import { formatDateTime } from '../../services/format'
import { printArea } from '../../services/print'
import type { ApiOrder, StatusTone } from '../../types'

const kitchenStatusLabel: Record<ApiOrder['status'], string> = {
  received: 'Recebido',
  preparing: 'Em preparo',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

const kitchenStatusTone: Record<ApiOrder['status'], StatusTone> = {
  received: 'warning',
  preparing: 'info',
  ready: 'success',
  delivered: 'neutral',
  cancelled: 'danger',
}

type KitchenOrderCardProps = {
  order: ApiOrder
  updating: boolean
  onUpdate: (order: ApiOrder, status: ApiOrder['status']) => Promise<void>
}

export function KitchenOrderCard({ order, updating, onUpdate }: KitchenOrderCardProps) {
  const items = order.items ?? []
  const printId = `kitchen-order-${order.id}`

  return (
    <article className={`kitchen-card kitchen-card--${order.status} printable-area`} data-print-id={printId}>
      <div className="kitchen-card__header">
        <div>
          <span className="kitchen-card__code">{order.code}</span>
          <h2>{order.table?.name ?? `Mesa ${order.table_id}`}</h2>
        </div>
        <StatusBadge label={kitchenStatusLabel[order.status]} tone={kitchenStatusTone[order.status]} />
      </div>

      <div className="compact-meta">
        <span><Clock3 size={16} /> {order.sent_at ? formatDateTime(order.sent_at) : 'Agora'}</span>
        <span><ReceiptText size={16} /> {items.length} item{items.length === 1 ? '' : 's'}</span>
      </div>

      <div className="kitchen-card__items">
        {items.map((item) => (
          <div className={item.notes ? 'kitchen-item kitchen-item--note' : 'kitchen-item'} key={`${order.id}-${item.id}`}>
            <strong><span>{item.quantity}x</span> {item.product_name}</strong>
            {item.notes ? <small><StickyNote size={15} /> {item.notes}</small> : null}
          </div>
        ))}
      </div>

      <div className="kitchen-actions no-print">
        <button className="secondary-button" type="button" onClick={() => printArea(printId, 'kitchen')}>
          <Printer size={18} />
          Imprimir comanda
        </button>

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
