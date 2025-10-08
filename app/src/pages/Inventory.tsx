import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Search, Plus, Edit2, Trash2, Package, DollarSign, AlertTriangle, Loader2, Box } from 'lucide-react'
import { useInventory } from '@/hooks/useInventory'
import { toast } from 'sonner'
import { api } from '@/lib/api' // 👈 Agregar import

// Types - 👇 Actualizado con los campos necesarios
type Product = {
  id: number
  name: string
  nameKey: string
  price: number
  category: string
  image: string
  sku?: string
  description?: string
  cost?: number
  preparationTime?: number
  ingredients?: string
  allergens?: string
  isAvailable?: boolean
  popularity?: number
  productIcon?: string
  stock?: number
  lowStockThreshold?: number
  supplier?: string
  location?: string
  createdAt?: string
  updatedAt?: string
  id_categoria?: number | null  // 👈 Agregar
  id_marca?: number | null       // 👈 Agregar
}

const getStockStatus = (
  product: Product,
  t: (key: string, options?: any) => string
) => {
  const threshold = product.lowStockThreshold || 10
  const stock = product.stock || 0
  if (stock === 0) {
    return <Badge variant="destructive">{t('pos.out_of_stock')}</Badge>
  } else if (stock <= threshold) {
    return <Badge variant="outline" className="bg-yellow-300 border-yellow-400 text-yellow-800">{t('pos.low_stock')}</Badge>
  } else {
    return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">{t('pos.in_stock')}</Badge>
  }
}

