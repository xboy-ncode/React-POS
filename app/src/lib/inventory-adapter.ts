// lib/inventory-adapter.ts
import { api } from './api'

type Product = {
    id: number
    name: string
    nameKey: string
    price: number
    category: string
    image: string
    sku?: string
    description?: string
    cost?: number
    isAvailable?: boolean
    productIcon?: string
    stock?: number
    lowStockThreshold?: number
    supplier?: string
    location?: string
    createdAt?: string
    updatedAt?: string

    id_categoria?: number | null
    id_marca?: number | null
}

// Mapear productos de la API al formato del frontend
const mapProductFromAPI = (apiProduct: any): Product => {
    console.log('Mapeando producto de API:', apiProduct) // Debug
    
    const price = parseFloat(apiProduct.precio_unitario || 0)
    const cost = parseFloat(apiProduct.precio_compra || 0)
    
    return {
        id: apiProduct.id_producto,
        name: apiProduct.nombre,
        nameKey: `pos.products.${apiProduct.nombre?.toLowerCase().replace(/\s+/g, '_')}`,
        price: price,
        category: apiProduct.categoria_nombre || 'other',
        image: apiProduct.imagen || '/api/placeholder/200/200',
        sku: apiProduct.codigo || '',
        description: apiProduct.descripcion || '',
        cost: cost,
        isAvailable: apiProduct.activo ?? true,
        productIcon: getIconForCategory(apiProduct.categoria_nombre),
        stock: apiProduct.stock || 0,
        lowStockThreshold: apiProduct.stock_minimo || 10,
        supplier: apiProduct.marca_nombre || '', 
        location: '', 
        createdAt: apiProduct.fecha_registro,
        updatedAt: apiProduct.fecha_actualizacion,

        id_categoria: apiProduct.id_categoria,
        id_marca: apiProduct.id_marca
    }
}

// Obtener icono según categoría
const getIconForCategory = (category: string): string => {
    const icons: Record<string, string> = {
        'alcohol': '🍷',
        'beer': '🍺',
        'cigarettes': '🚬',
        'snacks': '🥜',
        'beverages': '🥤',
        'candy': '🍬',
        'personal_care': '🧴',
        'household': '🧽',
        'phone_cards': '📱'
    }
    return icons[category] || '📦'
}

// Mapear producto del frontend a la API para CREAR
const mapProductToAPIForCreate = (product: Partial<Product>) => {
    const apiProduct: any = {
        nombre: product.name,
        codigo: product.sku,
        precio_unitario: product.price || 0,
        stock: product.stock || 0,
        activo: product.isAvailable ?? true
    }

    // Descripción
    if (product.description !== undefined) {
        apiProduct.descripcion = product.description.trim() || null
    }

    // Relaciones FK
    if (product.id_categoria !== undefined) {
        apiProduct.id_categoria = product.id_categoria
    }

    if (product.id_marca !== undefined) {
        apiProduct.id_marca = product.id_marca
    }

    return apiProduct
}

// Mapear producto del frontend a la API para ACTUALIZAR
const mapProductToAPIForUpdate = (product: Partial<Product>) => {
    const apiProduct: any = {}

    // Solo incluir campos que se van a actualizar
    if (product.name !== undefined) {
        apiProduct.nombre = product.name
    }

    if (product.sku !== undefined) {
        apiProduct.codigo = product.sku
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

    if (product.description !== undefined) {
        apiProduct.descripcion = product.description?.trim() || null
    }

    // Relaciones FK - null es válido para remover la relación
    if (product.id_categoria !== undefined) {
        apiProduct.id_categoria = product.id_categoria
    }

    if (product.id_marca !== undefined) {
        apiProduct.id_marca = product.id_marca
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
        console.log('Creando producto - Enviando a API:', apiData) // Debug
        
        const response = await api('/products', {
            method: 'POST',
            body: JSON.stringify(apiData)
        })
        
        return mapProductFromAPI(response.producto)
    } catch (error: any) {
        console.error('Error creating product:', error)
        throw new Error(error.response?.data?.error || error.message || 'Error al crear producto')
    }
}

// Actualizar un producto existente
export async function updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    try {
        const apiData = mapProductToAPIForUpdate(productData)
        console.log('Actualizando producto - Enviando a API:', apiData) // Debug
        
        const response = await api(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(apiData)
        })
        
        return mapProductFromAPI(response.producto)
    } catch (error: any) {
        console.error('Error updating product:', error)
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
        throw new Error(error.response?.data?.error || error.message || 'Error al eliminar producto')
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
export async function getProductsByCategory(category: string): Promise<Product[]> {
    try {
        const response = await api(`/products?categoria=${encodeURIComponent(category)}`)
        
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
            categories: [...new Set(products.map(p => p.category))].length
        }
    } catch (error: any) {
        console.error('Error getting inventory stats:', error)
        throw new Error(error.message || 'Error al obtener estadísticas')
    }
}