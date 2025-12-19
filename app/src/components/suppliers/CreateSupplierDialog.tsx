// components/suppliers/CreateSupplierDialog.tsx
import { useState } from 'react'
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
import { toast } from 'sonner'
import { proveedoresService, type ProveedorCreate } from '@/lib/api-client'

interface CreateSupplierDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CreateSupplierDialog({ open, onOpenChange, onSuccess }: CreateSupplierDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<ProveedorCreate>({
        ruc: '',
        razon_social: '',
        direccion: '',
        telefono: '',
        correo: '',
        activo: true
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.ruc.trim()) {
            toast.error('El RUC es requerido')
            return
        }

        if (!formData.razon_social.trim()) {
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
            await proveedoresService.create(formData)
            toast.success('Proveedor creado correctamente')
            resetForm()
            onSuccess()
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al crear el proveedor'
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            ruc: '',
            razon_social: '',
            direccion: '',
            telefono: '',
            correo: '',
            activo: true
        })
    }

    const handleChange = (field: keyof ProveedorCreate, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Nuevo Proveedor</DialogTitle>
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
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="correo"
                                type="email"
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
                            {loading ? 'Guardando...' : 'Crear Proveedor'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}