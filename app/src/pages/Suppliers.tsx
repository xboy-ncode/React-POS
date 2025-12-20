// pages/Suppliers.tsx
import { useState, useEffect } from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Search,
    Plus,
    Edit,
    Loader2,
    Building2,
    Phone,
    Mail,
    MapPin,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { proveedoresService, type Proveedor } from '@/lib/api-client'
import { CreateSupplierDialog } from '@/components/suppliers/CreateSupplierDialog'
import { EditSupplierDialog } from '@/components/suppliers/EditSupplierDialog'
import { toast } from 'sonner'

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState<Proveedor[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState<Proveedor | null>(null)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
    })

    useEffect(() => {
        fetchSuppliers()
    }, [])

    const fetchSuppliers = async (filters?: { page?: number; search?: string }) => {
        setLoading(true)
        try {
            const data = await proveedoresService.getAll({
                page: filters?.page || pagination.page,
                limit: pagination.limit,
                search: filters?.search
            })
            setSuppliers(data.proveedores || [])
            if (data.pagination) {
                setPagination(data.pagination)
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error)
            toast.error('Error al cargar proveedores')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        fetchSuppliers({ search: searchQuery, page: 1 })
    }

    const handleClearFilters = () => {
        setSearchQuery('')
        fetchSuppliers({ page: 1 })
    }

    const handleEdit = (supplier: Proveedor) => {
        setSelectedSupplier(supplier)
        setShowEdit(true)
    }

    const activeSuppliers = suppliers.filter(s => s.activo).length
    const inactiveSuppliers = suppliers.filter(s => !s.activo).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
                    <p className="text-muted-foreground">
                        Gestión de proveedores y contactos
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Proveedor
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Proveedores
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pagination.total}</div>
                        <p className="text-xs text-muted-foreground">
                            Proveedores registrados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Activos
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeSuppliers}</div>
                        <p className="text-xs text-muted-foreground">
                            Proveedores activos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Inactivos
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">{inactiveSuppliers}</div>
                        <p className="text-xs text-muted-foreground">
                            Proveedores inactivos
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="RUC, razón social..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        </div>

                        <div className="flex items-end gap-2">
                            <Button onClick={handleSearch}>
                                Buscar
                            </Button>
                            <Button variant="outline" onClick={handleClearFilters}>
                                Limpiar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Suppliers Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Lista de Proveedores</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>RUC</TableHead>
                                    <TableHead>Razón Social</TableHead>
                                    <TableHead>Contacto</TableHead>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading && suppliers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No se encontraron proveedores
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!loading && suppliers.map((supplier) => (
                                    <TableRow key={supplier.id_proveedor}>
                                        <TableCell className="font-medium">{supplier.ruc}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{supplier.razon_social}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {supplier.telefono && (
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                                        {supplier.telefono}
                                                    </div>
                                                )}
                                                {supplier.correo && (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Mail className="h-3 w-3" />
                                                        {supplier.correo}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {supplier.direccion && (
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="max-w-[200px] truncate">{supplier.direccion}</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={supplier.activo ? 'default' : 'secondary'}>
                                                {supplier.activo ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(supplier)}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Editar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchSuppliers({ page: pagination.page - 1 })}
                                    disabled={!pagination.hasPrev}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchSuppliers({ page: pagination.page + 1 })}
                                    disabled={!pagination.hasNext}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <CreateSupplierDialog
                open={showCreate}
                onOpenChange={setShowCreate}
                onSuccess={() => {
                    setShowCreate(false)
                    fetchSuppliers()
                }}
            />

            <EditSupplierDialog
                open={showEdit}
                onOpenChange={setShowEdit}
                supplier={selectedSupplier}
                onSuccess={() => {
                    setShowEdit(false)
                    fetchSuppliers()
                }}
            />
        </div>
    )
}