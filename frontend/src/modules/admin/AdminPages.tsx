import {
  BadgeDollarSign,
  Bell,
  ClipboardList,
  FileBarChart,
  PackageCheck,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Tags,
  UserRoundPlus,
  Utensils,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MetricCard } from '../../components/shared/MetricCard'
import { PageHeader } from '../../components/shared/PageHeader'
import { ApiStateMessage, StateMessage } from '../../components/shared/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApiQuery } from '../../hooks/useApiQuery'
import { usePageTitle } from '../../hooks/usePageTitle'
import { apiGet, apiPost, apiPut } from '../../services/api'
import { formatCurrency, formatDateTime } from '../../services/format'
import type {
  ApiActionLog,
  ApiCategory,
  ApiDashboard,
  ApiProduct,
  ApiRestaurantSettings,
  ApiRestaurantTable,
  ApiUser,
  PaginatedResponse,
  StatusTone,
  TableStatus,
} from '../../types'

const tableStatusLabel: Record<TableStatus, string> = {
  available: 'Livre',
  occupied: 'Ocupada',
  waiting_payment: 'Conta solicitada',
  closed: 'Fechada',
  inactive: 'Inativa',
}

const tableStatusTone: Record<TableStatus, StatusTone> = {
  available: 'success',
  occupied: 'info',
  waiting_payment: 'warning',
  closed: 'neutral',
  inactive: 'danger',
}

