import * as React from "react"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import type {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ShoppingCart,
    Edit2,
    Trash2,
    Box,
    Barcode,
    AlertTriangle,
} from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { Product } from "@/types/pos"
import type { Category } from "@/types/pos"

interface ProductsDataTableProps {
    products: Product[]
    categories: Category[]
    onAddToCart: (product: Product) => void
    onEditProduct: (product: Product) => void
    onDeleteProduct: (productId: number) => void
    getStockStatus: (product: Product, t: any) => React.ReactNode
    t: any
}

export function ProductsDataTable({
    products,
    categories,
    onAddToCart,
    onEditProduct,
    onDeleteProduct,
    getStockStatus,
    t,
}: ProductsDataTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = React.useState("")

    const columns: ColumnDef<Product>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 hover:bg-transparent"
                    >
                        <span className="font-semibold">{t('pos.product_title')}</span>
                        {column.getIsSorted() === "asc" ? (
                            <ArrowUp className="ml-2 h-3 w-3" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ArrowDown className="ml-2 h-3 w-3" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const product = row.original
                return (
                    <div className="font-medium">
                        {product.nameKey ? t(product.nameKey, product.name) : product.name}
                    </div>
                )
            },
        },
        {
            accessorKey: "sku",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 hover:bg-transparent"
                    >
                        <span className="font-semibold">{t('app.sku')}</span>
                        {column.getIsSorted() === "asc" ? (
                            <ArrowUp className="ml-2 h-3 w-3" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ArrowDown className="ml-2 h-3 w-3" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const sku = row.getValue("sku") as string | undefined
                return (
                    <div className="flex items-center space-x-2">
                        <Box className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-sm font-medium">
                            {sku || '-'}
                        </span>
                    </div>
                )
            },
        },
        {
            accessorKey: "barcode",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 hover:bg-transparent"
                    >
                        <span className="font-semibold">{t('pos.barcode', 'Código Barras')}</span>
                        {column.getIsSorted() === "asc" ? (
                            <ArrowUp className="ml-2 h-3 w-3" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ArrowDown className="ml-2 h-3 w-3" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const barcode = row.getValue("barcode") as string | undefined
                return (
                    <div className="flex items-center space-x-2">
                        <Barcode className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-sm">{barcode || '-'}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: "categoryName",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 hover:bg-transparent"
                    >
                        <span className="font-semibold">{t('pos.category')}</span>
                        {column.getIsSorted() === "asc" ? (
                            <ArrowUp className="ml-2 h-3 w-3" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ArrowDown className="ml-2 h-3 w-3" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const categoryName = row.getValue("categoryName") as string | undefined
                const product = row.original
                
                // Buscar el icono de la categoría
                const category = categories.find(cat => cat.name === categoryName)
                
                return (
                    <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                        {category?.icon && <span>{category.icon}</span>}
                        <span>{categoryName || 'Sin categoría'}</span>
                    </Badge>
                )
            },
            // Función de filtrado personalizada para categorías
            filterFn: (row, id, value) => {
                const categoryName = row.getValue(id) as string | undefined
                if (!value || value === "all") return true
                return categoryName === value
            },
        },
        {
            accessorKey: "price",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 hover:bg-transparent"
                    >
                        <span className="font-semibold">{t('app.price')}</span>
                        {column.getIsSorted() === "asc" ? (
                            <ArrowUp className="ml-2 h-3 w-3" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ArrowDown className="ml-2 h-3 w-3" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const price = parseFloat(row.getValue("price") as string)
                return <div className="font-semibold">S/ {price.toFixed(2)}</div>
            },
        },
        {
            accessorKey: "stock",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 px-2 hover:bg-transparent"
                    >
                        <span className="font-semibold">{t('app.stock')}</span>
                        {column.getIsSorted() === "asc" ? (
                            <ArrowUp className="ml-2 h-3 w-3" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ArrowDown className="ml-2 h-3 w-3" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const product = row.original
                const stock = product.stock || 0
                const lowStockThreshold = product.lowStockThreshold || 10
                return (
                    <div className="flex items-center space-x-2">
                        <span className="font-semibold">{stock}</span>
                        {stock <= lowStockThreshold && stock > 0 && (
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                        )}
                        {stock === 0 && (
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "status",
            header: () => {
                return <span className="font-semibold">{t('app.status')}</span>
            },
            cell: ({ row }) => {
                return getStockStatus(row.original, t)
            },
        },
        {
            id: "actions",
            header: () => {
                return <div className="text-right font-semibold">{t('app.actions')}</div>
            },
            cell: ({ row }) => {
                const product = row.original
                const isOutOfStock = (product.stock || 0) === 0
                
                return (
                    <div className="flex items-center justify-end space-x-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onAddToCart(product)}
                            title={t('pos.add_to_cart')}
                            disabled={isOutOfStock}
                        >
                            <ShoppingCart className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditProduct(product)}
                            title={t('app.edit')}
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-destructive hover:text-destructive"
                                    title={t('app.delete')}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('pos.delete_product')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('pos.delete_product_confirmation', {
                                            name: product.nameKey ? t(product.nameKey, product.name) : product.name,
                                            sku: product.sku || 'N/A'
                                        })}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('app.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onDeleteProduct(product.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        {t('app.delete')}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data: products,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
    })

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-3">
                    <CardTitle className="text-lg">{t('pos.products_title')}</CardTitle>
                    <Badge variant="secondary" className="text-sm">
                        {table.getFilteredRowModel().rows.length} {t('app.total')}
                    </Badge>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Búsqueda global */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder={t('pos.search_placeholder')}
                            value={globalFilter ?? ""}
                            onChange={(event) => setGlobalFilter(event.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Filtro por categoría */}
                    <Select
                        value={(table.getColumn("categoryName")?.getFilterValue() as string) ?? "all"}
                        onValueChange={(value) =>
                            table.getColumn("categoryName")?.setFilterValue(value === "all" ? undefined : value)
                        }
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder={t('pos.category')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                <span className="flex items-center gap-2">
                                    <span>🏪</span>
                                    <span>{t('app.all_categories', 'Todas')}</span>
                                </span>
                            </SelectItem>
                            {categories
                                .filter(cat => cat.id !== 0) // Excluir "Todos"
                                .map((cat) => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                        <span className="flex items-center gap-2">
                                            <span>{cat.icon}</span>
                                            <span>{cat.name}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="bg-muted/50">
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className="hover:bg-muted/50"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        {t('app.no_results', 'No se encontraron resultados')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}