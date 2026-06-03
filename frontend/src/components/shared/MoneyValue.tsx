import { formatCurrency } from '../../services/format'

type MoneyValueProps = {
  value: number | string | null | undefined
  label?: string
  emphasis?: boolean
  align?: 'start' | 'end'
}

export function MoneyValue({ value, label, emphasis = false, align = 'end' }: MoneyValueProps) {
  return (
    <span className={`money-value money-value--${align}${emphasis ? ' money-value--emphasis' : ''}`}>
      {label ? <small>{label}</small> : null}
      <strong>{formatCurrency(value)}</strong>
    </span>
  )
}
