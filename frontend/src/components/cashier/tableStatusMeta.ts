import type { StatusTone, TableStatus } from '../../types'

export const cashierTableStatusLabel: Record<TableStatus, string> = {
  available: 'Livre',
  occupied: 'Ocupada',
  waiting_payment: 'Aguardando pagamento',
  closed: 'Fechada',
  inactive: 'Inativa',
}

export const cashierTableStatusTone: Record<TableStatus, StatusTone> = {
  available: 'success',
  occupied: 'info',
  waiting_payment: 'warning',
  closed: 'neutral',
  inactive: 'danger',
}
