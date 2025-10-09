// types/pos.ts
export type Category = {
    id: number
    name: string
    nameKey: string
    icon: string
}

export type Product = {
    id: number
    name: string
    nameKey: string
    price: number
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
}