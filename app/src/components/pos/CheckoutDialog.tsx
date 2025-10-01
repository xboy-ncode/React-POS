// CheckoutDialog.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, FileText, Receipt, CreditCard, Minus, Plus, X, ShoppingCart, Loader2 } from 'lucide-react';

// Mock data para simular respuesta de RENIEC
const mockReniecData = {
    '12345678': {
        dni: '12345678',
        nombres: 'JUAN CARLOS',
        apellidos: 'PÉREZ GARCÍA',
        nombreCompleto: 'PÉREZ GARCÍA, JUAN CARLOS',
        fechaNacimiento: '1985-03-15',
        sexo: 'M',
        estadoCivil: 'SOLTERO',
        direccion: 'AV. AREQUIPA 1234 - LIMA - LIMA - PERÚ',
        telefono: '999888777',
        email: 'juan.perez@ejemplo.com'
    },
    '87654321': {
        dni: '87654321',
        nombres: 'MARÍA ELENA',
        apellidos: 'RODRIGUEZ LÓPEZ',
        nombreCompleto: 'RODRIGUEZ LÓPEZ, MARÍA ELENA',
        fechaNacimiento: '1990-07-22',
        sexo: 'F',
        estadoCivil: 'CASADA',
        direccion: 'JR. CUSCO 567 - CALLAO - CALLAO - PERÚ',
        telefono: '988777666',
        email: 'maria.rodriguez@ejemplo.com'
    },
    '11111111': {
        dni: '11111111',
        nombres: 'CARLOS ALBERTO',
        apellidos: 'MENDOZA SILVA',
        nombreCompleto: 'MENDOZA SILVA, CARLOS ALBERTO',
        fechaNacimiento: '1975-12-03',
        sexo: 'M',
        estadoCivil: 'DIVORCIADO',
        direccion: 'CAL. LAS FLORES 890 - AREQUIPA - AREQUIPA - PERÚ',
        telefono: '977666555',
        email: 'carlos.mendoza@ejemplo.com'
    }
};

type CartItem = {
    id: string | number;
    name: string;
    nameKey?: string;
    price: number;
    quantity: number;
};

type CheckoutDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cart?: CartItem[];
    updateQuantity?: (id: string | number, quantity: number) => void;
    removeFromCart?: (id: string | number) => void;
    onProcessPayment?: (data: any) => void;
};

