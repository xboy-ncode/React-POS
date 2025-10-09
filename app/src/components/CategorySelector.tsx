import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { api } from '@/lib/api'

export function CategorySelector({ 
    value, 
    onChange, 
    categoryName 
}: { 
    value?: number; 
    onChange: (id: number, name: string) => void;
    categoryName?: string;
}) {
    const [open, setOpen] = useState(false)
    const [categorias, setCategorias] = useState<{ id_categoria: number; nombre: string; descripcion?: string }[]>([])
    const [loading, setLoading] = useState(false)

    const fetchCategorias = async () => {
        try {
            setLoading(true)
            const res = await api('/categories')
            setCategorias(res.categorias || [])
        } catch (err) {
            console.error(err)
            toast.error('Error al cargar categorías')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategorias()
    }, [])

    // Intentar encontrar la categoría por nombre si no hay value pero sí categoryName
    useEffect(() => {
        if (!value && categoryName && categorias.length > 0) {
            // Buscar en las categorías de la BD comparando con categoria_nombre del producto
            const foundCategory = categorias.find(
                (c) => c.nombre.toLowerCase().trim() === categoryName.toLowerCase().trim()
            )
            if (foundCategory) {
                onChange(foundCategory.id_categoria, foundCategory.nombre)
            }
        }
    }, [categoryName, categorias, value])

    const createCategory = async (nombre: string) => {
        try {
            const res = await api('/categories', {
                method: 'POST',
                body: JSON.stringify({ nombre }),
            })
            toast.success('Categoría agregada')
            await fetchCategorias()
            onChange(res.categoria.id_categoria, res.categoria.nombre)
        } catch (err: any) {
            console.error('Error al crear categoría:', err)
            toast.error(err?.message || 'No se pudo crear la categoría')
        }
    }

    const selectedName = value 
        ? categorias.find((c) => c.id_categoria === value)?.nombre 
        : categoryName

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedName || 'Selecciona una categoría'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[300px]">
                <Command>
                    <CommandInput placeholder="Buscar o crear categoría..." />
                    <CommandEmpty>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-sm"
                            onClick={() => {
                                const input = document.querySelector<HTMLInputElement>(
                                    '[placeholder="Buscar o crear categoría..."]'
                                )
                                if (input && input.value.trim()) {
                                    createCategory(input.value.trim())
                                    setOpen(false)
                                }
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Crear nueva categoría
                        </Button>
                    </CommandEmpty>
                    <CommandGroup>
                        {categorias.map((cat) => (
                            <CommandItem
                                key={cat.id_categoria}
                                onSelect={() => {
                                    onChange(cat.id_categoria, cat.nombre)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        'mr-2 h-4 w-4',
                                        cat.id_categoria === value ? 'opacity-100' : 'opacity-0'
                                    )}
                                />
                                {cat.nombre}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}