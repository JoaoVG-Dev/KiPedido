import { ArrowRight, ShoppingCart } from 'lucide-react'
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

  const itemLabel = count === 1 ? '1 item' : `${count} itens`

  return (
    <Link className="floating-cart-summary" to={to}>
      <span className="floating-cart-summary__icon" aria-hidden="true">
        <ShoppingCart size={22} />
      </span>
      <span className="floating-cart-summary__copy">
        <strong>{itemLabel} no carrinho</strong>
        <small>Revisar pedido antes de enviar</small>
      </span>
      <span className="floating-cart-summary__total">{formatCurrency(total)}</span>
      <span className="floating-cart-summary__arrow" aria-hidden="true">
        <ArrowRight size={20} />
      </span>
    </Link>
  )
}
