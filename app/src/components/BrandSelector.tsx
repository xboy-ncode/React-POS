import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { api } from '@/lib/api'

export function BrandSelector({ 
    value, 
    onChange,
    brandName 
}: { 
    value?: number; 
    onChange: (id: number, name: string) => void;
    brandName?: string;
}) {
    const [open, setOpen] = useState(false)
    const [marcas, setMarcas] = useState<{ id_marca: number; nombre: string }[]>([])
    const [loading, setLoading] = useState(false)

    const fetchMarcas = async () => {
        try {
            setLoading(true)
            const res = await api('/brands')
            setMarcas(res.marcas || [])
        } catch (err) {
            console.error(err)
            toast.error('Error al cargar marcas')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMarcas()
    }, [])

    // Intentar encontrar la marca por nombre si no hay value pero sí brandName
    useEffect(() => {
        if (!value && brandName && marcas.length > 0) {
            const foundBrand = marcas.find(
                (m) => m.nombre.toLowerCase().trim() === brandName.toLowerCase().trim()
            )
            if (foundBrand) {
                onChange(foundBrand.id_marca, foundBrand.nombre)
            }
        }
    }, [brandName, marcas, value])

    const createMarca = async (nombre: string) => {
        try {
            const res = await api('/brands', {
                method: 'POST',
                body: JSON.stringify({ nombre }),
            })
            toast.success('Marca agregada')
            await fetchMarcas()
            onChange(res.marca.id_marca, res.marca.nombre)
        } catch (err: any) {
            console.error('Error al crear marca:', err)
            toast.error(err?.message || 'No se pudo crear la marca')
        }
    }

    const selectedName = value 
        ? marcas.find((m) => m.id_marca === value)?.nombre 
        : brandName

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                >
                    {selectedName || 'Selecciona una marca'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[300px]">
                <Command>
                    <CommandInput placeholder="Buscar o crear marca..." />
                    <CommandEmpty>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-sm"
                            onClick={() => {
                                const input = document.querySelector<HTMLInputElement>(
                                    '[placeholder="Buscar o crear marca..."]'
                                )
                                if (input && input.value.trim()) {
                                    createMarca(input.value.trim())
                                    setOpen(false)
                                }
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Crear nueva marca
                        </Button>
                    </CommandEmpty>
                    <CommandGroup>
                        {marcas.map((marca) => (
                            <CommandItem
                                key={marca.id_marca}
                                onSelect={() => {
                                    onChange(marca.id_marca, marca.nombre)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        'mr-2 h-4 w-4',
                                        marca.id_marca === value ? 'opacity-100' : 'opacity-0'
                                    )}
                                />
                                {marca.nombre}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}