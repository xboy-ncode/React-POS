// lib/price-helpers.ts
import type { Product, PriceCalculation, PriceBadge } from '@/types/pos'

/**
 * Calcula el precio correcto según cantidad, ofertas y tipo de venta
 * ✅ MODIFICADO: Descuentos acumulativos solo si mejoran el precio
 */
// lib/price-helpers.ts
export function calcularPrecioProducto(
    product: Product,
    quantity: number = 1
): PriceCalculation {
    const precioBase = product.precioVentaMinorista || product.price
    let precioFinal = precioBase
    let esOferta = false
    let esMayorista = false
    let descuento = 0
    let montoDescuentoOferta = 0
    let montoDescuentoMayorista = 0

    // 1. Calcular descuento de oferta (SIEMPRE desde precio base)
    if (product.enOferta && product.precioOferta) {
        montoDescuentoOferta = precioBase - product.precioOferta
        esOferta = true
    }

    // 2. Calcular descuento mayorista (SIEMPRE desde precio base)
    if (
        product.precioVentaMayorista &&
        quantity >= (product.cantidadMinimaMayorista || 1)
    ) {
        montoDescuentoMayorista = precioBase - product.precioVentaMayorista
        esMayorista = true
    }

    // 3. Aplicar descuentos de forma acumulativa
    if (esOferta && esMayorista) {
        // Ambos descuentos activos: aplicar el mayor y sumar la diferencia del menor
        if (montoDescuentoMayorista > montoDescuentoOferta) {
            // Mayorista es mejor: aplicar mayorista completo
            precioFinal = precioBase - montoDescuentoMayorista
        } else {
            // Oferta es mejor o igual: aplicar oferta completo
            precioFinal = precioBase - montoDescuentoOferta
            // Ajustar descuento mayorista para que no sobrepase
            montoDescuentoMayorista = Math.max(0, montoDescuentoMayorista)
        }
    } else if (esOferta) {
        // Solo oferta
        precioFinal = precioBase - montoDescuentoOferta
        montoDescuentoMayorista = 0
    } else if (esMayorista) {
        // Solo mayorista
        precioFinal = precioBase - montoDescuentoMayorista
        montoDescuentoOferta = 0
    }

    // No permitir precios negativos
    precioFinal = Math.max(0.01, precioFinal)

    // Calcular descuento total en porcentaje
    const descuentoTotal = precioBase - precioFinal
    descuento = descuentoTotal > 0 ? ((descuentoTotal / precioBase) * 100) : 0

    const ahorro = descuentoTotal * quantity

    return {
        precioBase,
        precioFinal,
        descuento: descuento > 0 ? descuento : undefined,
        esOferta,
        esMayorista,
        ahorro: ahorro > 0 ? ahorro : undefined,
        montoDescuentoOferta,
        montoDescuentoMayorista
    }
}
/**
 * Calcula el margen de ganancia
 */
export function calcularMargen(precioCompra: number, precioVenta: number): number {
    if (precioCompra <= 0) return 0
    return ((precioVenta - precioCompra) / precioCompra) * 100
}

/**
 * Calcula el precio de venta basado en el precio de compra y margen
 */
export function calcularPrecioVenta(precioCompra: number, margenPorcentaje: number): number {
    return precioCompra * (1 + margenPorcentaje / 100)
}

/**
 * Calcula el precio con descuento aplicado
 */
export function aplicarDescuento(precio: number, descuentoPorcentaje: number): number {
    return precio * (1 - descuentoPorcentaje / 100)
}

/**
 * Formatea un precio para mostrar
 */
export function formatearPrecio(precio: number, moneda: string = 'PEN'): string {
    const simbolos: Record<string, string> = {
        PEN: 'S/.',
        USD: '$',
        EUR: '€'
    }
    
    return `${simbolos[moneda] || moneda} ${precio.toFixed(2)}`
}

/**
 * Obtiene el badge de información de precio (oferta/mayorista)
 */