export default function Inventory() {
  const { t } = useTranslation()

  // Hook personalizado para gestionar inventario
  const {
    products,
    loading,
    error,
    stats,
    createProduct,
    updateProduct,
    deleteProduct
  } = useInventory()

  // Estados locales
  const [filteredItems, setFilteredItems] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  // Filtrar productos según búsqueda
  useEffect(() => {
    const filtered = products.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredItems(filtered)
  }, [products, searchTerm])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setEditing(null)
    }
  }

  const handleSaveItem = async (item: Product) => {
    try {
      if (item.id && editing) {
        // Actualizar producto existente
        await updateProduct(item.id, item)
      } else {
        // Crear nuevo producto
        await createProduct(item)
      }
      setOpen(false)
      setEditing(null)
    } catch (error) {
      console.error('Error saving item:', error)
      // El error ya se muestra en el hook con toast
    }
  }

  const handleDeleteItem = async (id: number) => {
    try {
      await deleteProduct(id)
    } catch (error) {
      console.error('Error deleting item:', error)
      // El error ya se muestra en el hook con toast
    }
  }

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t('app.loading')}</span>
      </div>
    )
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">Error al cargar inventario</p>
          <p className="text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            {t('pos.try_again')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('inventory.title')}</h1>
          <p className="text-muted-foreground">
            {t('inventory.description')}
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditing(null)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('inventory.add_item')}
            </Button>
          </DialogTrigger>
          <ItemEditor item={editing} onSave={handleSaveItem} onClose={() => handleOpenChange(false)} />
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('inventory.total_items')}</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('inventory.total_value')}</p>
                <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('inventory.low_stock_alerts')}</p>
                <p className="text-2xl font-bold text-destructive">{stats.lowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('inventory.inventory_items')}</CardTitle>
            <Badge variant="secondary" className="text-sm">
              {filteredItems.length} {t('app.total')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('inventory.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">{t('inventory.product')}</TableHead>
                  <TableHead className="font-semibold">{t('app.sku')}</TableHead>
                  <TableHead className="font-semibold">{t('inventory.category')}</TableHead>
                  <TableHead className="font-semibold">{t('app.price')}</TableHead>
                  <TableHead className="font-semibold">{t('app.stock')}</TableHead>
                  <TableHead className="font-semibold">{t('app.status')}</TableHead>
                  <TableHead className="font-semibold text-right">{t('app.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-center space-y-2">
                        <Box className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {searchTerm ? t('inventory.no_items_found') : t('inventory.no_items')}
                        </p>
                        {!searchTerm && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(null)
                              setOpen(true)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('inventory.add_first_item')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        <span>{item.sku}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.category || 'Sin categoría'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${item.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <span>{item.stock}</span>
                      </TableCell>
                      <TableCell>{getStockStatus(item, t)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing(item)
                              setOpen(true)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('inventory.delete_item')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('inventory.delete_item_confirmation', { name: item.name, sku: item.sku })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('app.cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t('app.delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ItemEditor({
  item,
  onSave,
  onClose
}: {
  item: Product | null
  onSave: (item: Product) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<Partial<Product>>(
    item || {
      name: '',
      sku: '',
      price: 0,
      stock: 0,
      category: '',
      lowStockThreshold: 10,
      description: '',
      supplier: '',
      cost: 0,
      id_categoria: null,
      id_marca: null
    }
  )
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])

  // Cargar categorías y marcas
  useEffect(() => {
    async function loadCategoriesAndBrands() {
      try {
        const [catResponse, brandResponse] = await Promise.all([
          api('/categories'),
          api('/brands')
        ])
        setCategories(catResponse.categorias || [])
        setBrands(brandResponse.marcas || [])
      } catch (error) {
        console.error('Error loading categories/brands:', error)
      }
    }
    loadCategoriesAndBrands()
  }, [])

  useEffect(() => {
    if (item) {
      console.log('Editando item:', item) // Debug
      setForm(item)
    } else {
      setForm({
        name: '',
        sku: '',
        price: 0,
        stock: 0,
        category: '',
        lowStockThreshold: 10,
        description: '',
        supplier: '',
        cost: 0,
        id_categoria: null,
        id_marca: null
      })
    }
  }, [item])

  async function save() {
    if (!form.name?.trim() || !form.sku?.trim()) {
      toast.error('Nombre y SKU son requeridos')
      return
    }

    try {
      setSaving(true)

      await new Promise(resolve => setTimeout(resolve, 300))

      const productToSave: Product = {
        id: item?.id ?? 0,
        name: form.name?.trim() || '',
        nameKey: form.nameKey || `pos.products.${form.name?.toLowerCase().replace(/\s+/g, '_')}`,
        sku: form.sku?.trim() || '',
        price: form.price || 0,
        stock: form.stock || 0,
        category: form.category?.trim() || 'other',
        lowStockThreshold: form.lowStockThreshold || 10,
        description: form.description?.trim() || '',
        supplier: form.supplier?.trim() || '',
        cost: form.cost || 0,
        image: form.image || '/api/placeholder/200/200',
        isAvailable: form.isAvailable ?? true,
        updatedAt: new Date().toISOString(),
        id_categoria: form.id_categoria,
        id_marca: form.id_marca
      }

      console.log('Guardando producto:', productToSave)

      onSave(productToSave)
    } catch (error) {
      console.error('Failed to save item:', error)
      toast.error('Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  const isValid = form.name?.trim() && form.sku?.trim() && (form.price || 0) >= 0 && (form.stock || 0) >= 0

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>
            {item ? t('inventory.edit_item') : t('inventory.add_new_item')}
          </span>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Basic Information */}
        <Card className="p-4">
          <h4 className="font-medium mb-3">{t('inventory.basic_information')}</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('inventory.product_name_required')}
                </Label>
                <Input
                  id="name"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('inventory.product_name_placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">
                  {t('inventory.sku_required')}
                </Label>
                <Input
                  id="sku"
                  value={form.sku || ''}
                  onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                  placeholder={t('inventory.sku_placeholder')}
                  className="font-mono uppercase"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing and Stock */}
        <Card className="p-4">
          <h4 className="font-medium mb-3">{t('inventory.pricing_stock')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                {t('inventory.price_required')}
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price ?? ''}
                onChange={(e) => {
                  const value = e.target.value
                  setForm({ ...form, price: value === '' ? 0 : parseFloat(value) })
                }}
                placeholder={t('inventory.price_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">
                {t('inventory.stock_quantity_required')}
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={form.stock || ''}
                onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                placeholder={t('inventory.stock_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">{t('inventory.low_stock_threshold')}</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                value={form.lowStockThreshold || ''}
                onChange={(e) => setForm({ ...form, lowStockThreshold: parseInt(e.target.value) || 10 })}
                placeholder={t('inventory.threshold_placeholder')}
              />
            </div>
          </div>
        </Card>

        {/* Category and Brand */}
        <Card className="p-4">
          <h4 className="font-medium mb-3">{t('inventory.category_details')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id_categoria">{t('inventory.category')}</Label>
              <Select
                value={form.id_categoria?.toString() || 'none'}
                onValueChange={(value) => setForm({ ...form, id_categoria: value === 'none' ? null : parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('inventory.select_category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id_categoria} value={cat.id_categoria.toString()}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_marca">{t('inventory.brand')}</Label>
              <Select
                value={form.id_marca?.toString() || 'none'}
                onValueChange={(value) => setForm({ ...form, id_marca: value === 'none' ? null : parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('inventory.select_brand')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin marca</SelectItem>
                  {brands.map((brand: any) => (
                    <SelectItem key={brand.id_marca} value={brand.id_marca.toString()}>
                      {brand.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          {t('app.cancel')}
        </Button>
        <Button
          onClick={save}
          disabled={!isValid || saving}
          className="min-w-[80px]"
        >
          {saving ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{t('app.saving')}</span>
            </div>
          ) : (
            item ? t('app.update') : t('app.add')
          )}
        </Button>
      </div>
    </DialogContent>
  )
}