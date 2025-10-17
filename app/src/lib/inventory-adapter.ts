// lib/inventory-adapter.ts
import { api } from './api'
import type { Product } from '@/types/pos'

// Mapeo de categorías (igual que en pos-adapter)
const DEFAULT_CATEGORY_MAP: Record<string, string> = {
    'BEBIDAS': 'Bebidas',
    'Bebidas': 'Bebidas',
    'bebidas': 'Bebidas',
    'LICORES': 'Licores',
    'Licores': 'Licores',
    'licores': 'Licores',
    'ALCOHOL': 'Alcohol',
    'Alcohol': 'Alcohol',
    'alcohol': 'Alcohol',
    'CERVEZAS': 'Cerveza',
    'Cerveza': 'Cerveza',
    'cerveza': 'Cerveza',
    'CIGARROS': 'Cigarros',
    'Cigarros': 'Cigarros',
    'cigarros': 'Cigarros',
    'SNACKS': 'Snacks',
    'Snacks': 'Snacks',
    'snacks': 'Snacks',
    'DULCES': 'Dulces',
    'Dulces': 'Dulces',
    'dulces': 'Dulces',
    'CUIDADO PERSONAL': 'Cuidado Personal',
    'Cuidado Personal': 'Cuidado Personal',
    'cuidado personal': 'Cuidado Personal',
    'HOGAR': 'Hogar',
    'Hogar': 'Hogar',
    'hogar': 'Hogar',
    'TARJETAS': 'Tarjetas Telefónicas',
    'Tarjetas': 'Tarjetas Telefónicas',
    'tarjetas': 'Tarjetas Telefónicas',
}

const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
    'Bebidas': '🥤',
    'Alcohol': '🍷',
    'Licores': '🍷',
    'Cerveza': '🍺',
    'Cigarros': '🚬',
    'Snacks': '🥜',
    'Dulces': '🍬',
    'Cuidado Personal': '🧴',
    'Hogar': '🧽',
    'Tarjetas Telefónicas': '📱'
}

// Obtener categorías personalizadas del localStorage
function getCustomCategoryMaps(): {
    categoryMap: Record<string, string>
    iconMap: Record<string, string>
} {
    try {
        const stored = localStorage.getItem('pos_custom_categories')
        if (!stored) {
            return { categoryMap: {}, iconMap: {} }
        }

        const customCategories = JSON.parse(stored)
        const categoryMap: Record<string, string> = {}
        const iconMap: Record<string, string> = {}

        customCategories.forEach((cat: any) => {
            categoryMap[cat.backendName] = cat.internalName
            iconMap[cat.internalName] = cat.icon
        })

        return { categoryMap, iconMap }
    } catch (error) {
        console.error('Error loading custom categories:', error)
        return { categoryMap: {}, iconMap: {} }
    }
}

function getCombinedCategoryMap(): Record<string, string> {
    const { categoryMap: customMap } = getCustomCategoryMaps()
    return { ...DEFAULT_CATEGORY_MAP, ...customMap }
}

function getCombinedIconMap(): Record<string, string> {
    const { iconMap: customIcons } = getCustomCategoryMaps()
    return { ...DEFAULT_CATEGORY_ICONS, ...customIcons }
}

