import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus, Package, DollarSign, AlertTriangle, Loader2, Barcode } from 'lucide-react'
import { useInventory } from '@/hooks/useInventory'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { ProductsDataTable } from '@/components/inventory/ProductDataTable'
import type { Product, Category } from '@/types/pos'
import { usePOSCategories } from '@/hooks/usePOSCategories'
import { CategorySelector } from '@/components/CategorySelector'
import { BrandSelector } from '@/components/BrandSelector'

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

  // Hooks - Ahora con el adapter corregido
  const {
    products,
    loading,
    error,
    stats,
    refetch,
    createProduct,
    updateProduct,
    deleteProduct
  } = useInventory()

  const {
    categories,
    loading: loadingCategories,
    error: errorCategories,
    getCategoryBackendId
  } = usePOSCategories()

  // Estados locales
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number>(0)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 0 || product.categoryId === selectedCategory
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, searchQuery])

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      // Verificar si la categoría es local y sincronizarla
      const category = categories.find(cat => cat.id === productData.categoryId)
      let finalCategoryId = productData.categoryId

      if (category?.isLocal && category.name) {
        toast.loading('Sincronizando categoría con el servidor...')
        const backendId = await getCategoryBackendId(category.name)
        toast.dismiss()

        if (!backendId) {
          toast.error('No se pudo sincronizar la categoría')
          return
        }

        finalCategoryId = backendId
        toast.success('Categoría sincronizada correctamente')
      }

      const finalProductData = {
        ...productData,
        categoryId: finalCategoryId
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, finalProductData)
      } else {
        await createProduct(finalProductData)
      }

      setEditingProduct(null)
      setShowAddProduct(false)
    } catch (error) {
      console.error('Failed to save product:', error)
    }
  }

  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProduct(id)
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const handleCloseEditor = () => {
    setEditingProduct(null)
    setShowAddProduct(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t('app.loading')}</span>
      </div>
    )
  }

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
        <Button
          onClick={() => {
            setEditingProduct(null)
            setShowAddProduct(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('inventory.add_item')}
        </Button>
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
                <p className="text-2xl font-bold">S/ {stats.totalValue.toFixed(2)}</p>
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

      {/* Products Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardContent className="p-0">
            <ProductsDataTable
              products={filteredProducts}
              categories={categories}
              onEditProduct={(product) => {
                setEditingProduct(product)
                setShowAddProduct(true)
              }}
              onDeleteProduct={handleDeleteProduct}
              getStockStatus={getStockStatus}
              t={t}
            />
          </CardContent>
        </CardHeader>
      </Card>

      {/* Product Editor Dialog */}
      <ProductEditor
        product={editingProduct}
        onSave={handleSaveProduct}
        onClose={handleCloseEditor}
        open={showAddProduct}
        onOpenChange={setShowAddProduct}
        categories={categories}
      />
    </div>
  )
}

