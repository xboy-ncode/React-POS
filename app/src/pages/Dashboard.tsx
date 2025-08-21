import { useTranslation } from 'react-i18next'

// ✅ import the reusable components
import StatCard from '../components/dashboard/StatCard'
import InventoryStatus from '../components/dashboard/InventoryStatus'
import TopProducts from '../components/dashboard/TopProducts'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import SalesTrendChart from '../components/dashboard/SalesTrendChart'
import WeeklyPerformance from '../components/dashboard/WeeklyPerformance'
import QuickActions from '../components/dashboard/QuickActions'
import { CreditCardFilled, InboxOutlined, TeamOutlined } from '@ant-design/icons'


export default function Dashboard() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {/* 🔹 Top Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <StatCard
          title={`${t('app.sales')} — Today`}
          value="$2,340"
          icon={CreditCardFilled}
          color="blue" change={0}        />
        <StatCard
          title={t('app.inventory')}
          value="1,284"
          icon={InboxOutlined}
          color="green" change={0}        />
        <StatCard
          title={t('app.customers')}
          value="642"
          icon={TeamOutlined}
          color="purple" change={0}        />
      </div>

      {/* 🔹 Charts Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <SalesTrendChart data={[]} />
        <WeeklyPerformance />
      </div>

      {/* 🔹 Details Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <InventoryStatus />
        <TopProducts />
        <RecentTransactions />
      </div>

      {/* 🔹 Quick Actions */}
      <QuickActions />
    </div>
  )
}