// Mapear productos de la API al formato del frontend (ACTUALIZADO)
const mapProductFromAPI = (apiProduct: any): Product => {
    const categoryMap = getCombinedCategoryMap()
    const categoryIcons = getCombinedIconMap()

    const categoryKey = apiProduct.categoria_nombre?.trim() || null
    const category = categoryKey && categoryMap[categoryKey] 
        ? categoryMap[categoryKey] 
        : 'uncategorized'

    const price = parseFloat(apiProduct.precio_unitario || 0)
    const cost = parseFloat(apiProduct.precio_compra || 0)
    
    return {
        id: apiProduct.id_producto,
        name: apiProduct.nombre,
        nameKey: `pos.products.${apiProduct.nombre?.toLowerCase().replace(/\s+/g, '_')}`,
        price: price,
        
        // ✅ ACTUALIZADO: Usar categoryId y categoryName como pos-adapter
        categoryId: apiProduct.id_categoria,
        categoryName: category,
        
        // ✅ AGREGADO: Campos de marca
        brandId: apiProduct.id_marca,
        brandName: apiProduct.marca_nombre || '',
        
        image: apiProduct.imagen || '/api/placeholder/200/200',
        sku: apiProduct.codigo || '',
        
        // ✅ AGREGADO: Código de barras
        barcode: apiProduct.codigo_barras || '',
        
        cost: cost,
        isAvailable: apiProduct.activo ?? true,
        productIcon: categoryIcons[category] || '📦',
        stock: apiProduct.stock || 0,
        lowStockThreshold: apiProduct.stock_minimo || 10,
        
        // ✅ MANTENER: supplier por compatibilidad
        supplier: apiProduct.marca_nombre || '',
        
        location: '', 
        createdAt: apiProduct.fecha_registro,
        updatedAt: apiProduct.fecha_actualizacion
    }
}

// Mapear producto del frontend a la API para CREAR
const mapProductToAPIForCreate = (product: Partial<Product>) => {
    // Validar categoryId
    if (!product.categoryId || product.categoryId <= 0) {
        throw new Error('Categoría inválida. Por favor, selecciona una categoría válida.')
    }

    const apiProduct: any = {
        nombre: product.name,
        codigo: product.sku,
        codigo_barras: product.barcode || '', // ✅ AGREGADO
        precio_unitario: product.price || 0,
        stock: product.stock || 0,
        activo: product.isAvailable ?? true,
        id_categoria: product.categoryId, // ✅ USAR categoryId
        id_marca: product.brandId || undefined // ✅ USAR brandId
    }

    return apiProduct
}

// Mapear producto del frontend a la API para ACTUALIZAR
const mapProductToAPIForUpdate = (product: Partial<Product>) => {
    const apiProduct: any = {}

    if (product.name !== undefined) {
        apiProduct.nombre = product.name
    }

    if (product.sku !== undefined) {
        apiProduct.codigo = product.sku
    }

    // ✅ AGREGADO: Código de barras
    if (product.barcode !== undefined) {
        apiProduct.codigo_barras = product.barcode
    }

    if (product.price !== undefined) {
        apiProduct.precio_unitario = product.price
    }

    if (product.stock !== undefined) {
        apiProduct.stock = product.stock
    }

    if (product.isAvailable !== undefined) {
        apiProduct.activo = product.isAvailable
    }

    // ✅ ACTUALIZADO: Usar categoryId en lugar de category
    if (product.categoryId !== undefined) {
        if (product.categoryId <= 0) {
            throw new Error('Categoría inválida. Por favor, selecciona una categoría válida.')
        }
        apiProduct.id_categoria = product.categoryId
    }

    // ✅ AGREGADO: Soporte para marca
    if (product.brandId !== undefined) {
        apiProduct.id_marca = product.brandId
    }

    return apiProduct
}

// Cargar todos los productos
export async function loadProducts(): Promise<Product[]> {
    try {
        const response = await api('/products?limit=1000&activo=true')
        
        if (response?.productos && Array.isArray(response.productos)) {
            return response.productos.map(mapProductFromAPI)
        }
        
        return []
    } catch (error: any) {
        console.error('Error loading products:', error)
        throw new Error(error.message || 'Error al cargar productos')
    }
}

// Obtener un producto por ID
export async function getProduct(id: number): Promise<Product> {
    try {
        const response = await api(`/products/${id}`)
        return mapProductFromAPI(response.producto)
    } catch (error: any) {
        console.error('Error getting product:', error)
        throw new Error(error.message || 'Error al obtener producto')
    }
}

