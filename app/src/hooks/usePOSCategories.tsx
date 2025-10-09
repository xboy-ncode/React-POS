// hooks/usePOSCategories.ts
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Category } from '@/types/pos' // ← Importar tipo compartido

const API_URL = `${import.meta.env.VITE_API_URL}/categories`

const getCategoryIcon = (categoryName: string): string => {
    const iconMap: Record<string, string> = {
        'Beer': '🍺',
        'Cerveza': '🍺',
        'CERVEZAS': '🍺',
        'Liquor': '🍷',
        'Licor': '🍷',
        'LICORES': '🍷',
        'Alcohol': '🍷',
        'Beverages': '🥤',
        'Bebidas': '🥤',
        'BEBIDAS': '🥤',
        'Snacks': '🥜',
        'SNACKS': '🥜',
        'Candy': '🍬',
        'Dulces': '🍬',
        'DULCES': '🍬',
        'Cigarettes': '🚬',
        'Cigarrillos': '🚬',
        'CIGARRILLOS': '🚬',
        'Personal Care': '🧴',
        'Cuidado Personal': '🧴',
        'CUIDADO_PERSONAL': '🧴',
        'Household': '🧽',
        'Hogar': '🧽',
        'HOGAR': '🧽',
        'Phone Cards': '📱',
        'Tarjetas': '📱',
        'TARJETAS_TELEFONO': '📱',
    }

    try {
        const stored = localStorage.getItem('pos_custom_categories')
        if (stored) {
            const customCategories = JSON.parse(stored)
            const customMapping = customCategories.find(
                (c: any) => c.backendName === categoryName
            )
            if (customMapping?.icon) {
                return customMapping.icon
            }
        }
    } catch (error) {
        console.error('Error al cargar iconos personalizados:', error)
    }

    return iconMap[categoryName] || '📦'
}

export function usePOSCategories() {
    const [categories, setCategories] = useState<Category[]>([
        { id: 0, name: 'Todos', nameKey: 'pos.categories.all', icon: '🏪' }
    ])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_URL}?activo=true`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            })

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()
            
           // console.log('📂 [usePOSCategories] Categorías recibidas del backend:', data)

            if (!data.categorias || data.categorias.length === 0) {
                console.warn('⚠️ No se encontraron categorías activas en el backend')
                return
            }

            const mappedCategories: Category[] = data.categorias.map((cat: any) => ({
                id: cat.id_categoria,
                name: cat.nombre,
                nameKey: `pos.categories.${cat.nombre.toLowerCase().replace(/\s+/g, '_')}`,
                icon: getCategoryIcon(cat.nombre)
            }))

            setCategories([
                { id: 0, name: 'Todos', nameKey: 'pos.categories.all', icon: '🏪' },
                ...mappedCategories
            ])

           // console.log('✅ [usePOSCategories] Categorías mapeadas:', mappedCategories)
        } catch (err: any) {
            const errorMsg = err.message || 'Error al cargar categorías'
            setError(errorMsg)
            console.error('❌ [usePOSCategories] Error:', err)
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    return {
        categories,
        loading,
        error,
        refetch: fetchCategories
    }
}