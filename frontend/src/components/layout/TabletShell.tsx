import { BellRing, ClipboardList, Home, ReceiptText, ShoppingCart, Utensils } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { useApiQuery } from '../../hooks/useApiQuery'
import { apiGet, apiPost } from '../../services/api'
import { InstallPrompt } from '../pwa/InstallPrompt'
import type { ApiServiceCall, TabletSessionResponse, TableStatus } from '../../types'
import { StatusBadge } from '../ui/StatusBadge'

const tableStatusLabel: Record<TableStatus, string> = {
  available: 'Livre',
  occupied: 'Mesa aberta',
  waiting_payment: 'Conta solicitada',
  closed: 'Fechada',
  inactive: 'Inativa',
}

export function TabletShell() {
  const { token = 'mesa-01-teste' } = useParams()
  const base = `/tablet/${token}`
  const { data } = useApiQuery(() => apiGet<TabletSessionResponse>(`/tablet/${token}/session`, { auth: false }), [token])
  const [headerMessage, setHeaderMessage] = useState<string | null>(null)

  async function callWaiter() {
    setHeaderMessage(null)

    try {
      await apiPost<ApiServiceCall>(`/tablet/${token}/call-waiter`, {}, { auth: false })
      setHeaderMessage('Garçom chamado')
    } catch {
      setHeaderMessage('Não foi possível chamar')
    }
  }

  return (
    <div className="tablet-shell">
      <header className="tablet-header">
        <div className="brand brand--tablet">
          <span className="brand__mark">K</span>
          <div>
            <strong>KiPedido</strong>
            <small>{data?.table.name ? `${data.table.name} vinculada` : 'Mesa vinculada'}</small>
          </div>
        </div>

        <div className="tablet-header__side">
          <div className="tablet-header__status">
            {data?.table.status ? (
              <StatusBadge
                label={tableStatusLabel[data.table.status]}
                tone={data.table.status === 'waiting_payment' ? 'warning' : data.table.status === 'occupied' ? 'info' : 'success'}
              />
            ) : null}
            {headerMessage ? <span>{headerMessage}</span> : null}
          </div>

          <div className="tablet-header__actions" aria-label="Ações rápidas da mesa">
            <InstallPrompt />
            <button className="tablet-quick-action" type="button" title="Chamar garçom" onClick={() => void callWaiter()}>
              <BellRing size={19} />
              <span>Garçom</span>
            </button>
            <Link className="tablet-quick-action" to={`${base}/conta`}>
              <ReceiptText size={19} />
              <span>Conta</span>
            </Link>
            <Link className="tablet-quick-action" to={`${base}/pedidos`}>
              <ClipboardList size={19} />
              <span>Pedidos</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="tablet-workspace">
        <Outlet />
      </main>

      <nav className="tablet-nav" aria-label="Navegação da mesa">
        <NavLink to={base} end>
          <Home size={22} />
          <span>Início</span>
        </NavLink>
        <NavLink to={`${base}/cardapio`}>
          <Utensils size={22} />
          <span>Cardápio</span>
        </NavLink>
        <NavLink to={`${base}/carrinho`}>
          <ShoppingCart size={22} />
          <span>Carrinho</span>
        </NavLink>
        <NavLink to={`${base}/pedidos`}>
          <ClipboardList size={22} />
          <span>Pedidos</span>
        </NavLink>
        <NavLink to={`${base}/conta`}>
          <ReceiptText size={22} />
          <span>Conta</span>
        </NavLink>
      </nav>
    </div>
  )
}
