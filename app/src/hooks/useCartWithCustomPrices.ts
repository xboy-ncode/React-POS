// hooks/useCartWithCustomPrices.ts

import { calculatePriceData, calculatePriceWithCustomBaseV2 } from '@/lib/price-calculator'
import type { Product, CartItem } from '@/types/pos'

export function useCartWithCustomPrices() {
    const calculateCartItemPrice = (product: Product, quantity: number, customPrice?: number) => {
        if (customPrice) {
            // Usar la función V2 que suma los descuentos absolutos
            return calculatePriceWithCustomBaseV2(product, quantity, customPrice)
        }

        // Precio normal
        return calculatePriceData(product, quantity)
    }

    const processCartForCheckout = (cart: CartItem[], products: Product[]) => {
        return cart.map(item => {
            const product = products.find(p => p.id === item.id)
            if (!product) return item

            // Manejar los dos tipos de retorno diferentes
            if (item.customPrice) {
                // Con precio personalizado
                const customPriceData = calculatePriceWithCustomBaseV2(product, item.quantity, item.customPrice)

                return {
                    ...item,
                    priceData: customPriceData,
                    // Datos unificados para el backend
                    precio_original: product.precioVentaMinorista || product.price,
                    precio_final: customPriceData.finalPrice,
                    descuento_oferta: customPriceData.discounts.oferta,
                    descuento_mayorista: customPriceData.discounts.mayorista,
                    descuento_total: customPriceData.totalDiscount,
                    es_oferta: customPriceData.isOnSale,
                    es_mayorista: customPriceData.isWholesale,
                    tiene_precio_personalizado: true,
                    precio_personalizado_base: customPriceData.basePrice
                }
            } else {
                // Precio normal
                const normalPriceData = calculatePriceData(product, item.quantity)

                return {
                    ...item,
                    priceData: normalPriceData,
                    // Datos unificados para el backend
                    precio_original: normalPriceData.priceCalculation.precioBase,
                    precio_final: normalPriceData.priceCalculation.precioFinal,
                    descuento_oferta: normalPriceData.priceCalculation.montoDescuentoOferta || 0,
                    descuento_mayorista: normalPriceData.priceCalculation.montoDescuentoMayorista || 0,
                    descuento_total: (normalPriceData.priceCalculation.montoDescuentoOferta || 0) +
                        (normalPriceData.priceCalculation.montoDescuentoMayorista || 0),
                    es_oferta: normalPriceData.isOnSale,
                    es_mayorista: normalPriceData.isWholesale,
                    tiene_precio_personalizado: false,
                    precio_personalizado_base: null
                }
            }
        })
    }

    return {
        calculateCartItemPrice,
        processCartForCheckout
    }
}