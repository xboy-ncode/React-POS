// lib/pos-adapter.ts
import { productosService } from '@/lib/api-client'
import type { Product } from '@/types/pos'



/// Mapeo de categorías del backend a categorías del POS
// ACTUALIZADO: Basado en los logs, el backend envía categorías en inglés
// Categorías por defecto del sistema
const DEFAULT_CATEGORY_MAP: Record<string, string> = {
    'BEBIDAS': 'beverages',
    'LICORES': 'alcohol',
    'CERVEZAS': 'beer',
    'Beer': 'beer',
    'Beverages': 'beverages',
    'Alcohol': 'alcohol',
    'Cigarettes': 'cigarettes',
    'Snacks': 'snacks',
    'Candy': 'candy',
    'Personal Care': 'personal_care',
    'Household': 'household',
    'Phone Cards': 'phone_cards',
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
 * Obtiene las categorías personalizadas del localStorage
 */
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
/**
 * Obtiene el mapeo completo de categorías (por defecto + personalizadas)
 */
function getCombinedCategoryMap(): Record<string, string> {
    const { categoryMap: customMap } = getCustomCategoryMaps()
    return { ...DEFAULT_CATEGORY_MAP, ...customMap }
}

/**
 * Obtiene el mapeo completo de iconos (por defecto + personalizados)
 */
function getCombinedIconMap(): Record<string, string> {
    const { iconMap: customIcons } = getCustomCategoryMaps()
    return { ...DEFAULT_CATEGORY_ICONS, ...customIcons }
}


/**
 * Convierte producto del backend al formato del POS
 */
export function mapProductToPos(backendProduct: any): Product {
    // console.log('🔍 [mapProductToPos] Producto recibido del backend:', {
    //     id: backendProduct.id_producto,
    //     nombre: backendProduct.nombre,
    //     categoria: backendProduct.categoria_nombre,
    //     id_categoria: backendProduct.id_categoria,
    //     marca: backendProduct.marca_nombre,
    //     id_marca: backendProduct.id_marca,
    //     precio: backendProduct.precio_unitario
    // });

    const categoryMap = getCombinedCategoryMap()
    const categoryIcons = getCombinedIconMap()

    const categoryKey = backendProduct.categoria_nombre?.trim() || null
    const category = categoryKey && categoryMap[categoryKey] ? categoryMap[categoryKey] : 'uncategorized'
    
    if (!categoryKey) {
        console.warn('⚠️ [mapProductToPos] Producto sin categoría asignada:', {
            productId: backendProduct.id_producto,
            productName: backendProduct.nombre,
            categoriaRecibida: backendProduct.categoria_nombre,
            id_categoria: backendProduct.id_categoria,
            usandoDefault: 'uncategorized',
            sugerencia: '💡 Asigna una categoría al producto en el backend'
        });
    } else if (!categoryMap[categoryKey]) {
        console.warn('⚠️ [mapProductToPos] Categoría no encontrada en el mapa:', {
            categoriaRecibida: backendProduct.categoria_nombre,
            categoriaLimpia: categoryKey,
            categoriasDisponibles: Object.keys(categoryMap),
            usandoDefault: 'uncategorized',
            sugerencia: '💡 Puedes agregar esta categoría desde Configuración > Categorías'
        });
    }

    const mappedProduct = {
        id: backendProduct.id_producto,
        name: backendProduct.nombre,
        nameKey: `pos.products.${backendProduct.nombre.toLowerCase().replace(/\s+/g, '_')}`,
        price: parseFloat(backendProduct.precio_unitario),
        categoryId: backendProduct.id_categoria,
        categoryName: category,
        brandId: backendProduct.id_marca, // ← NUEVO
        brandName: backendProduct.marca_nombre || '', // ← NUEVO
        image: '/api/placeholder/200/200',
        sku: backendProduct.codigo || `SKU-${backendProduct.id_producto}`,
        barcode: backendProduct.codigo_barras || '',
        stock: backendProduct.stock || 0,
        lowStockThreshold: 10,
        isAvailable: backendProduct.activo,
        productIcon: categoryIcons[category] || '📦',
        cost: 0,
        supplier: backendProduct.marca_nombre || '', // ← Mantener por compatibilidad
        location: '',
        createdAt: backendProduct.fecha_creacion,
        updatedAt: backendProduct.fecha_actualizacion
    };

    const validations = {
        precioValido: !isNaN(mappedProduct.price) && mappedProduct.price >= 0,
        nombreValido: mappedProduct.name && mappedProduct.name.length > 0,
        stockValido: !isNaN(mappedProduct.stock) && mappedProduct.stock >= 0,
    };

    const hasErrors = Object.values(validations).some(v => !v);

    if (hasErrors) {
        console.error('❌ [mapProductToPos] Errores de validación:', {
            productId: backendProduct.id_producto,
            validations,
            productData: mappedProduct
        });
    } else {
        // console.log('✅ [mapProductToPos] Producto mapeado exitosamente:', {
        //     id: mappedProduct.id,
        //     name: mappedProduct.name,
        //     price: mappedProduct.price,
        //     category: mappedProduct.categoryName,
        //     categoryId: mappedProduct.categoryId,
        //     brand: mappedProduct.brandName,
        //     brandId: mappedProduct.brandId,
        //     stock: mappedProduct.stock
        // });
    }

    return mappedProduct;
}

/**
 * Convierte producto del POS al formato del backend
 */
export function mapProductToBackend(posProduct: Partial<Product>) {
    // console.log('🔍 [mapProductToBackend] Producto recibido del POS:', {
    //     id: posProduct.id,
    //     name: posProduct.name,
    //     price: posProduct.price,
    //     stock: posProduct.stock,
    //     supplier: posProduct.supplier,
    //     brandName: posProduct.brandName,
    //     brandId: posProduct.brandId,
    //     categoryId: posProduct.categoryId,
    //     rawProduct: posProduct
    // });

    const mappedProduct = {
        nombre: posProduct.name || '',
        precio_unitario: posProduct.price ?? 0,
        stock: posProduct.stock ?? 0,
        codigo: posProduct.sku || '',
        codigo_barras: posProduct.barcode || '',
        activo: posProduct.isAvailable !== false,
        id_categoria: posProduct.categoryId || undefined,
        id_marca: posProduct.brandId || undefined, // ← USAR brandId en lugar de undefined directo
    };

    const warnings = [];
    
    if (!mappedProduct.nombre) {
        warnings.push('Nombre vacío');
    }
    if (mappedProduct.precio_unitario <= 0) {
        warnings.push('Precio inválido o cero');
    }
    if (!mappedProduct.codigo) {
        warnings.push('SKU vacío');
    }
    if (mappedProduct.id_categoria === undefined) {
        warnings.push('⚠️ ID de categoría no definido - el producto se creará sin categoría');
    }
    if (mappedProduct.id_marca === undefined) {
        warnings.push('⚠️ ID de marca no definido - el producto se creará sin marca');
    }

    if (warnings.length > 0) {
        console.warn('⚠️ [mapProductToBackend] Advertencias:', {
            productId: posProduct.id,
            warnings,
            mappedData: mappedProduct
        });
    } else {
        // console.log('✅ [mapProductToBackend] Producto mapeado para backend:', {
        //     nombre: mappedProduct.nombre,
        //     precio: mappedProduct.precio_unitario,
        //     stock: mappedProduct.stock,
        //     activo: mappedProduct.activo,
        //     categoria: mappedProduct.id_categoria,
        //     marca: mappedProduct.id_marca
        // });
    }

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
        // Asume que tu API tiene un endpoint de búsqueda
        // Ajusta según tu implementación real
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
   // console.log('➕ [createProduct] Creando producto:', product.name);
    
    try {
        const backendData = mapProductToBackend(product)
        
       // console.log('📤 [createProduct] Datos a enviar al backend:', backendData);
        
        const response = await productosService.create(backendData)

        const createdProduct = mapProductToPos(response.producto)
       // console.log('✅ [createProduct] Producto creado:', { id: createdProduct.id });

        return createdProduct
    } catch (error: any) {
        console.error('❌ [createProduct] Error:', error)
        throw new Error(error.response?.data?.error || 'Error al crear el producto')
    }
}

/**
 * Actualiza un producto existente
 */
export async function updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    //console.log('✏️ [updateProduct] Actualizando producto:', { id, name: product.name });
    
    try {
        const backendData = mapProductToBackend(product)
        
     //   console.log('📤 [updateProduct] Datos a enviar al backend:', backendData);
        
        const response = await productosService.update(id, backendData)

        const updatedProduct = mapProductToPos(response.producto)
      //  console.log('✅ [updateProduct] Producto actualizado exitosamente');

        return updatedProduct
    } catch (error: any) {
        console.error('❌ [updateProduct] Error:', error)
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