export function AdminDashboard() {
  usePageTitle('Admin')
  const { data, error, isLoading } = useApiQuery(() => apiGet<ApiDashboard>('/admin/dashboard'), [])

  if (isLoading) return <StateMessage title="Carregando painel administrativo..." tone="loading" />
  if (error) return <ApiStateMessage error={error} />
  if (!data) return <StateMessage title="Nenhum dado administrativo disponível." />

  return (
    <section className="page-stack admin-page">
      <PageHeader
        eyebrow="Operação em tempo real"
        title={data.settings?.restaurant_name ?? 'KiPedido'}
        description="Visão rápida da operação, cardápio, salão e eventos importantes do restaurante."
        actions={(
          <Link className="primary-button" to="/admin/products">
            <Plus size={18} />
            Novo produto
          </Link>
        )}
      />

      <div className="metrics-grid">
        <MetricCard icon={Utensils} label="Mesas abertas" value={String(data.metrics.open_tables)} detail={`${data.metrics.available_tables} livres`} tone="info" />
        <MetricCard icon={ClipboardList} label="Pedidos hoje" value={String(data.metrics.today_orders)} detail={`${data.metrics.active_kitchen_orders} ativos na cozinha`} tone="warning" />
        <MetricCard icon={BadgeDollarSign} label="Faturamento" value={formatCurrency(data.metrics.today_revenue)} detail="pagamentos do dia" tone="success" />
        <MetricCard icon={Bell} label="Chamados" value={String(data.metrics.pending_service_calls)} detail="pendentes no salão" tone="danger" />
      </div>

      <div className="content-grid">
        <section className="panel admin-summary-panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Salão</span>
              <h2>Mapa resumido de mesas</h2>
            </div>
            <Link to="/admin/tables">Ver todas</Link>
          </div>
          <TableRows tables={data.tables} />
        </section>

        <section className="panel admin-summary-panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Auditoria</span>
              <h2>Logs recentes</h2>
            </div>
            <Link to="/admin/logs">Ver logs</Link>
          </div>
          {data.recent_logs.length === 0 ? (
            <StateMessage title="Nenhum log registrado ainda." />
          ) : (
            <div className="task-list">
              {data.recent_logs.map((log) => (
                <article key={log.id}>
                  <ShieldCheck size={18} />
                  <span>
                    <strong>{log.action}</strong>
                    <small>{log.description}</small>
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export function AdminTablesPage() {
  usePageTitle('Mesas')
  const { data, error, isLoading, reload } = useApiQuery(() => apiGet<PaginatedResponse<ApiRestaurantTable>>('/admin/tables'), [])
  const tables = data?.data ?? []

  return (
    <section className="page-stack admin-page">
      <PageHeader
        eyebrow="Administração"
        title="Mesas"
        description="Gerencie tokens, status e consumo atual de cada mesa."
        actions={(
          <button className="primary-button" type="button">
            <Plus size={18} />
            Nova mesa
          </button>
        )}
      />

      {!isLoading && !error ? <AdminTableSummary tables={tables} /> : null}

      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input placeholder="Buscar mesa" />
          </label>
          <button className="secondary-button" type="button" onClick={() => void reload()}>
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        {isLoading ? <StateMessage title="Carregando mesas..." tone="loading" /> : null}
        {error ? <ApiStateMessage error={error} /> : null}
        {!isLoading && !error ? <TableDataTable tables={tables} /> : null}
      </section>
    </section>
  )
}

export function AdminCategoriesPage() {
  usePageTitle('Categorias')
  const { data, error, isLoading } = useApiQuery(() => apiGet<PaginatedResponse<ApiCategory>>('/admin/categories'), [])

  return (
    <AdminListPage
      title="Categorias"
      eyebrow="Cardápio"
      description="Organize as seções que aparecem no cardápio digital da mesa."
      action="Nova categoria"
      icon={Tags}
      isLoading={isLoading}
      error={error}
      emptyTitle="Nenhuma categoria cadastrada."
      rows={(data?.data ?? []).map((category) => [
        category.name,
        `${category.products_count ?? 0} produto${category.products_count === 1 ? '' : 's'} · ${category.description ?? 'Sem descrição'}`,
        `${category.is_active ? 'Ativa' : 'Inativa'} · ordem ${category.sort_order}`,
      ])}
      columns={['Categoria', 'Descrição', 'Status']}
    />
  )
}

export function AdminProductsPage() {
  usePageTitle('Produtos')
  const { data, error, isLoading, reload } = useApiQuery(() => apiGet<PaginatedResponse<ApiProduct>>('/admin/products'), [])
  const products = data?.data ?? []
  const activeProducts = products.filter((product) => product.is_active)
  const visibleProducts = activeProducts.filter((product) => product.is_available)
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(null)

  async function toggleProduct(product: ApiProduct) {
    setUpdatingProductId(product.id)

    try {
      await apiPost<ApiProduct>(`/admin/products/${product.id}/toggle-availability`)
      await reload()
    } finally {
      setUpdatingProductId(null)
    }
  }

  return (
    <section className="page-stack admin-page">
      <PageHeader
        eyebrow="Cardápio"
        title="Produtos"
        description="Itens vendidos no tablet, com preço, categoria e disponibilidade."
        actions={(
          <button className="primary-button" type="button">
            <Plus size={18} />
            Novo produto
          </button>
        )}
      />

      {isLoading ? <StateMessage title="Carregando produtos..." tone="loading" /> : null}
      {error ? <ApiStateMessage error={error} /> : null}
      {!isLoading && !error && products.length === 0 ? <StateMessage title="Nenhum produto cadastrado." /> : null}

      {!isLoading && !error ? (
        <div className="admin-ops-strip">
          <MetricCard icon={PackageCheck} label="Ativos" value={String(activeProducts.length)} detail="no cadastro" tone="info" />
          <MetricCard icon={Utensils} label="Visíveis no tablet" value={String(visibleProducts.length)} detail="vendendo agora" tone="success" />
          <MetricCard icon={Tags} label="Pausados" value={String(activeProducts.length - visibleProducts.length)} detail="fora do cardápio" tone="warning" />
        </div>
      ) : null}

      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-card__media">
              <span>{(product.category?.name ?? 'Produto').slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="product-card__body">
              <div className="product-card__topline">
                <span>{product.category?.name ?? 'Sem categoria'}</span>
                <StatusBadge label={product.is_available ? 'Disponível' : 'Pausado'} tone={product.is_available ? 'success' : 'danger'} />
              </div>
              <h2>{product.name}</h2>
              <p>{product.description ?? 'Sem descrição cadastrada.'}</p>
              <div className="product-card__footer">
                <strong>{formatCurrency(product.price)}</strong>
                <small>{product.is_available ? 'Visível no tablet' : 'Oculto no cardápio'}</small>
              </div>
              <div className="product-card__actions">
                <button className="secondary-button" type="button" disabled={updatingProductId === product.id} onClick={() => void toggleProduct(product)}>
                  {product.is_available ? 'Pausar venda' : 'Ativar venda'}
                </button>
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
  const { data, error, isLoading } = useApiQuery(() => apiGet<PaginatedResponse<ApiUser>>('/admin/users'), [])

  return (
    <AdminListPage
      title="Usuários internos"
      eyebrow="Permissões"
      description="Contas operacionais para administração, caixa e cozinha."
      action="Novo usuário"
      icon={UserRoundPlus}
      isLoading={isLoading}
      error={error}
      emptyTitle="Nenhum usuário cadastrado."
      rows={(data?.data ?? []).map((user) => [
        user.name,
        user.email,
        `${adminRoleLabel(user.role)}${user.is_active ? '' : ' · inativo'}`,
      ])}
      columns={['Usuário', 'Email', 'Perfil']}
    />
  )
}

export function AdminSettingsPage() {
  usePageTitle('Configurações')
  const { data, error, isLoading, reload } = useApiQuery(() => apiGet<ApiRestaurantSettings>('/admin/settings'), [])

  return (
    <section className="page-stack admin-page">
      <PageHeader
        eyebrow="Restaurante"
        title="Configurações"
        description="Parâmetros carregados da API para operação do restaurante."
      />

      {isLoading ? <StateMessage title="Carregando configurações..." tone="loading" /> : null}
      {error ? <ApiStateMessage error={error} /> : null}
      {data ? <RestaurantSettingsForm key={settingsFormKey(data)} settings={data} onSaved={reload} /> : null}
    </section>
  )
}

type SettingsFormState = {
  restaurant_name: string
  service_fee_percentage: string
  currency: string
  printer_enabled: boolean
  sound_alerts_enabled: boolean
}

function RestaurantSettingsForm({ settings, onSaved }: { settings: ApiRestaurantSettings; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<SettingsFormState>(() => settingsToForm(settings))
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccess(null)
    setError(null)
    setIsSaving(true)

    try {
      await apiPut<ApiRestaurantSettings>('/admin/settings', {
        ...form,
        currency: form.currency.toUpperCase(),
        service_fee_percentage: Number(form.service_fee_percentage),
      })
      setSuccess('Configurações salvas com sucesso.')
      await onSaved()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível salvar as configurações.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="settings-form" onSubmit={(event) => void submit(event)}>
      {success ? <StateMessage title={success} tone="success" /> : null}
      {error ? <StateMessage title={error} tone="error" /> : null}

      <section className="settings-grid">
        <label>
          Nome do restaurante
          <input value={form.restaurant_name} onChange={(event) => setForm((current) => ({ ...current, restaurant_name: event.target.value }))} />
        </label>
        <label>
          Taxa de serviço (%)
          <input type="number" min="0" max="100" step="0.01" value={form.service_fee_percentage} onChange={(event) => setForm((current) => ({ ...current, service_fee_percentage: event.target.value }))} />
        </label>
        <label>
          Moeda
          <input maxLength={3} value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} />
        </label>
        <div className="toggle-row">
          <Settings size={20} />
          <span>
            <strong>Impressão operacional</strong>
            <small>Controla se a operação deve usar os atalhos de impressão simples.</small>
          </span>
          <input type="checkbox" checked={form.printer_enabled} onChange={(event) => setForm((current) => ({ ...current, printer_enabled: event.target.checked }))} />
        </div>
        <div className="toggle-row">
          <Bell size={20} />
          <span>
            <strong>Alertas sonoros</strong>
            <small>Prepara a cozinha e o caixa para avisos operacionais em tempo real.</small>
          </span>
          <input type="checkbox" checked={form.sound_alerts_enabled} onChange={(event) => setForm((current) => ({ ...current, sound_alerts_enabled: event.target.checked }))} />
        </div>
      </section>

      <div className="settings-form__actions">
        <button className="primary-button" type="submit" disabled={isSaving}>
          <Save size={18} />
          {isSaving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </form>
  )
}

function settingsToForm(settings: ApiRestaurantSettings): SettingsFormState {
  return {
    restaurant_name: settings.restaurant_name,
    service_fee_percentage: String(settings.service_fee_percentage),
    currency: settings.currency,
    printer_enabled: settings.printer_enabled,
    sound_alerts_enabled: settings.sound_alerts_enabled,
  }
}

function settingsFormKey(settings: ApiRestaurantSettings) {
  return [
    settings.restaurant_name,
    settings.service_fee_percentage,
    settings.currency,
    settings.printer_enabled ? 'printer-on' : 'printer-off',
    settings.sound_alerts_enabled ? 'sound-on' : 'sound-off',
  ].join(':')
}

export function AdminReportsPage() {
  usePageTitle('Relatórios')
  const daily = useApiQuery(() => apiGet<{ net_total: number; payments_count: number }>('/admin/reports/daily-sales'), [])
  const products = useApiQuery(() => apiGet<Array<{ product_name: string; quantity_sold: string; total_sold: string }>>('/admin/reports/products-ranking'), [])
  const tables = useApiQuery(() => apiGet<Array<{ table?: ApiRestaurantTable; sessions_count: number; total_consumed: string }>>('/admin/reports/tables-usage'), [])
  const isLoading = daily.isLoading || products.isLoading || tables.isLoading
  const error = daily.error ?? products.error ?? tables.error

  return (
    <AdminListPage
      title="Relatórios simples"
      eyebrow="Indicadores"
      description="Resumo financeiro e operacional para conferência rápida."
      action="Exportar"
      icon={FileBarChart}
      isLoading={isLoading}
      error={error}
      emptyTitle="Nenhum dado de relatório encontrado."
      rows={[
        ['Vendas do dia', formatCurrency(daily.data?.net_total ?? 0), `${daily.data?.payments_count ?? 0} pagamentos`],
        ['Produto mais vendido', products.data?.[0]?.product_name ?? 'Sem vendas', `${products.data?.[0]?.quantity_sold ?? 0} unidades`],
        ['Mesa mais usada', tables.data?.[0]?.table?.name ?? 'Sem sessões', `${tables.data?.[0]?.sessions_count ?? 0} sessões`],
      ]}
      columns={['Indicador', 'Valor', 'Observação']}
    />
  )
}

export function AdminLogsPage() {
  usePageTitle('Logs')
  const { data, error, isLoading } = useApiQuery(() => apiGet<PaginatedResponse<ApiActionLog>>('/admin/logs'), [])

  return (
    <AdminListPage
      title="Logs de ações"
      eyebrow="Auditoria"
      description="Registro dos principais eventos operacionais do sistema."
      action="Filtrar"
      icon={ShieldCheck}
      isLoading={isLoading}
      error={error}
      emptyTitle="Nenhum log registrado."
      rows={(data?.data ?? []).map((log) => [
        log.action,
        log.description,
        formatDateTime(log.created_at),
      ])}
      columns={['Ação', 'Evento', 'Horário']}
    />
  )
}

function AdminTableSummary({ tables }: { tables: ApiRestaurantTable[] }) {
  const available = tables.filter((table) => table.status === 'available').length
  const occupied = tables.filter((table) => table.status === 'occupied').length
  const waitingPayment = tables.filter((table) => table.status === 'waiting_payment').length
  const inactive = tables.filter((table) => !table.is_active || table.status === 'inactive').length

  return (
    <div className="admin-ops-strip">
      <MetricCard icon={Utensils} label="Livres" value={String(available)} detail="prontas para abrir" tone="success" />
      <MetricCard icon={ClipboardList} label="Em uso" value={String(occupied)} detail="com consumo ativo" tone="info" />
      <MetricCard icon={BadgeDollarSign} label="Aguardando conta" value={String(waitingPayment)} detail="prioridade do caixa" tone="warning" />
      <MetricCard icon={ShieldCheck} label="Inativas" value={String(inactive)} detail="fora da operação" tone="neutral" />
    </div>
  )
}

function TableRows({ tables }: { tables: ApiRestaurantTable[] }) {
  if (tables.length === 0) {
    return <StateMessage title="Nenhuma mesa cadastrada." />
  }

  return (
    <div className="table-list">
      {tables.map((table) => (
        <article className={`table-row table-row--${table.status}`} key={table.id}>
          <div>
            <strong>{table.name}</strong>
            <small>{table.active_session ? adminSessionStatusLabel(table.active_session.status) : 'Sem consumo aberto'}</small>
          </div>
          <StatusBadge label={tableStatusLabel[table.status]} tone={tableStatusTone[table.status]} />
          <span>{formatCurrency(table.active_session?.total_amount)}</span>
        </article>
      ))}
    </div>
  )
}

function TableDataTable({ tables }: { tables: ApiRestaurantTable[] }) {
  if (tables.length === 0) {
    return <StateMessage title="Nenhuma mesa cadastrada." />
  }

  return (
    <div className="data-table">
      <div className="data-table__head">
        <span>Mesa</span>
        <span>Status</span>
        <span>Consumo</span>
        <span>Token</span>
      </div>
      {tables.map((table) => (
        <div className="data-table__row" key={table.id}>
          <strong data-label="Mesa">{table.name}</strong>
          <span data-label="Status"><StatusBadge label={tableStatusLabel[table.status]} tone={tableStatusTone[table.status]} /></span>
          <span data-label="Consumo">{formatCurrency(table.active_session?.total_amount)}</span>
          <code data-label="Token">{table.token}</code>
        </div>
      ))}
    </div>
  )
}

type AdminListPageProps = {
  title: string
  eyebrow: string
  description: string
  action: string
  rows: string[][]
  columns?: [string, string, string]
  isLoading: boolean
  error: Error | null
  emptyTitle: string
  icon?: typeof Plus
}

function AdminListPage({ title, eyebrow, description, action, rows, columns = ['Nome', 'Detalhe', 'Status'], isLoading, error, emptyTitle, icon: Icon = Plus }: AdminListPageProps) {
  return (
    <section className="page-stack admin-page">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={(
          <button className="primary-button" type="button">
            <Icon size={18} />
            {action}
          </button>
        )}
      />

      <section className="panel">
        {isLoading ? <StateMessage title={`Carregando ${title.toLowerCase()}...`} tone="loading" /> : null}
        {error ? <ApiStateMessage error={error} /> : null}
        {!isLoading && !error && rows.length === 0 ? <StateMessage title={emptyTitle} /> : null}
        {!isLoading && !error && rows.length > 0 ? (
          <div className="data-table data-table--three">
            <div className="data-table__head">
              <span>{columns[0]}</span>
              <span>{columns[1]}</span>
              <span>{columns[2]}</span>
            </div>
            {rows.map((row) => (
              <div className="data-table__row" key={row.join('-')}>
                <strong data-label={columns[0]}>{row[0]}</strong>
                <span data-label={columns[1]}>{row[1]}</span>
                <span data-label={columns[2]}>{row[2]}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  )
}

function adminSessionStatusLabel(status: NonNullable<ApiRestaurantTable['active_session']>['status']) {
  return {
    open: 'Sessão aberta',
    waiting_payment: 'Aguardando pagamento',
    paid: 'Conta paga',
    cancelled: 'Sessão cancelada',
  }[status]
}

function adminRoleLabel(role: ApiUser['role']) {
  return {
    admin: 'Administrador',
    manager: 'Gerente',
    cashier: 'Caixa',
    kitchen: 'Cozinha',
  }[role]
}