// Crear un nuevo producto
export async function createProduct(productData: Partial<Product>): Promise<Product> {
    try {
        const apiData = mapProductToAPIForCreate(productData)
        
        const response = await api('/products', {
            method: 'POST',
            body: JSON.stringify(apiData)
        })
        
        return mapProductFromAPI(response.producto)
    } catch (error: any) {
        console.error('Error creating product:', error)
        
        if (error.message?.includes('categoría')) {
            throw error
        }
        
        throw new Error(error.response?.data?.error || error.message || 'Error al crear producto')
    }
}

// Actualizar un producto existente
export async function updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    try {
        const apiData = mapProductToAPIForUpdate(productData)
        
        const response = await api(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(apiData)
        })
        
        return mapProductFromAPI(response.producto)
    } catch (error: any) {
        console.error('Error updating product:', error)
        
        if (error.message?.includes('categoría')) {
            throw error
        }
        
        throw new Error(error.response?.data?.error || error.message || 'Error al actualizar producto')
    }
}

// Eliminar un producto
export async function deleteProduct(id: number): Promise<void> {
    try {
        await api(`/products/${id}`, {
            method: 'DELETE'
        })
    } catch (error: any) {
        console.error('Error deleting product:', error)
        
        const errorMsg = error.response?.data?.error || ''
        
        if (errorMsg.includes('transacciones asociadas')) {
            throw new Error('No se puede eliminar el producto porque tiene ventas asociadas')
        }
        
        throw new Error(errorMsg || 'Error al eliminar producto')
    }
}

// Actualizar el stock de un producto
export async function updateProductStock(
    id: number, 
    quantity: number, 
    operation: 'add' | 'subtract' = 'add'
): Promise<Product> {
    try {
        const response = await api(`/products/${id}/stock`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity, operation })
        })
        
        return mapProductFromAPI(response.producto)
    } catch (error: any) {
        console.error('Error updating stock:', error)
        throw new Error(error.response?.data?.error || error.message || 'Error al actualizar stock')
    }
}

// Obtener productos con bajo stock
export async function getLowStockProducts(): Promise<Product[]> {
    try {
        const response = await api('/products?low_stock=true')
        
        if (response?.productos && Array.isArray(response.productos)) {
            return response.productos.map(mapProductFromAPI)
        }
        
        return []
    } catch (error: any) {
        console.error('Error loading low stock products:', error)
        throw new Error(error.message || 'Error al cargar productos con bajo stock')
    }
}

// Buscar productos
export async function searchProducts(query: string): Promise<Product[]> {
    try {
        const response = await api(`/products/search?q=${encodeURIComponent(query)}`)
        
        if (response?.productos && Array.isArray(response.productos)) {
            return response.productos.map(mapProductFromAPI)
        }
        
        return []
    } catch (error: any) {
        console.error('Error searching products:', error)
        throw new Error(error.message || 'Error al buscar productos')
    }
}

// Obtener productos por categoría
export async function getProductsByCategory(categoryId: number): Promise<Product[]> {
    try {
        const response = await api(`/products?id_categoria=${categoryId}`)
        
        if (response?.productos && Array.isArray(response.productos)) {
            return response.productos.map(mapProductFromAPI)
        }
        
        return []
    } catch (error: any) {
        console.error('Error loading products by category:', error)
        throw new Error(error.message || 'Error al cargar productos por categoría')
    }
}

// Exportar estadísticas del inventario
export async function getInventoryStats() {
    try {
        const products = await loadProducts()
        
        return {
            totalProducts: products.length,
            totalValue: products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0),
            lowStockCount: products.filter(p => (p.stock || 0) <= (p.lowStockThreshold || 10)).length,
            outOfStockCount: products.filter(p => (p.stock || 0) === 0).length,
            categories: [...new Set(products.map(p => p.categoryName))].length
        }
    } catch (error: any) {
        console.error('Error getting inventory stats:', error)
        throw new Error(error.message || 'Error al obtener estadísticas')
    }
}