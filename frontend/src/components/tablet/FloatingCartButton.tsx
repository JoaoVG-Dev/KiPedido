import { ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../services/format'

type FloatingCartButtonProps = {
  to: string
  count: number
  total: number
}

export function FloatingCartButton({ to, count, total }: FloatingCartButtonProps) {
  if (count === 0) {
    return null
  }

  return (
    <Link className="floating-cart-summary" to={to}>
      <span className="floating-cart-summary__icon" aria-hidden="true">
        <ShoppingCart size={22} />
      </span>
      <span className="floating-cart-summary__copy">
        <strong>{count} item{count === 1 ? '' : 's'} no carrinho</strong>
        <small>Revisar pedido</small>
      </span>
      <span className="floating-cart-summary__total">{formatCurrency(total)}</span>
    </Link>
  )
}
