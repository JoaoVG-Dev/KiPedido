import { BadgeDollarSign, CreditCard, Percent, ReceiptText, Unlock, Utensils } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { MetricCard } from '../../components/shared/MetricCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatCurrency, tables } from '../../services/mockData'
import type { TableStatus } from '../../types'

const statusLabel: Record<TableStatus, string> = {
  available: 'Livre',
  occupied: 'Ocupada',
  waiting_payment: 'Conta solicitada',
  closed: 'Fechada',
  inactive: 'Inativa',
}

const statusTone: Record<TableStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  available: 'success',
  occupied: 'info',
  waiting_payment: 'warning',
  closed: 'neutral',
  inactive: 'danger',
}

export function CashierDashboard() {
  usePageTitle('Caixa')

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Caixa</span>
          <h1>Fechamento de mesas</h1>
        </div>
      </header>

      <div className="metrics-grid">
        <MetricCard icon={Utensils} label="Mesas abertas" value="3" detail="1 pediu conta" />
        <MetricCard icon={BadgeDollarSign} label="A receber" value="R$ 487,60" detail="consumo aberto" />
        <MetricCard icon={CreditCard} label="Pagamentos" value="18" detail="registrados hoje" />
      </div>

      <CashierTablesPage embedded />
    </section>
  )
}

export function CashierTablesPage({ embedded = false }: { embedded?: boolean }) {
  usePageTitle('Mesas do caixa')

  return (
    <section className={embedded ? 'panel' : 'page-stack'}>
      {!embedded ? (
        <header className="page-header">
          <div>
            <span className="eyebrow">Mesas</span>
            <h1>Consumo por mesa</h1>
          </div>
        </header>
      ) : null}

      <div className="cashier-grid">
        {tables.map((table) => (
          <Link className="cashier-table-card" to={`/cashier/tables/${table.id}`} key={table.id}>
            <div>
              <strong>{table.name}</strong>
              <StatusBadge label={statusLabel[table.status]} tone={statusTone[table.status]} />
            </div>
            <span>{table.openedAt ? `Aberta às ${table.openedAt}` : 'Sem sessão aberta'}</span>
            <strong>{formatCurrency(table.total)}</strong>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function CashierTableDetailPage() {
  usePageTitle('Detalhe da mesa')
  const { id = '1' } = useParams()
  const table = tables.find((item) => String(item.id) === id) ?? tables[0]

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Fechamento</span>
          <h1>{table.name}</h1>
        </div>
        <StatusBadge label={statusLabel[table.status]} tone={statusTone[table.status]} />
      </header>

      <div className="content-grid">
        <section className="panel bill-breakdown">
          <h2>Conta</h2>
          <div><span>Subtotal</span><strong>{formatCurrency(table.total)}</strong></div>
          <div><span>Taxa de serviço</span><strong>{formatCurrency(table.total * 0.1)}</strong></div>
          <div><span>Desconto</span><strong>{formatCurrency(0)}</strong></div>
          <div><span>Total</span><strong>{formatCurrency(table.total * 1.1)}</strong></div>
        </section>

        <section className="panel cashier-actions">
          <button className="secondary-button" type="button">
            <Percent size={18} />
            Aplicar desconto
          </button>
          <button className="primary-button" type="button">
            <ReceiptText size={18} />
            Marcar como pago
          </button>
          <button className="secondary-button" type="button">
            <Unlock size={18} />
            Liberar mesa
          </button>
        </section>
      </div>
    </section>
  )
}