export function obtenerBadgePrecio(product: Product, quantity: number = 1): PriceBadge | null {
    const calculo = calcularPrecioProducto(product, quantity)
    
    if (calculo.esOferta && calculo.descuento) {
        return {
            texto: `OFERTA -${calculo.descuento.toFixed(0)}%`,
            tipo: 'oferta',
            ahorro: calculo.ahorro || 0
        }
    }
    
    if (calculo.esMayorista && calculo.descuento) {
        return {
            texto: `MAYORISTA -${calculo.descuento.toFixed(0)}%`,
            tipo: 'mayorista',
            ahorro: calculo.ahorro || 0
        }
    }
    
    return null
}

/**
 * Valida que los precios sean coherentes
 */
export function validarPrecios(data: {
    precioCompra: number
    precioVentaMinorista: number
    precioVentaMayorista?: number | null
    precioOferta?: number | null
}): { valido: boolean; errores: string[] } {
    const errores: string[] = []
    
    // Validar que precio de venta sea mayor que precio de compra
    if (data.precioVentaMinorista <= data.precioCompra) {
        errores.push('El precio de venta minorista debe ser mayor que el precio de compra')
    }
    
    // Validar precio mayorista
    if (data.precioVentaMayorista !== null && data.precioVentaMayorista !== undefined) {
        if (data.precioVentaMayorista <= data.precioCompra) {
            errores.push('El precio mayorista debe ser mayor que el precio de compra')
        }
        if (data.precioVentaMayorista >= data.precioVentaMinorista) {
            errores.push('El precio mayorista debe ser menor que el precio minorista')
        }
    }
    
    // Validar precio de oferta
    if (data.precioOferta !== null && data.precioOferta !== undefined) {
        if (data.precioOferta <= 0) {
            errores.push('El precio de oferta debe ser mayor que cero')
        }
        if (data.precioOferta >= data.precioVentaMinorista) {
            errores.push('El precio de oferta debe ser menor que el precio minorista')
        }
    }
    
    return {
        valido: errores.length === 0,
        errores
    }
}

/**
 * Calcula el total del carrito considerando ofertas y precios mayoristas
 */
export function calcularTotalCarrito(items: Array<{
    product: Product
    quantity: number
}>): {
    subtotal: number
    descuentos: number
    total: number
    itemsConDescuento: number
} {
    let subtotal = 0
    let descuentos = 0
    let itemsConDescuento = 0
    
    items.forEach(({ product, quantity }) => {
        const calculo = calcularPrecioProducto(product, quantity)
        const subtotalItem = calculo.precioBase * quantity
        const totalItem = calculo.precioFinal * quantity
        
        subtotal += subtotalItem
        descuentos += (subtotalItem - totalItem)
        
        if (calculo.esOferta || calculo.esMayorista) {
            itemsConDescuento++
        }
    })
    
    return {
        subtotal,
        descuentos,
        total: subtotal - descuentos,
        itemsConDescuento
    }
}

/**
 * Obtiene el texto descriptivo del tipo de precio aplicado
 */
export function obtenerDescripcionPrecio(product: Product, quantity: number): string {
    const calculo = calcularPrecioProducto(product, quantity)
    
    if (calculo.esOferta && calculo.esMayorista) {
        return `Oferta + Mayorista (${calculo.descuento?.toFixed(0)}% desc. total)`
    }
    
    if (calculo.esOferta) {
        return `En oferta (${calculo.descuento?.toFixed(0)}% desc.)`
    }
    
    if (calculo.esMayorista) {
        return `Precio mayorista (${quantity} unidades)`
    }
    
    return 'Precio normal'
}

/**
 * Verifica si un producto califica para precio mayorista con la cantidad dada
 */
export function calificaParaMayorista(product: Product, quantity: number): boolean {
    return (
        product.precioVentaMayorista !== null &&
        product.precioVentaMayorista !== undefined &&
        quantity >= (product.cantidadMinimaMayorista || 1)
    )
}

/**
 * Calcula cuántas unidades faltan para precio mayorista
 */
export function unidadesParaMayorista(product: Product, currentQuantity: number): number | null {
    if (!product.precioVentaMayorista || !product.cantidadMinimaMayorista) {
        return null
    }
    
    const faltantes = product.cantidadMinimaMayorista - currentQuantity
    return faltantes > 0 ? faltantes : 0
}