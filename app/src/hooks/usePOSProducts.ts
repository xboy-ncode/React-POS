// hooks/usePOSProducts.ts
import { useState, useEffect, useCallback } from 'react'
import {
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    validateCartStock
} from '@/lib/pos-adapter'
import { toast } from 'sonner'

type Product = {
    id: number
    name: string
    nameKey: string
    price: number
    category: string
    image: string
    sku?: string
    stock?: number
    isAvailable?: boolean
    productIcon?: string
    lowStockThreshold?: number
    supplier?: string
    location?: string
}

export function usePOSProducts() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Cargar productos
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await loadProducts()
            setProducts(data)
        } catch (err: any) {
            const errorMsg = err.message || 'Error al cargar productos'
            setError(errorMsg)
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }, [])

    // Cargar al montar
    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    // Crear producto
    const handleCreateProduct = async (productData: Partial<Product>) => {
        try {
            const newProduct = await createProduct(productData)
            toast.success('Producto creado exitosamente')
            // Recargar todos los productos para obtener datos actualizados
            await fetchProducts()
            return newProduct
        } catch (err: any) {
            toast.error(err.message)
            throw err
        }
    }

    // Actualizar producto
    const handleUpdateProduct = async (id: number, productData: Partial<Product>) => {
        try {
            const updatedProduct = await updateProduct(id, productData)
            toast.success('Producto actualizado exitosamente')
            // Recargar todos los productos para obtener datos actualizados
            await fetchProducts()
            return updatedProduct
        } catch (err: any) {
            toast.error(err.message)
            throw err
        }
    }

    // Eliminar producto
    const handleDeleteProduct = async (id: number) => {
        try {
            await deleteProduct(id)
            toast.success('Producto eliminado exitosamente')
            // Recargar todos los productos
            await fetchProducts()
        } catch (err: any) {
            toast.error(err.message)
            throw err
        }
    }

    // Validar stock del carrito
    const validateStock = async (cart: Array<{ id: number; quantity: number }>) => {
        const validation = await validateCartStock(cart)

        if (!validation.valid) {
            validation.errors.forEach(error => {
                const product = products.find(p => p.id === error.productId)
                toast.error(`${product?.name}: ${error.message}`)
            })
        }

        return validation.valid
    }

    return {
        products,
        loading,
        error,
        refetch: fetchProducts,
        createProduct: handleCreateProduct,
        updateProduct: handleUpdateProduct,
        deleteProduct: handleDeleteProduct,
        validateStock
    }
}