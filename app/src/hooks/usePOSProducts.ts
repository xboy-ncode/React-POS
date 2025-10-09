// hooks/usePOSProducts.ts
import { useState, useEffect, useCallback } from 'react'
import {
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    validateCartStock,
    findProductByBarcode
} from '@/lib/pos-adapter'
import { toast } from 'sonner'
import type { Product } from '@/types/pos' // ← Importar tipo compartido

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

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    const handleCreateProduct = async (productData: Partial<Product>) => {
        try {
            const newProduct = await createProduct(productData)
            toast.success('Producto creado exitosamente')
            await fetchProducts()
            return newProduct
        } catch (err: any) {
            toast.error(err.message)
            throw err
        }
    }

    const handleUpdateProduct = async (id: number, productData: Partial<Product>) => {
        try {
            const updatedProduct = await updateProduct(id, productData)
            toast.success('Producto actualizado exitosamente')
            await fetchProducts()
            return updatedProduct
        } catch (err: any) {
            toast.error(err.message)
            throw err
        }
    }

    const handleDeleteProduct = async (id: number) => {
        try {
            await deleteProduct(id)
            toast.success('Producto eliminado exitosamente')
            await fetchProducts()
        } catch (err: any) {
            toast.error(err.message)
            throw err
        }
    }

    const validateStock = async (cart: Array<{ id: number; quantity: number; name: string; nameKey: string; price: number }>) => {
        const validation = await validateCartStock(cart)

        if (!validation.valid) {
            validation.errors.forEach(error => {
                const product = products.find(p => p.id === error.productId)
                toast.error(`${product?.name}: ${error.message}`)
            })
        }

        return validation.valid
    }

    const searchByBarcode = async (barcode: string): Promise<Product | null> => {
        try {
            if (!barcode.trim()) return null

            const product = await findProductByBarcode(barcode)

            if (!product) {
                toast.error('Producto no encontrado')
                return null
            }

            return product
        } catch (err: any) {
            toast.error('Error al buscar producto')
            return null
        }
    }

    return {
        products,
        loading,
        error,
        refetch: fetchProducts,
        createProduct: handleCreateProduct,
        updateProduct: handleUpdateProduct,
        deleteProduct: handleDeleteProduct,
        validateStock,
        searchByBarcode
    }
}