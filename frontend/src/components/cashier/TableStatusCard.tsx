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
  const sessionStatus = table.active_session?.status ? sessionStatusLabel(table.active_session.status) : 'Sem sessão aberta'

  return (
    <Link className={`cashier-table-card cashier-table-card--${table.status}`} to={`/cashier/tables/${table.id}`}>
      <div className="cashier-table-card__header">
        <div>
          <strong>{table.name}</strong>
          <small>{sessionStatus}</small>
        </div>
        <StatusBadge label={cashierTableStatusLabel[table.status]} tone={cashierTableStatusTone[table.status]} />
      </div>
      <div className="cashier-table-card__body">
        <MoneyValue value={table.active_session?.total_amount} label="Total da mesa" emphasis={table.status !== 'available'} align="start" />
        <span>{hasActiveSession ? 'Consumo em andamento' : 'Mesa pronta para abrir'}</span>
      </div>
      <span className="cashier-table-card__action">Abrir fechamento</span>
    </Link>
  )
}

function sessionStatusLabel(status: NonNullable<ApiRestaurantTable['active_session']>['status']) {
  return {
    open: 'Sessão aberta',
    waiting_payment: 'Aguardando pagamento',
    paid: 'Conta paga',
    cancelled: 'Sessão cancelada',
  }[status]
}
