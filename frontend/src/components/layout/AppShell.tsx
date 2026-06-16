import {
  ClipboardList,
  CookingPot,
  CreditCard,
  FileBarChart,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Package,
  Settings,
  Tags,
  Users,
  Utensils,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import type { NavItem } from '../../types'

type AppArea = 'admin' | 'kitchen' | 'cashier'

const navByArea: Record<AppArea, NavItem[]> = {
  admin: [
    { to: '/admin', label: 'Painel', icon: LayoutDashboard, end: true },
    { to: '/admin/tables', label: 'Mesas', icon: Utensils },
    { to: '/admin/categories', label: 'Categorias', icon: Tags },
    { to: '/admin/products', label: 'Produtos', icon: Package },
    { to: '/admin/users', label: 'Usuários', icon: Users },
    { to: '/admin/settings', label: 'Configurações', icon: Settings },
    { to: '/admin/reports', label: 'Relatórios', icon: FileBarChart },
    { to: '/admin/logs', label: 'Logs', icon: ListChecks },
  ],
  kitchen: [
    { to: '/kitchen', label: 'Resumo', icon: CookingPot, end: true },
    { to: '/kitchen/orders', label: 'Pedidos', icon: ClipboardList },
  ],
  cashier: [
    { to: '/cashier', label: 'Resumo', icon: CreditCard, end: true },
    { to: '/cashier/tables', label: 'Mesas', icon: Utensils },
  ],
}

const titleByArea: Record<AppArea, string> = {
  admin: 'Admin',
  kitchen: 'Cozinha',
  cashier: 'Caixa',
}

export function AppShell({ area }: { area: AppArea }) {
  const navItems = navByArea[area]

  return (
    <div className={`app-shell app-shell--${area}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark">K</span>
          <div>
            <strong>KiPedido</strong>
            <small>{titleByArea[area]}</small>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label={`Navegação ${titleByArea[area]}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <NavLink to="/admin/login" className="nav-link nav-link--muted">
          <LogOut size={18} />
          <span>Sair</span>
        </NavLink>
      </aside>

      <main className="workspace">
        <Outlet />
      </main>
    </div>
  )
}