// Product Editor Component
function ProductEditor({
  product,
  onSave,
  onClose,
  open,
  onOpenChange,
  categories
}: {
  product: Product | null
  onSave: (product: Partial<Product>) => void
  onClose: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
}) {
  const { t } = useTranslation()

  const [form, setForm] = useState<Partial<Product>>({
    name: '',
    price: 0,
    categoryId: undefined,
    categoryName: '',
    sku: '',
    barcode: '',
    stock: 0,
    cost: 0,
    isAvailable: true,
    supplier: '',
    lowStockThreshold: 0,
    // ✅ NUEVOS CAMPOS
    precioCompra: 0,
    precioVentaMinorista: 0,
    precioVentaMayorista: undefined,
    cantidadMinimaMayorista: undefined,
    enOferta: false,
    precioOferta: undefined,
    porcentajeDescuentoOferta: undefined,
    brandId: undefined,
    brandName: ''
  })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product) {
      setForm(product)
    } else {
      setForm({
        name: '',
        price: 0,
        categoryId: undefined,
        categoryName: '',
        sku: '',
        barcode: '',
        stock: 0,
        cost: 0,
        isAvailable: true,
        supplier: '',
        lowStockThreshold: 0,
        // ✅ NUEVOS CAMPOS
        precioCompra: 0,
        precioVentaMinorista: 0,
        precioVentaMayorista: undefined,
        cantidadMinimaMayorista: undefined,
        enOferta: false,
        precioOferta: undefined,
        porcentajeDescuentoOferta: undefined,
        brandId: undefined,
        brandName: ''
      })
    }
  }, [product, open])

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen) {
      onClose()
    }
  }

  async function save() {
    if (!form.name?.trim() || !form.categoryId || (form.price || 0) <= 0) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    try {
      setSaving(true)
      await new Promise(resolve => setTimeout(resolve, 300))

      const categoryPrefix = form.categoryName?.substring(0, 3).toUpperCase() || 'PRD'

      onSave({
        ...form,
        name: form.name?.trim(),
        sku: form.sku?.trim().toUpperCase() || `${categoryPrefix}-${Date.now().toString().slice(-3)}`,
        barcode: form.barcode?.trim() || '',
        stock: form.stock || 0,
        supplier: form.supplier?.trim() || '',
        price: form.precioVentaMinorista || form.price || 0, // Mantener compatibilidad
        nameKey: `pos.products.${form.name?.toLowerCase().replace(/\s+/g, '_')}` || '',
        id: product?.id || Date.now()
      })

      handleOpenChange(false)
    } catch (error) {
      console.error('Failed to save product:', error)
      toast.error('Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  const isValid = form.name?.trim() &&
    form.categoryId &&
    (form.precioVentaMinorista || form.price || 0) > 0 &&
    (form.precioCompra || 0) >= 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>
              {product ? t('pos.dialogs.edit_product.title', 'Editar Producto') : t('pos.dialogs.add_product.title', 'Agregar Producto')}
            </span>
          </DialogTitle>
          <DialogDescription>
            {product
              ? t('pos.dialogs.edit_product.description', 'Edita los detalles del producto.')
              : t('pos.dialogs.add_product.description', 'Agrega un nuevo producto al inventario.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">{t('inventory.basic_information', 'Información Básica')}</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t('inventory.product_name_required', 'Nombre del Producto *')}
                  </Label>
                  <Input
                    id="name"
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t('inventory.product_name_placeholder', 'Ej: Vino Tinto')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">
                    {t('inventory.sku_required', 'SKU *')}
                  </Label>
                  <Input
                    id="sku"
                    value={form.sku || ''}
                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    placeholder={t('inventory.sku_placeholder', 'Ej: ALC-RED-001')}
                    className="font-mono uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">{t('inventory.barcode', 'Código de Barras')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="barcode"
                      value={form.barcode || ''}
                      onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                      placeholder={t('inventory.barcode_placeholder', 'Ej: 7501234567890')}
                      className="font-mono"
                    />
                    <Button variant="outline" size="icon" type="button">
                      <Barcode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing - Precios Detallados */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">Precios</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precioCompra">Precio de Compra *</Label>
                <Input
                  id="precioCompra"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precioCompra || ''}
                  onChange={(e) => setForm({ ...form, precioCompra: parseFloat(e.target.value) || 0 })}
                  placeholder="Ej: 10.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precioVentaMinorista">Precio Venta Minorista *</Label>
                <Input
                  id="precioVentaMinorista"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precioVentaMinorista || ''}
                  onChange={(e) => setForm({
                    ...form,
                    precioVentaMinorista: parseFloat(e.target.value) || 0,
                    price: parseFloat(e.target.value) || 0 // Mantener compatibilidad
                  })}
                  placeholder="Ej: 15.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precioVentaMayorista">Precio Venta Mayorista (Opcional)</Label>
                <Input
                  id="precioVentaMayorista"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precioVentaMayorista || ''}
                  onChange={(e) => setForm({ ...form, precioVentaMayorista: parseFloat(e.target.value) || undefined })}
                  placeholder="Ej: 12.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidadMinimaMayorista">Cantidad Mínima Mayorista</Label>
                <Input
                  id="cantidadMinimaMayorista"
                  type="number"
                  min="1"
                  value={form.cantidadMinimaMayorista || ''}
                  onChange={(e) => setForm({ ...form, cantidadMinimaMayorista: parseInt(e.target.value) || undefined })}
                  placeholder="Ej: 10"
                  disabled={!form.precioVentaMayorista}
                />
              </div>
            </div>
          </Card>

          {/* Ofertas */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Ofertas</h4>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enOferta"
                  checked={form.enOferta || false}
                  onChange={(e) => setForm({ ...form, enOferta: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="enOferta" className="cursor-pointer">Activar Oferta</Label>
              </div>
            </div>
            {form.enOferta && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="porcentajeDescuentoOferta">% Descuento</Label>
                  <Input
                    id="porcentajeDescuentoOferta"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={form.porcentajeDescuentoOferta || ''}
                    onChange={(e) => {
                      const descuento = parseFloat(e.target.value) || 0
                      const precioBase = form.precioVentaMinorista || form.price || 0
                      const precioOferta = precioBase * (1 - descuento / 100)
                      setForm({
                        ...form,
                        porcentajeDescuentoOferta: descuento,
                        precioOferta: precioOferta
                      })
                    }}
                    placeholder="Ej: 20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precioOferta">Precio con Oferta</Label>
                  <Input
                    id="precioOferta"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precioOferta || ''}
                    onChange={(e) => setForm({ ...form, precioOferta: parseFloat(e.target.value) || undefined })}
                    placeholder="Calculado automáticamente"
                    disabled
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Stock */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">Inventario</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Cantidad en Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={form.stock || ''}
                  onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                  placeholder="Ej: 20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Umbral de Stock Bajo</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  value={form.lowStockThreshold || ''}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: parseInt(e.target.value) || 5 })}
                  placeholder="Ej: 5"
                />
              </div>
            </div>
          </Card>

          {/* Category and Details */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">{t('inventory.category_details', 'Categoría y Detalles')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t('inventory.category', 'Categoría *')}</Label>
                <CategorySelector
                  value={form.categoryId}
                  categoryName={form.categoryName}
                  onChange={(id, name) => setForm({ ...form, categoryId: id, categoryName: name })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">{t('inventory.brand', 'Marca')}</Label>
                <Input
                  id="brand"
                  value={form.brandName || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      brandName: e.target.value,
                      brandId: undefined // clear id when typing a free-text brand
                    })
                  }
                  placeholder={t('inventory.brand_placeholder', 'Ej: Coca-Cola')}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            {t('pos.buttons.cancel', 'Cancelar')}
          </Button>
          <Button
            onClick={save}
            disabled={!isValid || saving}
            className="min-w-[100px]"
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{t('pos.buttons.saving', 'Guardando...')}</span>
              </div>
            ) : (
              product ? t('pos.buttons.update', 'Actualizar') : t('pos.buttons.add_product', 'Agregar')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}