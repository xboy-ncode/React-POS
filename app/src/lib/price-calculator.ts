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
        priceCalculation,
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
