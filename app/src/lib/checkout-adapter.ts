// lib/checkout-adapter.ts
import { ventasService, productosService, invoiceService } from '@/lib/api-client'
import { getNextInvoiceNumber } from '@/utils/invoiceUtils'

type CartItem = {
    id: number
    name: string
    nameKey: string
    price: number
    quantity: number
    productIcon?: string
}

type CheckoutData = {
    cart: CartItem[]
    customer: any
    customerId?: string
    receiptType: string
    paymentMethod: string
    subtotal: number
    tax: number
    total: number
    receivedAmount: number
    change: number
    timestamp: string
}

/**
 * Procesa el pago y crea la venta en el backend
 */
export async function processCheckout(checkoutData: CheckoutData) {
    try {
        const paymentMethodMap: Record<string, string> = {
            'cash': 'EFECTIVO',
            'card': 'TARJETA',
            'transfer': 'TRANSFERENCIA',
            'yape': 'YAPE',
            'plin': 'PLIN'
        }

        // 1️⃣ Crear la venta
        const ventaData = {
            id_cliente: checkoutData.customerId ? parseInt(checkoutData.customerId) : null,
            metodo_pago: paymentMethodMap[checkoutData.paymentMethod] || 'EFECTIVO',
            moneda: 'PEN',
            productos: checkoutData.cart.map(item => ({
                id_producto: item.id,
                cantidad: item.quantity,
                precio_unitario: item.price
            }))
        }

        const ventaResponse = await ventasService.create(ventaData)
        const venta = ventaResponse.venta

        // 2️⃣ Determinar serie y número de factura
        const serie = checkoutData.receiptType === 'factura' ? 'F001' : 'B001'
        const numero = await getNextInvoiceNumber(serie)

        // 3️⃣ Crear la factura
        const facturaData = {
            id_venta: venta.id_venta,
            serie,
            numero,
            ruc_emisor: '12345678901',
            razon_social_emisor: 'Mi Empresa SAC',
            direccion_emisor: 'Av. Siempre Viva 123',
            ruc_receptor: null,
            dni_receptor: checkoutData.customer?.dni || null,
            razon_social_receptor: `${checkoutData.customer?.nombre || ''} ${checkoutData.customer?.apellido_paterno || ''}`.trim(),
            direccion_receptor: checkoutData.customer?.direccion || '',
        }

        const facturaResponse = await invoiceService.create(facturaData)

        return {
            success: true,
            venta,
            factura: facturaResponse.factura,
            message: `Factura ${facturaResponse.factura.serie}-${facturaResponse.factura.numero} creada exitosamente`
        }

    } catch (error: any) {
        console.error('Error al procesar checkout:', error)
        throw new Error(error.response?.data?.error || 'Error al procesar la venta')
    }
}

/**
 * Valida el stock disponible antes del checkout
 */
export async function validateStock(cartItems: CartItem[]): Promise<{
    valid: boolean
    errors: string[]
}> {
    const errors: string[] = []

    try {
        // Obtener información de productos
        for (const item of cartItems) {
            try {
                const producto = await productosService.getById(item.id)

                if (!producto) {
                    errors.push(`Producto "${item.name}" no encontrado`)
                    continue
                }

                if (!producto.activo) {
                    errors.push(`Producto "${item.name}" no está disponible`)
                    continue
                }

                if (producto.stock < item.quantity) {
                    errors.push(
                        `Stock insuficiente para "${item.name}". ` +
                        `Disponible: ${producto.stock}, Solicitado: ${item.quantity}`
                    )
                }
            } catch (error) {
                errors.push(`Error al validar "${item.name}"`)
            }
        }

        return {
            valid: errors.length === 0,
            errors
        }
    } catch (error) {
        console.error('Error al validar stock:', error)
        return {
            valid: false,
            errors: ['Error al validar el stock de los productos']
        }
    }
}