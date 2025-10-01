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



// Types
type Category = {
  toLowerCase(): unknown
  id: string
  name: string
  nameKey: string
  icon: string
}


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
}




const categories: Category[] = [
  {
    id: 'all', name: 'Todos', nameKey: 'pos.categories.all', icon: '🏪',
    toLowerCase: function (): unknown {
      throw new Error('Function not implemented.')
    }
  },
  { id: 'alcohol', name: 'Liquor', nameKey: 'pos.categories.liquor', icon: '🍷', toLowerCase: function () { return undefined; } },
  { id: 'beer', name: 'Beer', nameKey: 'pos.categories.beer', icon: '🍺', toLowerCase: function () { return undefined; } },
  { id: 'cigarettes', name: 'Cigarrettes', nameKey: 'pos.categories.cigarettes', icon: '🚬', toLowerCase: function () { return undefined; } },
  { id: 'snacks', name: 'Snacks', nameKey: 'pos.categories.snacks', icon: '🥜', toLowerCase: function () { return undefined; } },
  { id: 'beverages', name: 'Beverages', nameKey: 'pos.categories.beverages', icon: '🥤', toLowerCase: function () { return undefined; } },
  { id: 'candy', name: 'Candy', nameKey: 'pos.categories.candy', icon: '🍬', toLowerCase: function () { return undefined; } },
  { id: 'personal_care', name: 'Personal Care', nameKey: 'pos.categories.personal_care', icon: '🧴', toLowerCase: function () { return undefined; } },
  { id: 'household', name: 'Household', nameKey: 'pos.categories.household', icon: '🧽', toLowerCase: function () { return undefined; } },
  { id: 'phone_cards', name: 'Phone Cards', nameKey: 'pos.categories.phone_cards', icon: '📱', toLowerCase: function () { return undefined; } }
]



