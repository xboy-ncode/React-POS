// hooks/usePOSCategories.ts
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Category } from '@/types/pos'
import { categoriasService } from '@/lib/api-client'
import type { CustomCategory } from './useCategories'

/**
 * Mapeo por defecto de iconos para categorías comunes
 */
const DEFAULT_ICON_MAP: Record<string, string> = {
    'Beer': '🍺',
    'Cerveza': '🍺',
    'CERVEZAS': '🍺',
    'Liquor': '🍷',
    'Licor': '🍷',
    'LICORES': '🍷',
    'Alcohol': '🍷',
    'alcohol': '🍷',
    'ALCOHOL': '🍷',
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

/**
 * Carga categorías personalizadas desde localStorage
 */
const loadCustomCategories = (): CustomCategory[] => {
    try {
        const stored = localStorage.getItem('pos_custom_categories')
        if (stored) {
            const parsed = JSON.parse(stored)
            return Array.isArray(parsed) ? parsed : []
        }
    } catch (error) {
        console.error('❌ Error al cargar categorías personalizadas:', error)
    }
    return []
}

/**
 * Obtiene el icono de una categoría
 */
const getCategoryIcon = (categoryName: string, customCategories: CustomCategory[]): string => {
    // 1. Buscar en categorías personalizadas
    const customMapping = customCategories.find(c => c.backendName === categoryName)
    if (customMapping?.icon) {
        return customMapping.icon
    }

    // 2. Usar mapeo por defecto
    if (DEFAULT_ICON_MAP[categoryName]) {
        return DEFAULT_ICON_MAP[categoryName]
    }

    // 3. Icono genérico
    return '📦'
}

/**
 * Obtiene la clave de traducción de una categoría
 */
const getCategoryNameKey = (categoryName: string, customCategories: CustomCategory[]): string => {
    const customMapping = customCategories.find(c => c.backendName === categoryName)
    
    if (customMapping?.internalName) {
        return `categories.${customMapping.internalName}`
    }

    return `categories.${categoryName.toLowerCase().replace(/\s+/g, '_')}`
}

/**
 * Sincroniza una categoría local con el backend
 */
const syncCategoryToBackend = async (
    customCategory: CustomCategory
): Promise<number | null> => {
    try {
        console.log(`🔄 Sincronizando categoría local "${customCategory.backendName}" con backend...`)
        
        const response = await categoriasService.create({
            nombre: customCategory.backendName,
            descripcion: `Categoría creada desde POS - ${customCategory.internalName}`,
        })

        console.log(`✅ Categoría sincronizada con ID: ${response.categoria.id_categoria}`)
        return response.categoria.id_categoria

    } catch (error: any) {
        console.error('❌ Error al sincronizar categoría:', error)
        
        // Si ya existe, intentar obtenerla
        if (error.message?.includes('ya existe')) {
            try {
                const allCategories = await categoriasService.getAll({ activo: true })
                const existing = allCategories.categorias.find(
                    cat => cat.nombre === customCategory.backendName
                )
                if (existing) {
                    console.log(`✅ Categoría encontrada en backend con ID: ${existing.id_categoria}`)
                    return existing.id_categoria
                }
            } catch (fetchError) {
                console.error('❌ Error al buscar categoría existente:', fetchError)
            }
        }
        
        throw error
    }
}

export function usePOSCategories() {
    const [categories, setCategories] = useState<Category[]>([
        { id: 0, name: 'Todos', nameKey: 'pos.categories.all', icon: '🏪' }
    ])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])

    /**
     * Obtiene el ID de backend de una categoría local o la sincroniza
     */
    const getCategoryBackendId = useCallback(async (
        categoryName: string
    ): Promise<number | null> => {
        try {
            // 1. Buscar en categorías ya cargadas
            const existing = categories.find(cat => cat.name === categoryName && cat.id !== 0)
            if (existing) {
                return existing.id
            }

            // 2. Buscar en categorías personalizadas locales
            const customCategory = customCategories.find(
                cat => cat.backendName === categoryName
            )

            if (customCategory) {
                // Sincronizar con backend
                const backendId = await syncCategoryToBackend(customCategory)
                
                if (backendId) {
                    // Recargar categorías para incluir la nueva
                    await fetchCategories()
                    return backendId
                }
            }

            return null
        } catch (error) {
            console.error('❌ Error al obtener ID de categoría:', error)
            return null
        }
    }, [categories, customCategories])

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            
            // Cargar categorías personalizadas
            const localCustomCategories = loadCustomCategories()
            setCustomCategories(localCustomCategories)

            // Obtener categorías del backend
            const data = await categoriasService.getAll({ activo: true })

            if (!data.categorias || data.categorias.length === 0) {
                console.warn('⚠️ No se encontraron categorías activas en el backend')
                
                // Si hay categorías locales, mostrarlas con advertencia
                if (localCustomCategories.length > 0) {
                    const localCategories: Category[] = localCustomCategories.map((cat, idx) => ({
                        id: -(idx + 1), // ID temporal negativo
                        name: cat.backendName,
                        nameKey: `categories.${cat.internalName}`,
                        icon: cat.icon,
                        isLocal: true // Marcar como local
                    }))

                    setCategories([
                        { id: 0, name: 'Todos', nameKey: 'pos.categories.all', icon: '🏪' },
                        ...localCategories
                    ])

                    toast.warning('Mostrando categorías locales. Sincronízalas con el servidor.')
                } else {
                    setCategories([
                        { id: 0, name: 'Todos', nameKey: 'pos.categories.all', icon: '🏪' }
                    ])
                }
                return
            }

            // Mapear categorías del backend
            const backendCategories: Category[] = data.categorias.map((cat) => ({
                id: cat.id_categoria,
                name: cat.nombre,
                nameKey: getCategoryNameKey(cat.nombre, localCustomCategories),
                icon: getCategoryIcon(cat.nombre, localCustomCategories),
                isLocal: false
            }))

            // Identificar categorías locales que no están en el backend
            const backendCategoryNames = new Set(
                backendCategories.map(cat => cat.name)
            )
            
            const unmatchedLocalCategories = localCustomCategories
                .filter(cat => !backendCategoryNames.has(cat.backendName))
                .map((cat, idx) => ({
                    id: -(idx + 1),
                    name: cat.backendName,
                    nameKey: `categories.${cat.internalName}`,
                    icon: cat.icon,
                    isLocal: true
                }))

            // Combinar categorías
            setCategories([
                { id: 0, name: 'Todos', nameKey: 'pos.categories.all', icon: '🏪' },
                ...backendCategories,
                ...unmatchedLocalCategories
            ])

            //console.log(`✅ Categorías cargadas: ${backendCategories.length} del backend, ${unmatchedLocalCategories.length} locales`)

            if (unmatchedLocalCategories.length > 0) {
                toast.info(`${unmatchedLocalCategories.length} categoría(s) pendiente(s) de sincronizar`)
            }

        } catch (err: any) {
            const errorMsg = err.message || 'Error al cargar categorías'
            setError(errorMsg)
            console.error('❌ [usePOSCategories] Error:', err)
            toast.error(errorMsg)
            
            // Mantener categorías locales en caso de error
            const localCustomCategories = loadCustomCategories()
            if (localCustomCategories.length > 0) {
                const localCategories: Category[] = localCustomCategories.map((cat, idx) => ({
                    id: -(idx + 1),
                    name: cat.backendName,
                    nameKey: `categories.${cat.internalName}`,
                    icon: cat.icon,
                    isLocal: true
                }))

                setCategories([
                    { id: 0, name: 'Todos', nameKey: 'pos.categories.all', icon: '🏪' },
                    ...localCategories
                ])
            } else {
                setCategories([
                    { id: 0, name: 'Todos', nameKey: 'pos.categories.all', icon: '🏪' }
                ])
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    // Escuchar cambios en las categorías personalizadas
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'pos_custom_categories') {
                console.log('🔄 Categorías personalizadas actualizadas, recargando...')
                fetchCategories()
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [fetchCategories])

    /**
     * Sincroniza todas las categorías locales con el backend
     */
    const syncAllLocalCategories = useCallback(async () => {
        const localCategories = categories.filter(cat => cat.isLocal)
        
        if (localCategories.length === 0) {
            toast.info('No hay categorías locales para sincronizar')
            return
        }

        toast.loading(`Sincronizando ${localCategories.length} categoría(s)...`)

        let successCount = 0
        let failCount = 0

        for (const category of localCategories) {
            const customCategory = customCategories.find(
                cat => cat.backendName === category.name
            )

            if (customCategory) {
                try {
                    await syncCategoryToBackend(customCategory)
                    successCount++
                } catch (error) {
                    failCount++
                }
            }
        }

        toast.dismiss()
        
        if (successCount > 0) {
            toast.success(`${successCount} categoría(s) sincronizada(s)`)
            await fetchCategories()
        }
        
        if (failCount > 0) {
            toast.error(`${failCount} categoría(s) fallaron al sincronizar`)
        }
    }, [categories, customCategories, fetchCategories])

    return {
        categories,
        loading,
        error,
        refetch: fetchCategories,
        getCategoryBackendId,
        syncAllLocalCategories,
        hasLocalCategories: categories.some(cat => cat.isLocal)
    }
}