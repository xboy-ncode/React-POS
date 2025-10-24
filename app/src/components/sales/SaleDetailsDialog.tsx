// components/sales/SaleDetailsDialog.tsx
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    User,
    Calendar,
    CreditCard,
    Package,
    Loader2,
    Phone,
    Mail,
    MapPin,
    Receipt,
} from 'lucide-react'
import { useSaleDetails } from '@/hooks/useSales'
import { calculateTaxBreakdown } from '@/lib/tax-helpers'

interface SaleDetailsDialogProps {
    saleId: number | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SaleDetailsDialog({ saleId, open, onOpenChange }: SaleDetailsDialogProps) {
    const { t } = useTranslation()
    const { sale, loading, error } = useSaleDetails(saleId)
    const taxBreakdown = sale ? calculateTaxBreakdown(parseFloat(sale.total)) : null

    const getPaymentMethodBadge = (method: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'outline', label: string }> = {
            'EFECTIVO': { variant: 'default', label: t('sales.payment.cash', 'Efectivo') },
            'TARJETA': { variant: 'secondary', label: t('sales.payment.card', 'Tarjeta') },
            'TRANSFERENCIA': { variant: 'outline', label: t('sales.payment.transfer', 'Transferencia') }
        }
        const config = variants[method] || { variant: 'outline', label: method }
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        {t('sales.details.title', 'Detalles de Venta')} #{saleId}
                    </DialogTitle>
                    <DialogDescription> </DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-8 text-destructive">
                        {error}
                    </div>
                )}

                {!loading && !error && sale && (
                    <div className="space-y-6">
                        {/* Sale Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg">
                                    {t('sales.details.sale_info', 'Información de Venta')}
                                </h3>

                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        {t('sales.date', 'Fecha')}:
                                    </span>
                                    <span className="font-medium">
                                        {format(new Date(sale.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        {t('sales.seller', 'Vendedor')}:
                                    </span>
                                    <span className="font-medium">{sale.vendedor}</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                        {t('sales.payment_method', 'Método de Pago')}:
                                    </span>
                                    {getPaymentMethodBadge(sale.metodo_pago)}
                                </div>
                            </div>

                            {/* Customer Information */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg">
                                    {t('sales.details.customer_info', 'Información del Cliente')}
                                </h3>

                                {sale.nombre ? (
                                    <>
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                                {t('sales.customer', 'Cliente')}:
                                            </span>
                                            <span className="font-medium">
                                                {sale.nombre} {sale.apellido_paterno} {sale.apellido_materno}
                                            </span>
                                        </div>

                                        {sale.dni && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">DNI:</span>
                                                <span className="font-medium">{sale.dni}</span>
                                            </div>
                                        )}

                                        {sale.telefono && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">
                                                    {t('sales.details.phone', 'Teléfono')}:
                                                </span>
                                                <span className="font-medium">{sale.telefono}</span>
                                            </div>
                                        )}

                                        {sale.correo && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">
                                                    {t('sales.details.email', 'Email')}:
                                                </span>
                                                <span className="font-medium">{sale.correo}</span>
                                            </div>
                                        )}

                                        {sale.direccion && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">
                                                    {t('sales.details.address', 'Dirección')}:
                                                </span>
                                                <span className="font-medium">{sale.direccion}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                                        <User className="h-4 w-4" />
                                        {t('sales.no_customer', 'Sin cliente registrado')}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Products Table */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                {t('sales.details.products', 'Productos')}
                            </h3>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('sales.details.product', 'Producto')}</TableHead>
                                            <TableHead className="text-center">
                                                {t('sales.details.quantity', 'Cantidad')}
                                            </TableHead>
                                            <TableHead className="text-right">
                                                {t('sales.details.unit_price', 'Precio Unit.')}
                                            </TableHead>
                                            <TableHead className="text-right">
                                                {t('sales.details.subtotal', 'Subtotal')}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sale.detalles && sale.detalles.length > 0 ? (
                                            sale.detalles.map((detalle) => (
                                                <TableRow key={detalle.id_detalle}>
                                                    <TableCell className="font-medium">
                                                        {detalle.producto_nombre}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {detalle.cantidad}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {sale.moneda} {parseFloat(detalle.precio_unitario).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        {sale.moneda} {parseFloat(detalle.subtotal).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    {t('sales.details.no_products', 'No hay productos registrados')}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <Separator />

                        {/* Total Breakdown */}
                        <div className="flex justify-end">
                            <div className="space-y-2 min-w-[300px]">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Subtotal:
                                    </span>
                                    <span className="font-medium">
                                        {sale.moneda} {taxBreakdown?.subtotal.toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        IGV (18%):
                                    </span>
                                    <span className="font-medium">
                                        {sale.moneda} {taxBreakdown?.igv.toFixed(2)}
                                    </span>
                                </div>

                                <Separator />

                                <div className="flex justify-between text-lg">
                                    <span className="font-semibold">
                                        {t('app.total', 'Total con IGV')}:
                                    </span>
                                    <span className="font-bold text-primary">
                                        {sale.moneda} {taxBreakdown?.total.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}