// Mock data for demonstration
const initialProducts: Product[] = [
  // Alcohol
  { id: 1, name: 'Red Wine', nameKey: 'pos.products.red_wine', price: 15.00, category: 'alcohol', image: '/api/placeholder/200/200', sku: 'ALC-RED-001', isAvailable: true, productIcon: '🍷', stock: 5 },
  { id: 2, name: 'Whiskey', nameKey: 'pos.products.whiskey', price: 25.00, category: 'alcohol', image: '/api/placeholder/200/200', sku: 'ALC-WHI-001', isAvailable: true, productIcon: '🥃', stock: 12 },

  // Beer
  { id: 3, name: 'Lager Beer', nameKey: 'pos.products.lager_beer', price: 3.50, category: 'beer', image: '/api/placeholder/200/200', sku: 'BER-LAG-001', isAvailable: true, productIcon: '🍺', stock: 20 },
  { id: 4, name: 'IPA Beer', nameKey: 'pos.products.ipa_beer', price: 4.20, category: 'beer', image: '/api/placeholder/200/200', sku: 'BER-IPA-001', isAvailable: true, productIcon: '🍻', stock: 7 },

  // Cigarettes
  { id: 5, name: 'Marlboro Pack', nameKey: 'pos.products.marlboro_pack', price: 6.00, category: 'cigarettes', image: '/api/placeholder/200/200', sku: 'CIG-MAR-001', isAvailable: true, productIcon: '🚬', stock: 30 },
  { id: 6, name: 'Camel Pack', nameKey: 'pos.products.camel_pack', price: 5.50, category: 'cigarettes', image: '/api/placeholder/200/200', sku: 'CIG-CAM-001', isAvailable: true, productIcon: '🚬', stock: 2 },

  // Snacks
  { id: 7, name: 'Potato Chips', nameKey: 'pos.products.potato_chips', price: 2.00, category: 'snacks', image: '/api/placeholder/200/200', sku: 'SNK-POT-001', isAvailable: true, productIcon: '🥔', stock: 15 },
  { id: 8, name: 'Salted Peanuts', nameKey: 'pos.products.salted_peanuts', price: 1.50, category: 'snacks', image: '/api/placeholder/200/200', sku: 'SNK-PEA-001', isAvailable: true, productIcon: '🥜', stock: 8 },

  // Beverages
  { id: 9, name: 'Coca-Cola', nameKey: 'pos.products.coca_cola', price: 1.80, category: 'beverages', image: '/api/placeholder/200/200', sku: 'BEV-COC-001', isAvailable: true, productIcon: '🥤', stock: 50 },
  { id: 10, name: 'Orange Juice', nameKey: 'pos.products.orange_juice', price: 2.50, category: 'beverages', image: '/api/placeholder/200/200', sku: 'BEV-ORA-001', isAvailable: true, productIcon: '🧃', stock: 3 },

  // Candy
  { id: 11, name: 'Chocolate Bar', nameKey: 'pos.products.chocolate_bar', price: 1.20, category: 'candy', image: '/api/placeholder/200/200', sku: 'CAN-CHO-001', isAvailable: true, productIcon: '🍫', stock: 18 },
  { id: 12, name: 'Gummy Bears', nameKey: 'pos.products.gummy_bears', price: 1.00, category: 'candy', image: '/api/placeholder/200/200', sku: 'CAN-GUM-001', isAvailable: true, productIcon: '🧸', stock: 0 },

  // Personal Care
  { id: 13, name: 'Shampoo', nameKey: 'pos.products.shampoo', price: 5.00, category: 'personal_care', image: '/api/placeholder/200/200', sku: 'PER-SHA-001', isAvailable: true, productIcon: '🧴', stock: 6 },
  { id: 14, name: 'Toothpaste', nameKey: 'pos.products.toothpaste', price: 2.50, category: 'personal_care', image: '/api/placeholder/200/200', sku: 'PER-TOO-001', isAvailable: true, productIcon: '🦷', stock: 25 },

  // Household
  { id: 15, name: 'Laundry Detergent', nameKey: 'pos.products.laundry_detergent', price: 8.00, category: 'household', image: '/api/placeholder/200/200', sku: 'HOU-LAU-001', isAvailable: true, productIcon: '🧽', stock: 10 },
  { id: 16, name: 'Dish Soap', nameKey: 'pos.products.dish_soap', price: 3.00, category: 'household', image: '/api/placeholder/200/200', sku: 'HOU-DIS-001', isAvailable: true, productIcon: '🧼', stock: 1 },

  // Phone Cards
  { id: 17, name: 'Phone Card $10', nameKey: 'pos.products.phone_card_10', price: 10.00, category: 'phone_cards', image: '/api/placeholder/200/200', sku: 'PHC-010-001', isAvailable: true, productIcon: '📱', stock: 40 },
  { id: 18, name: 'Phone Card $20', nameKey: 'pos.products.phone_card_20', price: 20.00, category: 'phone_cards', image: '/api/placeholder/200/200', sku: 'PHC-020-001', isAvailable: true, productIcon: '📞', stock: 9 }
]



export default function Inventory() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Product[]>(initialProducts)
  const [filteredItems, setFilteredItems] = useState<Product[]>(initialProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)


  useEffect(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredItems(filtered)
  }, [items, searchTerm])

  const totalValue = items.reduce((sum, item) => sum + (item.price * (item.stock ?? 0)), 0)
  const lowStockItems = items.filter(item => (item.stock ?? 0) <= (item.lowStockThreshold || 10))

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setEditing(null)
    }
  }

  const handleSaveItem = (item: Product) => {
    if (item.id && editing) {
      setItems(prev => prev.map(i => i.id === item.id ? item : i))
    } else {
      const newItem = { ...item, id: Date.now(), createdAt: new Date().toISOString() }
      setItems(prev => [...prev, newItem as Product])
    }
    setOpen(false)
    setEditing(null)
  }

  const handleDeleteItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id))
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

          {/* Table - SalePOS style */}
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
                          
                          <div className="font-medium">{t(item.nameKey, item.name)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        <span>{item.sku}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {t(`pos.categories.${item.category}`, categories.find(c => c.id === item.category)?.name || item.category)}
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
        id: item?.id ?? 0,
        name: form.name?.trim() || '',
        sku: form.sku?.trim() || '',
        price: form.price || 0,
        stock: form.stock || 0,
        category: form.category?.trim() || '',
        lowStockThreshold: form.lowStockThreshold || 10,
        description: form.description?.trim(),
        supplier: form.supplier?.trim(),
        location: form.location?.trim(),
        updatedAt: new Date().toISOString(),
        nameKey: '',
        image: ''
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
                    <SelectItem key={cat.id} value={cat.id}>
                      {t(`categories.${cat.id.toLowerCase()}`, cat.name)}
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