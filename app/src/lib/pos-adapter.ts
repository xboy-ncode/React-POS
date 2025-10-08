// lib/pos-adapter.ts
import { productosService } from '@/lib/api-client'

// Tipos del POS actual
type Product = {
    id: number
    name: string
    nameKey: string
    price: number
    category: string
    image: string
    sku?: string
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

// Mapeo de categorías del backend a categorías del POS
const categoryMap: Record<string, string> = {
    'BEBIDAS': 'beverages',
    'LICORES': 'alcohol',
    'CERVEZAS': 'beer',
    'CIGARRILLOS': 'cigarettes',
    'SNACKS': 'snacks',
    'DULCES': 'candy',
    'CUIDADO_PERSONAL': 'personal_care',
    'HOGAR': 'household',
    'TARJETAS_TELEFONO': 'phone_cards'
}

// Mapeo inverso
const categoryMapReverse: Record<string, string> = {
    'beverages': 'BEBIDAS',
    'alcohol': 'LICORES',
    'beer': 'CERVEZAS',
    'cigarettes': 'CIGARRILLOS',
    'snacks': 'SNACKS',
    'candy': 'DULCES',
    'personal_care': 'CUIDADO_PERSONAL',
    'household': 'HOGAR',
    'phone_cards': 'TARJETAS_TELEFONO'
}

// Iconos por categoría
const categoryIcons: Record<string, string> = {
    'beverages': '🥤',
    'alcohol': '🍷',
    'beer': '🍺',
    'cigarettes': '🚬',
    'snacks': '🥜',
    'candy': '🍬',
    'personal_care': '🧴',
    'household': '🧽',
    'phone_cards': '📱'
}

/**
 * Convierte producto del backend al formato del POS
 */
export function mapProductToPos(backendProduct: any): Product {
    const category = categoryMap[backendProduct.categoria_nombre] || 'snacks'

    return {
        id: backendProduct.id_producto,
        name: backendProduct.nombre,
        nameKey: `pos.products.${backendProduct.nombre.toLowerCase().replace(/\s+/g, '_')}`,
        price: parseFloat(backendProduct.precio_unitario),
        category,
        image: '/api/placeholder/200/200',
        sku: backendProduct.codigo || `SKU-${backendProduct.id_producto}`,
        stock: backendProduct.stock || 0,
        lowStockThreshold: 10,
        isAvailable: backendProduct.activo,
        productIcon: categoryIcons[category] || '📦',
        cost: 0,
        supplier: backendProduct.marca_nombre || '',
        location: '',
        createdAt: backendProduct.fecha_creacion,
        updatedAt: backendProduct.fecha_actualizacion
    }
}

/**
 * Convierte producto del POS al formato del backend
 */
export function mapProductToBackend(posProduct: Partial<Product>) {
    return {
        nombre: posProduct.name,
        precio_unitario: posProduct.price,
        stock: posProduct.stock || 0,
        codigo: posProduct.sku,
        activo: posProduct.isAvailable !== false,
        id_categoria: null, // Puedes mapear esto si tienes categorías en el backend
        id_marca: null
    }
}

/**
 * Carga todos los productos desde la API
 */
export async function loadProducts(): Promise<Product[]> {
    try {
        const response = await productosService.getAll({
            limit: 1000,
            activo: 'true'
        })

        if (!response.productos || response.productos.length === 0) {
            return []
        }

        return response.productos.map(mapProductToPos)
    } catch (error) {
        console.error('Error loading products:', error)
        throw new Error('No se pudieron cargar los productos')
    }
}

/**
 * Crea un nuevo producto
 */
export async function createProduct(product: Partial<Product>): Promise<Product> {
    try {
        const backendData = mapProductToBackend(product)
        const response = await productosService.create(backendData)

        return mapProductToPos(response.producto)
    } catch (error: any) {
        console.error('Error creating product:', error)
        throw new Error(error.response?.data?.error || 'Error al crear el producto')
    }
}

/**
 * Actualiza un producto existente
 */
export async function updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    try {
        const backendData = mapProductToBackend(product)
        const response = await productosService.update(id, backendData)

        return mapProductToPos(response.producto)
    } catch (error: any) {
        console.error('Error updating product:', error)
        throw new Error(error.response?.data?.error || 'Error al actualizar el producto')
    }
}

/**
 * Elimina un producto
 */
export async function deleteProduct(id: number): Promise<void> {
    try {
        await productosService.delete(id)
    } catch (error: any) {
        console.error('Error deleting product:', error)

        // Manejar errores específicos
        const errorMsg = error.response?.data?.error || ''

        if (errorMsg.includes('transacciones asociadas')) {
            throw new Error('No se puede eliminar el producto porque tiene ventas asociadas')
        }

        throw new Error(errorMsg || 'Error al eliminar el producto')
    }
}

/**
 * Valida si hay suficiente stock para el carrito
 */
export async function validateCartStock(cart: Array<{ id: number; quantity: number }>): Promise<{
    valid: boolean
    errors: Array<{ productId: number; message: string }>
}> {
    const errors: Array<{ productId: number; message: string }> = []

    for (const item of cart) {
        try {
            const product = await productosService.getById(item.id)

            if (!product.activo) {
                errors.push({
                    productId: item.id,
                    message: 'Producto no disponible'
                })
                continue
            }

            if (product.stock < item.quantity) {
                errors.push({
                    productId: item.id,
                    message: `Stock insuficiente. Disponible: ${product.stock}`
                })
            }
        } catch (error) {
            errors.push({
                productId: item.id,
                message: 'Error al validar producto'
            })
        }
    }

    return {
        valid: errors.length === 0,
        errors
    }
}