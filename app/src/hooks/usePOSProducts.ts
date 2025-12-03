// hooks/usePOSProducts.ts
import { useState, useEffect, useCallback } from 'react'
import {
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    validateCartStock,
    findProductByBarcode,
    validateUniqueBarcode
} from '@/lib/pos-adapter'
import { toast } from 'sonner'
import type { Product } from '@/types/pos' 
import { validateBarcodeFormat} from '@/lib/barcode-validation'

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
      if (!barcode.trim()) {
        toast.error('Código de barras vacío')
        return null
      }

      // Validar formato
      const validation = validateBarcodeFormat(barcode)
      if (!validation.valid) {
        toast.error(validation.error || 'Formato de código inválido')
        return null
      }

      const product = await findProductByBarcode(barcode)

      if (!product) {
        toast.error(`No se encontró producto con código: ${barcode}`)
        return null
      }

      // Validar disponibilidad
      if (!product.isAvailable) {
        toast.warning(`${product.name} no está disponible`)
        return null
      }

      // Validar stock
      if (!product.stock || product.stock <= 0) {
        toast.warning(`${product.name} sin stock disponible`)
        return null
      }

      return product
    } catch (err: any) {
      toast.error(err.message || 'Error al buscar producto')
      return null
    }
  }
 const validateBarcode = async (barcode: string, excludeId?: number): Promise<boolean> => {
    if (!barcode) return true

    const validation = validateBarcodeFormat(barcode)
    if (!validation.valid) {
      toast.error(validation.error || 'Código de barras inválido')
      return false
    }

    const uniqueCheck = await validateUniqueBarcode(barcode, excludeId)
    if (!uniqueCheck.unique) {
      toast.error(
        `Este código ya está asignado a: ${uniqueCheck.existingProduct?.name}`
      )
      return false
    }

    return true
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
        searchByBarcode,
        validateBarcode 
    }
}