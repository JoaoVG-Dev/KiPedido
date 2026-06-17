import {
  BadgeDollarSign,
  Bell,
  ClipboardList,
  Download,
  KeyRound,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Tags,
  Trash2,
  UserRoundPlus,
  Utensils,
  X,
} from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MetricCard } from '../../components/shared/MetricCard'
import { PageHeader } from '../../components/shared/PageHeader'
import { ApiStateMessage, StateMessage } from '../../components/shared/StateMessage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useApiQuery } from '../../hooks/useApiQuery'
import { usePageTitle } from '../../hooks/usePageTitle'
import { apiDelete, apiGet, apiPost, apiPut } from '../../services/api'
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

const tableStatusOptions: Array<{ value: TableStatus; label: string }> = [
  { value: 'available', label: 'Livre' },
  { value: 'occupied', label: 'Ocupada' },
  { value: 'waiting_payment', label: 'Conta solicitada' },
  { value: 'closed', label: 'Fechada' },
  { value: 'inactive', label: 'Inativa' },
]

type TableFormState = {
  name: string
  number: string
  status: TableStatus
  is_active: boolean
}

type CategoryFormState = {
  name: string
  description: string
  sort_order: string
  is_active: boolean
}

type ProductFormState = {
  category_id: string
  name: string
  description: string
  price: string
  image_path: string
  is_available: boolean
  is_active: boolean
  sort_order: string
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
  const [search, setSearch] = useState('')
  const [editingTable, setEditingTable] = useState<ApiRestaurantTable | null>(null)
  const [tableForm, setTableForm] = useState<TableFormState | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const filteredTables = tables.filter((table) => matchesSearch([
    table.name,
    String(table.number),
    table.token,
    tableStatusLabel[table.status],
  ], search))

  function openNewTableForm() {
    const nextNumber = tables.reduce((max, table) => Math.max(max, table.number), 0) + 1

    setEditingTable(null)
    setTableForm({
      name: `Mesa ${nextNumber}`,
      number: String(nextNumber),
      status: 'available',
      is_active: true,
    })
    setSuccess(null)
    setActionError(null)
  }

  function openEditTableForm(table: ApiRestaurantTable) {
    setEditingTable(table)
    setTableForm({
      name: table.name,
      number: String(table.number),
      status: table.status,
      is_active: table.is_active,
    })
    setSuccess(null)
    setActionError(null)
  }

  async function saveTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!tableForm) return

    setIsSaving(true)
    setSuccess(null)
    setActionError(null)

    const payload = {
      name: tableForm.name.trim(),
      number: Number(tableForm.number),
      status: tableForm.status,
      is_active: tableForm.is_active,
    }

    try {
      if (editingTable) {
        await apiPut<ApiRestaurantTable>(`/admin/tables/${editingTable.id}`, payload)
        setSuccess('Mesa atualizada com sucesso.')
      } else {
        await apiPost<ApiRestaurantTable>('/admin/tables', payload)
        setSuccess('Mesa criada com sucesso.')
      }

      setTableForm(null)
      setEditingTable(null)
      await reload()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Não foi possível salvar a mesa.')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteTable(table: ApiRestaurantTable) {
    if (!window.confirm(`Inativar ${table.name}?`)) return

    setSuccess(null)
    setActionError(null)

    try {
      await apiDelete(`/admin/tables/${table.id}`)
      setSuccess(`${table.name} foi inativada.`)
      await reload()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Não foi possível inativar a mesa.')
    }
  }

  async function regenerateTableToken(table: ApiRestaurantTable) {
    setSuccess(null)
    setActionError(null)

    try {
      await apiPost<ApiRestaurantTable>(`/admin/tables/${table.id}/regenerate-token`)
      setSuccess(`Token da ${table.name} regenerado.`)
      await reload()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Não foi possível regenerar o token.')
    }
  }

  return (
    <section className="page-stack admin-page">
      <PageHeader
        eyebrow="Administração"
        title="Mesas"
        description="Gerencie tokens, status e consumo atual de cada mesa."
        actions={(
          <button className="primary-button" type="button" onClick={openNewTableForm}>
            <Plus size={18} />
            Nova mesa
          </button>
        )}
      />

      {!isLoading && !error ? <AdminTableSummary tables={tables} /> : null}
      {success ? <StateMessage title={success} tone="success" /> : null}
      {actionError ? <StateMessage title={actionError} tone="error" /> : null}

      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input placeholder="Buscar mesa" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <button className="secondary-button" type="button" onClick={() => void reload()}>
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        {isLoading ? <StateMessage title="Carregando mesas..." tone="loading" /> : null}
        {error ? <ApiStateMessage error={error} /> : null}
        {!isLoading && !error ? (
          <TableDataTable
            tables={filteredTables}
            onEdit={openEditTableForm}
            onDelete={(table) => void deleteTable(table)}
            onRegenerateToken={(table) => void regenerateTableToken(table)}
          />
        ) : null}
      </section>

      {tableForm ? (
        <AdminModal title={editingTable ? 'Editar mesa' : 'Nova mesa'} onClose={() => setTableForm(null)}>
          <form className="admin-form" onSubmit={(event) => void saveTable(event)}>
            <label>
              Nome
              <input value={tableForm.name} onChange={(event) => setTableForm((current) => current ? { ...current, name: event.target.value } : current)} required />
            </label>
            <label>
              Número
              <input type="number" min="1" value={tableForm.number} onChange={(event) => setTableForm((current) => current ? { ...current, number: event.target.value } : current)} required />
            </label>
            <label>
              Status
              <select value={tableForm.status} onChange={(event) => setTableForm((current) => current ? { ...current, status: event.target.value as TableStatus } : current)}>
                {tableStatusOptions.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="toggle-row toggle-row--compact">
              <Utensils size={20} />
              <span>
                <strong>Mesa ativa</strong>
                <small>Mesas inativas não aceitam pedidos pelo tablet.</small>
              </span>
              <input type="checkbox" checked={tableForm.is_active} onChange={(event) => setTableForm((current) => current ? { ...current, is_active: event.target.checked } : current)} />
            </label>
            <div className="admin-form__actions">
              <button className="secondary-button" type="button" onClick={() => setTableForm(null)}>Cancelar</button>
              <button className="primary-button" type="submit" disabled={isSaving}>
                <Save size={18} />
                {isSaving ? 'Salvando...' : 'Salvar mesa'}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </section>
  )
}

export function AdminCategoriesPage() {
  usePageTitle('Categorias')
  const { data, error, isLoading, reload } = useApiQuery(() => apiGet<PaginatedResponse<ApiCategory>>('/admin/categories'), [])
  const categories = data?.data ?? []
  const [search, setSearch] = useState('')
  const [editingCategory, setEditingCategory] = useState<ApiCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState<CategoryFormState | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const filteredCategories = categories.filter((category) => matchesSearch([
    category.name,
    category.description ?? '',
    category.is_active ? 'ativa' : 'inativa',
    String(category.sort_order),
  ], search))

  function openNewCategoryForm() {
    setEditingCategory(null)
    setCategoryForm({
      name: '',
      description: '',
      sort_order: String(categories.length + 1),
      is_active: true,
    })
    setSuccess(null)
    setActionError(null)
  }

  function openEditCategoryForm(category: ApiCategory) {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description ?? '',
      sort_order: String(category.sort_order),
      is_active: category.is_active,
    })
    setSuccess(null)
    setActionError(null)
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!categoryForm) return

    setIsSaving(true)
    setSuccess(null)
    setActionError(null)

    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim() || null,
      sort_order: Number(categoryForm.sort_order || 0),
      is_active: categoryForm.is_active,
    }

    try {
      if (editingCategory) {
        await apiPut<ApiCategory>(`/admin/categories/${editingCategory.id}`, payload)
        setSuccess('Categoria atualizada com sucesso.')
      } else {
        await apiPost<ApiCategory>('/admin/categories', payload)
        setSuccess('Categoria criada com sucesso.')
      }

      setCategoryForm(null)
      setEditingCategory(null)
      await reload()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Nao foi possivel salvar a categoria.')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteCategory(category: ApiCategory) {
    if (!window.confirm(`Inativar categoria ${category.name}?`)) return

    setSuccess(null)
    setActionError(null)

    try {
      await apiDelete(`/admin/categories/${category.id}`)
      setSuccess(`Categoria ${category.name} inativada.`)
      await reload()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Nao foi possivel inativar a categoria.')
    }
  }

  return (
    <section className="page-stack admin-page">
      <PageHeader
        eyebrow="Cardapio"
        title="Categorias"
        description="Organize as secoes que aparecem no cardapio digital da mesa."
        actions={(
          <button className="primary-button" type="button" onClick={openNewCategoryForm}>
            <Tags size={18} />
            Nova categoria
          </button>
        )}
      />

      {success ? <StateMessage title={success} tone="success" /> : null}
      {actionError ? <StateMessage title={actionError} tone="error" /> : null}

      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input placeholder="Buscar categoria" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <button className="secondary-button" type="button" onClick={() => void reload()}>
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        {isLoading ? <StateMessage title="Carregando categorias..." tone="loading" /> : null}
        {error ? <ApiStateMessage error={error} /> : null}
        {!isLoading && !error && filteredCategories.length === 0 ? <StateMessage title="Nenhuma categoria encontrada." /> : null}
        {!isLoading && !error && filteredCategories.length > 0 ? (
          <div className="data-table data-table--with-actions data-table--category-actions">
            <div className="data-table__head">
              <span>Categoria</span>
              <span>Descricao</span>
              <span>Status</span>
              <span>Acoes</span>
            </div>
            {filteredCategories.map((category) => (
              <div className="data-table__row" key={category.id}>
                <strong data-label="Categoria">{category.name}</strong>
                <span data-label="Descricao">{category.products_count ?? 0} produto{category.products_count === 1 ? '' : 's'} - {category.description ?? 'Sem descricao'}</span>
                <span data-label="Status">{category.is_active ? 'Ativa' : 'Inativa'} - ordem {category.sort_order}</span>
                <RowActions
                  onEdit={() => openEditCategoryForm(category)}
                  onDelete={() => void deleteCategory(category)}
                />
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {categoryForm ? (
        <AdminModal title={editingCategory ? 'Editar categoria' : 'Nova categoria'} onClose={() => setCategoryForm(null)}>
          <form className="admin-form" onSubmit={(event) => void saveCategory(event)}>
            <label>
              Nome
              <input value={categoryForm.name} onChange={(event) => setCategoryForm((current) => current ? { ...current, name: event.target.value } : current)} required />
            </label>
            <label>
              Descricao
              <textarea value={categoryForm.description} onChange={(event) => setCategoryForm((current) => current ? { ...current, description: event.target.value } : current)} rows={3} />
            </label>
            <label>
              Ordem
              <input type="number" min="0" value={categoryForm.sort_order} onChange={(event) => setCategoryForm((current) => current ? { ...current, sort_order: event.target.value } : current)} />
            </label>
            <label className="toggle-row toggle-row--compact">
              <Tags size={20} />
              <span>
                <strong>Categoria ativa</strong>
                <small>Categorias inativas deixam de aparecer no cardapio.</small>
              </span>
              <input type="checkbox" checked={categoryForm.is_active} onChange={(event) => setCategoryForm((current) => current ? { ...current, is_active: event.target.checked } : current)} />
            </label>
            <div className="admin-form__actions">
              <button className="secondary-button" type="button" onClick={() => setCategoryForm(null)}>Cancelar</button>
              <button className="primary-button" type="submit" disabled={isSaving}>
                <Save size={18} />
                {isSaving ? 'Salvando...' : 'Salvar categoria'}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </section>
  )
}

export function LegacyAdminCategoriesPage() {
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
  const productsQuery = useApiQuery(() => apiGet<PaginatedResponse<ApiProduct>>('/admin/products'), [])
  const categoriesQuery = useApiQuery(() => apiGet<PaginatedResponse<ApiCategory>>('/admin/categories'), [])
  const products = productsQuery.data?.data ?? []
  const categories = categoriesQuery.data?.data ?? []
  const activeProducts = products.filter((product) => product.is_active)
  const visibleProducts = activeProducts.filter((product) => product.is_available)
  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null)
  const [productForm, setProductForm] = useState<ProductFormState | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const filteredProducts = products.filter((product) => matchesSearch([
    product.name,
    product.description ?? '',
    product.category?.name ?? '',
    product.is_available ? 'disponivel' : 'pausado',
  ], search))

  function emptyProductForm(): ProductFormState {
    return {
      category_id: String(categories[0]?.id ?? ''),
      name: '',
      description: '',
      price: '',
      image_path: '',
      is_available: true,
      is_active: true,
      sort_order: String(products.length + 1),
    }
  }

  function openNewProductForm() {
    setEditingProduct(null)
    setProductForm(emptyProductForm())
    setSuccess(null)
    setActionError(null)
  }

  function openEditProductForm(product: ApiProduct) {
    setEditingProduct(product)
    setProductForm({
      category_id: String(product.category_id),
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      image_path: product.image_path ?? '',
      is_available: product.is_available,
      is_active: product.is_active,
      sort_order: String(product.sort_order),
    })
    setSuccess(null)
    setActionError(null)
  }

  async function reloadProducts() {
    await productsQuery.reload()
    await categoriesQuery.reload()
  }

  async function toggleProduct(product: ApiProduct) {
    setUpdatingProductId(product.id)
    setSuccess(null)
    setActionError(null)

    try {
      await apiPost<ApiProduct>(`/admin/products/${product.id}/toggle-availability`)
      setSuccess(product.is_available ? 'Produto pausado.' : 'Produto ativado para venda.')
      await productsQuery.reload()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Nao foi possivel alterar a disponibilidade.')
    } finally {
      setUpdatingProductId(null)
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!productForm) return

    setIsSaving(true)
    setSuccess(null)
    setActionError(null)

    const payload = {
      category_id: Number(productForm.category_id),
      name: productForm.name.trim(),
      description: productForm.description.trim() || null,
      price: Number(productForm.price),
      image_path: productForm.image_path.trim() || null,
      is_available: productForm.is_available,
      is_active: productForm.is_active,
      sort_order: Number(productForm.sort_order || 0),
    }

    try {
      if (editingProduct) {
        await apiPut<ApiProduct>(`/admin/products/${editingProduct.id}`, payload)
        setSuccess('Produto atualizado com sucesso.')
      } else {
        await apiPost<ApiProduct>('/admin/products', payload)
        setSuccess('Produto criado com sucesso.')
      }

      setProductForm(null)
      setEditingProduct(null)
      await productsQuery.reload()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Nao foi possivel salvar o produto.')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteProduct(product: ApiProduct) {
    if (!window.confirm(`Inativar produto ${product.name}?`)) return

    setSuccess(null)
    setActionError(null)

    try {
      await apiDelete(`/admin/products/${product.id}`)
      setSuccess(`Produto ${product.name} inativado.`)
      await productsQuery.reload()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Nao foi possivel inativar o produto.')
    }
  }

  return (
    <section className="page-stack admin-page">
      <PageHeader
        eyebrow="Cardapio"
        title="Produtos"
        description="Itens vendidos no tablet, com preco, categoria e disponibilidade."
        actions={(
          <button className="primary-button" type="button" onClick={openNewProductForm} disabled={categories.length === 0}>
            <Plus size={18} />
            Novo produto
          </button>
        )}
      />

      {success ? <StateMessage title={success} tone="success" /> : null}
      {actionError ? <StateMessage title={actionError} tone="error" /> : null}
      {productsQuery.isLoading ? <StateMessage title="Carregando produtos..." tone="loading" /> : null}
      {productsQuery.error ? <ApiStateMessage error={productsQuery.error} /> : null}
      {categoriesQuery.error ? <ApiStateMessage error={categoriesQuery.error} /> : null}
      {!productsQuery.isLoading && !productsQuery.error && products.length === 0 ? <StateMessage title="Nenhum produto cadastrado." /> : null}
      {!categoriesQuery.isLoading && categories.length === 0 ? <StateMessage title="Cadastre uma categoria antes de criar produtos." /> : null}

      {!productsQuery.isLoading && !productsQuery.error ? (
        <div className="admin-ops-strip">
          <MetricCard icon={PackageCheck} label="Ativos" value={String(activeProducts.length)} detail="no cadastro" tone="info" />
          <MetricCard icon={Utensils} label="Visiveis no tablet" value={String(visibleProducts.length)} detail="vendendo agora" tone="success" />
          <MetricCard icon={Tags} label="Pausados" value={String(activeProducts.length - visibleProducts.length)} detail="fora do cardapio" tone="warning" />
        </div>
      ) : null}

      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input placeholder="Buscar produto" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <button className="secondary-button" type="button" onClick={() => void reloadProducts()}>
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-card__media">
                <span>{(product.category?.name ?? 'Produto').slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="product-card__body">
                <div className="product-card__topline">
                  <span>{product.category?.name ?? 'Sem categoria'}</span>
                  <StatusBadge label={product.is_available ? 'Disponivel' : 'Pausado'} tone={product.is_available ? 'success' : 'danger'} />
                </div>
                <h2>{product.name}</h2>
                <p>{product.description ?? 'Sem descricao cadastrada.'}</p>
                <div className="product-card__footer">
                  <strong>{formatCurrency(product.price)}</strong>
                  <small>{product.is_available ? 'Visivel no tablet' : 'Oculto no cardapio'}</small>
                </div>
                <div className="product-card__actions">
                  <button className="secondary-button" type="button" disabled={updatingProductId === product.id} onClick={() => void toggleProduct(product)}>
                    {product.is_available ? 'Pausar venda' : 'Ativar venda'}
                  </button>
                  <button className="secondary-button" type="button" onClick={() => openEditProductForm(product)}>
                    <Pencil size={17} />
                    Editar
                  </button>
                  <button className="secondary-button secondary-button--danger" type="button" onClick={() => void deleteProduct(product)}>
                    <Trash2 size={17} />
                    Inativar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {productForm ? (
        <AdminModal title={editingProduct ? 'Editar produto' : 'Novo produto'} onClose={() => setProductForm(null)}>
          <form className="admin-form" onSubmit={(event) => void saveProduct(event)}>
            <label>
              Categoria
              <select value={productForm.category_id} onChange={(event) => setProductForm((current) => current ? { ...current, category_id: event.target.value } : current)} required>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              Nome
              <input value={productForm.name} onChange={(event) => setProductForm((current) => current ? { ...current, name: event.target.value } : current)} required />
            </label>
            <label>
              Descricao
              <textarea value={productForm.description} onChange={(event) => setProductForm((current) => current ? { ...current, description: event.target.value } : current)} rows={3} />
            </label>
            <label>
              Preco
              <input type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductForm((current) => current ? { ...current, price: event.target.value } : current)} required />
            </label>
            <label>
              Caminho da imagem
              <input value={productForm.image_path} onChange={(event) => setProductForm((current) => current ? { ...current, image_path: event.target.value } : current)} placeholder="products/foto.jpg" />
            </label>
            <label>
              Ordem
              <input type="number" min="0" value={productForm.sort_order} onChange={(event) => setProductForm((current) => current ? { ...current, sort_order: event.target.value } : current)} />
            </label>
            <label className="toggle-row toggle-row--compact">
              <PackageCheck size={20} />
              <span>
                <strong>Disponivel para venda</strong>
                <small>Controla a visibilidade imediata no tablet.</small>
              </span>
              <input type="checkbox" checked={productForm.is_available} onChange={(event) => setProductForm((current) => current ? { ...current, is_available: event.target.checked } : current)} />
            </label>
            <label className="toggle-row toggle-row--compact">
              <ShieldCheck size={20} />
              <span>
                <strong>Produto ativo</strong>
                <small>Produtos inativos ficam fora da operacao.</small>
              </span>
              <input type="checkbox" checked={productForm.is_active} onChange={(event) => setProductForm((current) => current ? { ...current, is_active: event.target.checked } : current)} />
            </label>
            <div className="admin-form__actions">
              <button className="secondary-button" type="button" onClick={() => setProductForm(null)}>Cancelar</button>
              <button className="primary-button" type="submit" disabled={isSaving}>
                <Save size={18} />
                {isSaving ? 'Salvando...' : 'Salvar produto'}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </section>
  )
}

export function LegacyAdminProductsPage() {
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
      description="Contas operacionais para administração, caixa e cozinha. O backend atual expõe apenas listagem de usuários."
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
  const daily = useApiQuery(() => apiGet<{ net_total: number; payments_count: number; amount_paid_total?: number; change_total?: number }>('/admin/reports/daily-sales'), [])
  const products = useApiQuery(() => apiGet<Array<{ product_name: string; quantity_sold: string; total_sold: string }>>('/admin/reports/products-ranking'), [])
  const tables = useApiQuery(() => apiGet<Array<{ table?: ApiRestaurantTable; sessions_count: number; total_consumed: string }>>('/admin/reports/tables-usage'), [])
  const isLoading = daily.isLoading || products.isLoading || tables.isLoading
  const error = daily.error ?? products.error ?? tables.error
  const reportRows = [
    ['Vendas do dia', formatCurrency(daily.data?.net_total ?? 0), `${daily.data?.payments_count ?? 0} pagamentos`],
    ['Valor recebido', formatCurrency(daily.data?.amount_paid_total ?? daily.data?.net_total ?? 0), `${formatCurrency(daily.data?.change_total ?? 0)} em troco`],
    ['Produto mais vendido', products.data?.[0]?.product_name ?? 'Sem vendas', `${products.data?.[0]?.quantity_sold ?? 0} unidades`],
    ['Mesa mais usada', tables.data?.[0]?.table?.name ?? 'Sem sessões', `${tables.data?.[0]?.sessions_count ?? 0} sessões`],
  ]

  return (
    <AdminListPage
      title="Relatórios simples"
      eyebrow="Indicadores"
      description="Resumo financeiro e operacional para conferência rápida."
      action="Exportar"
      icon={Download}
      onAction={() => exportCsv('kipedido-relatorios.csv', ['Indicador', 'Valor', 'Observação'], reportRows)}
      isLoading={isLoading}
      error={error}
      emptyTitle="Nenhum dado de relatório encontrado."
      rows={reportRows}
      columns={['Indicador', 'Valor', 'Observação']}
    />
  )
}

export function AdminLogsPage() {
  usePageTitle('Logs')
  const { data, error, isLoading } = useApiQuery(() => apiGet<PaginatedResponse<ApiActionLog>>('/admin/logs'), [])
  const [search, setSearch] = useState('')
  const logs = (data?.data ?? []).filter((log) => matchesSearch([
    log.action,
    log.description,
    formatDateTime(log.created_at),
  ], search))

  return (
    <section className="page-stack admin-page">
      <PageHeader
        eyebrow="Auditoria"
        title="Logs de ações"
        description="Registro dos principais eventos operacionais do sistema."
      />

      <section className="panel">
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input placeholder="Filtrar logs" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        </div>

        {isLoading ? <StateMessage title="Carregando logs de ações..." tone="loading" /> : null}
        {error ? <ApiStateMessage error={error} /> : null}
        {!isLoading && !error && logs.length === 0 ? <StateMessage title="Nenhum log encontrado." /> : null}
        {!isLoading && !error && logs.length > 0 ? (
          <div className="data-table data-table--three">
            <div className="data-table__head">
              <span>Ação</span>
              <span>Evento</span>
              <span>Horário</span>
            </div>
            {logs.map((log) => (
              <div className="data-table__row" key={log.id}>
                <strong data-label="Ação">{log.action}</strong>
                <span data-label="Evento">{log.description}</span>
                <span data-label="Horário">{formatDateTime(log.created_at)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </section>
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

type TableDataTableProps = {
  tables: ApiRestaurantTable[]
  onEdit: (table: ApiRestaurantTable) => void
  onDelete: (table: ApiRestaurantTable) => void
  onRegenerateToken: (table: ApiRestaurantTable) => void
}

function TableDataTable({ tables, onEdit, onDelete, onRegenerateToken }: TableDataTableProps) {
  if (tables.length === 0) {
    return <StateMessage title="Nenhuma mesa cadastrada." />
  }

  return (
    <div className="data-table data-table--with-actions data-table--table-actions">
      <div className="data-table__head">
        <span>Mesa</span>
        <span>Status</span>
        <span>Consumo</span>
        <span>Token</span>
        <span>Ações</span>
      </div>
      {tables.map((table) => (
        <div className="data-table__row" key={table.id}>
          <strong data-label="Mesa">{table.name}</strong>
          <span data-label="Status"><StatusBadge label={tableStatusLabel[table.status]} tone={tableStatusTone[table.status]} /></span>
          <span data-label="Consumo">{formatCurrency(table.active_session?.total_amount)}</span>
          <code data-label="Token">{table.token}</code>
          <RowActions
            onEdit={() => onEdit(table)}
            onDelete={() => onDelete(table)}
            extraActions={(
              <button className="icon-button" type="button" title="Regenerar token" onClick={() => onRegenerateToken(table)}>
                <KeyRound size={17} />
              </button>
            )}
          />
        </div>
      ))}
    </div>
  )
}

type RowActionsProps = {
  onEdit: () => void
  onDelete: () => void
  extraActions?: ReactNode
}

function RowActions({ onEdit, onDelete, extraActions }: RowActionsProps) {
  return (
    <div className="row-actions" data-label="Ações">
      {extraActions}
      <button className="icon-button" type="button" title="Editar" onClick={onEdit}>
        <Pencil size={17} />
      </button>
      <button className="icon-button icon-button--danger" type="button" title="Inativar" onClick={onDelete}>
        <Trash2 size={17} />
      </button>
    </div>
  )
}

function AdminModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
      <div className="admin-modal__backdrop" onClick={onClose} />
      <section className="admin-modal__panel">
        <header className="admin-modal__header">
          <h2 id="admin-modal-title">{title}</h2>
          <button className="icon-button" type="button" title="Fechar" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

function matchesSearch(values: Array<string | number | null | undefined>, search: string) {
  const normalizedSearch = search.trim().toLowerCase()

  if (!normalizedSearch) return true

  return values.some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch))
}

function exportCsv(fileName: string, headers: string[], rows: string[][]) {
  const escapeValue = (value: string) => `"${value.replaceAll('"', '""')}"`
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeValue).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

type AdminListPageProps = {
  title: string
  eyebrow: string
  description: string
  action?: string
  onAction?: () => void
  rows: string[][]
  columns?: [string, string, string]
  isLoading: boolean
  error: Error | null
  emptyTitle: string
  icon?: typeof Plus
}

function AdminListPage({ title, eyebrow, description, action, onAction, rows, columns = ['Nome', 'Detalhe', 'Status'], isLoading, error, emptyTitle, icon: Icon = Plus }: AdminListPageProps) {
  return (
    <section className="page-stack admin-page">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={action ? (
          <button className="primary-button" type="button" onClick={onAction}>
            <Icon size={18} />
            {action}
          </button>
        ) : undefined}
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
