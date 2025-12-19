// components/suppliers/EditSupplierDialog.tsx
import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { proveedoresService, type Proveedor, type ProveedorUpdate } from '@/lib/api-client'

interface EditSupplierDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    supplier: Proveedor | null
    onSuccess: () => void
}

export function EditSupplierDialog({ open, onOpenChange, supplier, onSuccess }: EditSupplierDialogProps) {
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showDeleteAlert, setShowDeleteAlert] = useState(false)
    const [formData, setFormData] = useState<ProveedorUpdate>({
        ruc: '',
        razon_social: '',
        direccion: '',
        telefono: '',
        correo: '',
        activo: true
    })

    useEffect(() => {
        if (supplier) {
            setFormData({
                ruc: supplier.ruc,
                razon_social: supplier.razon_social,
                direccion: supplier.direccion || '',
                telefono: supplier.telefono || '',
                correo: supplier.correo || '',
                activo: supplier.activo
            })
        }
    }, [supplier])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!supplier) return

        if (!formData.ruc?.trim()) {
            toast.error('El RUC es requerido')
            return
        }

        if (!formData.razon_social?.trim()) {
            toast.error('La razón social es requerida')
            return
        }

        // Validar formato RUC (11 dígitos para Perú)
        if (!/^\d{11}$/.test(formData.ruc)) {
            toast.error('El RUC debe tener 11 dígitos')
            return
        }

        // Validar correo si se proporciona
        if (formData.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
            toast.error('El correo no es válido')
            return
        }

        setLoading(true)
        try {
            await proveedoresService.update(supplier.id_proveedor, formData)
            toast.success('Proveedor actualizado correctamente')
            onSuccess()
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al actualizar el proveedor'
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!supplier) return

        setDeleting(true)
        try {
            await proveedoresService.delete(supplier.id_proveedor)
            toast.success('Proveedor eliminado correctamente')
            setShowDeleteAlert(false)
            onSuccess()
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al eliminar el proveedor'
            toast.error(errorMsg)
        } finally {
            setDeleting(false)
        }
    }

    const handleChange = (field: keyof ProveedorUpdate, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    if (!supplier) return null

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle>Editar Proveedor</DialogTitle>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowDeleteAlert(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                            </Button>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Información Básica */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ruc">RUC *</Label>
                                <Input
                                    id="ruc"
                                    value={formData.ruc}
                                    onChange={(e) => handleChange('ruc', e.target.value)}
                                    placeholder="12345678901"
                                    maxLength={11}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="razon_social">Razón Social *</Label>
                                <Input
                                    id="razon_social"
                                    value={formData.razon_social}
                                    onChange={(e) => handleChange('razon_social', e.target.value)}
                                    placeholder="Empresa SAC"
                                    required
                                />
                            </div>
                        </div>

                        {/* Información de Contacto */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="telefono">Teléfono</Label>
                                <Input
                                    id="telefono"
                                    value={formData.telefono}
                                    onChange={(e) => handleChange('telefono', e.target.value)}
                                    placeholder="999 999 999"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="correo">correo</Label>
                                <Input
                                    id="correo"
                                    type="correo"
                                    value={formData.correo}
                                    onChange={(e) => handleChange('correo', e.target.value)}
                                    placeholder="contacto@empresa.com"
                                />
                            </div>
                        </div>

                        {/* Dirección */}
                        <div className="space-y-2">
                            <Label htmlFor="direccion">Dirección</Label>
                            <Input
                                id="direccion"
                                value={formData.direccion}
                                onChange={(e) => handleChange('direccion', e.target.value)}
                                placeholder="Av. Principal 123, Lima"
                            />
                        </div>

                        {/* Estado */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label htmlFor="activo">Estado</Label>
                                <p className="text-sm text-muted-foreground">
                                    {formData.activo ? 'Proveedor activo' : 'Proveedor inactivo'}
                                </p>
                            </div>
                            <Switch
                                id="activo"
                                checked={formData.activo}
                                onCheckedChange={(checked) => handleChange('activo', checked)}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este proveedor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará permanentemente al proveedor "{supplier?.razon_social}".
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
                            {deleting ? 'Eliminando...' : 'Eliminar Proveedor'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}