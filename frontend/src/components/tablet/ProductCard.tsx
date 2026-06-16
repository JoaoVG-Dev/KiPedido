import { CircleOff, Plus, Sparkles } from 'lucide-react'
import { formatCurrency } from '../../services/format'
import type { ApiCategory, ApiProduct } from '../../types'

type ProductCardProps = {
  category: ApiCategory
  product: ApiProduct
  onAdd: () => void
  disabledReason?: string
}

const publicAssetUrl = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '')

export function ProductCard({ category, product, onAdd, disabledReason }: ProductCardProps) {
  const isAvailable = product.is_available !== false
  const canAdd = isAvailable && !disabledReason
  const initials = category.name.slice(0, 2).toUpperCase()
  const imageUrl = product.image_path ? `${publicAssetUrl}/storage/${product.image_path}` : null

  return (
    <article className={canAdd ? 'menu-item' : 'menu-item menu-item--disabled'}>
      <div className="menu-item__image">
        {imageUrl ? <img src={imageUrl} alt="" /> : <span>{initials}</span>}
        <small><Sparkles size={14} /> {canAdd ? 'Destaque do cardápio' : disabledReason ?? 'Pausado hoje'}</small>
      </div>
      <div className="menu-item__content">
        <div className="menu-item__meta">
          <span className="menu-item__badge">{category.name}</span>
          <span className={canAdd ? 'menu-item__availability' : 'menu-item__availability menu-item__availability--off'}>
            {canAdd ? 'Disponível' : disabledReason ?? 'Indisponível'}
          </span>
        </div>
        <div className="menu-item__copy">
          <h2>{product.name}</h2>
          <p>{product.description ?? 'Receita selecionada pelo restaurante.'}</p>
        </div>
        <div className="menu-item__footer">
          <div className="menu-item__price">
            <small>Preço</small>
            <strong>{formatCurrency(product.price)}</strong>
          </div>
          <button className="primary-button menu-add-button" type="button" disabled={!canAdd} onClick={onAdd}>
            {canAdd ? <Plus size={22} /> : <CircleOff size={22} />}
            {canAdd ? 'Adicionar' : disabledReason ?? 'Pausado'}
          </button>
        </div>
      </div>
    </article>
  )
}
