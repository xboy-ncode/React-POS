// hooks/useDynamicCategories.ts
import { useState, useEffect } from 'react'

interface CategoryMapping {
  backendName: string
  internalName: string
  icon: string
  createdAt: string
}

const STORAGE_KEY = 'pos_custom_categories'
const API_URL = `${import.meta.env.VITE_API_URL}/categories`

export function useDynamicCategories() {
  const [customCategories, setCustomCategories] = useState<CategoryMapping[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setCustomCategories(JSON.parse(stored))
      } catch (error) {
        console.error('Error loading custom categories:', error)
      }
    }
  }, [])

  const saveCategories = (categories: CategoryMapping[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
    setCustomCategories(categories)
  }

  const addCategory = async (mapping: Omit<CategoryMapping, 'createdAt'>) => {
    const newCategory: CategoryMapping = {
      ...mapping,
      createdAt: new Date().toISOString()
    }

    // Guardar localmente
    const updated = [...customCategories, newCategory]
    saveCategories(updated)

    console.log('✅ Nueva categoría agregada localmente:', newCategory)

    // Enviar al backend
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          nombre: mapping.backendName,
          descripcion: mapping.internalName // o mapping.icon si prefieres
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('❌ Error al guardar en el backend:', errorText)
        throw new Error(`Error al crear categoría: ${res.status}`)
      }

      const data = await res.json()
      console.log('🌐 Categoría guardada en la base de datos:', data.categoria)
      return data.categoria
    } catch (error) {
      console.error('⚠️ Error al sincronizar con backend:', error)
      alert('La categoría se guardó localmente pero no se pudo enviar al servidor.')
    }

    return newCategory
  }

  const removeCategory = (backendName: string) => {
    const updated = customCategories.filter(c => c.backendName !== backendName)
    saveCategories(updated)
    console.log('🗑️ Categoría eliminada localmente:', backendName)
  }

  const updateCategory = (backendName: string, updates: Partial<CategoryMapping>) => {
    const updated = customCategories.map(c =>
      c.backendName === backendName ? { ...c, ...updates } : c
    )
    saveCategories(updated)
    console.log('✏️ Categoría actualizada localmente:', backendName)
  }

  return {
    customCategories,
    addCategory,
    removeCategory,
    updateCategory
  }
}
