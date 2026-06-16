import {
  Activity,
  BadgeDollarSign,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ToggleLeft,
  UserRoundPlus,
  Utensils,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { MetricCard } from '../../components/shared/MetricCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatCurrency, products, tables } from '../../services/mockData'
import type { TableStatus } from '../../types'

const tableStatusLabel: Record<TableStatus, string> = {
  available: 'Livre',
  occupied: 'Ocupada',
  waiting_payment: 'Conta solicitada',
  closed: 'Fechada',
  inactive: 'Inativa',
}

const tableStatusTone: Record<TableStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  available: 'success',
  occupied: 'info',
  waiting_payment: 'warning',
  closed: 'neutral',
  inactive: 'danger',
}

export function AdminDashboard() {
  usePageTitle('Admin')

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Operação em tempo real</span>
          <h1>Visão geral do restaurante</h1>
        </div>
        <Link className="primary-button" to="/admin/products">
          <Plus size={18} />
          Novo produto
        </Link>
      </header>

      <div className="metrics-grid">
        <MetricCard icon={Utensils} label="Mesas abertas" value="3" detail="2 aguardando preparo" />
        <MetricCard icon={ClipboardList} label="Pedidos hoje" value="42" detail="8 nos últimos 30 min" />
        <MetricCard icon={BadgeDollarSign} label="Faturamento" value="R$ 4.820" detail="parcial do dia" />
        <MetricCard icon={Bell} label="Chamados" value="2" detail="pendentes no salão" />
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel__header">
            <h2>Mesas em destaque</h2>
            <Link to="/admin/tables">Ver todas</Link>
          </div>
          <div className="table-list">
            {tables.slice(0, 4).map((table) => (
              <article className="table-row" key={table.id}>
                <div>
                  <strong>{table.name}</strong>
                  <small>{table.openedAt ? `Aberta às ${table.openedAt}` : 'Sem consumo aberto'}</small>
                </div>
                <StatusBadge label={tableStatusLabel[table.status]} tone={tableStatusTone[table.status]} />
                <span>{formatCurrency(table.total)}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2>Próximas ações</h2>
          </div>
          <div className="task-list">
            <span><CheckCircle2 size={18} /> Validar disponibilidade do almoço</span>
            <span><Clock3 size={18} /> Revisar pedidos prontos há mais de 10 min</span>
            <span><Activity size={18} /> Acompanhar chamados de mesa</span>
          </div>
        </section>
      </div>
    </section>
  )
}

export function AdminTablesPage() {
  usePageTitle('Mesas')

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Administração</span>
          <h1>Mesas</h1>
        </div>
        <button className="primary-button" type="button">
          <Plus size={18} />
          Nova mesa
        </button>
      </header>

      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input placeholder="Buscar mesa" />
          </label>
          <button className="secondary-button" type="button">
            <RefreshCw size={18} />
            Regenerar tokens
          </button>
        </div>

        <div className="data-table">
          <div className="data-table__head">
            <span>Mesa</span>
            <span>Status</span>
            <span>Consumo</span>
            <span>Token</span>
          </div>
          {tables.map((table) => (
            <div className="data-table__row" key={table.id}>
              <strong>{table.name}</strong>
              <StatusBadge label={tableStatusLabel[table.status]} tone={tableStatusTone[table.status]} />
              <span>{formatCurrency(table.total)}</span>
              <code>tablet-token-{table.number}</code>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

export function AdminCategoriesPage() {
  usePageTitle('Categorias')

  return (
    <AdminSimplePage
      title="Categorias"
      eyebrow="Cardápio"
      action="Nova categoria"
      rows={[
        ['Entradas', '2 produtos', 'Ativa'],
        ['Pratos principais', '2 produtos', 'Ativa'],
        ['Bebidas', '2 produtos', 'Ativa'],
        ['Sobremesas', '2 produtos', 'Ativa'],
      ]}
    />
  )
}

export function AdminProductsPage() {
  usePageTitle('Produtos')

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Cardápio</span>
          <h1>Produtos</h1>
        </div>
        <button className="primary-button" type="button">
          <Plus size={18} />
          Novo produto
        </button>
      </header>

      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-card__media">{product.category.slice(0, 2).toUpperCase()}</div>
            <div className="product-card__body">
              <span>{product.category}</span>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <div className="product-card__footer">
                <strong>{formatCurrency(product.price)}</strong>
                <StatusBadge label={product.isAvailable ? 'Disponível' : 'Indisponível'} tone={product.isAvailable ? 'success' : 'danger'} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function AdminUsersPage() {
  usePageTitle('Usuários')

  return (
    <AdminSimplePage
      title="Usuários internos"
      eyebrow="Permissões"
      action="Novo usuário"
      icon={UserRoundPlus}
      rows={[
        ['Administrador KiPedido', 'admin@kipedido.local', 'admin'],
        ['Caixa principal', 'caixa@kipedido.local', 'cashier'],
        ['Cozinha', 'cozinha@kipedido.local', 'kitchen'],
      ]}
    />
  )
}

export function AdminSettingsPage() {
  usePageTitle('Configurações')

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Restaurante</span>
          <h1>Configurações</h1>
        </div>
      </header>

      <section className="settings-grid">
        <label>
          Nome do restaurante
          <input defaultValue="KiPedido Restaurante" />
        </label>
        <label>
          Taxa de serviço (%)
          <input defaultValue="10" inputMode="decimal" />
        </label>
        <label>
          Moeda
          <input defaultValue="BRL" />
        </label>
        <div className="toggle-row">
          <Settings size={20} />
          <span>Alertas sonoros da cozinha</span>
          <button className="icon-button" type="button" title="Alternar alertas">
            <ToggleLeft size={24} />
          </button>
        </div>
      </section>
    </section>
  )
}

export function AdminReportsPage() {
  usePageTitle('Relatórios')

  return (
    <AdminSimplePage
      title="Relatórios simples"
      eyebrow="Indicadores"
      action="Exportar"
      rows={[
        ['Vendas do dia', 'R$ 4.820,00', '42 pedidos'],
        ['Produto mais vendido', 'Bolinho de queijo', '18 unidades'],
        ['Mesa com maior consumo', 'Mesa 02', 'R$ 248,70'],
      ]}
    />
  )
}

export function AdminLogsPage() {
  usePageTitle('Logs')

  return (
    <AdminSimplePage
      title="Logs de ações"
      eyebrow="Auditoria"
      action="Filtrar"
      icon={ShieldCheck}
      rows={[
        ['order.created', 'Pedido KP240612391 criado', '12:39'],
        ['order.status_changed', 'Pedido enviado para preparo', '12:41'],
        ['table.bill_requested', 'Mesa 02 pediu a conta', '12:46'],
      ]}
    />
  )
}

type SimplePageProps = {
  title: string
  eyebrow: string
  action: string
  rows: string[][]
  icon?: typeof Plus
}

function AdminSimplePage({ title, eyebrow, action, rows, icon: Icon = Plus }: SimplePageProps) {
  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
        </div>
        <button className="primary-button" type="button">
          <Icon size={18} />
          {action}
        </button>
      </header>

      <section className="panel">
        <div className="data-table data-table--three">
          <div className="data-table__head">
            <span>Nome</span>
            <span>Detalhe</span>
            <span>Status</span>
          </div>
          {rows.map((row) => (
            <div className="data-table__row" key={row.join('-')}>
              <strong>{row[0]}</strong>
              <span>{row[1]}</span>
              <span>{row[2]}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
