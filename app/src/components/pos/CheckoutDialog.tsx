import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Minus, Plus, CreditCard, User, Loader2, AlertCircle, Receipt, FileText } from 'lucide-react'
import {
    Dialog,
    DialogContent,
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

type CartItem = {
    id: number
    name: string
    nameKey: string
    price: number
    quantity: number
    productIcon?: string
}

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
    updateQuantity: (productId: number, newQuantity: number) => void
    removeFromCart: (productId: number) => void
    onProcessPayment: (checkoutData: any) => void
}

export default function CheckoutDialog({
    open,
    onOpenChange,
    cart,
    updateQuantity,
    removeFromCart,
    onProcessPayment
}: CheckoutDialogProps) {
    const { t } = useTranslation()
    const [paymentMethod, setPaymentMethod] = useState<string>('cash')
    const [receivedAmount, setReceivedAmount] = useState<string>('')
    const [processing, setProcessing] = useState(false)

    // Receipt type state
    const [receiptType, setReceiptType] = useState('ticket')

    // Customer form states
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

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.18 // 18% IGV
    const total = subtotal + tax
    const change = receivedAmount ? Math.max(0, parseFloat(receivedAmount) - total) : 0

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
        if (dni.length !== 8) {
            toast.error(t('app.dni_must_be_8_digits'))
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
        if (receiptType === 'invoice') {
            if (!customerForm.nombre?.trim()) {
                toast.error(t('app.name_required_for_invoice'))
                return false
            }
            if (!customerForm.dni?.trim()) {
                toast.error(t('app.document_required_for_invoice'))
                return false
            }
            if (!customerForm.direccion?.trim()) {
                toast.error(t('app.address_required_for_invoice'))
                return false
            }
        } else if (receiptType === 'receipt') {
            if (!customerForm.nombre?.trim()) {
                toast.error(t('app.name_required_for_receipt'))
                return false
            }
        }
        return true
    }

    const handleProcessPayment = async () => {
        if (!validateForm()) {
            return
        }

        if (!customerForm.dni?.trim() || !customerForm.nombre?.trim()) {
            toast.error(t('app.fill_required_fields'))
            return
        }

        if (paymentMethod === 'cash' && parseFloat(receivedAmount) < total) {
            toast.error(t('pos.insufficient_amount'))
            return
        }

        setProcessing(true)
        try {
            // Save customer if new
            let customerId = selectedCustomerId
            if (!customerId && customerForm.dni) {
                const newCustomerId = await saveCustomer()
                if (newCustomerId) {
                    customerId = newCustomerId.toString()
                }
            }

            const checkoutData = {
                cart,
                customer: customerForm,
                customerId,
                receiptType, // Added receipt type
                paymentMethod,
                subtotal,
                tax,
                total,
                receivedAmount: paymentMethod === 'cash' ? parseFloat(receivedAmount) : total,
                change: paymentMethod === 'cash' ? change : 0,
                timestamp: new Date().toISOString()
            }

            await onProcessPayment(checkoutData)

            // Reset form
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
            setPaymentMethod('cash')
            setReceivedAmount('')
            setReceiptType('ticket')

            onOpenChange(false)
        } catch (error) {
            console.error('Payment processing failed:', error)
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

    const getReceiptTypeIcon = (type: string) => {
        switch (type) {
            case 'ticket': return <Receipt className="w-4 h-4" />
            case 'receipt': return <FileText className="w-4 h-4" />
            case 'invoice': return <CreditCard className="w-4 h-4" />
            default: return <Receipt className="w-4 h-4" />
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {t('pos.checkout.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Left Column - Customer Information */}
                    <div className="space-y-6">
                        <Card className="p-4">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {t('app.customer_information')}
                            </h3>

                            {/* Select Existing Customer */}
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

                            {/* DNI Search Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">
                                        {t('app.dni')}
                                        {receiptType === 'invoice' && <span className="text-destructive ml-1">*</span>}
                                    </Label>
                                    <Badge variant="outline" className="text-xs">
                                        {t('app.auto_complete')}
                                    </Badge>
                                </div>

                                <div className="flex space-x-2">
                                    <Input
                                        placeholder="12345678"
                                        value={dniInput}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                                            setDniInput(value)
                                            setCustomerForm(prev => ({ ...prev, dni: value }))
                                        }}
                                        className="font-mono"
                                        maxLength={8}
                                        disabled={loadingReniec}
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => consultarDNI(dniInput)}
                                        disabled={dniInput.length !== 8 || loadingReniec}
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

                            {/* Personal Information */}
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nombre">
                                        {t('app.first_names')}
                                        {(receiptType === 'invoice' || receiptType === 'receipt') &&
                                            <span className="text-destructive ml-1">*</span>
                                        }
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
                                        <Label htmlFor="direccion">{t('app.address')}</Label>
                                        <Input
                                            id="direccion"
                                            value={customerForm.direccion || ''}
                                            onChange={(e) => setCustomerForm({ ...customerForm, direccion: e.target.value.toUpperCase() })}
                                            placeholder={t('app.address_placeholder')}
                                            className="uppercase"
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
                                {t('pos.checkout.receipt_type.title')}
                            </h3>

                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'ticket', label: t('pos.checkout.receipt_type.ticket') },
                                    { value: 'receipt', label: t('pos.checkout.receipt_type.receipt') },
                                    { value: 'invoice', label: t('pos.checkout.receipt_type.invoice') }
                                ].map((type) => (
                                    <Button
                                        key={type.value}
                                        variant={receiptType === type.value ? "default" : "outline"}
                                        onClick={() => setReceiptType(type.value)}
                                        className="flex flex-col h-auto py-4 gap-2"
                                    >
                                        {getReceiptTypeIcon(type.value)}
                                        <span className="text-sm font-medium">{type.label}</span>
                                    </Button>
                                ))}
                            </div>

                            {receiptType === 'invoice' && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        <strong>{t('pos.checkout.receipt_type.invoice')}:</strong> {t('app.invoice_requirements')}
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
                                {cart.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm truncate">
                                                {t(item.nameKey, item.name)}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">
                                                ${item.price.toFixed(2)} × {item.quantity}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-6 w-6 p-0"
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </Button>
                                            <span className="w-6 text-center text-sm">{item.quantity}</span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-6 w-6 p-0"
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 text-destructive"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <div className="font-semibold text-sm">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <div className="flex justify-between text-sm">
                                    <span>{t('pos.checkout.subtotal')}:</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>{t('pos.checkout.tax')} (18%):</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2">
                                    <span>{t('pos.checkout.total')}:</span>
                                    <span>${total.toFixed(2)}</span>
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
                                        <SelectItem value="cash">💵 {t('pos.checkout.payment_methods.cash')}</SelectItem>
                                        <SelectItem value="card">💳 {t('pos.checkout.payment_methods.card')}</SelectItem>
                                        <SelectItem value="transfer">🏦 {t('pos.checkout.payment_methods.transfer')}</SelectItem>
                                    </SelectContent>
                                </Select>

                                {paymentMethod === 'cash' && (
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
                                                    ${change.toFixed(2)}
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
                                    !customerForm.dni?.trim() ||
                                    !customerForm.nombre?.trim() ||
                                    (paymentMethod === 'cash' && parseFloat(receivedAmount) < total)
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