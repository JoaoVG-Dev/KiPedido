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
