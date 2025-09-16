import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, ShoppingCart, X, Minus, Package, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
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
}

type CartItem = Product & {
  quantity: number
}

const categories: Category[] = [
  { id: 'all', name: 'All', nameKey: 'pos.categories.all', icon: '📦' },
  { id: 'snack', name: 'Snack', nameKey: 'pos.categories.snack', icon: '🍟' },
  { id: 'pizza', name: 'Pizza', nameKey: 'pos.categories.pizza', icon: '🍕' },
  { id: 'hamburger', name: 'Hamburger', nameKey: 'pos.categories.hamburger', icon: '🍔' },
  { id: 'coffee', name: 'Coffee', nameKey: 'pos.categories.coffee', icon: '☕' },
  { id: 'drink', name: 'Drink', nameKey: 'pos.categories.drink', icon: '🍹' },
  { id: 'pasta', name: 'Pasta', nameKey: 'pos.categories.pasta', icon: '🍝' },
  { id: 'dessert', name: 'Dessert', nameKey: 'pos.categories.dessert', icon: '🍰' },
  { id: 'salad', name: 'Salad', nameKey: 'pos.categories.salad', icon: '🥗' }
]

const initialProducts: Product[] = [
  { id: 1, name: 'Margherita Pizza', nameKey: 'pos.products.margherita_pizza', price: 10.00, category: 'pizza', image: '/api/placeholder/200/200', sku: 'PIZ-MAR-001', isAvailable: true },
  { id: 2, name: 'Vegetarian Pizza', nameKey: 'pos.products.vegetarian_pizza', price: 12.00, category: 'pizza', image: '/api/placeholder/200/200', sku: 'PIZ-VEG-001', isAvailable: true },
  { id: 3, name: 'Pepperoni Pizza', nameKey: 'pos.products.pepperoni_pizza', price: 16.00, category: 'pizza', image: '/api/placeholder/200/200', sku: 'PIZ-PEP-001', isAvailable: true },
  { id: 4, name: 'Supreme Pizza', nameKey: 'pos.products.supreme_pizza', price: 18.00, category: 'pizza', image: '/api/placeholder/200/200', sku: 'PIZ-SUP-001', isAvailable: true },
  { id: 5, name: 'Gourmet Burger', nameKey: 'pos.products.gourmet_burger', price: 18.40, category: 'hamburger', image: '/api/placeholder/200/200', sku: 'BUR-GOU-001', isAvailable: true },
  { id: 6, name: 'Classic Burger', nameKey: 'pos.products.classic_burger', price: 21.15, category: 'hamburger', image: '/api/placeholder/200/200', sku: 'BUR-CLA-001', isAvailable: true },
  { id: 7, name: 'Chicken Burger', nameKey: 'pos.products.chicken_burger', price: 10.15, category: 'hamburger', image: '/api/placeholder/200/200', sku: 'BUR-CHI-001', isAvailable: true },
  { id: 8, name: 'Latte', nameKey: 'pos.products.latte', price: 4.00, category: 'coffee', image: '/api/placeholder/200/200', sku: 'COF-LAT-001', isAvailable: true },
  { id: 9, name: 'Cappuccino', nameKey: 'pos.products.cappuccino', price: 12.00, category: 'coffee', image: '/api/placeholder/200/200', sku: 'COF-CAP-001', isAvailable: true },
  { id: 10, name: 'Espresso', nameKey: 'pos.products.espresso', price: 5.00, category: 'coffee', image: '/api/placeholder/200/200', sku: 'COF-ESP-001', isAvailable: true }
]

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
    isAvailable: true
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
        isAvailable: true
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
        sku: form.sku?.trim().toUpperCase() || `${form.category?.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-3)}`,
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

          {/* Product Grid */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t('pos.sections.products')}</h2>
              <Badge variant="secondary" className="text-sm">
                {filteredProducts.length} {t('pos.products_available')}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <Card
                  key={product.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 relative group"
                >
                  <div 
                    className="aspect-square bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center"
                    onClick={() => addToCart(product)}
                  >
                    <span className="text-6xl">
                      {product.category === 'pizza' && '🍕'}
                      {product.category === 'hamburger' && '🍔'}
                      {product.category === 'coffee' && '☕'}
                      {product.category === 'drink' && '🍹'}
                      {product.category === 'snack' && '🍟'}
                      {product.category === 'pasta' && '🍝'}
                      {product.category === 'dessert' && '🍰'}
                      {product.category === 'salad' && '🥗'}
                    </span>
                  </div>
                  
                  {/* Edit button - aparece en hover */}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingProduct(product)
                      setShowAddProduct(true)
                    }}
                  >
                    <Package className="w-3 h-3" />
                  </Button>

                  <div className="p-4" onClick={() => addToCart(product)}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm line-clamp-2 flex-1">
                        {t(product.nameKey, product.name)}
                      </h3>
                    </div>
                    
                    {product.sku && (
                      <p className="text-xs text-muted-foreground font-mono mb-1">
                        {product.sku}
                      </p>
                    )}
                    
                    {product.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        ${product.price.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1">
                        {product.preparationTime && (
                          <Badge variant="outline" className="text-xs">
                            {product.preparationTime}min
                          </Badge>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>

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
  )
}