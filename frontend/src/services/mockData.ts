import type { KitchenOrder, ProductSummary, TableSummary } from '../types'

export const tables: TableSummary[] = [
  { id: 1, name: 'Mesa 01', number: 1, status: 'occupied', total: 156.4, openedAt: '12:18' },
  { id: 2, name: 'Mesa 02', number: 2, status: 'waiting_payment', total: 248.7, openedAt: '11:47' },
  { id: 3, name: 'Mesa 03', number: 3, status: 'available', total: 0 },
  { id: 4, name: 'Mesa 04', number: 4, status: 'occupied', total: 82.5, openedAt: '12:42' },
  { id: 5, name: 'Mesa 05', number: 5, status: 'closed', total: 0 },
  { id: 6, name: 'Mesa 06', number: 6, status: 'available', total: 0 },
]

export const products: ProductSummary[] = [
  {
    id: 1,
    name: 'Bolinho de queijo',
    category: 'Entradas',
    description: 'Porção com 8 unidades crocantes e molho da casa.',
    price: 28.9,
    isAvailable: true,
  },
  {
    id: 2,
    name: 'Filé ao molho madeira',
    category: 'Pratos principais',
    description: 'Arroz, fritas, legumes e molho reduzido.',
    price: 68,
    isAvailable: true,
  },
  {
    id: 3,
    name: 'Risoto de camarão',
    category: 'Pratos principais',
    description: 'Arroz arbóreo, camarões salteados e parmesão.',
    price: 74.9,
    isAvailable: true,
  },
  {
    id: 4,
    name: 'Pudim da casa',
    category: 'Sobremesas',
    description: 'Calda de caramelo e textura cremosa.',
    price: 18,
    isAvailable: false,
  },
]

export const kitchenOrders: KitchenOrder[] = [
  {
    id: 1,
    code: 'KP240612391',
    table: 'Mesa 01',
    status: 'received',
    sentAt: '12:39',
    items: [
      { name: 'Bolinho de queijo', quantity: 1, notes: 'Sem pimenta' },
      { name: 'Suco natural', quantity: 2 },
    ],
  },
  {
    id: 2,
    code: 'KP240612404',
    table: 'Mesa 04',
    status: 'preparing',
    sentAt: '12:40',
    items: [
      { name: 'Filé ao molho madeira', quantity: 2, notes: 'Um ponto menos' },
      { name: 'Batata rústica', quantity: 1 },
    ],
  },
  {
    id: 3,
    code: 'KP240612422',
    table: 'Mesa 02',
    status: 'ready',
    sentAt: '12:42',
    items: [{ name: 'Brownie com sorvete', quantity: 2 }],
  },
]

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
