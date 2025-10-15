// components/CategorySelector.tsx
import { usePOSCategories } from '@/hooks/usePOSCategories'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Cloud, HardDrive } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface CategorySelectorProps {
    value?: number
    categoryName?: string
    onChange: (id: number | undefined, name: string) => void
    disabled?: boolean
    showLocalIndicator?: boolean
}

export function CategorySelector({
    value,
    categoryName,
    onChange,
    disabled = false,
    showLocalIndicator = true
}: CategorySelectorProps) {
    const { t } = useTranslation()
    const { categories, loading } = usePOSCategories()

    const handleValueChange = (stringValue: string) => {
        const numericValue = parseInt(stringValue, 10)
        const selectedCategory = categories.find(cat => cat.id === numericValue)

        if (selectedCategory) {
            onChange(numericValue, selectedCategory.name)
        }
    }

    if (loading) {
        return (
            <Select disabled>
                <SelectTrigger>
                    <SelectValue placeholder={t('inventory.loading_categories', 'Cargando categorías...')} />
                </SelectTrigger>
            </Select>
        )
    }

    const selectedCategory = categories.find(cat => cat.id === value)

    return (
        <div className="space-y-2">
            <Select
                value={value?.toString()}
                onValueChange={handleValueChange}
                disabled={disabled}
            >
                <SelectTrigger>
                    <SelectValue placeholder={t('inventory.select_category')}>
                        {/* {selectedCategory && (
                            <div className="flex items-center gap-2">
                                <span>{selectedCategory.icon}</span>
                                <span>{t(selectedCategory.nameKey, selectedCategory.name)}</span>
                                {showLocalIndicator && selectedCategory.isLocal && (
                                    <Badge
                                        variant="outline"
                                        className="ml-auto text-xs bg-amber-50 text-amber-700 border-amber-300"
                                    >
                                        <HardDrive className="w-3 h-3 mr-1" />
                                        Local
                                    </Badge>
                                )}
                            </div>
                        )} */}
                    </SelectValue>
                </SelectTrigger>

                <SelectContent>
                    {categories
                        .filter(cat => cat.id !== 0) // Excluir "Todos"
                        .map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                                <div className="flex items-center gap-2 w-full">
                                    <span>{category.icon}</span>
                                    <span className="flex-1">{t(category.nameKey, category.name)}</span>

                                    {/* {showLocalIndicator && (
                                        category.isLocal ? (
                                            <Badge
                                                variant="outline"
                                                className="ml-2 text-xs bg-amber-50 text-amber-700 border-amber-300"
                                            >
                                                <HardDrive className="w-3 h-3 mr-1" />
                                                Local
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-300"
                                            >
                                                <Cloud className="w-3 h-3 mr-1" />
                                                Servidor
                                            </Badge>
                                        )
                                    )} */}
                                </div>
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>

            {/* Advertencia si la categoría seleccionada es local */}
            {showLocalIndicator && selectedCategory?.isLocal && (
                <div className="flex items-center gap-2 text-amber-600 text-xs p-2 bg-amber-50 border border-amber-200 rounded">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>
                        {t('inventory.local_category_warning', 'Esta categoría se sincronizará con el servidor al guardar el producto')}
                    </span>
                </div>
            )}
        </div>
    )
}