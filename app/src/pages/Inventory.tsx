import React, { useEffect, useState } from 'react'
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

type Item = {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category?: string
  lowStockThreshold?: number
  description?: string
  supplier?: string
  location?: string
  createdAt?: string
  updatedAt?: string
}

// Mock data for demonstration
const mockItems: Item[] = [
  { 
    id: '1', 
    name: 'iPhone 15 Pro', 
    sku: 'IPH15PRO-128', 
    price: 999.00, 
    stock: 25, 
    category: 'Electronics', 
    lowStockThreshold: 10,
    description: 'Latest iPhone model with 128GB storage',
    supplier: 'Apple Inc.',
    location: 'Shelf A1-001'
  },
  { 
    id: '2', 
    name: 'Samsung Galaxy S24', 
    sku: 'SGS24-256', 
    price: 899.00, 
    stock: 8, 
    category: 'Electronics', 
    lowStockThreshold: 10,
    description: 'Samsung flagship phone with 256GB',
    supplier: 'Samsung',
    location: 'Shelf A1-002'
  },
  { 
    id: '3', 
    name: 'MacBook Pro 14"', 
    sku: 'MBP14-512', 
    price: 1999.00, 
    stock: 12, 
    category: 'Computers', 
    lowStockThreshold: 5,
    description: '14-inch MacBook Pro with M3 chip',
    supplier: 'Apple Inc.',
    location: 'Shelf B2-001'
  },
  { 
    id: '4', 
    name: 'iPad Air', 
    sku: 'IPAD-AIR-64', 
    price: 599.00, 
    stock: 18, 
    category: 'Tablets', 
    lowStockThreshold: 8,
    description: 'iPad Air with 64GB storage',
    supplier: 'Apple Inc.',
    location: 'Shelf A2-001'
  },
  { 
    id: '5', 
    name: 'AirPods Pro', 
    sku: 'APP-GEN2', 
    price: 249.00, 
    stock: 3, 
    category: 'Audio', 
    lowStockThreshold: 15,
    description: 'AirPods Pro 2nd generation',
    supplier: 'Apple Inc.',
    location: 'Shelf C1-001'
  },
  { 
    id: '6', 
    name: 'Dell Monitor 27"', 
    sku: 'DELL-MON-27', 
    price: 299.00, 
    stock: 22, 
    category: 'Accessories', 
    lowStockThreshold: 10,
    description: '27-inch 4K monitor',
    supplier: 'Dell',
    location: 'Shelf B1-001'
  },
  { 
    id: '7', 
    name: 'Logitech Mouse', 
    sku: 'LOG-MX-MASTER', 
    price: 99.00, 
    stock: 45, 
    category: 'Accessories', 
    lowStockThreshold: 20,
    description: 'MX Master wireless mouse',
    supplier: 'Logitech',
    location: 'Shelf C2-001'
  },
  { 
    id: '8', 
    name: 'Gaming Keyboard', 
    sku: 'GAME-KB-RGB', 
    price: 159.00, 
    stock: 2, 
    category: 'Accessories', 
    lowStockThreshold: 12,
    description: 'RGB mechanical gaming keyboard',
    supplier: 'Corsair',
    location: 'Shelf C2-002'
  }
]

const categories = ['Electronics', 'Computers', 'Tablets', 'Audio', 'Accessories', 'Gaming']

export default function Inventory() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Item[]>(mockItems)
  const [filteredItems, setFilteredItems] = useState<Item[]>(mockItems)
  const [searchTerm, setSearchTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredItems(filtered)
  }, [items, searchTerm])

  const totalValue = items.reduce((sum, item) => sum + (item.price * item.stock), 0)
  const lowStockItems = items.filter(item => item.stock <= (item.lowStockThreshold || 10))

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setEditing(null)
    }
  }

  const handleSaveItem = (item: Item) => {
    if (item.id && editing) {
      setItems(prev => prev.map(i => i.id === item.id ? item : i))
    } else {
      const newItem = { ...item, id: Date.now().toString(), createdAt: new Date().toISOString() }
      setItems(prev => [...prev, newItem])
    }
    setOpen(false)
    setEditing(null)
  }

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const getStockStatus = (item: Item) => {
    const threshold = item.lowStockThreshold || 10
    if (item.stock === 0) {
      return <Badge variant="destructive">{t('inventory.out_of_stock')}</Badge>
    } else if (item.stock <= threshold) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">{t('inventory.low_stock')}</Badge>
    } else {
      return <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">{t('inventory.in_stock')}</Badge>
    }
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
                <p className="text-2xl font-bold">{items.length}</p>
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
                <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
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
                <p className="text-2xl font-bold text-destructive">{lowStockItems.length}</p>
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

          {/* Table */}
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        <span className="text-muted-foreground">{t('app.loading')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-center space-y-2">
                        <Box className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {searchTerm ? 
                            t('inventory.no_items_found') :
                            t('inventory.no_items')
                          }
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
                          {item.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-48">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Box className="h-3 w-3 text-muted-foreground" />
                          <span>{item.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {t(`categories.${item.category?.toLowerCase()}`, item.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${item.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <div className="flex items-center space-x-2">
                          <span>{item.stock}</span>
                          {item.stock <= (item.lowStockThreshold || 10) && (
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStockStatus(item)}</TableCell>
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
                                  {t('inventory.delete_item_confirmation', { 
                                    name: item.name, 
                                    sku: item.sku 
                                  })}
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
  item: Item | null
  onSave: (item: Item) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<Partial<Item>>(
    item || { 
      name: '', 
      sku: '', 
      price: 0, 
      stock: 0, 
      category: '',
      lowStockThreshold: 10,
      description: '',
      supplier: '',
      location: ''
    }
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
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
        location: ''
      })
    }
  }, [item])

  async function save() {
    if (!form.name?.trim() || !form.sku?.trim()) {
      return
    }

    try {
      setSaving(true)
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      onSave({
        id: item?.id || '',
        name: form.name?.trim() || '',
        sku: form.sku?.trim() || '',
        price: form.price || 0,
        stock: form.stock || 0,
        category: form.category?.trim(),
        lowStockThreshold: form.lowStockThreshold || 10,
        description: form.description?.trim(),
        supplier: form.supplier?.trim(),
        location: form.location?.trim(),
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to save item:', error)
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

            <div className="space-y-2">
              <Label htmlFor="description">{t('inventory.description')}</Label>
              <Input
                id="description"
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('inventory.description_placeholder')}
              />
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
                value={form.price || ''}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
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

        {/* Category and Details */}
        <Card className="p-4">
          <h4 className="font-medium mb-3">{t('inventory.category_details')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">{t('inventory.category')}</Label>
              <Select
                value={form.category || ''}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('inventory.select_category')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`categories.${cat.toLowerCase()}`, cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplier">{t('inventory.supplier')}</Label>
              <Input
                id="supplier"
                value={form.supplier || ''}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder={t('inventory.supplier_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t('inventory.location')}</Label>
              <Input
                id="location"
                value={form.location || ''}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder={t('inventory.location_placeholder')}
              />
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