type Errors = {
    name?: string;
    document?: string;
    address?: string;
    [key: string]: string | undefined;
};

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
    open,
    onOpenChange,
    cart = [],
    updateQuantity,
    removeFromCart,
    onProcessPayment
}) => {
    const { t } = useTranslation();

    const [customerData, setCustomerData] = useState({
        name: '',
        email: '',
        phone: '',
        document: '',
        address: '',
        notes: ''
    });

    const [receiptType, setReceiptType] = useState('ticket');
    const [errors, setErrors] = useState<Errors>({});
    const [loadingReniec, setLoadingReniec] = useState(false);
    const [dniInput, setDniInput] = useState('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    // Simular consulta a RENIEC
    const consultarReniec = async (dni: string) => {
        if (dni.length !== 8) return;

        setLoadingReniec(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const reniecData = mockReniecData[dni as keyof typeof mockReniecData];
            
            if (reniecData) {
                setCustomerData(prev => ({
                    ...prev,
                    document: reniecData.dni,
                    name: reniecData.nombreCompleto,
                    address: reniecData.direccion,
                    phone: reniecData.telefono || '',
                    email: reniecData.email || ''
                }));
                
                // Limpiar errores
                setErrors({});
            } else {
                alert(t('app.dni_not_found'));
            }
        } catch (error) {
            console.error('Error consultando RENIEC:', error);
            alert(t('app.reniec_error'));
        } finally {
            setLoadingReniec(false);
        }
    };

    // Simular consulta a BD
    const consultarBD = async (dni: string) => {
        if (dni.length !== 8) return;

        setLoadingReniec(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const bdData = mockReniecData[dni as keyof typeof mockReniecData];
            
            if (bdData) {
                setCustomerData(prev => ({
                    ...prev,
                    document: bdData.dni,
                    name: bdData.nombreCompleto,
                    address: bdData.direccion,
                    phone: bdData.telefono || '',
                    email: bdData.email || ''
                }));
                
                setErrors({});
            } else {
                alert(t('app.dni_not_found'));
            }
        } catch (error) {
            console.error('Error consultando BD:', error);
            alert(t('app.reniec_error'));
        } finally {
            setLoadingReniec(false);
        }
    };

    const validateForm = () => {
        const newErrors: Errors = {};

        if (receiptType === 'invoice') {
            if (!customerData.name.trim()) newErrors.name = t('app.required');
            if (!customerData.document.trim()) newErrors.document = t('app.required');
            if (!customerData.address.trim()) newErrors.address = t('app.required');
        } else if (receiptType === 'receipt') {
            if (!customerData.name.trim()) newErrors.name = t('app.required');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof typeof customerData, value: string) => {
        setCustomerData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const handleProcessPayment = () => {
        if (validateForm()) {
            onProcessPayment?.({
                customer: customerData,
                receiptType,
                cart,
                total,
                subtotal,
                tax
            });
        }
    };

    const getReceiptTypeIcon = (type: string) => {
        switch (type) {
            case 'ticket': return <Receipt className="w-4 h-4" />;
            case 'receipt': return <FileText className="w-4 h-4" />;
            case 'invoice': return <CreditCard className="w-4 h-4" />;
            default: return <Receipt className="w-4 h-4" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-3xl lg:max-w-5xl h-[80vh] max-h-[90vh] overflow-y-auto custom-scrollbar bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <ShoppingCart className="w-5 h-5" />
                        {t('pos.checkout.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Customer Data and Receipt Type */}
                    <div className="space-y-6">
                        {/* Customer Data */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <User className="w-4 h-4" />
                                    {t('pos.checkout.customer.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* DNI Section with Buttons */}
                                <div className="space-y-2">
                                    <Label htmlFor="document" className="flex items-center justify-between">
                                        <span>
                                            {t('pos.checkout.customer.document')}
                                            {receiptType === 'invoice' && <span className="text-red-500 ml-1">*</span>}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                            {t('app.auto_complete')}
                                        </Badge>
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="document"
                                            placeholder="12345678"
                                            value={dniInput}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                setDniInput(value);
                                                handleInputChange('document', value);
                                            }}
                                            className={`font-mono ${errors.document ? 'border-red-500' : ''}`}
                                            maxLength={8}
                                            disabled={loadingReniec}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            
                                            onClick={() => consultarReniec(dniInput)}
                                            disabled={dniInput.length !== 8 || loadingReniec}
                                            className="whitespace-nowrap flex-1"
                                        >
                                            {loadingReniec ? (
                                                <div className="flex items-center space-x-2">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    <span>{t('app.consulting')}</span>
                                                </div>
                                            ) : (
                                                t('app.consult_reniec')
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => consultarBD(dniInput)}
                                            disabled={dniInput.length !== 8 || loadingReniec}
                                            className="whitespace-nowrap flex-1"
                                        >
                                            {t('app.manual_entry')}
                                        </Button>
                                    </div>
                                    {errors.document && <p className="text-sm text-red-500">{errors.document}</p>}
                                </div>

                                {/* Name Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        {t('pos.checkout.customer.name')}
                                        {(receiptType === 'invoice' || receiptType === 'receipt') && 
                                            <span className="text-red-500 ml-1">*</span>
                                        }
                                    </Label>
                                    <Input
                                        id="name"
                                        value={customerData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value.toUpperCase())}
                                        className={`uppercase ${errors.name ? 'border-red-500' : ''}`}
                                        readOnly={loadingReniec}
                                        placeholder="JUAN PÉREZ GARCÍA"
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                {/* Email and Phone */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t('pos.checkout.customer.email')}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={customerData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
                                            placeholder="cliente@ejemplo.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">{t('pos.checkout.customer.phone')}</Label>
                                        <Input
                                            id="phone"
                                            value={customerData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            placeholder="999 888 777"
                                        />
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="space-y-2">
                                    <Label htmlFor="address">
                                        {t('pos.checkout.customer.address')}
                                        {receiptType === 'invoice' && <span className="text-red-500 ml-1">*</span>}
                                    </Label>
                                    <Input
                                        id="address"
                                        value={customerData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value.toUpperCase())}
                                        className={`uppercase ${errors.address ? 'border-red-500' : ''}`}
                                        readOnly={loadingReniec}
                                        placeholder="AV. PRINCIPAL 123"
                                    />
                                    {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">{t('pos.checkout.customer.notes')}</Label>
                                    <Textarea
                                        id="notes"
                                        value={customerData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        rows={3}
                                        placeholder={t('pos.checkout.customer.notes')}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Receipt Type */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="w-4 h-4" />
                                    {t('pos.checkout.receipt_type.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                                            <strong>Factura:</strong> Requiere nombre completo, documento y dirección del cliente.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Cart Summary */}
                    <div>
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <ShoppingCart className="w-4 h-4" />
                                        {t('pos.checkout.cart.title')}
                                    </CardTitle>
                                    <Badge variant="secondary">
                                        {t('pos.checkout.cart.items_count', { count: cart.length })}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {cart.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-4">🛒</div>
                                        <p className="text-muted-foreground">{t('pos.checkout.cart.empty')}</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                                            {cart.map(item => (
                                                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-sm truncate">
                                                            {t(item.nameKey || '', { defaultValue: item.name })}
                                                        </h4>
                                                        <p className="text-muted-foreground text-xs">
                                                            {t('pos.checkout.cart.price_each', { price: item.price.toFixed(2) })}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => updateQuantity?.(item.id, item.quantity - 1)}
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </Button>
                                                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => updateQuantity?.(item.id, item.quantity + 1)}
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-6 w-6 p-0 ml-1"
                                                            onClick={() => removeFromCart?.(item.id)}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <Separator className="my-4" />

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>{t('pos.checkout.cart.subtotal')}:</span>
                                                <span>${subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>{t('pos.checkout.cart.tax')} (18%):</span>
                                                <span>${tax.toFixed(2)}</span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between font-bold text-lg">
                                                <span>{t('pos.checkout.cart.total')}:</span>
                                                <span>${total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('pos.checkout.buttons.cancel')}
                    </Button>
                    <Button
                        onClick={handleProcessPayment}
                        disabled={cart.length === 0 || loadingReniec}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {t('pos.checkout.buttons.process')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CheckoutDialog;