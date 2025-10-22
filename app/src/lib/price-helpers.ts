// lib/price-helpers.ts
import type { Product, PriceCalculation, PriceBadge } from '@/types/pos'

/**
 * Calcula el precio correcto según cantidad, ofertas y tipo de venta
 */
export function calcularPrecioProducto(
    product: Product,
    quantity: number = 1
): PriceCalculation {
    let precioBase = product.precioVentaMinorista || product.price
    let precioFinal = precioBase
    let esOferta = false
    let esMayorista = false
    let descuento = 0

    // 1. Verificar si aplica oferta
    if (product.enOferta && product.precioOferta) {
        precioFinal = product.precioOferta
        descuento = ((precioBase - precioFinal) / precioBase) * 100
        esOferta = true
    }
    // 2. Verificar si aplica precio mayorista (solo si no hay oferta)
    else if (
        product.precioVentaMayorista &&
        quantity >= (product.cantidadMinimaMayorista || 1)
    ) {
        precioFinal = product.precioVentaMayorista
        descuento = ((precioBase - precioFinal) / precioBase) * 100
        esMayorista = true
    }

    const ahorro = (precioBase - precioFinal) * quantity

    return {
        precioBase,
        precioFinal,
        descuento: descuento > 0 ? descuento : undefined,
        esOferta,
        esMayorista,
        ahorro: ahorro > 0 ? ahorro : undefined
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