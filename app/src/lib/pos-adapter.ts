// lib/pos-adapter.ts
import { productosService } from '@/lib/api-client'
import type { Product } from '@/types/pos'
import { useTranslation } from 'react-i18next'

export function useCategoryAdapter() {
    const { t } = useTranslation()

    const normalizeCategory = (rawCategory?: string): string => {
        if (!rawCategory) return 'other'
        return DEFAULT_CATEGORY_MAP[rawCategory.trim()] || 'other'
    }

    const translateCategory = (categoryKey: string): string => {
        return t(`categories.${categoryKey}`, categoryKey)
    }

    const getCategoryIcon = (categoryKey: string): string => {
        return DEFAULT_CATEGORY_ICONS[categoryKey] || '📦'
    }

    return {
        normalizeCategory,
        translateCategory,
        getCategoryIcon,
    }
}

const DEFAULT_CATEGORY_MAP: Record<string, string> = {
    'BEBIDAS': 'Bebidas',
    'Bebidas': 'Bebidas',
    'bebidas': 'Bebidas',
    'BEBIDA': 'Bebidas',
    'Bebida': 'Bebidas',
    'bebida': 'Bebidas',
    'BEVERAGES': 'Bebidas',
    'Beverages': 'Bebidas',
    'beverages': 'Bebidas',
    'DRINKS': 'Bebidas',
    'Drinks': 'Bebidas',
    'drinks': 'Bebidas',
    'LICORES': 'Licores',
    'Licores': 'Licores',
    'licores': 'Licores',
    'LICOR': 'Licores',
    'Licor': 'Licores',
    'licor': 'Licores',
    'ALCOHOL': 'Alcohol',
    'Alcohol': 'Alcohol',
    'alcohol': 'Alcohol',
    'SPIRITS': 'Licores',
    'Spirits': 'Licores',
    'spirits': 'Licores',
    'CERVEZAS': 'Cerveza',
    'Cerveza': 'Cerveza',
    'cerveza': 'Cerveza',
    'CERVEZA': 'Cerveza',
    'BEER': 'Cerveza',
    'Beer': 'Cerveza',
    'beer': 'Cerveza',
    'CIGARROS': 'Cigarros',
    'Cigarros': 'Cigarros',
    'cigarros': 'Cigarros',
    'CIGARRO': 'Cigarros',
    'Cigarro': 'Cigarros',
    'cigarro': 'Cigarros',
    'CIGARRILLOS': 'Cigarros',
    'Cigarrillos': 'Cigarros',
    'cigarrillos': 'Cigarros',
    'CIGARETTES': 'Cigarros',
    'Cigarettes': 'Cigarros',
    'cigarettes': 'Cigarros',
    'SMOKES': 'Cigarros',
    'Smokes': 'Cigarros',
    'smokes': 'Cigarros',
    'SNACKS': 'Snacks',
    'Snacks': 'Snacks',
    'snacks': 'Snacks',
    'BOCADILLOS': 'Snacks',
    'Bocadillos': 'Snacks',
    'bocadillos': 'Snacks',
    'BOTANAS': 'Snacks',
    'Botanas': 'Snacks',
    'botanas': 'Snacks',
    'APPETIZERS': 'Snacks',
    'Appetizers': 'Snacks',
    'appetizers': 'Snacks',
    'DULCES': 'Dulces',
    'Dulces': 'Dulces',
    'dulces': 'Dulces',
    'GOLOSINAS': 'Dulces',
    'Golosinas': 'Dulces',
    'golosinas': 'Dulces',
    'CANDY': 'Dulces',
    'Candy': 'Dulces',
    'candy': 'Dulces',
    'SWEETS': 'Dulces',
    'Sweets': 'Dulces',
    'sweets': 'Dulces',
    'CONFITES': 'Dulces',
    'Confites': 'Dulces',
    'confites': 'Dulces',
    'CUIDADO PERSONAL': 'Cuidado Personal',
    'Cuidado Personal': 'Cuidado Personal',
    'cuidado personal': 'Cuidado Personal',
    'HIGIENE': 'Cuidado Personal',
    'Higiene': 'Cuidado Personal',
    'higiene': 'Cuidado Personal',
    'PERSONAL CARE': 'Cuidado Personal',
    'Personal Care': 'Cuidado Personal',
    'personal care': 'Cuidado Personal',
    'HYGIENE': 'Cuidado Personal',
    'Hygiene': 'Cuidado Personal',
    'hygiene': 'Cuidado Personal',
    'HOGAR': 'Hogar',
    'Hogar': 'Hogar',
    'hogar': 'Hogar',
    'LIMPIEZA': 'Hogar',
    'Limpieza': 'Hogar',
    'limpieza': 'Hogar',
    'HOUSEHOLD': 'Hogar',
    'Household': 'Hogar',
    'household': 'Hogar',
    'HOME': 'Hogar',
    'Home': 'Hogar',
    'home': 'Hogar',
    'HOUSE': 'Hogar',
    'House': 'Hogar',
    'house': 'Hogar',
    'TARJETAS': 'Tarjetas Telefónicas',
    'Tarjetas': 'Tarjetas Telefónicas',
    'tarjetas': 'Tarjetas Telefónicas',
    'TARJETAS TELEFÓNICAS': 'Tarjetas Telefónicas',
    'Tarjetas Telefónicas': 'Tarjetas Telefónicas',
    'tarjetas telefónicas': 'Tarjetas Telefónicas',
    'PHONE CARDS': 'Tarjetas Telefónicas',
    'Phone Cards': 'Tarjetas Telefónicas',
    'phone cards': 'Tarjetas Telefónicas',
    'CALLING CARDS': 'Tarjetas Telefónicas',
    'Calling Cards': 'Tarjetas Telefónicas',
    'calling cards': 'Tarjetas Telefónicas',
    'RECHARGE CARDS': 'Tarjetas Telefónicas',
    'Recharge Cards': 'Tarjetas Telefónicas',
    'recharge cards': 'Tarjetas Telefónicas',
}

