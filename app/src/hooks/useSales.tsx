// hooks/useSales.tsx
import { useState, useEffect, useCallback } from 'react'
import { salesAdapter, type Sale, type SalesFilters, type SalesResponse } from '@/lib/sales-adapter'
import { toast } from 'sonner'

export function useSales(initialFilters: SalesFilters = {}) {
    const [sales, setSales] = useState<Sale[]>([])
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<SalesFilters>(initialFilters)

    const fetchSales = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await salesAdapter.getSales(filters)
            setSales(response.ventas)
            setPagination(response.pagination)
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || 'Error al cargar las ventas'
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [filters])

    useEffect(() => {
        fetchSales()
    }, [fetchSales])

    const updateFilters = useCallback((newFilters: Partial<SalesFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }))
    }, [])

    const nextPage = useCallback(() => {
        if (pagination.hasNext) {
            updateFilters({ page: pagination.page + 1 })
        }
    }, [pagination, updateFilters])

    const prevPage = useCallback(() => {
        if (pagination.hasPrev) {
            updateFilters({ page: pagination.page - 1 })
        }
    }, [pagination, updateFilters])

    const goToPage = useCallback((page: number) => {
        updateFilters({ page })
    }, [updateFilters])

    return {
        sales,
        pagination,
        loading,
        error,
        filters,
        updateFilters,
        refetch: fetchSales,
        nextPage,
        prevPage,
        goToPage
    }
}

export function useSaleDetails(saleId: number | null) {
    const [sale, setSale] = useState<Sale | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!saleId) {
            setSale(null)
            return
        }

        const fetchSaleDetails = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await salesAdapter.getSaleById(saleId)
                setSale(data)
            } catch (err: any) {
                const errorMessage = err.response?.data?.error || 'Error al cargar los detalles'
                setError(errorMessage)
                toast.error(errorMessage)
            } finally {
                setLoading(false)
            }
        }

        fetchSaleDetails()
    }, [saleId])

    return { sale, loading, error }
}