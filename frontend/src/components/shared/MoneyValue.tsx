import { formatCurrency } from '../../services/format'

type MoneyValueProps = {
  value: number | string | null | undefined
  label?: string
  emphasis?: boolean
}

export function MoneyValue({ value, label, emphasis = false }: MoneyValueProps) {
  return (
    <span className={emphasis ? 'money-value money-value--emphasis' : 'money-value'}>
      {label ? <small>{label}</small> : null}
      <strong>{formatCurrency(value)}</strong>
    </span>
  )
}
