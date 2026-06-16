import { ReceiptText } from 'lucide-react'
import { StateMessage } from '../shared/StateMessage'
import { formatCurrency, formatDateTime } from '../../services/format'
import type { TableBillResponse } from '../../types'

type BillSummaryCardProps = {
  bill: TableBillResponse | null
  isLoading: boolean
  error: Error | null
}

export function BillSummaryCard({ bill, isLoading, error }: BillSummaryCardProps) {
  return (
    <section className="panel bill-breakdown bill-summary-card">
      <div className="panel__header">
        <div>
          <span className="eyebrow">Recibo da mesa</span>
          <h2>Conta</h2>
        </div>
        <ReceiptText size={22} />
      </div>

      {bill?.session.opened_at ? <small className="bill-summary-card__date">{formatDateTime(bill.session.opened_at)}</small> : null}
      {isLoading ? <StateMessage title="Calculando consumo..." tone="loading" /> : null}
      {error ? <StateMessage title={error.message} tone="empty" /> : null}
      {bill ? (
        <>
          <div><span>Subtotal</span><strong>{formatCurrency(bill.subtotal)}</strong></div>
          <div><span>Taxa de serviço</span><strong>{formatCurrency(bill.service_fee_amount)}</strong></div>
          <div><span>Desconto</span><strong>{formatCurrency(bill.discount_amount)}</strong></div>
          <div className="bill-breakdown__total"><span>Total final</span><strong>{formatCurrency(bill.total_amount)}</strong></div>
        </>
      ) : null}
    </section>
  )
}
