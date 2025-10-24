// lib/price-calculator.ts
import {
    calcularPrecioProducto,
    obtenerBadgePrecio,
    formatearPrecio,
    calificaParaMayorista,
    unidadesParaMayorista
} from '@/lib/price-helpers'
import type { Product } from '@/types/pos'

export function calculatePriceData(product: Product, quantity: number = 1) {
    const priceCalculation = calcularPrecioProducto(product, quantity)
    const badgeInfo = obtenerBadgePrecio(product, quantity)

    const formattedPrices = {
        precioBase: formatearPrecio(priceCalculation.precioBase, 'PEN'),
        precioFinal: formatearPrecio(priceCalculation.precioFinal, 'PEN'),
        ahorro: priceCalculation.ahorro
            ? formatearPrecio(priceCalculation.ahorro, 'PEN')
            : null
    }

    const calificaMayorista = calificaParaMayorista(product, quantity)
    const unidadesFaltantes = unidadesParaMayorista(product, quantity)
    const totalPrice = priceCalculation.precioFinal * quantity
    const formattedTotal = formatearPrecio(totalPrice, 'PEN')

    return {
        priceCalculation, // Ya incluye montoDescuentoOferta y montoDescuentoMayorista
        totalPrice,
        formattedPrices,
        formattedTotal,
        priceBadge: badgeInfo,
        calificaMayorista,
        unidadesFaltantes,
        hasDiscount: priceCalculation.esOferta || priceCalculation.esMayorista,
        discountPercentage: priceCalculation.descuento,
        isOnSale: priceCalculation.esOferta,
        isWholesale: priceCalculation.esMayorista
    }
}

/**
 * Calcula el precio final con un precio base personalizado
 * 
 * LÓGICA ACTUALIZADA:
 * 1. Calcula los descuentos absolutos del precio original
 * 2. Suma todos los descuentos absolutos
 * 3. Resta la suma de descuentos del precio personalizado
 * 
 * Ejemplo:
 * - Precio original: 10
 * - Precio oferta: 8 (descuento de 2)
 * - Precio mayorista: 7 (descuento de 3)
 * - Total descuentos: 2 + 3 = 5
 * - Si precio personalizado = 6, precio final = 6 - 5 = 1
 */
export function calculatePriceWithCustomBase(
    product: Product, 
    quantity: number, 
    customBasePrice: number
) {
    // Obtener información de precios del producto
    const priceInfo = calculatePriceData(product, quantity)
    
    // Calcular los descuentos absolutos sobre el precio base ORIGINAL
    let totalDescuentosAbsolutos = 0
    let discounts = {
        oferta: 0,
        mayorista: 0
    }

    // Obtener precio base original del producto
    const precioBaseOriginal = product.precioVentaMinorista || product.price

    // 1. Calcular descuento de oferta si está activo
    if (product.enOferta && product.precioOferta) {
        // Descuento absoluto de la oferta respecto al precio original
        discounts.oferta = precioBaseOriginal - product.precioOferta
        totalDescuentosAbsolutos += discounts.oferta
    }

    // 2. Calcular descuento mayorista si califica
    if (product.precioVentaMayorista && quantity >= (product.cantidadMinimaMayorista || 1)) {
        // Descuento absoluto del mayorista respecto al precio original
        // Solo si el precio mayorista es mejor que el precio después de oferta
        const precioTrasDctoOferta = product.enOferta && product.precioOferta 
            ? product.precioOferta 
            : precioBaseOriginal
            
        if (product.precioVentaMayorista < precioTrasDctoOferta) {
            // Calcular el descuento mayorista desde el precio base original
            discounts.mayorista = precioBaseOriginal - product.precioVentaMayorista
            // Si ya hay oferta, ajustar para no duplicar descuentos
            if (discounts.oferta > 0) {
                // El descuento mayorista adicional es la diferencia entre el precio con oferta y el mayorista
                discounts.mayorista = precioTrasDctoOferta - product.precioVentaMayorista
            }
            totalDescuentosAbsolutos += discounts.mayorista
        }
    }

    // 3. Aplicar la suma de descuentos al precio personalizado
    let finalPrice = customBasePrice - totalDescuentosAbsolutos

    // No permitir precios negativos o cero
    finalPrice = Math.max(0.01, finalPrice)

    // console.log('📊 Cálculo precio personalizado:', {
    //     precioBaseOriginal,
    //     customBasePrice,
    //     descuentoOferta: discounts.oferta,
    //     descuentoMayorista: discounts.mayorista,
    //     totalDescuentosAbsolutos,
    //     formulaAplicada: `${customBasePrice} - ${totalDescuentosAbsolutos} = ${finalPrice}`,
    //     finalPrice
    // })

    return {
        basePrice: customBasePrice,
        finalPrice,
        discounts,
        totalDiscount: totalDescuentosAbsolutos,
        isOnSale: product.enOferta || false,
        isWholesale: quantity >= (product.cantidadMinimaMayorista || 999999)
    }
}

/**
 * Función alternativa: Calcula descuentos como se suman del precio base original
 * Esta es la implementación exacta que solicitaste
 */
export function calculatePriceWithCustomBaseV2(
    product: Product, 
    quantity: number, 
    customBasePrice: number
) {
    const precioBase = product.precioVentaMinorista || product.price
    let descuentoOfertaAbsoluto = 0
    let descuentoMayoristaAbsoluto = 0
    
    // Calcular descuento de oferta (precio base - precio oferta)
    if (product.enOferta && product.precioOferta) {
        descuentoOfertaAbsoluto = precioBase - product.precioOferta
    }
    
    // Calcular descuento mayorista (precio base - precio mayorista)
    if (product.precioVentaMayorista && quantity >= (product.cantidadMinimaMayorista || 1)) {
        descuentoMayoristaAbsoluto = precioBase - product.precioVentaMayorista
    }
    
    // Sumar ambos descuentos
    const descuentoTotalAbsoluto = descuentoOfertaAbsoluto + descuentoMayoristaAbsoluto
    
    // Restar del precio personalizado
    const precioFinal = Math.max(0.01, customBasePrice - descuentoTotalAbsoluto)
    
    // console.log('📊 Cálculo V2 - Exacto como solicitaste:', {
    //     formula: `(${precioBase} - ${product.precioOferta || 'N/A'}) + (${precioBase} - ${product.precioVentaMayorista || 'N/A'}) = ${descuentoTotalAbsoluto}`,
    //     resultado: `${customBasePrice} - ${descuentoTotalAbsoluto} = ${precioFinal}`
    // })
    
    return {
        basePrice: customBasePrice,
        finalPrice: precioFinal,
        discounts: {
            oferta: descuentoOfertaAbsoluto,
            mayorista: descuentoMayoristaAbsoluto
        },
        totalDiscount: descuentoTotalAbsoluto,
        isOnSale: product.enOferta || false,
        isWholesale: quantity >= (product.cantidadMinimaMayorista || 999999)
    }
}