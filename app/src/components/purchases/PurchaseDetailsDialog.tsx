// components/purchases/PurchaseDetailsDialog.tsx
import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Loader2, Building2, Calendar, CreditCard, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { apiClient, comprasService } from '@/lib/api-client'


interface PurchaseDetailsDialogProps {
    purchaseId: number | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PurchaseDetailsDialog({ purchaseId, open, onOpenChange }: PurchaseDetailsDialogProps) {

    const [loading, setLoading] = useState(false)
    const [purchase, setPurchase] = useState<any>(null)
    const [showDeleteAlert, setShowDeleteAlert] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (open && purchaseId) {
            fetchPurchaseDetails()
        }
    }, [open, purchaseId])

    const fetchPurchaseDetails = async () => {
        if (!purchaseId) return
        setLoading(true)
        try {
            const data = await comprasService.getById(purchaseId)
            setPurchase(data)
        } catch (error) {
            toast("Error", {
                description: "No se pudo cargar los detalles de la compra"
            })
        } finally {
            setLoading(false)
        }
    }


    const handleDelete = async () => {
        if (!purchaseId) return

        setDeleting(true)
        try {
            // Axios throws on non-2xx responses, so a successful delete will reach here
            await apiClient.delete(`/purchases/${purchaseId}`)
            toast("Éxito", {
                description: "Compra anulada correctamente"
            })
            setShowDeleteAlert(false)
            onOpenChange(false)
            // Opcional: Trigger refresh in parent component
            window.location.reload()
        } catch (error: any) {
            const errMsg = error?.response?.data?.error || error?.message || "No se pudo anular la compra"
            toast("Error", {
                description: errMsg
            })
        } finally {
            setDeleting(false)
        }
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

    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (!purchase) {
        return null
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle>Detalle de Compra #{purchase.id_compra}</DialogTitle>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowDeleteAlert(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Anular Compra
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Información General */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Proveedor</p>
                                        <p className="text-sm text-muted-foreground">{purchase.razon_social}</p>
                                        <p className="text-xs text-muted-foreground">RUC: {purchase.ruc}</p>
                                        {purchase.direccion && (
                                            <p className="text-xs text-muted-foreground">{purchase.direccion}</p>
                                        )}
                                        {purchase.telefono && (
                                            <p className="text-xs text-muted-foreground">Tel: {purchase.telefono}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Fecha</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(purchase.fecha), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Método de Pago</p>
                                        <div>{getPaymentMethodBadge(purchase.metodo_pago)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Productos */}
                        <div className="space-y-3">
                            <h3 className="font-semibold">Productos</h3>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead className="text-center">Cantidad</TableHead>
                                            <TableHead className="text-right">Precio Unit.</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {purchase.detalles && purchase.detalles.map((detalle: any) => (
                                            <TableRow key={detalle.id_detalle}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{detalle.producto_nombre}</div>
                                                        {detalle.codigo && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Código: {detalle.codigo}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {detalle.cantidad}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {purchase.moneda} {parseFloat(detalle.precio_unitario).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {purchase.moneda} {parseFloat(detalle.subtotal).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <Separator />

                        {/* Total */}
                        <div className="flex justify-end">
                            <div className="space-y-2 w-64">
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Total:</span>
                                    <span>{purchase.moneda} {parseFloat(purchase.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Anular esta compra?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la compra y reducirá el stock de los productos incluidos.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? 'Anulando...' : 'Anular Compra'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}