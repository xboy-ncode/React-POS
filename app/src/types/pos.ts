// types/pos.ts
export type Category = {
    id: number
    name: string
    nameKey: string
    icon: string
    isLocal?: boolean
}

export type Product = {
    id: number
    name: string
    nameKey: string
    price: number // Precio principal (minorista por defecto)
    
    // ✅ NUEVO: Campos de precios detallados
    precioCompra?: number
    precioVentaMinorista?: number
    precioVentaMayorista?: number | null
    precioOferta?: number | null
    margenMinorista?: number
    margenMayorista?: number | null
    enOferta?: boolean
    porcentajeDescuentoOferta?: number
    cantidadMinimaMayorista?: number
    
    // Campos existentes
    categoryId?: number
    categoryName?: string
    brandId?: number
    brandName?: string
    image: string
    sku?: string
    barcode?: string
    cost?: number
    preparationTime?: number
    ingredients?: string
    allergens?: string
    isAvailable?: boolean
    popularity?: number
    productIcon?: string
    stock?: number
    lowStockThreshold?: number
    supplier?: string
    location?: string
    createdAt?: string
    updatedAt?: string
}

export type CartItem = {
    id: number
    name: string
    nameKey: string
    price: number
    quantity: number
    productIcon?: string
    image?: string
    
    // ✅ NUEVO: Campos adicionales para el carrito
    enOferta?: boolean
    precioOferta?: number
    esPrecioMayorista?: boolean
    precioOriginal?: number
    descuentoAplicado?: number
}

// ✅ NUEVO: Tipo para el cálculo de precios
export type PriceCalculation = {
    precioBase: number
    precioFinal: number
    descuento?: number
    esOferta: boolean
    esMayorista: boolean
    ahorro?: number
}

// ✅ NUEVO: Tipo para información de descuentos/badges
export type PriceBadge = {
    texto: string
    tipo: 'oferta' | 'mayorista'
    ahorro: number
}

// ✅ NUEVO: Tipo para resumen de carrito
export type CartSummary = {
    subtotal: number
    descuentos: number
    total: number
    itemsConDescuento: number
    ahorro: number
}

// ✅ NUEVO: Tipo para estadísticas de inventario mejoradas
export type InventoryStats = {
    totalProducts: number
    totalValue: number
    totalRevenue: number
    potentialProfit: number
    lowStockCount: number
    outOfStockCount: number
    categories: number
    productsOnSale: number
}

// ✅ NUEVO: Tipo para validación de precios
export type PriceValidation = {
    valido: boolean
    errores: string[]
}