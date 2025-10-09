// components/CategoryManager.tsx
import { useState } from 'react'
import { useDynamicCategories } from '../hooks/useDynamicsCategories'
import { Plus, Trash2, Edit2 } from 'lucide-react'

export function CategoryManager() {
    const {
        customCategories,
        addCategory,
        removeCategory,
        updateCategory
    } = useDynamicCategories()

    const [isAdding, setIsAdding] = useState(false)
    const [newCategory, setNewCategory] = useState({
        backendName: '',
        internalName: '',
        icon: '📦'
    })

    // Lista de emojis comunes para seleccionar
    const commonEmojis = [
        '🍕', '🍔', '🥗', '🍜', '🍰', '☕', '🧃', '🍺', '🍷', '🥤',
        '📱', '💻', '🎮', '📚', '👕', '👟', '💊', '🧴', '🧽', '🔧',
        '🚗', '🏠', '🐾', '👶', '🎨', '⚽', '🎵', '🎬', '📦', '🛒'
    ]

    const handleAdd = () => {
        if (!newCategory.backendName || !newCategory.internalName) {
            alert('Por favor completa todos los campos')
            return
        }

        addCategory(newCategory)
        setNewCategory({ backendName: '', internalName: '', icon: '📦' })
        setIsAdding(false)
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Gestión de Categorías</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Nueva Categoría
                </button>
            </div>

            {/* Formulario para agregar */}
            {isAdding && (
                <div className="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                    <h3 className="font-semibold mb-4">Agregar Nueva Categoría</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Nombre del Backend
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Electronics"
                                value={newCategory.backendName}
                                onChange={(e) => setNewCategory({
                                    ...newCategory,
                                    backendName: e.target.value
                                })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Exactamente como viene del backend
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Nombre Interno
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: electronics"
                                value={newCategory.internalName}
                                onChange={(e) => setNewCategory({
                                    ...newCategory,
                                    internalName: e.target.value.toLowerCase().replace(/\s+/g, '_')
                                })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                En minúsculas, sin espacios
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Icono
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategory.icon}
                                    onChange={(e) => setNewCategory({
                                        ...newCategory,
                                        icon: e.target.value
                                    })}
                                    className="w-20 px-3 py-2 border rounded-lg text-center text-2xl"
                                />
                                <select
                                    onChange={(e) => setNewCategory({
                                        ...newCategory,
                                        icon: e.target.value
                                    })}
                                    className="flex-1 px-3 py-2 border rounded-lg"
                                >
                                    <option value="">Seleccionar emoji</option>
                                    {commonEmojis.map(emoji => (
                                        <option key={emoji} value={emoji}>
                                            {emoji} {emoji}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Guardar
                        </button>
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de categorías personalizadas */}
            <div className="space-y-3">
                <h3 className="font-semibold text-lg mb-3">Categorías Personalizadas</h3>
                
                {customCategories.length === 0 ? (
                    <p className="text-gray-500 italic">
                        No hay categorías personalizadas. Agrega una para empezar.
                    </p>
                ) : (
                    customCategories.map((cat) => (
                        <div
                            key={cat.backendName}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-3xl">{cat.icon}</span>
                                <div>
                                    <p className="font-semibold">{cat.backendName}</p>
                                    <p className="text-sm text-gray-500">
                                        → {cat.internalName}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (confirm('¿Eliminar esta categoría?')) {
                                        removeCategory(cat.backendName)
                                    }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Información de ayuda */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold mb-2">💡 ¿Cómo funciona?</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                    <li>• <strong>Nombre del Backend:</strong> El nombre exacto que envía tu API</li>
                    <li>• <strong>Nombre Interno:</strong> Cómo lo identificarás en el sistema</li>
                    <li>• <strong>Icono:</strong> Un emoji que represente la categoría</li>
                    <li>• Las categorías se guardan en tu navegador</li>
                </ul>
            </div>
        </div>
    )
}