const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
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

/**
 * Convierte producto del backend al formato del POS
 * ACTUALIZADO: Incluye nuevos campos de precios
 */
export function mapProductToPos(backendProduct: any): Product {
    const categoryMap = getCombinedCategoryMap()
    const categoryIcons = getCombinedIconMap()

    const categoryKey = backendProduct.categoria_nombre?.trim() || null
    const category = categoryKey && categoryMap[categoryKey] ? categoryMap[categoryKey] : 'uncategorized'

    if (!categoryKey) {
        console.warn('⚠️ [mapProductToPos] Producto sin categoría asignada:', {
            productId: backendProduct.id_producto,
            productName: backendProduct.nombre
        });
    } else if (!categoryMap[categoryKey]) {
        console.warn('⚠️ [mapProductToPos] Categoría no encontrada en el mapa:', {
            categoriaRecibida: backendProduct.categoria_nombre
        });
    }

    const mappedProduct = {
        id: backendProduct.id_producto,
        name: backendProduct.nombre,
        nameKey: `pos.products.${backendProduct.nombre.toLowerCase().replace(/\s+/g, '_')}`,
        
        // ✅ ACTUALIZADO: Usar precio_venta_minorista como precio principal
        price: parseFloat(backendProduct.precio_venta_minorista || backendProduct.precio_unitario || 0),
        
        // ✅ NUEVO: Campos de precios adicionales
        precioCompra: parseFloat(backendProduct.precio_compra || 0),
        precioVentaMinorista: parseFloat(backendProduct.precio_venta_minorista || 0),
        precioVentaMayorista: backendProduct.precio_venta_mayorista 
            ? parseFloat(backendProduct.precio_venta_mayorista) 
            : null,
        precioOferta: backendProduct.precio_oferta 
            ? parseFloat(backendProduct.precio_oferta) 
            : null,
        margenMinorista: parseFloat(backendProduct.margen_minorista || 0),
        margenMayorista: backendProduct.margen_mayorista 
            ? parseFloat(backendProduct.margen_mayorista) 
            : null,
        enOferta: backendProduct.en_oferta || false,
        porcentajeDescuentoOferta: parseFloat(backendProduct.porcentaje_descuento_oferta || 0),
        cantidadMinimaMayorista: parseInt(backendProduct.cantidad_minima_mayorista || 1),
        
        categoryId: backendProduct.id_categoria,
        categoryName: category,
        brandId: backendProduct.id_marca,
        brandName: backendProduct.marca_nombre || '',
        image: '/api/placeholder/200/200',
        sku: backendProduct.codigo || `SKU-${backendProduct.id_producto}`,
        barcode: backendProduct.codigo_barras || '',
        stock: backendProduct.stock || 0,
        lowStockThreshold: 10,
        isAvailable: backendProduct.activo,
        productIcon: categoryIcons[category] || '📦',
        cost: parseFloat(backendProduct.precio_compra || 0),
        supplier: backendProduct.marca_nombre || '',
        location: '',
        createdAt: backendProduct.fecha_creacion,
        updatedAt: backendProduct.fecha_actualizacion
    };

    return mappedProduct;
}

