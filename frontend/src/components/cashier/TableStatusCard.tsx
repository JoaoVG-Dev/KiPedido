import { Link } from 'react-router-dom'
import { MoneyValue } from '../shared/MoneyValue'
import { StatusBadge } from '../ui/StatusBadge'
import type { ApiRestaurantTable } from '../../types'
import { cashierTableStatusLabel, cashierTableStatusTone } from './tableStatusMeta'

type TableStatusCardProps = {
  table: ApiRestaurantTable
}

export function TableStatusCard({ table }: TableStatusCardProps) {
  const hasActiveSession = Boolean(table.active_session)

  return (
    <Link className={`cashier-table-card cashier-table-card--${table.status}`} to={`/cashier/tables/${table.id}`}>
      <div className="cashier-table-card__header">
        <div>
          <strong>{table.name}</strong>
          <small>{hasActiveSession ? `Sessão ${table.active_session?.status}` : 'Sem sessão aberta'}</small>
        </div>
        <StatusBadge label={cashierTableStatusLabel[table.status]} tone={cashierTableStatusTone[table.status]} />
      </div>
      <MoneyValue value={table.active_session?.total_amount} label="Total da mesa" emphasis={table.status !== 'available'} align="start" />
      <span className="cashier-table-card__action">Abrir fechamento</span>
    </Link>
  )
}
