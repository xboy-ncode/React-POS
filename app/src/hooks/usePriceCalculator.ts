// hooks/usePriceCalculator.ts
import React, { useMemo, useState } from 'react'
import type { Product, PriceCalculation, PriceBadge } from '@/types/pos'
import {
    calcularPrecioProducto,
    obtenerBadgePrecio,
    formatearPrecio,
    calificaParaMayorista,
    unidadesParaMayorista
} from '@/lib/price-helpers'

/**
 * Hook para calcular precios de productos considerando ofertas y mayoristas
 */
export function usePriceCalculator(product: Product, quantity: number = 1) {
    // Cálculo del precio
    const priceCalculation = useMemo<PriceCalculation>(() => {
        return calcularPrecioProducto(product, quantity)
    }, [product, quantity])

    // Badge de precio (oferta/mayorista)
    const badgeInfo = useMemo<PriceBadge | null>(() => {
        return obtenerBadgePrecio(product, quantity)
    }, [product, quantity])

    // Formateo de precios
    const formattedPrices = useMemo(() => ({
        precioBase: formatearPrecio(priceCalculation.precioBase, 'PEN'),
        precioFinal: formatearPrecio(priceCalculation.precioFinal, 'PEN'),
        ahorro: priceCalculation.ahorro 
            ? formatearPrecio(priceCalculation.ahorro, 'PEN')
            : null
    }), [priceCalculation])

    // Verificar si califica para mayorista
    const calificaMayorista = useMemo(() => {
        return calificaParaMayorista(product, quantity)
    }, [product, quantity])

    // Unidades faltantes para mayorista
    const unidadesFaltantes = useMemo(() => {
        return unidadesParaMayorista(product, quantity)
    }, [product, quantity])

    // Precio total
    const totalPrice = useMemo(() => {
        return priceCalculation.precioFinal * quantity
    }, [priceCalculation.precioFinal, quantity])

    // Total formateado
    const formattedTotal = useMemo(() => {
        return formatearPrecio(totalPrice, 'PEN')
    }, [totalPrice])

    return {
        // Cálculos
        priceCalculation,
        totalPrice,
        
        // Formateo
        formattedPrices,
        formattedTotal,
        
        // Badges y etiquetas
        priceBadge: badgeInfo,
        
        // Información de mayorista
        calificaMayorista,
        unidadesFaltantes,
        
        // Helpers
        hasDiscount: priceCalculation.esOferta || priceCalculation.esMayorista,
        discountPercentage: priceCalculation.descuento,
        isOnSale: priceCalculation.esOferta,
        isWholesale: priceCalculation.esMayorista
    }
}

/**
 * Hook para calcular totales del carrito
 */
export function useCartTotals(cartItems: Array<{ product: Product; quantity: number }>) {
    const totals = useMemo(() => {
        let subtotal = 0
        let descuentos = 0
        let itemsConDescuento = 0
        
        cartItems.forEach(({ product, quantity }) => {
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
            itemsConDescuento,
            ahorro: descuentos
        }
    }, [cartItems])

    const formatted = useMemo(() => ({
        subtotal: formatearPrecio(totals.subtotal, 'PEN'),
        descuentos: formatearPrecio(totals.descuentos, 'PEN'),
        total: formatearPrecio(totals.total, 'PEN'),
        ahorro: formatearPrecio(totals.ahorro, 'PEN')
    }), [totals])

    return {
        ...totals,
        formatted,
        hasDiscounts: totals.descuentos > 0
    }
}

/**
 * Hook para gestión de precios en formularios de productos
 */
export function usePriceForm(initialPrecioCompra: number = 0) {
    const [precioCompra, setPrecioCompra] = useState(initialPrecioCompra)
    const [margenMinorista, setMargenMinorista] = useState(0)
    const [margenMayorista, setMargenMayorista] = useState(0)
    const [porcentajeDescuento, setPorcentajeDescuento] = useState(0)

    // Calcular precios automáticamente
    const calculatedPrices = useMemo(() => {
        const precioVentaMinorista = precioCompra * (1 + margenMinorista / 100)
        const precioVentaMayorista = margenMayorista > 0 
            ? precioCompra * (1 + margenMayorista / 100)
            : null
        const precioOferta = porcentajeDescuento > 0
            ? precioVentaMinorista * (1 - porcentajeDescuento / 100)
            : null

        return {
            precioCompra,
            precioVentaMinorista: parseFloat(precioVentaMinorista.toFixed(2)),
            precioVentaMayorista: precioVentaMayorista 
                ? parseFloat(precioVentaMayorista.toFixed(2)) 
                : null,
            precioOferta: precioOferta 
                ? parseFloat(precioOferta.toFixed(2)) 
                : null
        }
    }, [precioCompra, margenMinorista, margenMayorista, porcentajeDescuento])

    return {
        // Estados
        precioCompra,
        margenMinorista,
        margenMayorista,
        porcentajeDescuento,
        
        // Setters
        setPrecioCompra,
        setMargenMinorista,
        setMargenMayorista,
        setPorcentajeDescuento,
        
        // Precios calculados
        calculatedPrices
    }
}