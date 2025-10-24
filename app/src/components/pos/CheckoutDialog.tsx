// CheckoutDialog.tsx - ADAPTED VERSION WITH PRICE CALCULATORS
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Minus, Plus, CreditCard, User, Loader2, AlertCircle, Receipt, FileText, FileSpreadsheet, Tag, Edit2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { ventasService } from '@/lib/api-client'
import { generateCustomPdfTicket, usePdfTicket } from '@/hooks/usePdfTicket'
import { usePriceCalculator, useCartTotals } from '@/hooks/usePriceCalculator'
import React from 'react'
import { cn } from '@/lib/utils'
import type { CartItem, Product } from '@/types/pos'

import businessConfig, {
    formatCurrency,
    calculateIGV,
    generateInvoiceNumber
} from '@/config/business.config'
import { calculatePriceData, calculatePriceWithCustomBase, calculatePriceWithCustomBaseV2 } from '@/lib/price-calculator'

type Customer = {
    id_cliente?: number
    dni: string
    nombre: string
    apellido_paterno?: string
    apellido_materno?: string
    nombreCompleto?: string
    direccion?: string
    telefono?: string
    correo?: string
    fuente_datos?: 'RENIEC' | 'Manual'
    datos_completos?: any
}

type CheckoutDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    cart: CartItem[]
    setCart: (cart: CartItem[]) => void
    products?: Product[] // Added to get full product data
    updateQuantity: (productId: number, newQuantity: number) => void
    removeFromCart: (productId: number) => void
    onProcessPayment: (checkoutData: any) => void
    onClearCart?: () => void
    onRefreshData?: () => Promise<void>
}

type ComprobanteType = 'ticket' | 'boleta' | 'factura'




