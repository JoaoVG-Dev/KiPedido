import { Plus, Sparkles } from 'lucide-react'
import { formatCurrency } from '../../services/format'
import type { ApiCategory, ApiProduct } from '../../types'

type ProductCardProps = {
  category: ApiCategory
  product: ApiProduct
  onAdd: () => void
}

export function ProductCard({ category, product, onAdd }: ProductCardProps) {
  const isAvailable = product.is_available !== false
  const initials = category.name.slice(0, 2).toUpperCase()

  return (
    <article className={isAvailable ? 'menu-item' : 'menu-item menu-item--disabled'}>
      <div className="menu-item__image">
        <span>{initials}</span>
        <small><Sparkles size={14} /> {category.name}</small>
      </div>
      <div className="menu-item__content">
        <span>{category.name}</span>
        <h2>{product.name}</h2>
        <p>{product.description ?? 'Receita selecionada pelo restaurante.'}</p>
        <div className="menu-item__footer">
          <strong>{formatCurrency(product.price)}</strong>
          <button className="primary-button menu-add-button" type="button" disabled={!isAvailable} onClick={onAdd}>
            <Plus size={22} />
            {isAvailable ? 'Adicionar' : 'Indisponivel'}
          </button>
        </div>
      </div>
    </article>
  )
}
