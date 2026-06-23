import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { TabletShell } from '../components/layout/TabletShell'
import { LoginPage } from '../modules/auth/LoginPage'
import {
  AdminCategoriesPage,
  AdminDashboard,
  AdminLogsPage,
  AdminProductsPage,
  AdminReportsPage,
  AdminSettingsPage,
  AdminTablesPage,
  AdminUsersPage,
} from '../modules/admin/AdminPages'
import {
  TabletBillPage,
  TabletCartPage,
  TabletHomePage,
  TabletLinkPage,
  TabletMenuPage,
  TabletOrdersPage,
} from '../modules/tablet/TabletPages'
import { KitchenDashboard, KitchenOrdersPage } from '../modules/kitchen/KitchenPages'
import { CashierDashboard, CashierTableDetailPage, CashierTablesPage } from '../modules/cashier/CashierPages'
import { SalesPage } from '../modules/marketing/SalesPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SalesPage />,
  },
  {
    path: '/admin/login',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: <AppShell area="admin" />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'tables', element: <AdminTablesPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: 'reports', element: <AdminReportsPage /> },
      { path: 'logs', element: <AdminLogsPage /> },
    ],
  },
  {
    path: '/tablet',
    element: <TabletLinkPage />,
  },
  {
    path: '/tablet/:token',
    element: <TabletShell />,
    children: [
      { index: true, element: <TabletHomePage /> },
      { path: 'cardapio', element: <TabletMenuPage /> },
      { path: 'carrinho', element: <TabletCartPage /> },
      { path: 'pedidos', element: <TabletOrdersPage /> },
      { path: 'conta', element: <TabletBillPage /> },
    ],
  },
  {
    path: '/kitchen',
    element: <AppShell area="kitchen" />,
    children: [
      { index: true, element: <KitchenDashboard /> },
      { path: 'orders', element: <KitchenOrdersPage /> },
    ],
  },
  {
    path: '/cashier',
    element: <AppShell area="cashier" />,
    children: [
      { index: true, element: <CashierDashboard /> },
      { path: 'tables', element: <CashierTablesPage /> },
      { path: 'tables/:id', element: <CashierTableDetailPage /> },
    ],
  },
])
