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
// import QuickActions from '../components/dashboard/QuickActions'

import {
  useDashboardStats,
  useInventoryStatus,
  useTopProducts,
  useRecentTransactions,
  useSalesTrend,
  useWeeklyPerformance
} from '../hooks/useDashboardData'

export default function Dashboard() {
  const { t } = useTranslation()

  const { stats, loading: statsLoading, error: statsError } = useDashboardStats()
  const { data: inventoryData, loading: inventoryLoading } = useInventoryStatus()
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
      {/* 🔹 Top Stats */}
      <Card className="p-4">
        {statsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <StatCard
              title={`${t('app.sales')} — Today`}
              value={`$${stats.ventasHoy.toFixed(2)}`}
              icon={CreditCardFilled}
              color="blue"
              change={2}
            />
            <StatCard
              title={t('app.inventory')}
              value={stats.totalProductos}
              icon={InboxOutlined}
              color="green"
              change={5}
            />
            <StatCard
              title={t('app.customers')}
              value={stats.totalClientes}
              icon={TeamOutlined}
              color="purple"
              change={8}
            />
          </div>
        )}
      </Card>

      {/* 🔹 Quick Actions */}
      {/* <Card className="p-4">
        <QuickActions />
      </Card> */}

      {/* 🔹 Charts Section */}
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

      {/* 🔹 Details Section */}
      <Card className="p-4">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {inventoryLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <InventoryStatus/>
          )}

          {productsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <TopProducts data={topProducts} />
          )}

          {transactionsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <RecentTransactions data={transactions} />
          )}
        </div>
      </Card>
    </div>
  )
}