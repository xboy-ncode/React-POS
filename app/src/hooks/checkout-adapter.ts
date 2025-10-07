// lib/checkout-adapter.ts
import { ventasService, productosService } from '@/lib/api-client'

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
        // Mapear método de pago al formato del backend
        const paymentMethodMap: Record<string, string> = {
            'cash': 'EFECTIVO',
            'card': 'TARJETA',
            'transfer': 'TRANSFERENCIA',
            'yape': 'YAPE',
            'plin': 'PLIN'
        }

        // Preparar datos de la venta
        const ventaData = {
            id_cliente: checkoutData.customerId ? parseInt(checkoutData.customerId) : null,
            metodo_pago: paymentMethodMap[checkoutData.paymentMethod] || 'EFECTIVO',
            moneda: 'PEN', // Puedes hacerlo dinámico si lo necesitas
            productos: checkoutData.cart.map(item => ({
                id_producto: item.id,
                cantidad: item.quantity,
                precio_unitario: item.price
            }))
        }

        // Crear la venta
        const response = await ventasService.create(ventaData)

        // Retornar datos de la venta creada
        return {
            success: true,
            venta: response.venta,
            message: `Venta #${response.venta.id_venta} registrada exitosamente`
        }

    } catch (error: any) {
        console.error('Error al procesar checkout:', error)

        // Manejar errores específicos del backend
        let errorMessage = 'Error al procesar la venta'

        if (error.response?.data?.error) {
            errorMessage = error.response.data.error

            // Traducir errores comunes
            if (errorMessage.includes('Stock insuficiente')) {
                errorMessage = 'Stock insuficiente para uno o más productos'
            } else if (errorMessage.includes('Cliente no encontrado')) {
                errorMessage = 'Cliente no encontrado'
            } else if (errorMessage.includes('Producto') && errorMessage.includes('no encontrado')) {
                errorMessage = 'Uno o más productos no están disponibles'
            }
        }

        throw new Error(errorMessage)
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