/**
 * Convierte producto del POS al formato del backend
 * ACTUALIZADO: Incluye nuevos campos de precios
 */
export function mapProductToBackend(posProduct: Partial<Product>) {
    if (!posProduct.categoryId || posProduct.categoryId <= 0) {
        throw new Error('Categoría inválida. Por favor, selecciona una categoría válida.')
    }

    const mappedProduct: any = {
        nombre: posProduct.name || '',
        codigo: posProduct.sku || '',
        codigo_barras: posProduct.barcode || '',
        stock: posProduct.stock ?? 0,
        activo: posProduct.isAvailable !== false,
        id_categoria: posProduct.categoryId || undefined,
        id_marca: posProduct.brandId || undefined,
        
        // ✅ NUEVO: Campos de precios
        precio_compra: posProduct.precioCompra ?? posProduct.cost ?? 0,
        precio_venta_minorista: posProduct.precioVentaMinorista ?? posProduct.price ?? 0,
        precio_venta_mayorista: posProduct.precioVentaMayorista ?? null,
        precio_oferta: posProduct.precioOferta ?? null,
        margen_minorista: posProduct.margenMinorista ?? 0,
        margen_mayorista: posProduct.margenMayorista ?? null,
        en_oferta: posProduct.enOferta ?? false,
        porcentaje_descuento_oferta: posProduct.porcentajeDescuentoOferta ?? 0,
        cantidad_minima_mayorista: posProduct.cantidadMinimaMayorista ?? 1,
        
        // Legacy: mantener para compatibilidad
        precio_unitario: posProduct.precioVentaMinorista ?? posProduct.price ?? 0,
    };

    return mappedProduct;
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
 * Busca un producto por código de barras
 */
export async function findProductByBarcode(barcode: string): Promise<Product | null> {
    try {
        const response = await productosService.getAll({
            codigo_barras: barcode,
            activo: 'true',
            limit: 1
        })

        if (!response.productos || response.productos.length === 0) {
            return null
        }

        return mapProductToPos(response.productos[0])
    } catch (error) {
        console.error('Error finding product by barcode:', error)
        return null
    }
}

/**
 * Crea un nuevo producto
 */
export async function createProduct(product: Partial<Product>): Promise<Product> {
    try {
        if (!product.categoryId || product.categoryId <= 0) {
            throw new Error('La categoría debe ser sincronizada con el servidor antes de crear el producto.')
        }

        const backendData = mapProductToBackend(product)
        const response = await productosService.create(backendData)
        return mapProductToPos(response.producto)
    } catch (error: any) {
        console.error('❌ [createProduct] Error:', error)
        if (error.message?.includes('categoría')) {
            throw error
        }
        throw new Error(error.response?.data?.error || error.message || 'Error al crear el producto')
    }
}

/**
 * Actualiza un producto existente
 */
export async function updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    try {
        if (product.categoryId !== undefined && product.categoryId <= 0) {
            throw new Error('La categoría debe ser sincronizada con el servidor antes de actualizar el producto.')
        }

        const backendData = mapProductToBackend(product)
        const response = await productosService.update(id, backendData)
        return mapProductToPos(response.producto)
    } catch (error: any) {
        console.error('❌ [updateProduct] Error:', error)
        if (error.message?.includes('categoría')) {
            throw error
        }
        throw new Error(error.response?.data?.error || error.message || 'Error al actualizar el producto')
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

/**
 * ✅ NUEVO: Calcular el precio correcto según cantidad y ofertas
 */
export function calculateProductPrice(product: Product, quantity: number): number {
    // Si está en oferta, usar precio de oferta
    if (product.enOferta && product.precioOferta) {
        return product.precioOferta
    }
    
    // Si la cantidad cumple el threshold de mayorista, usar precio mayorista
    if (product.precioVentaMayorista && quantity >= (product.cantidadMinimaMayorista || 1)) {
        return product.precioVentaMayorista
    }
    
    // Usar precio minorista por defecto
    return product.precioVentaMinorista || product.price
}