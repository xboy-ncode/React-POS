import { useTranslation } from 'react-i18next'
import { CreditCardFilled, InboxOutlined, TeamOutlined } from '@ant-design/icons'
import { Card } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Loader2 } from 'lucide-react'

import StatCard from '../components/dashboard/StatCard'
import InventoryStatus from '../components/dashboard/InventoryStatus'
import TopProducts from '../components/dashboard/TopProducts'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import SalesTrendChart from '../components/dashboard/SalesTrendChart'
import WeeklyPerformance from '../components/dashboard/WeeklyPerformance'

import {
  useDashboardStats,
  useInventoryStatus,
  useTopProducts,
  useRecentTransactions,
  useSalesTrend,
  useWeeklyPerformance
} from '../hooks/useDashboardData'

import { useCan } from '../lib/permissions' // ✅ Importamos helper de permisos
import QuickActions from '@/components/dashboard/QuickActions'

export default function Dashboard() {
  const { t } = useTranslation()

  // ✅ Permisos según el rol
  const canSales = useCan(['sales:read'])
  const canInventory = useCan(['inventory:read'])
  const canCustomers = useCan(['customers:read'])
  const canMovements = useCan(['movements:read'])

  const { stats, loading: statsLoading, error: statsError } = useDashboardStats()
  const { loading: inventoryLoading } = useInventoryStatus()
  const { data: topProducts, loading: productsLoading } = useTopProducts()
  const { data: transactions, loading: transactionsLoading } = useRecentTransactions()
  const { data: salesTrend, loading: trendLoading } = useSalesTrend()
  const { data: weeklyPerf, loading: weeklyLoading } = useWeeklyPerformance()

  if (statsError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>{statsError}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">

    {/* Quick Actions */}
      <QuickActions />

      {/* 🔹 Top Stats */}
      {(canSales || canInventory || canCustomers) && (
        <Card className="p-4">
          {statsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              {canSales && (
                <StatCard
                  title={`${t('app.sales')} — Today`}
                  value={`S/${stats.ventasHoy.toFixed(2)}`}
                  icon={CreditCardFilled}
                  color="blue"
                  change={2}
                />
              )}
              {canInventory && (
                <StatCard
                  title={t('app.inventory')}
                  value={stats.totalProductos}
                  icon={InboxOutlined}
                  color="green"
                  change={5}
                />
              )}
              {canCustomers && (
                <StatCard
                  title={t('app.customers')}
                  value={stats.totalClientes}
                  icon={TeamOutlined}
                  color="purple"
                  change={8}
                />
              )}
            </div>
          )}
        </Card>
      )}

      {/* 🔹 Charts Section */}
      {canSales && (
        <Card className="p-4">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {trendLoading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <SalesTrendChart data={salesTrend} />
            )}

            {weeklyLoading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <WeeklyPerformance data={weeklyPerf} />
            )}
          </div>
        </Card>
      )}

      {/* 🔹 Details Section */}
      {(canInventory || canSales || canCustomers) && (
        <Card className="p-4">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {canInventory && (
              inventoryLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <InventoryStatus />
              )
            )}

            {canSales && (
              productsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <TopProducts data={topProducts} />
              )
            )}

            {canSales && (
              transactionsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <RecentTransactions data={transactions} />
              )
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
