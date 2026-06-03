import { KitchenOrderCard } from './KitchenOrderCard'
import type { ApiOrder } from '../../types'

type KitchenStatusColumnProps = {
  status: ApiOrder['status']
  title: string
  description: string
  orders: ApiOrder[]
  updatingId: number | null
  onUpdate: (order: ApiOrder, status: ApiOrder['status']) => Promise<void>
}

export function KitchenStatusColumn({ status, title, description, orders, updatingId, onUpdate }: KitchenStatusColumnProps) {
  return (
    <section className={`kitchen-lane kitchen-lane--${status}`}>
      <div className="kitchen-lane__header">
        <div>
          <h2>{title}</h2>
          <span>{description}</span>
        </div>
        <strong>{orders.length}</strong>
      </div>

      {orders.length === 0 ? (
        <div className="kitchen-empty">Nenhum pedido.</div>
      ) : (
        orders.map((order) => (
          <KitchenOrderCard order={order} updating={updatingId === order.id} onUpdate={onUpdate} key={order.id} />
        ))
      )}
    </section>
  )
}
