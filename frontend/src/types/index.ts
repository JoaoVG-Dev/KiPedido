import type { LucideIcon } from 'lucide-react'

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export type TableStatus = 'available' | 'occupied' | 'waiting_payment' | 'closed' | 'inactive'

export type TableSummary = {
  id: number
  name: string
  number: number
  status: TableStatus
  total: number
  openedAt?: string
}

export type ProductSummary = {
  id: number
  name: string
  category: string
  description: string
  price: number
  isAvailable: boolean
}

export type KitchenOrder = {
  id: number
  code: string
  table: string
  status: 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  sentAt: string
  items: Array<{
    name: string
    quantity: number
    notes?: string
  }>
}

export type PaginatedResponse<T> = {
  data: T[]
  current_page: number
  last_page: number
  total: number
}

export type ApiUser = {
  id: number
  name: string
  email: string
  role: 'admin' | 'manager' | 'cashier' | 'kitchen'
  is_active: boolean
}

export type ApiTableSession = {
  id: number
  table_id: number
  opened_at: string
  closed_at?: string | null
  status: 'open' | 'waiting_payment' | 'paid' | 'cancelled'
  subtotal: string | number
  discount_amount: string | number
  service_fee_amount: string | number
  total_amount: string | number
  orders?: ApiOrder[]
  payments?: ApiPayment[]
}

export type ApiRestaurantTable = {
  id: number
  name: string
  number: number
  token: string
  token_regenerated_at?: string | null
  token_revoked_at?: string | null
  status: TableStatus
  is_active: boolean
  active_session?: ApiTableSession | null
}

export type ApiCategory = {
  id: number
  name: string
  description?: string | null
  sort_order: number
  is_active: boolean
  products_count?: number
  products?: ApiProduct[]
}

export type ApiProduct = {
  id: number
  category_id: number
  category?: ApiCategory
  name: string
  description?: string | null
  price: string | number
  image_path?: string | null
  is_available: boolean
  is_active: boolean
  sort_order: number
}

export type ApiOrderItem = {
  id: number
  order_id: number
  product_id: number | null
  product_name: string
  unit_price: string | number
  quantity: number
  notes?: string | null
  status: string
  total_price: string | number
}

export type ApiOrder = {
  id: number
  table_session_id: number
  table_id: number
  code: string
  status: KitchenOrder['status']
  notes?: string | null
  sent_at?: string | null
  delivered_at?: string | null
  cancelled_at?: string | null
  table?: ApiRestaurantTable
  items?: ApiOrderItem[]
}

export type ApiServiceCall = {
  id: number
  table_id: number
  table_session_id?: number | null
  type: 'call_waiter' | 'request_bill' | 'custom'
  status: 'pending' | 'resolved' | 'cancelled'
  message?: string | null
}

export type ApiPayment = {
  id: number
  table_session_id: number
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'mixed'
  total_amount: string | number
  amount_paid: string | number
  change_amount: string | number
  status: 'pending' | 'paid' | 'cancelled'
}

export type ApiActionLog = {
  id: number
  action: string
  description: string
  created_at: string
  user?: Pick<ApiUser, 'id' | 'name' | 'email' | 'role'> | null
  table?: Pick<ApiRestaurantTable, 'id' | 'name' | 'number' | 'status'> | null
}

export type ApiDashboard = {
  settings?: ApiRestaurantSettings | null
  metrics: {
    open_tables: number
    available_tables: number
    today_orders: number
    active_kitchen_orders: number
    pending_service_calls: number
    today_revenue: number
    categories_count: number
    products_count: number
  }
  tables: ApiRestaurantTable[]
  recent_logs: ApiActionLog[]
}

export type ApiRestaurantSettings = {
  restaurant_name: string
  logo_path?: string | null
  service_fee_percentage: string | number
  currency: string
  printer_enabled: boolean
  sound_alerts_enabled: boolean
}

export type TabletMenuResponse = {
  table: ApiRestaurantTable
  categories: ApiCategory[]
}

export type TabletSessionResponse = {
  table: ApiRestaurantTable
  session: ApiTableSession | null
  bill: TableBillResponse | null
}

export type TableBillResponse = {
  session: ApiTableSession
  subtotal: number
  discount_amount: number
  service_fee_percentage: number
  service_fee_amount: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  change_amount: number
}

export type TabletOrdersResponse = {
  orders: ApiOrder[]
}
