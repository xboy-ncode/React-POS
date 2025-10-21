// pages/Movements.tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Search,
    Eye,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Receipt,
    TrendingUp,
    Users,
    DollarSign,
} from 'lucide-react'
import { useSales } from '@/hooks/useSales'
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog'
import { MonthlyReportDialog } from '@/components/movements/MonthlyReportDialog'

export default function Movements() {
    const { t } = useTranslation()
    const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)
    const [showDetails, setShowDetails] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')

    const {
        sales,
        pagination,
        loading,
        error,
        updateFilters,
        nextPage,
        prevPage,
        goToPage
    } = useSales({ limit: 10 })

    const handleSearch = () => {
        updateFilters({
            cliente: searchQuery,
            fecha_desde: dateFrom,
            fecha_hasta: dateTo,
            page: 1
        })
    }

    const handleClearFilters = () => {
        setSearchQuery('')
        setDateFrom('')
        setDateTo('')
        updateFilters({
            cliente: '',
            fecha_desde: '',
            fecha_hasta: '',
            page: 1
        })
    }

    const handleViewDetails = (saleId: number) => {
        setSelectedSaleId(saleId)
        setShowDetails(true)
    }

    const getPaymentMethodBadge = (method: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'outline', label: string }> = {
            'EFECTIVO': { variant: 'default', label: t('sales.payment.cash', 'Efectivo') },
            'TARJETA': { variant: 'secondary', label: t('sales.payment.card', 'Tarjeta') },
            'TRANSFERENCIA': { variant: 'outline', label: t('sales.payment.transfer', 'Transferencia') }
        }
        const config = variants[method] || { variant: 'outline', label: method }
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    // Calculate summary stats
    const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total), 0)
    const averageSale = sales.length > 0 ? totalSales / sales.length : 0
    const uniqueCustomers = new Set(sales.filter(s => s.id_cliente).map(s => s.id_cliente)).size

    if (loading && sales.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p>{t('sales.loading', 'Cargando ventas...')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('sales.title', 'Movimientos')}</h1>
                <p className="text-muted-foreground">
                    {t('sales.subtitle', 'Historial de ventas y transacciones')}
                </p>
            </div>

            {/* Botón de reporte mensual */}
            <MonthlyReportDialog />
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('sales.total_sales', 'Total Ventas')}
                        </CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pagination.total}</div>
                        <p className="text-xs text-muted-foreground">
                            {t('sales.transactions', 'Transacciones registradas')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('sales.total_amount', 'Monto Total')}
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">S/ {totalSales.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            {t('sales.in_period', 'En el período')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('sales.average_sale', 'Venta Promedio')}
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">S/ {averageSale.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            {t('sales.per_transaction', 'Por transacción')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t('sales.unique_customers', 'Clientes Únicos')}
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniqueCustomers}</div>
                        <p className="text-xs text-muted-foreground">
                            {t('sales.customers_served', 'Clientes atendidos')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t('app.filters', 'Filtros')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('sales.search_customer', 'Buscar Cliente')}</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('sales.search_placeholder', 'DNI, nombre...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('sales.date_from', 'Desde')}</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('sales.date_to', 'Hasta')}</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex items-end gap-2">
                            <Button onClick={handleSearch} className="flex-1">
                                {t('app.search', 'Buscar')}
                            </Button>
                            <Button variant="outline" onClick={handleClearFilters}>
                                {t('app.clear', 'Limpiar')}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sales Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t('sales.list', 'Lista de Ventas')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('sales.sale_id', 'ID')}</TableHead>
                                    <TableHead>{t('sales.date', 'Fecha')}</TableHead>
                                    <TableHead>{t('sales.customer', 'Cliente')}</TableHead>
                                    <TableHead>{t('sales.seller', 'Vendedor')}</TableHead>
                                    <TableHead>{t('sales.payment_method', 'Método Pago')}</TableHead>
                                    <TableHead className="text-right">{t('app.total', 'Total')}</TableHead>
                                    <TableHead className="text-right">{t('app.actions', 'Acciones')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading && sales.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            {t('sales.no_sales', 'No se encontraron ventas')}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading && sales.map((sale) => (
                                    <TableRow key={sale.id_venta}>
                                        <TableCell className="font-medium">#{sale.id_venta}</TableCell>
                                        <TableCell>
                                            {format(new Date(sale.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            {sale.cliente_nombre ? (
                                                <div>
                                                    <div className="font-medium">{sale.cliente_nombre}</div>
                                                    <div className="text-sm text-muted-foreground">{sale.cliente_dni}</div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">
                                                    {t('sales.no_customer', 'Sin cliente')}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>{sale.vendedor}</TableCell>
                                        <TableCell>{getPaymentMethodBadge(sale.metodo_pago)}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {sale.moneda} {parseFloat(sale.total).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewDetails(sale.id_venta)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                {t('app.view', 'Ver')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                {t('sales.showing', 'Mostrando')} {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} {t('sales.of', 'de')} {pagination.total}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={prevPage}
                                    disabled={!pagination.hasPrev}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {/* Page numbers */}
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                        let pageNum: number
                                        if (pagination.totalPages <= 5) {
                                            pageNum = i + 1
                                        } else if (pagination.page <= 3) {
                                            pageNum = i + 1
                                        } else if (pagination.page >= pagination.totalPages - 2) {
                                            pageNum = pagination.totalPages - 4 + i
                                        } else {
                                            pageNum = pagination.page - 2 + i
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={pagination.page === pageNum ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => goToPage(pageNum)}
                                                className="w-9"
                                            >
                                                {pageNum}
                                            </Button>
                                        )
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={nextPage}
                                    disabled={!pagination.hasNext}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sale Details Dialog */}
            <SaleDetailsDialog
                saleId={selectedSaleId}
                open={showDetails}
                onOpenChange={setShowDetails}
            />
        </div>
    )
}