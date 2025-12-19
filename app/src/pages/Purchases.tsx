// pages/Purchases.tsx
import { useState, useEffect } from 'react'
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
    ShoppingCart,
    DollarSign,
    Plus,
} from 'lucide-react'
import { CreatePurchaseDialog } from '@/components/purchases/CreatePurchasesDialog'
import { PurchaseDetailsDialog } from '@/components/purchases/PurchaseDetailsDialog'

import { comprasService } from '@/lib/api-client'


export default function Purchases() {
    const { t } = useTranslation()
    const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null)
    const [showDetails, setShowDetails] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    type Purchase = {
        id_compra: number
        fecha: string
        proveedor_nombre: string
        proveedor_ruc?: string
        metodo_pago: string
        moneda: string
        total: string
    }

    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
    })

    useEffect(() => {
        fetchPurchases()
    }, [])

    type PurchasesFilters = {
        page?: number
        proveedor?: string
        fecha_desde?: string
        fecha_hasta?: string
    }

   const fetchPurchases = async (filters: PurchasesFilters = {}) => {
    setLoading(true)
    try {
        const data = await comprasService.getAll({
            page: filters.page || pagination.page,
            proveedor: filters.proveedor,
            fecha_desde: filters.fecha_desde,
            fecha_hasta: filters.fecha_hasta
        })
        setPurchases(data.compras || [])
        setPagination(data.pagination)
    } catch (error) {
        console.error('Error fetching purchases:', error)
    } finally {
        setLoading(false)
    }
}

    const handleSearch = () => {
        fetchPurchases({
            proveedor: searchQuery,
            fecha_desde: dateFrom,
            fecha_hasta: dateTo,
            page: 1
        })
    }

    const handleClearFilters = () => {
        setSearchQuery('')
        setDateFrom('')
        setDateTo('')
        fetchPurchases({ page: 1 })
    }

    const getPaymentMethodBadge = (method: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'outline', label: string }> = {
            'EFECTIVO': { variant: 'default', label: 'Efectivo' },
            'TARJETA': { variant: 'secondary', label: 'Tarjeta' },
            'TRANSFERENCIA': { variant: 'outline', label: 'Transferencia' }
        }
        const config = variants[method] || { variant: 'outline', label: method }
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const totalAmount = purchases.reduce((sum, p) => sum + parseFloat(p.total || '0'), 0)
    const averagePurchase = purchases.length > 0 ? totalAmount / purchases.length : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
                    <p className="text-muted-foreground">
                        Gestión de compras a proveedores
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Compra
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Compras
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pagination.total}</div>
                        <p className="text-xs text-muted-foreground">
                            Compras registradas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Monto Total
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">S/ {totalAmount.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            En compras
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Compra Promedio
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">S/ {averagePurchase.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Por transacción
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Buscar Proveedor</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="RUC, razón social..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Desde</label>
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
                            <label className="text-sm font-medium">Hasta</label>
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
                                Buscar
                            </Button>
                            <Button variant="outline" onClick={handleClearFilters}>
                                Limpiar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Purchases Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Lista de Compras</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Proveedor</TableHead>
                                    <TableHead>Método Pago</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading && purchases.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No se encontraron compras
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading && purchases.map((purchase) => (
                                    <TableRow key={purchase.id_compra}>
                                        <TableCell className="font-medium">#{purchase.id_compra}</TableCell>
                                        <TableCell>
                                            {format(new Date(purchase.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{purchase.proveedor_nombre}</div>
                                                <div className="text-sm text-muted-foreground">{purchase.proveedor_ruc}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getPaymentMethodBadge(purchase.metodo_pago)}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {purchase.moneda} {parseFloat(purchase.total).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedPurchaseId(purchase.id_compra)
                                                    setShowDetails(true)
                                                }}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Ver
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
                                Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchPurchases({ page: pagination.page - 1 })}
                                    disabled={!pagination.hasPrev}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchPurchases({ page: pagination.page + 1 })}
                                    disabled={!pagination.hasNext}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <CreatePurchaseDialog
                open={showCreate}
                onOpenChange={setShowCreate}
                onSuccess={() => {
                    setShowCreate(false)
                    fetchPurchases()
                }}
            />

            <PurchaseDetailsDialog
                purchaseId={selectedPurchaseId}
                open={showDetails}
                onOpenChange={setShowDetails}
            />
        </div>
    )
}