function CartItemRow({
    item,
    product,
    updateQuantity,
    removeFromCart,
    updatePrice,
}: {
    item: CartItem
    product?: Product
    updateQuantity: (id: number, qty: number) => void
    removeFromCart: (id: number) => void
    updatePrice: (id: number, newPrice: number) => void
}) {
    const { t } = useTranslation()
    const [showPriceDialog, setShowPriceDialog] = useState(false)
    const [tempPrice, setTempPrice] = useState('')

    const priceInfo = product ? calculatePriceData(product, item.quantity) : null

    // 🔍 DEBUG: Ver qué está devolviendo priceInfo
    // console.log('🔍 DEBUG CartItemRow:', {
    //     productName: product?.name,
    //     quantity: item.quantity,
    //     priceInfo: priceInfo,
    //     montoDescuentoOferta: priceInfo?.priceCalculation?.montoDescuentoOferta,
    //     montoDescuentoMayorista: priceInfo?.priceCalculation?.montoDescuentoMayorista,
    //     isOnSale: priceInfo?.isOnSale,
    //     isWholesale: priceInfo?.isWholesale,
    //     customPrice: item.customPrice
    // })

    // Calcular precio con o sin personalización
    let effectivePrice: number
    let originalPrice: number
    let activeDiscounts = {
        oferta: false,
        mayorista: false,
        personalizado: false
    }

    if (item.customPrice && product) {
        // Si hay precio personalizado, calcular con descuentos aplicados
        const customPriceCalc = calculatePriceWithCustomBaseV2(product, item.quantity, item.customPrice)
        effectivePrice = customPriceCalc.finalPrice
        originalPrice = item.customPrice

        activeDiscounts.personalizado = true
        // For custom prices, only consider oferta/mayorista active when they produce a
        // positive absolute discount. This prevents showing a 'Mayorista' label with
        // no effective discount which confuses users when oferta is already better.
        activeDiscounts.oferta = customPriceCalc.isOnSale && (customPriceCalc.discounts.oferta ?? 0) > 0
        activeDiscounts.mayorista = customPriceCalc.isWholesale && (customPriceCalc.discounts.mayorista ?? 0) > 0

        // console.log('💰 Con precio personalizado:', customPriceCalc)
    } else {
        // Usar precios normales del sistema
        effectivePrice = priceInfo?.priceCalculation?.precioFinal ?? item.price
        originalPrice = priceInfo?.priceCalculation?.precioBase ?? item.price

        // ✅ Verificar si hay descuentos activos. Only set when the numeric discount
        // amount is greater than zero to avoid showing empty/zero badges.
        if (priceInfo?.isOnSale && (priceInfo?.priceCalculation?.montoDescuentoOferta ?? 0) > 0) {
            activeDiscounts.oferta = true
        }
        if (priceInfo?.isWholesale && (priceInfo?.priceCalculation?.montoDescuentoMayorista ?? 0) > 0) {
            activeDiscounts.mayorista = true
        }

        // console.log('💰 Sin precio personalizado:', {
        //     effectivePrice,
        //     originalPrice,
        //     activeDiscounts
        // })
    }

    const hasDiscount = activeDiscounts.oferta || activeDiscounts.mayorista || effectivePrice < originalPrice

    const handleOpenPriceDialog = () => {
        setTempPrice(effectivePrice.toString())
        setShowPriceDialog(true)
    }

    const handleSavePrice = () => {
        const newPrice = parseFloat(tempPrice)
        if (!isNaN(newPrice) && newPrice > 0) {
            updatePrice(item.id, newPrice)
            setShowPriceDialog(false)
        }
    }

    const handleResetPrice = () => {
        updatePrice(item.id, 0)
        setShowPriceDialog(false)
    }

    return (
        <>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-xs truncate">
                        {t(item.nameKey, item.name)}
                    </h4>

                    <div className="flex items-center gap-1">
                        <p className="text-muted-foreground text-xs">
                            {formatCurrency(effectivePrice)}{' '}
                            {hasDiscount && (
                                <span className="line-through ml-1 text-[10px] opacity-70">
                                    {formatCurrency(originalPrice)}
                                </span>
                            )}
                        </p>

                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleOpenPriceDialog()
                            }}
                        >
                            <Edit2 className="w-3 h-3 text-primary hover:text-primary/80" />
                        </Button>
                    </div>

                    {/* Precio personalizado */}
                    {item.customPrice && (
                        <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1 mt-0.5 flex items-center gap-0.5 bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700"
                        >
                            <Edit2 className="w-3 h-3" />
                            Precio personalizado
                        </Badge>
                    )}

                    {/* Badge de oferta */}
                    {activeDiscounts.oferta && (priceInfo?.priceCalculation?.montoDescuentoOferta ?? 0) > 0 && (
                        <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1 mt-0.5 flex items-center gap-0.5 bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700"
                        >
                            <Tag className="w-3 h-3" />
                            Oferta -{formatCurrency(priceInfo?.priceCalculation?.montoDescuentoOferta ?? 0)}
                        </Badge>
                    )}

                    {/* Badge mayorista */}
                    {priceInfo?.calificaMayorista && (
                        <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1 mt-0.5 flex items-center gap-0.5 bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
                        >
                            <Tag className="w-3 h-3" />
                            {/* Prefer to show discount relative to retail base (if product available), otherwise fall back to the calculated amount. */}
                            {(() => {
                                const baseRetail = product ? (product.precioVentaMinorista ?? product.price) : undefined
                                const mayoristaPrice = product ? product.precioVentaMayorista : undefined
                                const discountFromBase = (baseRetail !== undefined && mayoristaPrice !== undefined && mayoristaPrice !== null)
                                    ? Math.max(0, baseRetail - (mayoristaPrice as number))
                                    : 0

                                const calcDiscount = priceInfo?.priceCalculation?.montoDescuentoMayorista ?? 0

                                if (discountFromBase > 0) return `Mayorista -${formatCurrency(discountFromBase)}`
                                if (calcDiscount > 0) return `Mayorista -${formatCurrency(calcDiscount)}`
                                return 'Mayorista'
                            })()}
                        </Badge>
                    )}

                    {/* Unidades faltantes */}
                    {!priceInfo?.calificaMayorista && (priceInfo?.unidadesFaltantes ?? 0) > 0 && (
                        <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                            <Tag className="w-3 h-3" />
                            +{priceInfo?.unidadesFaltantes ?? 0} p/ mayorista
                        </p>
                    )}
                </div>

                {/* Controles */}
                <div className="flex items-center gap-1">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                            e.stopPropagation()
                            updateQuantity(item.id, item.quantity - 1)
                        }}
                    >
                        <Minus className="w-3 h-3" />
                    </Button>

                    <span className="w-5 text-center text-xs font-medium">
                        {item.quantity}
                    </span>

                    <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                            e.stopPropagation()
                            updateQuantity(item.id, item.quantity + 1)
                        }}
                    >
                        <Plus className="w-3 h-3" />
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation()
                            removeFromCart(item.id)
                            updateQuantity(item.id, 0)
                        }}
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            {/* Dialog para editar precio */}
            <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar precio temporal</DialogTitle>
                        <DialogDescription>
                            Modifica el precio base de "{t(item.nameKey, item.name)}" solo para esta venta.
                            Los descuentos activos (oferta/mayorista) se aplicarán sobre este precio.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price">Nuevo precio base</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={tempPrice}
                                onChange={(e) => setTempPrice(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSavePrice()
                                    }
                                }}
                                placeholder="0.00"
                                autoFocus
                            />
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>Precio original: {formatCurrency(product?.precioVentaMinorista ?? item.price)}</p>
                                {product && tempPrice && parseFloat(tempPrice) > 0 && (
                                    (() => {
                                        const preview = calculatePriceWithCustomBase(product, item.quantity, parseFloat(tempPrice))
                                        return (
                                            <>
                                                {preview.totalDiscount > 0 && (
                                                    <p className="text-amber-600">
                                                        ⚠️ Descuentos activos: -{formatCurrency(preview.totalDiscount)}
                                                        {preview.discounts.oferta > 0 && ` (Oferta: -${formatCurrency(preview.discounts.oferta)})`}
                                                        {preview.discounts.mayorista > 0 && ` (Mayorista: -${formatCurrency(preview.discounts.mayorista)})`}
                                                    </p>
                                                )}
                                                <p className="font-medium text-green-600">
                                                    💰 Precio final: {formatCurrency(preview.finalPrice)}
                                                </p>
                                            </>
                                        )
                                    })()
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleResetPrice}
                            disabled={!item.customPrice}
                        >
                            Restaurar precio
                        </Button>
                        <Button onClick={handleSavePrice}>
                            Aplicar precio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default function CheckoutDialog({
    open,
    onOpenChange,
    cart,
    setCart,
    products = [],
    updateQuantity,
    removeFromCart,
    onProcessPayment,
    onClearCart,
    onRefreshData
}: CheckoutDialogProps) {
    const { t } = useTranslation()
    const [paymentMethod, setPaymentMethod] = useState<string>('EFECTIVO')
    const [receivedAmount, setReceivedAmount] = useState<string>('')
    const [processing, setProcessing] = useState(false)
    const [receiptType, setReceiptType] = useState<ComprobanteType>('ticket')

    const [customerForm, setCustomerForm] = useState<Partial<Customer>>({
        dni: '',
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        direccion: '',
        telefono: '',
        correo: ''
    })
    const [dniInput, setDniInput] = useState('')
    const [loadingReniec, setLoadingReniec] = useState(false)
    const [customers, setCustomers] = useState<Customer[]>([])
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
    const { generatePdfTicket } = usePdfTicket()


    // Prepare cart items with full product data for price calculations
    const cartItemsWithProducts = cart.map(item => ({
        product: products.find(p => p.id === item.id) || {
            id: item.id,
            name: item.name,
            nameKey: item.nameKey,
            price: item.price,
            image: item.image || '',
            precioVentaMinorista: item.price
        } as Product,
        quantity: item.quantity
    }))

    // ✅ Calcular totales desde los precios YA actualizados en el carrito
    const subtotal = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id)

        let priceToUse = item.price

        if (item.customPrice && product) {
            // Usar la función helper para calcular precio con descuentos
            const customPriceCalc = calculatePriceWithCustomBaseV2(product, item.quantity, item.customPrice)
            priceToUse = customPriceCalc.finalPrice
        } else if (product) {
            const priceInfo = calculatePriceData(product, item.quantity)
            priceToUse = priceInfo.priceCalculation.precioFinal
        }

        return sum + (priceToUse * item.quantity)
    }, 0)

    const cartTotals = {
        subtotal: subtotal,
        descuentos: 0, // Los descuentos ya están aplicados en item.price
        total: subtotal
    }

    // Calculate IGV and final totals
    const igv = calculateIGV(cartTotals.total)
    const totalWithIGV = cartTotals.total + igv
    const change = receivedAmount ? Math.max(0, parseFloat(receivedAmount) - totalWithIGV) : 0



    const handleUpdatePrice = (id: number, newPrice: number) => {
        const updatedCart = cart.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    customPrice: newPrice > 0 ? newPrice : undefined
                }
            }
            return item
        })
        setCart(updatedCart)
    }


    useEffect(() => {
        if (open) {
            loadCustomers()
        }
    }, [open])

    async function loadCustomers() {
        try {
            const response = await api('/customers?limit=100')
            const mapped = (response?.clientes || []).map((c: any) => ({
                ...c,
                nombreCompleto: `${c.apellido_paterno || ''} ${c.apellido_materno || ''}, ${c.nombre || ''}`.trim()
            }))
            setCustomers(mapped)
        } catch (error) {
            console.error('Failed to load customers:', error)
        }
    }

    async function consultarDNI(dni: string) {
        const expectedLength = receiptType === 'factura' ? 11 : 8

        if (dni.length !== expectedLength) {
            toast.error(
                receiptType === 'factura'
                    ? 'El RUC debe tener 11 dígitos'
                    : t('app.dni_must_be_8_digits')
            )
            return
        }

        setLoadingReniec(true)
        try {
            const data = await api(`/customers/dni/${dni}`)

            if (data) {
                setCustomerForm({
                    dni: data.dni,
                    nombre: data.nombre,
                    apellido_paterno: data.apellido_paterno,
                    apellido_materno: data.apellido_materno,
                    direccion: data.direccion,
                    telefono: data.telefono,
                    correo: data.correo,
                    fuente_datos: data.fuente_datos,
                    datos_completos: data.datos_completos
                })

                if (data.fuente_datos === 'RENIEC') {
                    toast.success(t('app.data_from_reniec'))
                } else {
                    toast.success(t('app.data_from_database'))
                }
            }
        } catch (error: any) {
            console.error('Error consultando DNI:', error)
            if (error?.error?.includes('no encontrado')) {
                toast.error(t('app.dni_not_found'))
            } else if (error?.error?.includes('Token')) {
                toast.error(t('app.reniec_token_error'))
            } else if (error?.error?.includes('no disponible')) {
                toast.error(t('app.reniec_unavailable'))
            } else {
                toast.error(t('app.reniec_error'))
            }
        } finally {
            setLoadingReniec(false)
        }
    }

    async function saveCustomer() {
        if (!customerForm.dni?.trim() || !customerForm.nombre?.trim()) {
            toast.error(t('app.fill_required_fields'))
            return null
        }

        try {
            const response = await api('/customers', {
                method: 'POST',
                body: JSON.stringify({
                    dni: customerForm.dni.trim(),
                    nombre: customerForm.nombre.trim(),
                    apellido_paterno: customerForm.apellido_paterno?.trim() || null,
                    apellido_materno: customerForm.apellido_materno?.trim() || null,
                    direccion: customerForm.direccion?.trim() || null,
                    telefono: customerForm.telefono?.trim() || null,
                    correo: customerForm.correo?.trim() || null,
                    fuente_datos: customerForm.fuente_datos || 'Manual',
                    datos_completos: customerForm.datos_completos || null
                })
            })

            toast.success(t('app.customer_created'))
            await loadCustomers()
            return response.id_cliente
        } catch (error: any) {
            console.error('Failed to save customer:', error)
            const errorMsg = error?.error || t('app.save_error')
            toast.error(errorMsg)
            return null
        }
    }

    const validateForm = () => {
        if (receiptType === 'factura') {
            if (!customerForm.nombre?.trim()) {
                toast.error('La razón social es requerida para Factura')
                return false
            }

            if (!customerForm.direccion?.trim()) {
                toast.error('La dirección fiscal es requerida para Factura')
                return false
            }
        } else if (receiptType === 'boleta') {
            if (!customerForm.nombre?.trim()) {
                toast.error('El nombre es requerido para Boleta')
                return false
            }
            const dni = customerForm.dni?.trim() || ''
            if (!dni || dni.length !== 8) {
                toast.error(`El DNI debe tener 8 dígitos (actual: ${dni.length})`)
                return false
            }
        }

        return true
    }


    // Helper para calcular precio final con descuentos E IGV
    const calculateFinalPriceWithTax = (item: any): number => {
        const product = products.find(p => p.id === item.id)
        if (!product) return item.price * (1 + businessConfig.igvRate / 100)

        let precioFinal: number

        if (item.customPrice) {
            const customCalc = calculatePriceWithCustomBaseV2(product, item.quantity, item.customPrice)
            precioFinal = customCalc.finalPrice
        } else {
            const priceCalc = calculatePriceData(product, item.quantity)
            precioFinal = priceCalc.priceCalculation.precioFinal
        }

        // Aplicar IGV al precio final
        return precioFinal * (1 + businessConfig.igvRate / 100)
    }


    const handleProcessPayment = async () => {
        // Validar formulario primero
        if (!validateForm()) return

        if (paymentMethod === 'EFECTIVO' && parseFloat(receivedAmount) < totalWithIGV) {
            toast.error(t('pos.insufficient_amount'))
            return
        }

        setProcessing(true)

        try {
            let customerId = selectedCustomerId

            // Solo guardar cliente si hay datos y no es un ticket simple
            if (!customerId && customerForm.dni && receiptType !== 'ticket') {
                const newCustomerId = await saveCustomer()
                if (newCustomerId) customerId = newCustomerId.toString()
            }

            // Helper para calcular precio final con descuentos
            const calculateFinalPrice = (item: any): number => {
                const product = products.find(p => p.id === item.id)
                if (!product) return item.price

                if (item.customPrice) {
                    const customCalc = calculatePriceWithCustomBaseV2(product, item.quantity, item.customPrice)
                    return customCalc.finalPrice
                }

                const priceCalc = calculatePriceData(product, item.quantity)
                return priceCalc.priceCalculation.precioFinal
            }

            // Helper para obtener información completa de descuentos
            const getItemPriceInfo = (item: any) => {
                const product = products.find(p => p.id === item.id)
                if (!product) {
                    return {
                        precioBase: item.price,
                        precioFinal: item.price,
                        descuentoOferta: 0,
                        descuentoMayorista: 0,
                        esOferta: false,
                        esMayorista: false
                    }
                }

                if (item.customPrice) {
                    const customCalc = calculatePriceWithCustomBaseV2(product, item.quantity, item.customPrice)
                    return {
                        precioBase: item.customPrice,
                        precioFinal: customCalc.finalPrice,
                        descuentoOferta: customCalc.discounts.oferta,
                        descuentoMayorista: customCalc.discounts.mayorista,
                        esOferta: customCalc.isOnSale,
                        esMayorista: customCalc.isWholesale
                    }
                }

                const priceCalc = calculatePriceData(product, item.quantity)
                return {
                    precioBase: priceCalc.priceCalculation.precioBase,
                    precioFinal: priceCalc.priceCalculation.precioFinal,
                    descuentoOferta: priceCalc.priceCalculation.montoDescuentoOferta || 0,
                    descuentoMayorista: priceCalc.priceCalculation.montoDescuentoMayorista || 0,
                    esOferta: priceCalc.isOnSale,
                    esMayorista: priceCalc.isWholesale
                }
            }

            // Checkout data para el frontend
            const checkoutData = {
                cart: cart.map(item => {
                    const priceInfo = getItemPriceInfo(item)
                    return {
                        ...item,
                        ...priceInfo
                    }
                }),
                customer: customerForm,
                customerId,
                receiptType,
                paymentMethod,
                subtotal: cartTotals.subtotal,
                descuentos: cartTotals.descuentos,
                tax: igv,
                total: totalWithIGV,
                receivedAmount: paymentMethod === 'EFECTIVO' ? parseFloat(receivedAmount) : totalWithIGV,
                change: paymentMethod === 'EFECTIVO' ? change : 0,
                timestamp: new Date().toISOString()
            }

            await onProcessPayment(checkoutData)

            // Crear venta en backend (formato que tu API espera)
            const ventaData = {
                id_cliente: customerId ? parseInt(customerId) : null,
                metodo_pago: paymentMethod,
                moneda: businessConfig.currency,
                productos: cart.map(item => ({
                    id_producto: item.id,
                    cantidad: item.quantity,
                    precio_unitario: calculateFinalPriceWithTax(item) // Precio con IGV incluido
                }))
            }

            const ventaResponse = await ventasService.create(ventaData)
            const ventaId = ventaResponse.venta?.id_venta || ventaResponse.id_venta

            if (!ventaId) {
                throw new Error('No se pudo obtener el ID de la venta')
            }

            toast.success('Venta registrada correctamente')

            // Generar PDF con información de descuentos
            try {
                // NO usar generatePdfTicket que hace una llamada al backend
                // En su lugar, crear el PDF directamente con los datos que ya tenemos

                const ventaParaPDF = {
                    id_venta: ventaId,
                    numero_comprobante: `T-${ventaId.toString().padStart(6, '0')}`,
                    tipo_comprobante: receiptType,
                    fecha_venta: new Date().toISOString(),
                    total: totalWithIGV,
                    subtotal: cartTotals.subtotal - cartTotals.descuentos, // Subtotal después de descuentos
                    igv: igv,
                    cliente_nombre: customerForm.nombre ?
                        `${customerForm.nombre} ${customerForm.apellido_paterno || ''}`.trim() :
                        null,
                    cliente_documento: customerForm.dni || null,
                    cliente_direccion: customerForm.direccion || null,
                    metodo_pago: paymentMethod,
                    // Items con información de descuentos
                    items: cart.map(item => {
                        const product = products.find(p => p.id === item.id)
                        const priceInfo = getItemPriceInfo(item)

                        return {
                            nombre: item.name,
                            cantidad: item.quantity,
                            precio_unitario: priceInfo.precioFinal,
                            precio_original: priceInfo.precioBase,
                            descuento_oferta: priceInfo.descuentoOferta,
                            descuento_mayorista: priceInfo.descuentoMayorista,
                            es_oferta: priceInfo.esOferta,
                            es_mayorista: priceInfo.esMayorista,
                            subtotal: priceInfo.precioFinal * item.quantity
                        }
                    }),
                    // Totales de descuentos
                    subtotal_sin_descuentos: cartTotals.subtotal,
                    total_descuentos: cartTotals.descuentos
                }

                // Usar generateCustomPdfTicket que NO hace llamada al backend
                await generateCustomPdfTicket(ventaParaPDF, receiptType)

                const comprobanteNombre = receiptType === 'ticket'
                    ? 'Ticket'
                    : receiptType === 'boleta'
                        ? 'Boleta'
                        : 'Factura'

                toast.success(`${comprobanteNombre} generado exitosamente`)
            } catch (pdfError) {
                console.error('Error generando PDF:', pdfError)

                // Fallback al método original
                try {
                    await generatePdfTicket(ventaId, receiptType)
                } catch (fallbackError) {
                    console.warn('Venta registrada pero no se pudo generar el PDF', fallbackError)
                    toast.warning('Venta registrada pero no se pudo generar el PDF')
                }
            }

            if (onClearCart) onClearCart()
            if (onRefreshData) await onRefreshData()

            // Limpiar formulario
            setCustomerForm({
                dni: '',
                nombre: '',
                apellido_paterno: '',
                apellido_materno: '',
                direccion: '',
                telefono: '',
                correo: ''
            })
            setDniInput('')
            setSelectedCustomerId('')
            setPaymentMethod('EFECTIVO')
            setReceivedAmount('')
            setReceiptType('ticket')
            onOpenChange(false)
        } catch (err) {
            console.error('Payment processing failed:', err)
            toast.error(t('pos.payment_error'))
        } finally {
            setProcessing(false)
        }
    }

    const handleSelectExistingCustomer = (customerId: string) => {
        const customer = customers.find(c => c.id_cliente?.toString() === customerId)
        if (customer) {
            setCustomerForm({
                dni: customer.dni,
                nombre: customer.nombre,
                apellido_paterno: customer.apellido_paterno,
                apellido_materno: customer.apellido_materno,
                direccion: customer.direccion,
                telefono: customer.telefono,
                correo: customer.correo,
                fuente_datos: customer.fuente_datos,
                datos_completos: customer.datos_completos
            })
            setDniInput(customer.dni)
        }
    }

    const getReceiptTypeIcon = (type: ComprobanteType) => {
        switch (type) {
            case 'ticket': return <Receipt className="w-5 h-5" />
            case 'boleta': return <FileText className="w-5 h-5" />
            case 'factura': return <FileSpreadsheet className="w-5 h-5" />
        }
    }

    const getReceiptTypeDescription = (type: ComprobanteType) => {
        switch (type) {
            case 'ticket': return 'Comprobante simple (80mm)'
            case 'boleta': return 'Boleta Electrónica (A4)'
            case 'factura': return 'Factura Electrónica (A4)'
        }
    }

    interface ReceiptTypeButtonProps {
        type: ComprobanteType
        isSelected: boolean
        onClick: () => void
        icon: React.ReactNode
        label: string
        description: string
    }

    const ReceiptTypeButton: React.FC<ReceiptTypeButtonProps> = ({
        type,
        isSelected,
        onClick,
        icon,
        label,
        description
    }) => {
        const [isHovered, setIsHovered] = React.useState(false)

        return (
            <Button
                variant={isSelected ? "default" : "outline"}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="relative flex flex-col h-auto py-4 gap-2 overflow-hidden group"
            >
                {icon}
                <span className="text-sm font-medium capitalize">{label}</span>

                <div className="w-full overflow-hidden h-5">
                    <div
                        className={cn(
                            "text-xs opacity-70 whitespace-nowrap transition-transform duration-[3000ms] ease-linear",
                            isHovered && description.length > 15 && "animate-marquee"
                        )}
                    >
                        <span>{description}</span>
                        {isHovered && description.length > 15 && (
                            <span className="ml-8">{description}</span>
                        )}
                    </div>
                </div>
            </Button>
        )
    }

    const marqueeStyles = `
  @keyframes marquee {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
  
  .animate-marquee {
    animation: marquee 3s linear infinite;
  }
`

    // Wrapper para updateQuantity que recalcula precios
    const handleUpdateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity === 0) {
            removeFromCart(productId)
            return
        }

        // Buscar el producto para recalcular precio
        const product = products.find(p => p.id === productId)
        if (!product) {
            updateQuantity(productId, newQuantity)
            return
        }

        // Verificar stock
        if (newQuantity > (product.stock || 0)) {
            toast.error(`Stock máximo disponible: ${product.stock || 0}`)
            return
        }

        // Llamar a updateQuantity del padre (POSSystem)
        updateQuantity(productId, newQuantity)
    }

    React.useEffect(() => {
        const styleElement = document.createElement('style')
        styleElement.textContent = marqueeStyles
        document.head.appendChild(styleElement)

        return () => {
            document.head.removeChild(styleElement)
        }
    }, [])




    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {t('pos.checkout.title')}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {businessConfig.name} - RUC: {businessConfig.ruc}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Left Column - Customer Information */}
                    <div className="space-y-6">
                        <Card className="p-4">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {t('app.customer_information')}
                            </h3>

                            <div className="space-y-4 mb-4">
                                <div className="space-y-2">
                                    <Label>{t('app.select_existing_customer')}</Label>
                                    <Select
                                        value={selectedCustomerId}
                                        onValueChange={(value) => {
                                            setSelectedCustomerId(value)
                                            handleSelectExistingCustomer(value)
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('app.select_customer_placeholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map(customer => (
                                                <SelectItem key={customer.id_cliente} value={customer.id_cliente?.toString() || ''}>
                                                    {customer.nombreCompleto} - {customer.dni}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">
                                            {t('app.or_add_new')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* DNI/RUC Search Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">
                                        {receiptType === 'factura' ? 'RUC' : 'DNI'}
                                        {receiptType !== 'ticket' && <span className="text-destructive ml-1">*</span>}
                                    </Label>
                                    <Badge variant="outline" className="text-xs">
                                        {t('app.auto_complete')}
                                    </Badge>
                                </div>

                                <div className="flex space-x-2">
                                    <Input
                                        placeholder={receiptType === 'factura' ? "20123456789" : "12345678"}
                                        value={dniInput}
                                        onChange={(e) => {
                                            const maxLength = receiptType === 'factura' ? 11 : 8
                                            const value = e.target.value.replace(/\D/g, '').slice(0, maxLength)
                                            setDniInput(value)
                                            setCustomerForm(prev => ({ ...prev, dni: value }))
                                        }}
                                        className="font-mono"
                                        maxLength={receiptType === 'factura' ? 11 : 8}
                                        disabled={loadingReniec}
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => consultarDNI(dniInput)}
                                        disabled={
                                            (receiptType === 'factura' ? dniInput.length !== 11 : dniInput.length !== 8) ||
                                            loadingReniec
                                        }
                                        className="whitespace-nowrap"
                                    >
                                        {loadingReniec ? (
                                            <div className="flex items-center space-x-2">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                <span>{t('app.consulting')}</span>
                                            </div>
                                        ) : (
                                            t('app.search_dni')
                                        )}
                                    </Button>
                                </div>

                                <div className="flex items-start space-x-2 text-xs text-muted-foreground">
                                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <p>{t('app.dni_search_info')}</p>
                                </div>
                            </div>

                            {/* Personal Information Fields - Same as before */}
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nombre">
                                        {receiptType === 'factura' ? 'Razón Social' : t('app.first_names')}
                                        {receiptType !== 'ticket' && <span className="text-destructive ml-1">*</span>}
                                    </Label>
                                    <Input
                                        id="nombre"
                                        value={customerForm.nombre || ''}
                                        onChange={(e) => setCustomerForm({ ...customerForm, nombre: e.target.value.toUpperCase() })}
                                        placeholder="JUAN CARLOS"
                                        className="uppercase"
                                        readOnly={loadingReniec}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="apellido_paterno">{t('app.paternal_surname')}</Label>
                                        <Input
                                            id="apellido_paterno"
                                            value={customerForm.apellido_paterno || ''}
                                            onChange={(e) => setCustomerForm({ ...customerForm, apellido_paterno: e.target.value.toUpperCase() })}
                                            placeholder="PÉREZ"
                                            className="uppercase"
                                            readOnly={loadingReniec}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="apellido_materno">{t('app.maternal_surname')}</Label>
                                        <Input
                                            id="apellido_materno"
                                            value={customerForm.apellido_materno || ''}
                                            onChange={(e) => setCustomerForm({ ...customerForm, apellido_materno: e.target.value.toUpperCase() })}
                                            placeholder="GARCÍA"
                                            className="uppercase"
                                            readOnly={loadingReniec}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="direccion">
                                        {t('app.address')}
                                        {receiptType === 'factura' && <span className="text-destructive ml-1">*</span>}
                                    </Label>
                                    <Input
                                        id="direccion"
                                        value={customerForm.direccion || ''}
                                        onChange={(e) => setCustomerForm({ ...customerForm, direccion: e.target.value.toUpperCase() })}
                                        placeholder={t('app.address_placeholder')}
                                        className="uppercase"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="telefono">{t('app.phone')}</Label>
                                        <Input
                                            id="telefono"
                                            value={customerForm.telefono || ''}
                                            onChange={(e) => setCustomerForm({ ...customerForm, telefono: e.target.value })}
                                            placeholder="999 888 777"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="correo">{t('app.email')}</Label>
                                        <Input
                                            id="correo"
                                            type="email"
                                            value={customerForm.correo || ''}
                                            onChange={(e) => setCustomerForm({ ...customerForm, correo: e.target.value.toLowerCase() })}
                                            placeholder="cliente@ejemplo.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>


                        {/* Receipt Type Selection */}
                        <Card className="p-4">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Tipo de Comprobante
                            </h3>

                            <div className="grid grid-cols-3 gap-3">
                                {(['ticket', 'boleta', 'factura'] as ComprobanteType[]).map((type) => (
                                    <ReceiptTypeButton
                                        key={type}
                                        type={type}
                                        isSelected={receiptType === type}
                                        onClick={() => setReceiptType(type)}
                                        icon={getReceiptTypeIcon(type)}
                                        label={type}
                                        description={getReceiptTypeDescription(type)}
                                    />
                                ))}
                            </div>

                            {/* Información adicional según tipo */}
                            {receiptType === 'factura' && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        <strong>Factura Electrónica:</strong> Requiere RUC (11 dígitos), razón social y dirección fiscal.
                                    </p>
                                </div>
                            )}
                            {receiptType === 'boleta' && (
                                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        <strong>Boleta Electrónica:</strong> Requiere DNI (8 dígitos) y nombre completo del cliente.
                                    </p>
                                </div>
                            )}
                            {receiptType === 'ticket' && (
                                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-800 dark:text-gray-200">
                                        <strong>Ticket:</strong> Comprobante simple sin validez tributaria. No requiere datos del cliente.
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column - Order Summary & Payment */}
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <Card className="p-4">
                            <h3 className="font-semibold text-lg mb-4">
                                {t('pos.checkout.order_summary')}
                            </h3>

                            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                                {cartItemsWithProducts.map(({ product, quantity }) => {
                                    const item = cart.find(i => i.id === product.id)
                                    if (!item) return null

                                    return (
                                        <CartItemRow
                                            key={item.id}
                                            item={item}
                                            product={product}
                                            updateQuantity={handleUpdateQuantity}  // ← USA EL WRAPPER
                                            removeFromCart={removeFromCart}
                                            updatePrice={handleUpdatePrice}
                                        />
                                    )
                                })}
                            </div>


                            <div className="space-y-2 border-t pt-4">
                                <div className="flex justify-between text-sm">
                                    <span>{t('pos.checkout.subtotal')}:</span>
                                    <span>{formatCurrency(cartTotals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>{t('pos.checkout.tax')} ({businessConfig.igvRate}%):</span>
                                    <span>{formatCurrency(igv)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>{t('pos.checkout.total')}:</span>
                                    <span>{formatCurrency(totalWithIGV)}</span>
                                </div>
                            </div>

                        </Card>

                        {/* Payment Method */}
                        <Card className="p-4">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                {t('pos.checkout.select_payment_method')}
                            </h3>

                            <div className="space-y-4">
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EFECTIVO">💵 {t('pos.checkout.payment_methods.cash')}</SelectItem>
                                        <SelectItem value="TARJETA">💳 {t('pos.checkout.payment_methods.card')}</SelectItem>
                                        <SelectItem value="TRANSFERENCIA">🏦 {t('pos.checkout.payment_methods.transfer')}</SelectItem>
                                    </SelectContent>
                                </Select>

                                {paymentMethod === 'EFECTIVO' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>{t('pos.checkout.received_amount')}</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={receivedAmount}
                                                onChange={(e) => setReceivedAmount(e.target.value)}
                                                className="text-lg"
                                            />
                                        </div>
                                        {receivedAmount && (
                                            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                                <span className="font-medium">{t('pos.checkout.change')}:</span>
                                                <span className="text-xl font-bold text-green-600">
                                                    {change > 0 ? formatCurrency(change) : '-'}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="flex-1"
                                disabled={processing}
                            >
                                {t('pos.buttons.cancel')}
                            </Button>
                            <Button
                                onClick={handleProcessPayment}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                disabled={
                                    processing ||
                                    (paymentMethod === 'EFECTIVO' && parseFloat(receivedAmount) < totalWithIGV)
                                }
                            >
                                {processing ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>{t('pos.checkout.buttons.processing')}</span>
                                    </div>
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        {t('pos.checkout.buttons.process')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}