import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, ShoppingCart, X, Minus, Package, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


import { Edit2, Trash2, Box, DollarSign, AlertTriangle } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

// Types
type Category = {
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

type CartItem = Product & {
  quantity: number
}

const categories: Category[] = [
  { id: 'all', name: 'Todos', nameKey: 'pos.categories.all', icon: '🏪' },
  { id: 'alcohol', name: 'Liquor', nameKey: 'pos.categories.liquor', icon: '🍷' },
  { id: 'beer', name: 'Beer', nameKey: 'pos.categories.beer', icon: '🍺' },
  { id: 'cigarettes', name: 'Cigarrettes', nameKey: 'pos.categories.cigarettes', icon: '🚬' },
  { id: 'snacks', name: 'Snacks', nameKey: 'pos.categories.snacks', icon: '🥜' },
  { id: 'beverages', name: 'Beverages', nameKey: 'pos.categories.beverages', icon: '🥤' },
  { id: 'candy', name: 'Candy', nameKey: 'pos.categories.candy', icon: '🍬' },
  { id: 'personal_care', name: 'Personal Care', nameKey: 'pos.categories.personal_care', icon: '🧴' },
  { id: 'household', name: 'Household', nameKey: 'pos.categories.household', icon: '🧽' },
  { id: 'phone_cards', name: 'Phone Cards', nameKey: 'pos.categories.phone_cards', icon: '📱' }
]

const initialProducts: Product[] = [
  // Alcohol
  { id: 1, name: 'Red Wine', nameKey: 'pos.products.red_wine', price: 15.00, category: 'alcohol', image: '/api/placeholder/200/200', sku: 'ALC-RED-001', isAvailable: true, productIcon: '🍷' },
  { id: 2, name: 'Whiskey', nameKey: 'pos.products.whiskey', price: 25.00, category: 'alcohol', image: '/api/placeholder/200/200', sku: 'ALC-WHI-001', isAvailable: true, productIcon: '🥃' },

  // Beer
  { id: 3, name: 'Lager Beer', nameKey: 'pos.products.lager_beer', price: 3.50, category: 'beer', image: '/api/placeholder/200/200', sku: 'BER-LAG-001', isAvailable: true, productIcon: '🍺' },
  { id: 4, name: 'IPA Beer', nameKey: 'pos.products.ipa_beer', price: 4.20, category: 'beer', image: '/api/placeholder/200/200', sku: 'BER-IPA-001', isAvailable: true, productIcon: '🍻' },

  // Cigarettes
  { id: 5, name: 'Marlboro Pack', nameKey: 'pos.products.marlboro_pack', price: 6.00, category: 'cigarettes', image: '/api/placeholder/200/200', sku: 'CIG-MAR-001', isAvailable: true, productIcon: '🚬' },
  { id: 6, name: 'Camel Pack', nameKey: 'pos.products.camel_pack', price: 5.50, category: 'cigarettes', image: '/api/placeholder/200/200', sku: 'CIG-CAM-001', isAvailable: true, productIcon: '🚬' },

  // Snacks
  { id: 7, name: 'Potato Chips', nameKey: 'pos.products.potato_chips', price: 2.00, category: 'snacks', image: '/api/placeholder/200/200', sku: 'SNK-POT-001', isAvailable: true, productIcon: '🥔' },
  { id: 8, name: 'Salted Peanuts', nameKey: 'pos.products.salted_peanuts', price: 1.50, category: 'snacks', image: '/api/placeholder/200/200', sku: 'SNK-PEA-001', isAvailable: true, productIcon: '🥜' },

  // Beverages
  { id: 9, name: 'Coca-Cola', nameKey: 'pos.products.coca_cola', price: 1.80, category: 'beverages', image: '/api/placeholder/200/200', sku: 'BEV-COC-001', isAvailable: true, productIcon: '🥤' },
  { id: 10, name: 'Orange Juice', nameKey: 'pos.products.orange_juice', price: 2.50, category: 'beverages', image: '/api/placeholder/200/200', sku: 'BEV-ORA-001', isAvailable: true, productIcon: '🧃' },

  // Candy
  { id: 11, name: 'Chocolate Bar', nameKey: 'pos.products.chocolate_bar', price: 1.20, category: 'candy', image: '/api/placeholder/200/200', sku: 'CAN-CHO-001', isAvailable: true, productIcon: '🍫' },
  { id: 12, name: 'Gummy Bears', nameKey: 'pos.products.gummy_bears', price: 1.00, category: 'candy', image: '/api/placeholder/200/200', sku: 'CAN-GUM-001', isAvailable: true, productIcon: '🧸' },

  // Personal Care
  { id: 13, name: 'Shampoo', nameKey: 'pos.products.shampoo', price: 5.00, category: 'personal_care', image: '/api/placeholder/200/200', sku: 'PER-SHA-001', isAvailable: true, productIcon: '🧴' },
  { id: 14, name: 'Toothpaste', nameKey: 'pos.products.toothpaste', price: 2.50, category: 'personal_care', image: '/api/placeholder/200/200', sku: 'PER-TOO-001', isAvailable: true, productIcon: '🦷' },

  // Household
  { id: 15, name: 'Laundry Detergent', nameKey: 'pos.products.laundry_detergent', price: 8.00, category: 'household', image: '/api/placeholder/200/200', sku: 'HOU-LAU-001', isAvailable: true, productIcon: '🧽' },
  { id: 16, name: 'Dish Soap', nameKey: 'pos.products.dish_soap', price: 3.00, category: 'household', image: '/api/placeholder/200/200', sku: 'HOU-DIS-001', isAvailable: true, productIcon: '🧼' },

  // Phone Cards
  { id: 17, name: 'Phone Card $10', nameKey: 'pos.products.phone_card_10', price: 10.00, category: 'phone_cards', image: '/api/placeholder/200/200', sku: 'PHC-010-001', isAvailable: true, productIcon: '📱' },
  { id: 18, name: 'Phone Card $20', nameKey: 'pos.products.phone_card_20', price: 20.00, category: 'phone_cards', image: '/api/placeholder/200/200', sku: 'PHC-020-001', isAvailable: true, productIcon: '📞' }
]



const getStockStatus = (product: Product) => {
  const { t } = useTranslation()
  const threshold = product.lowStockThreshold || 10
  const stock = product.stock || 0
  if (stock === 0) {
    return <Badge variant="destructive">{t('pos.out_of_stock')}</Badge>
  } else if (stock <= threshold) {
    return <Badge variant="outline" className="border-yellow-500 text-yellow-600">{t('pos.low_stock')}</Badge>
  } else {
    return <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">{t('pos.in_stock')}</Badge>
  }
}





const handleDeleteProduct = (productId: number) => {
  setProducts(prev => prev.filter((p: { id: number }) => p.id !== productId))
  setCart(prev => prev.filter((item: { id: number }) => item.id !== productId)) // Also remove from cart if present
}

function ProductEditor({
  product,
  onSave,
  onClose,
  open,
  onOpenChange
}: {
  product: Product | null
  onSave: (product: Partial<Product>) => void
  onClose: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()




  const [form, setForm] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: '',
    sku: '',
    description: '',
    cost: 0,
    preparationTime: 0,
    ingredients: '',
    allergens: '',
    isAvailable: true,
    productIcon: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product) {
      setForm(product)
    } else {
      setForm({
        name: '',
        price: 0,
        category: '',
        sku: '',
        description: '',
        cost: 0,
        preparationTime: 0,
        ingredients: '',
        allergens: '',
        isAvailable: true,
        productIcon: ''
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
    if (!form.name?.trim() || !form.category || (form.price || 0) <= 0) {
      return
    }

    try {
      setSaving(true)
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800))

      onSave({
        ...form,
        name: form.name?.trim(),
        sku: form.sku?.trim().toUpperCase() || `${form.category?.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`,
        nameKey: `pos.products.${form.name?.toLowerCase().replace(/\s+/g, '_')}` || '',
        id: product?.id || Date.now()
      })

      handleOpenChange(false)
    } catch (error) {
      console.error('Failed to save product:', error)
    } finally {
      setSaving(false)
    }
  }

  const isValid = form.name?.trim() && form.category && (form.price || 0) > 0



  // Common product icons by category
  const categoryIcons = {
    alcohol: ['🍷', '🥃', '🍸', '🍹', '🍾', '🥂'],
    beer: ['🍺', '🍻', '🍺', '🍻'],
    cigarettes: ['🚬'],
    snacks: ['🥜', '🥔', '🍿', '🥨', '🍪', '🍘'],
    beverages: ['🥤', '🧃', '☕', '🧋', '🍵', '🥛'],
    candy: ['🍫', '🍬', '🧸', '🍭', '🍩', '🧁'],
    personal_care: ['🧴', '🦷', '🪥', '🧼', '🪒', '💄'],
    household: ['🧽', '🧼', '🧹', '🪣', '🧺', '🧻'],
    phone_cards: ['📱', '📞', '💳', '📶']
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>
              {product ? t('pos.dialogs.edit_product.title') : t('pos.dialogs.add_product.title')}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información Básica */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">{t('pos.dialogs.basic_information')}</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t('pos.dialogs.product_name')} *
                  </Label>
                  <Input
                    id="name"
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t('pos.dialogs.product_name_placeholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">
                    {t('pos.dialogs.sku')}
                  </Label>
                  <Input
                    id="sku"
                    value={form.sku || ''}
                    onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    placeholder={t('pos.dialogs.sku_placeholder')}
                    className="font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('pos.dialogs.description')}</Label>
                <Input
                  id="description"
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t('pos.dialogs.description_placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productIcon">{t('pos.dialogs.product_icon')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="productIcon"
                    value={form.productIcon || ''}
                    onChange={(e) => setForm({ ...form, productIcon: e.target.value })}
                    placeholder="🍫"
                    className="w-20 text-center text-lg"
                    maxLength={2}
                  />
                  {form.category && categoryIcons[form.category as keyof typeof categoryIcons] && (
                    <div className="flex gap-1">
                      {categoryIcons[form.category as keyof typeof categoryIcons].map((icon, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0 text-lg"
                          onClick={() => setForm({ ...form, productIcon: icon })}
                        >
                          {icon}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Precios y Categoría */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">{t('pos.dialogs.pricing_category')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  {t('pos.dialogs.price')} *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price || ''}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">
                  {t('pos.dialogs.cost')}
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost || ''}
                  onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t('pos.dialogs.category')} *</Label>
                <Select
                  value={form.category || ''}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('pos.dialogs.select_category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {t(category.nameKey, category.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Detalles del Producto */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">{t('pos.dialogs.product_details')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preparationTime">{t('pos.dialogs.preparation_time')}</Label>
                <Input
                  id="preparationTime"
                  type="number"
                  min="0"
                  value={form.preparationTime || ''}
                  onChange={(e) => setForm({ ...form, preparationTime: parseInt(e.target.value) || 0 })}
                  placeholder={t('pos.dialogs.preparation_time_placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">{t('pos.dialogs.availability')}</Label>
                <Select
                  value={form.isAvailable ? 'available' : 'unavailable'}
                  onValueChange={(value) => setForm({ ...form, isAvailable: value === 'available' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">{t('pos.dialogs.available')}</SelectItem>
                    <SelectItem value="unavailable">{t('pos.dialogs.unavailable')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="ingredients">{t('pos.dialogs.ingredients')}</Label>
                <Input
                  id="ingredients"
                  value={form.ingredients || ''}
                  onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                  placeholder={t('pos.dialogs.ingredients_placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergens">{t('pos.dialogs.allergens')}</Label>
                <Input
                  id="allergens"
                  value={form.allergens || ''}
                  onChange={(e) => setForm({ ...form, allergens: e.target.value })}
                  placeholder={t('pos.dialogs.allergens_placeholder')}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            {t('pos.buttons.cancel')}
          </Button>
          <Button
            onClick={save}
            disabled={!isValid || saving}
            className="min-w-[100px]"
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{t('pos.buttons.saving')}</span>
              </div>
            ) : (
              product ? t('pos.buttons.update') : t('pos.buttons.add_product')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}



export default function POSSystem() {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [showAddProduct, setShowAddProduct] = useState<boolean>(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const productName = t(product.nameKey, product.name)
    const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const isAvailable = product.isAvailable !== false
    return matchesCategory && matchesSearch && isAvailable
  })

  const addToCart = (product: Product) => {
    if (product.isAvailable === false) return

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)

  const handleSaveProduct = (productData: Partial<Product>) => {
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p))
    } else {
      const newProduct = {
        ...productData,
        id: Date.now(),
        image: '/api/placeholder/200/200'
      } as Product
      setProducts(prev => [...prev, newProduct])
    }
    setEditingProduct(null)
  }

  const handleCloseEditor = () => {
    setEditingProduct(null)
    setShowAddProduct(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{t('pos.title')}</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setEditingProduct(null)
                setShowAddProduct(true)
              }}
            >
              <Plus className="w-4 h-4" />
              {t('pos.buttons.add_product')}
            </Button>

            <Button variant="outline" className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0H8v0z" />
              </svg>
              {t('pos.buttons.tables')}
            </Button>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('pos.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-[300px]"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Category Filters */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">{t('pos.sections.categories')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex flex-col h-auto py-4 px-3 gap-2"
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-xs font-medium">{t(category.nameKey, category.name)}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Product Table */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t('pos.products_title')}</CardTitle>
                <Badge variant="secondary" className="text-sm">
                  {filteredProducts.length} {t('app.total')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={t('pos.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">{t('pos.product_title')}</TableHead>
                      <TableHead className="font-semibold">{t('app.sku')}</TableHead>
                      <TableHead className="font-semibold">{t('pos.category')}</TableHead>
                      <TableHead className="font-semibold">{t('app.price')}</TableHead>
                      <TableHead className="font-semibold">{t('app.stock')}</TableHead>
                      <TableHead className="font-semibold">{t('app.status')}</TableHead>
                      <TableHead className="font-semibold text-right">{t('app.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{t(product.nameKey, product.name)}</div>
                            {product.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-48">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Box className="h-3 w-3 text-muted-foreground" />
                            <span>{product.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {t(`pos.categories.${product.category}`, categories.find(c => c.id === product.category)?.name || product.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${product.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div className="flex items-center space-x-2">
                            <span>{product.stock || 0}</span>
                            {(product.stock || 0) <= (product.lowStockThreshold || 10) && (
                              <AlertTriangle className="h-3 w-3 text-destructive" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStockStatus(product)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addToCart(product)}
                              title={t('pos.add_to_cart')}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product)
                                setShowAddProduct(true)
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
                                  <AlertDialogTitle>{t('pos.delete_product')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('pos.delete_product_confirmation', {
                                      name: t(product.nameKey, product.name),
                                      sku: product.sku
                                    })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('app.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteProduct(product.id)}
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{t('pos.cart.title')}</h2>
                <Badge variant="secondary">
                  {t('pos.cart.items_count', { count: cart.length })}
                </Badge>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🛒</div>
                  <p className="text-muted-foreground">{t('pos.cart.empty')}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {t(item.nameKey, item.name)}
                          </h4>
                          <p className="text-muted-foreground text-xs">
                            {t('pos.cart.price_each', { price: item.price.toFixed(2) })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantity(item.id, item.quantity - 1)
                            }}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantity(item.id, item.quantity + 1)
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 w-6 p-0 ml-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFromCart(item.id)
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">{t('pos.cart.total')}:</span>
                        <span className="text-xl font-bold">${cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button className="w-full" size="lg">
                      {t('pos.buttons.checkout')}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>

        {/* Product Editor Dialog */}
        <ProductEditor
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={handleCloseEditor}
          open={showAddProduct}
          onOpenChange={setShowAddProduct}
        />
      </div>
    </div>
  )
}

function setProducts(arg0: (prev: any) => any) {
  throw new Error('Function not implemented.')
}
function setCart(arg0: (prev: any) => any) {
  throw new Error('Function not implemented.')
}

