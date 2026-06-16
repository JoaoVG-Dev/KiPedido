import { BellRing, ClipboardList, Home, ReceiptText, ShoppingCart, Utensils } from 'lucide-react'
import { NavLink, Outlet, useParams } from 'react-router-dom'

export function TabletShell() {
  const { token = 'mesa-demo' } = useParams()
  const base = `/tablet/${token}`

  return (
    <div className="tablet-shell">
      <header className="tablet-header">
        <div className="brand brand--tablet">
          <span className="brand__mark">K</span>
          <div>
            <strong>KiPedido</strong>
            <small>Mesa vinculada</small>
          </div>
        </div>
        <button className="icon-button" type="button" title="Chamar garçom">
          <BellRing size={24} />
        </button>
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
