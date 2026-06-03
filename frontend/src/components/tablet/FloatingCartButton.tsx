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
      <span>{count} item{count === 1 ? '' : 's'} no carrinho</span>
      <strong>{formatCurrency(total)}</strong>
      <ShoppingCart size={22} />
    </Link>
  )
}
