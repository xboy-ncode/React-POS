import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { categoriasService } from '@/lib/api-client'

export interface CustomCategory {
    backendName: string
    internalName: string
    icon: string
    descripcion?: string
}

const STORAGE_KEY = 'pos_custom_categories'

export function useCategories() {
    const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
    const [loading, setLoading] = useState(true)

    // =====================================
    // Cargar categorías desde localStorage
    // =====================================
    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = useCallback(() => {
        try {
            setLoading(true)
            const stored = localStorage.getItem(STORAGE_KEY)

            if (stored) {
                const parsed = JSON.parse(stored)
                if (Array.isArray(parsed)) {
                    setCustomCategories(parsed)
                } else {
                    console.warn('⚠️ Datos inválidos en localStorage')
                    setCustomCategories([])
                }
            } else {
                setCustomCategories([])
            }
        } catch (error) {
            console.error('❌ Error al cargar categorías:', error)
            toast.error('Error al cargar categorías')
            setCustomCategories([])
        } finally {
            setLoading(false)
        }
    }, [])

    const saveCategories = useCallback((categories: CustomCategory[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
            setCustomCategories(categories)
        } catch (error) {
            console.error('❌ Error al guardar categorías:', error)
            toast.error('Error al guardar categorías')
        }
    }, [])

    // =====================================
    // Agregar categoría (solo local)
    // =====================================
    const addCategoryLocal = useCallback((category: CustomCategory) => {
        if (!category.backendName.trim() || !category.internalName.trim()) {
            toast.error('El nombre del backend y el nombre interno son obligatorios')
            return false
        }

        const exists = customCategories.some(
            (cat) => cat.backendName.toLowerCase() === category.backendName.toLowerCase()
        )

        if (exists) {
            toast.error(`Ya existe una categoría con el nombre "${category.backendName}"`)
            return false
        }

        const newCategories = [...customCategories, category]
        saveCategories(newCategories)
        toast.success(`Categoría "${category.backendName}" agregada correctamente`)
        return true
    }, [customCategories, saveCategories])

// =====================================
// 🚀 Agregar categoría directamente al API (con toast de carga)
// =====================================
const addCategoryToApi = useCallback(async (category: CustomCategory) => {
    const loadingToast = toast.loading(`Creando categoría "${category.backendName}"...`);

    try {
        if (!category.backendName.trim() || !category.internalName.trim()) {
            toast.dismiss(loadingToast);
            toast.error('El nombre del backend y el nombre interno son obligatorios');
            return false;
        }

        // Llamada al backend
        const { categoria } = await categoriasService.create({
            nombre: category.backendName,
            descripcion: category.descripcion || category.internalName,
        });

        // Guardar también localmente
        const newCategory: CustomCategory = {
            backendName: categoria.nombre,
            internalName: category.internalName,
            icon: category.icon,
        };

        const updatedCategories = [...customCategories, newCategory];
        saveCategories(updatedCategories);

        toast.dismiss(loadingToast);
        toast.success(`Categoría "${categoria.nombre}" creada en el servidor`);
        return categoria;
    } catch (error: any) {
        console.error('❌ Error al crear categoría en el servidor:', error);
        toast.dismiss(loadingToast);
        toast.error(error.response?.data?.error || 'Error al crear categoría');
        return false;
    }
}, [customCategories, saveCategories]);

    // =====================================
    // Eliminar categoría localmente
    // =====================================
    const removeLocalCategory = useCallback(
        (backendName: string) => {
            const newCategories = customCategories.filter(
                (cat) => cat.backendName !== backendName
            )
            saveCategories(newCategories)
            toast.success(`Categoría "${backendName}" eliminada localmente`)
        },
        [customCategories, saveCategories]
    )

// =====================================
// Eliminar categoría desde el backend (usando nombre del backend)
// =====================================
const removeRemoteCategory = useCallback(
    async (categoria_nombre: string) => {
        const loadingToast = toast.loading(`Eliminando "${categoria_nombre}"...`);

        try {
            // Obtener el ID desde el nombre
            const id_categoria = await categoriasService.getIdbyName(categoria_nombre);

            if (!id_categoria) {
                toast.dismiss(loadingToast);
                toast.error(`No se encontró la categoría "${categoria_nombre}" en el servidor`);
                return;
            }

            // Eliminar desde el backend
            await categoriasService.delete(id_categoria);

            // Actualizar las categorías locales
            const newCategories = customCategories.filter(
                (cat) => cat.backendName !== categoria_nombre
            );
            saveCategories(newCategories);

            toast.dismiss(loadingToast);
            toast.success(`Categoría "${categoria_nombre}" eliminada del servidor`);
        } catch (error: any) {
            console.error('Error al eliminar categoría:', error);
            toast.dismiss(loadingToast);
            toast.error('No se pudo eliminar la categoría del servidor');
        }
    },
    [customCategories, saveCategories]
);


    // =====================================
    // Actualizar categoría
    // =====================================
    const updateCategory = useCallback((oldBackendName: string, updatedCategory: CustomCategory) => {
        const index = customCategories.findIndex((cat) => cat.backendName === oldBackendName)

        if (index === -1) {
            toast.error('Categoría no encontrada')
            return false
        }

        if (oldBackendName !== updatedCategory.backendName) {
            const exists = customCategories.some(
                (cat) => cat.backendName.toLowerCase() === updatedCategory.backendName.toLowerCase()
            )

            if (exists) {
                toast.error(`Ya existe una categoría con el nombre "${updatedCategory.backendName}"`)
                return false
            }
        }

        const newCategories = [...customCategories]
        newCategories[index] = updatedCategory
        saveCategories(newCategories)
        toast.success('Categoría actualizada correctamente')
        return true
    }, [customCategories, saveCategories])

    // =====================================
    // Extras
    // =====================================
    const getCategoryIcon = useCallback((backendName: string): string | null => {
        const category = customCategories.find((cat) => cat.backendName === backendName)
        return category?.icon || null
    }, [customCategories])

    const getInternalName = useCallback((backendName: string): string | null => {
        const category = customCategories.find((cat) => cat.backendName === backendName)
        return category?.internalName || null
    }, [customCategories])

    const clearAllCategories = useCallback(() => {
        saveCategories([])
        toast.success('Todas las categorías personalizadas han sido eliminadas')
    }, [saveCategories])

    return {
        customCategories,
        loading,
        addCategoryLocal,     // solo localStorage
        addCategoryToApi,     // 🚀 directo al backend
        removeLocalCategory,
        removeRemoteCategory,
        updateCategory,
        getCategoryIcon,
        getInternalName,
        clearAllCategories,
        refetch: loadCategories,
    }
}
