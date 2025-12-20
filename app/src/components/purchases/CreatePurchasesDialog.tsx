// components/purchases/CreatePurchaseDialog.tsx
import { useState, useEffect } from 'react'
import type { Product } from '@/types/pos'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { proveedoresService, productosService, comprasService } from '@/lib/api-client'


interface CreatePurchaseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

type PurchaseItem = {
    id_producto: Product['id'] | number
    nombre: Product['name'] | string
    cantidad: number
    precio_unitario: number
    subtotal: number
}

export function CreatePurchaseDialog({ open, onOpenChange, onSuccess }: CreatePurchaseDialogProps) {

    const [loading, setLoading] = useState(false)
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [searchProduct, setSearchProduct] = useState('')

    // Form state
    const [idProveedor, setIdProveedor] = useState('')
    const [metodoPago, setMetodoPago] = useState('EFECTIVO')
    const [moneda, setMoneda] = useState('PEN')
    const [items, setItems] = useState<PurchaseItem[]>([])

    useEffect(() => {
        if (open) {
            fetchSuppliers()
            fetchProducts()
        }
    }, [open])

    const fetchSuppliers = async () => {
        try {
            const data = await proveedoresService.getAll()
            setSuppliers(data.proveedores || [])
        } catch (error) {
            console.error('Error fetching suppliers:', error)
        }
    }
    const fetchProducts = async () => {
        try {
            const data = await productosService.getAll()
            setProducts(data.productos as unknown as Product[] || [])
        } catch (error) {
            console.error('Error fetching products:', error)
        }
    }

    const addItem = () => {
        setItems([...items, {
            id_producto: 0,
            nombre: '',
            cantidad: 1,
            precio_unitario: 0,
            subtotal: 0
        }])
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }

        // Si cambia el producto, actualizar el nombre y precio
        if (field === 'id_producto') {
            const pid = parseInt(value)
            const product = products.find(p => p.id === pid)
            if (product) {
                newItems[index].nombre = (product as any).nombre || (product as any).name || ''
                // support multiple possible price fields returned by API
                const price = (product as any).precio_compra ?? (product as any).precioCompra ?? (product as any).price ?? 0
                newItems[index].precio_unitario = parseFloat(String(price)) || 0
            }
        }

        // Recalcular subtotal
        if (field === 'cantidad' || field === 'precio_unitario' || field === 'id_producto') {
            newItems[index].subtotal = newItems[index].cantidad * newItems[index].precio_unitario
        }

        setItems(newItems)
    }

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + item.subtotal, 0)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!idProveedor) {
            toast("Error", {
                description: "Debe seleccionar un proveedor"
            })
            return
        }

        if (items.length === 0) {
            toast("Error", {
                description: "Debe agregar al menos un producto"
            })
            return
        }

        const invalidItems = items.filter(item =>
            !item.id_producto || item.cantidad <= 0 || item.precio_unitario <= 0
        )

        if (invalidItems.length > 0) {
            toast("Error", {
                description: "Todos los productos deben tener cantidad y precio válidos"
            })
            return
        }

        setLoading(true)
        try {
            const response = await comprasService.create({
                id_proveedor: parseInt(idProveedor),
                metodo_pago: metodoPago,
                moneda: moneda,
                productos: items.map(item => ({
                    id_producto: item.id_producto,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario
                }))
            })

            if (response) {
                toast("Éxito", {
                    description: "Compra registrada correctamente"
                })
                resetForm()
                onSuccess()

            } else {
                const error = await response.json()
                toast("Error", {
                    description: error.error || "Error al registrar la compra"
                })
            }
        } catch (error) {
            toast("Error", {
                description: "Error de conexión"
            })
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setIdProveedor('')
        setMetodoPago('EFECTIVO')
        setMoneda('PEN')
        setItems([])
    }

    const filteredProducts = products.filter(p =>
        ((p as any).nombre || p.name || '').toString().toLowerCase().includes(searchProduct.toLowerCase()) ||
        ((p as any).codigo || (p as any).sku || p.sku || p.barcode || '').toString().toLowerCase().includes(searchProduct.toLowerCase())
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
           <DialogContent className="max-w-[90vw] md:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nueva Compra</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Información general */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Proveedor *</Label>
                            <Select value={idProveedor} onValueChange={setIdProveedor}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar proveedor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id_proveedor} value={supplier.id_proveedor.toString()}>
                                            {supplier.razon_social} - {supplier.ruc}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Método de Pago *</Label>
                            <Select value={metodoPago} onValueChange={setMetodoPago}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar método" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                    <SelectItem value="TARJETA">Tarjeta</SelectItem>
                                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Moneda *</Label>
                            <Select value={moneda} onValueChange={setMoneda}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar moneda" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PEN">PEN (S/)</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Productos */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Productos</Label>
                            <Button type="button" size="sm" onClick={addItem}>
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Producto
                            </Button>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 grid grid-cols-12 gap-3">
    <div className="col-span-12 md:col-span-6 space-y-2">
                                            <Label>Producto</Label>
                                            <Select
                                                value={item.id_producto.toString()}
                                                onValueChange={(value) => updateItem(index, 'id_producto', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <div className="p-2">
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                placeholder="Buscar..."
                                                                value={searchProduct}
                                                                onChange={(e) => setSearchProduct(e.target.value)}
                                                                className="pl-8"
                                                            />
                                                        </div>
                                                    </div>
                                                    {filteredProducts.map((product) => (
                                                        <SelectItem
                                                            key={(product as any).id_producto ?? (product as any).id}
                                                            value={String((product as any).id_producto ?? (product as any).id)}
                                                        >
                                                            {((product as any).nombre || (product as any).name)} {((product as any).codigo || (product as any).sku || (product as any).barcode) ? `(${((product as any).codigo || (product as any).sku || (product as any).barcode)})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="col-span-6 md:col-span-3 space-y-2">
                                            <Label>Cantidad</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.cantidad}
                                                onChange={(e) => updateItem(index, 'cantidad', parseInt(e.target.value) || 0)}
                                            />
                                        </div>

                                        <div className="col-span-6 md:col-span-3 space-y-2">
                                            <Label>Precio Unit.</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.precio_unitario}
                                                onChange={(e) => updateItem(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <Label>Subtotal</Label>
                                        <div className="font-semibold">{moneda === 'PEN' ? 'S/' : '$'} {item.subtotal.toFixed(2)}</div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeItem(index)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {items.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay productos agregados
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    <div className="flex justify-end items-center gap-4 border-t pt-4">
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">Total</div>
                            <div className="text-2xl font-bold">{moneda === 'PEN' ? 'S/' : '$'} {calculateTotal().toFixed(2)}</div>
                        </div>
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
                            {loading ? 'Guardando...' : 'Registrar Compra'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}