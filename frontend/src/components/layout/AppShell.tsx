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
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { clearAuthToken, me } from '../../services/auth'
import { StateMessage } from '../shared/StateMessage'
import type { ApiUser, NavItem } from '../../types'

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

const allowedRolesByArea: Record<AppArea, ApiUser['role'][]> = {
  admin: ['admin', 'manager'],
  kitchen: ['admin', 'manager', 'kitchen'],
  cashier: ['admin', 'manager', 'cashier'],
}

const homeByRole: Record<ApiUser['role'], string> = {
  admin: '/admin',
  manager: '/admin',
  kitchen: '/kitchen',
  cashier: '/cashier',
}

type AuthGuardState = {
  isLoading: boolean
  user: ApiUser | null
  error: string | null
}

export function AppShell({ area }: { area: AppArea }) {
  const navItems = navByArea[area]
  const navigate = useNavigate()
  const [authGuard, setAuthGuard] = useState<AuthGuardState>({
    isLoading: true,
    user: null,
    error: null,
  })

  useEffect(() => {
    let isMounted = true

    void Promise.resolve()
      .then(() => {
        if (!isMounted) return null

        setAuthGuard({ isLoading: true, user: null, error: null })

        return me()
      })
      .then((user) => {
        if (!isMounted || !user) return

        if (!allowedRolesByArea[area].includes(user.role)) {
          navigate(homeByRole[user.role], { replace: true })
          return
        }

        setAuthGuard({ isLoading: false, user, error: null })
      })
      .catch(() => {
        if (!isMounted) return

        clearAuthToken()
        navigate('/admin/login', { replace: true })
      })

    return () => {
      isMounted = false
    }
  }, [area, navigate])

  function handleLogout() {
    clearAuthToken()
    navigate('/admin/login')
  }

  if (authGuard.isLoading) {
    return (
      <main className="auth-guard-page">
        <StateMessage title="Validando sessão..." description="Conferindo usuário e perfil de acesso." tone="loading" />
      </main>
    )
  }

  if (authGuard.error) {
    return (
      <main className="auth-guard-page">
        <StateMessage title={authGuard.error} tone="error" action={{ to: '/admin/login', label: 'Entrar novamente' }} />
      </main>
    )
  }

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

        <button className="nav-link nav-link--muted nav-link--button" type="button" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </aside>

      <main className="workspace">
        <Outlet />
      </main>
    </div>
  )
}
