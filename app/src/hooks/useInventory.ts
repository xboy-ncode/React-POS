// hooks/useInventory.ts
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
    loadProducts,
    createProduct as createProductAPI,
    updateProduct as updateProductAPI,
    deleteProduct as deleteProductAPI,
    updateProductStock
} from '@/lib/inventory-adapter'

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

export function useInventory() {
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
            const newProduct = await createProductAPI(productData)
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
            const updatedProduct = await updateProductAPI(id, productData)
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
            await deleteProductAPI(id)
            toast.success('Producto eliminado exitosamente')
            // Recargar todos los productos
            await fetchProducts()
        } catch (err: any) {
            toast.error(err.message)
            throw err
        }
    }

    // Actualizar stock
    const handleUpdateStock = async (id: number, quantity: number, operation: 'add' | 'subtract') => {
        try {
            await updateProductStock(id, quantity, operation)
            toast.success('Stock actualizado')
            await fetchProducts()
        } catch (err: any) {
            toast.error(err.message)
            throw err
        }
    }

    // Estadísticas
    const stats = {
        totalItems: products.length,
        totalValue: products.reduce((sum, item) => sum + (item.price * (item.stock ?? 0)), 0),
        lowStockItems: products.filter(item => (item.stock ?? 0) <= (item.lowStockThreshold || 10)).length,
        outOfStock: products.filter(item => (item.stock ?? 0) === 0).length
    }

    return {
        products,
        loading,
        error,
        stats,
        refetch: fetchProducts,
        createProduct: handleCreateProduct,
        updateProduct: handleUpdateProduct,
        deleteProduct: handleDeleteProduct,
        updateStock: handleUpdateStock
    }
}