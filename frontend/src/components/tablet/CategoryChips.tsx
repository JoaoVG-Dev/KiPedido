import type { ApiCategory } from '../../types'

type CategoryChipsProps = {
  categories: ApiCategory[]
  selectedCategoryId: number | null
  onSelect: (categoryId: number | null) => void
}

export function CategoryChips({ categories, selectedCategoryId, onSelect }: CategoryChipsProps) {
  if (categories.length === 0) {
    return null
  }

  return (
    <div className="category-rail" aria-label="Categorias do cardapio">
      <button className={selectedCategoryId === null ? 'category-chip category-chip--active' : 'category-chip'} type="button" onClick={() => onSelect(null)}>
        Todos
      </button>
      {categories.map((category) => (
        <button
          className={selectedCategoryId === category.id ? 'category-chip category-chip--active' : 'category-chip'}
          type="button"
          onClick={() => onSelect(category.id)}
          key={category.id}
        >
          <span>{category.name}</span>
          <small>{category.products?.length ?? 0}</small>
        </button>
      ))}
    </div>
  )
}
