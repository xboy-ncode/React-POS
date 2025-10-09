import { useTranslation } from 'react-i18next'
import { X, Printer, Download } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface TicketPreviewDialogProps {
    open: boolean
    onClose: () => void
    ticketData: {
        id_venta?: number
        id_factura?: number
        tipo_comprobante: string
        cliente: {
            nombre: string
            apellido_paterno?: string
            apellido_materno?: string
            dni?: string
            direccion?: string
            telefono?: string
        }
        productos: Array<{
            nombre: string
            cantidad: number
            precio_unitario: number
            subtotal: number
        }>
        subtotal: number
        igv: number
        total: number
        metodo_pago: string
        monto_recibido: number
        cambio: number
        fecha: string
    }
    onPrint: () => Promise<void>
}

export function TicketPreviewDialog({
    open,
    onClose,
    ticketData,
    onPrint
}: TicketPreviewDialogProps) {
    const { t } = useTranslation()

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getComprobanteLabel = () => {
        switch (ticketData.tipo_comprobante) {
            case 'invoice': return 'FACTURA'
            case 'receipt': return 'BOLETA'
            case 'ticket': return 'TICKET'
            default: return 'COMPROBANTE'
        }
    }

    const getPaymentMethodLabel = (method: string) => {
        switch (method) {
            case 'cash': return t('pos.checkout.payment_methods.cash')
            case 'card': return t('pos.checkout.payment_methods.card')
            case 'transfer': return t('pos.checkout.payment_methods.transfer')
            default: return method
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center justify-between">
                        <span>Vista Previa - {getComprobanteLabel()}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {/* Ticket Preview */}
                    <Card className="p-6 bg-white dark:bg-gray-900 border-2">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold mb-1">MI EMPRESA</h2>
                            <p className="text-sm text-muted-foreground">RUC: 20123456789</p>
                            <p className="text-sm text-muted-foreground">Av. Principal 123</p>
                            <p className="text-sm text-muted-foreground">Tel: (01) 123-4567</p>
                        </div>

                        <Separator className="my-4" />

                        {/* Comprobante Info */}
                        <div className="text-center mb-4">
                            <h3 className="text-lg font-bold">{getComprobanteLabel()}</h3>
                            {ticketData.id_factura && (
                                <p className="text-sm">N° F001-{String(ticketData.id_factura).padStart(8, '0')}</p>
                            )}
                            {ticketData.id_venta && !ticketData.id_factura && (
                                <p className="text-sm">N° {String(ticketData.id_venta).padStart(8, '0')}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(ticketData.fecha)}
                            </p>
                        </div>

                        <Separator className="my-4" />

                        {/* Customer Info */}
                        <div className="mb-4 space-y-1">
                            <p className="text-sm">
                                <span className="font-semibold">Cliente:</span>{' '}
                                {ticketData.cliente.nombre} {ticketData.cliente.apellido_paterno} {ticketData.cliente.apellido_materno}
                            </p>
                            {ticketData.cliente.dni && (
                                <p className="text-sm">
                                    <span className="font-semibold">DNI:</span> {ticketData.cliente.dni}
                                </p>
                            )}
                            {ticketData.cliente.direccion && (
                                <p className="text-sm">
                                    <span className="font-semibold">Dirección:</span> {ticketData.cliente.direccion}
                                </p>
                            )}
                        </div>

                        <Separator className="my-4" />

                        {/* Products */}
                        <div className="mb-4">
                            <div className="space-y-2">
                                {ticketData.productos.map((producto, index) => (
                                    <div key={index} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{producto.nombre}</span>
                                            <span className="font-semibold">
                                                ${producto.subtotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>
                                                {producto.cantidad} × ${producto.precio_unitario.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator className="my-4" />

                        {/* Totals */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span>${ticketData.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>IGV (18%):</span>
                                <span>${ticketData.igv.toFixed(2)}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between text-lg font-bold">
                                <span>TOTAL:</span>
                                <span>${ticketData.total.toFixed(2)}</span>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        {/* Payment Info */}
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="font-semibold">Método de Pago:</span>
                                <span>{getPaymentMethodLabel(ticketData.metodo_pago)}</span>
                            </div>
                            {ticketData.metodo_pago === 'cash' && (
                                <>
                                    <div className="flex justify-between">
                                        <span>Monto Recibido:</span>
                                        <span>${ticketData.monto_recibido.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Cambio:</span>
                                        <span className="text-green-600 font-semibold">
                                            ${ticketData.cambio.toFixed(2)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-6 text-center text-xs text-muted-foreground">
                            <p>¡Gracias por su compra!</p>
                            <p className="mt-1">Sistema POS v1.0</p>
                        </div>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cerrar
                        </Button>
                        <Button
                            onClick={onPrint}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Generar PDF
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}