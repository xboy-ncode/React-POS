import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, ShoppingCart, X, Minus, Package, Loader2, Barcode } from 'lucide-react'
import {
  Card,
  CardContent,

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
  DialogFooter,
  DialogHeader,
  DialogTitle,

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

  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


import { Edit2, Trash2, Box, AlertTriangle } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

import CheckoutDialog from '../components/pos/CheckoutDialog'

import { usePOSProducts } from '../hooks/usePOSProducts'
import { processCheckout } from '../lib/checkout-adapter'

import { toast } from 'sonner'
import { BrandSelector } from '@/components/BrandSelector'
import { CategorySelector } from '@/components/CategorySelector'
import { Switch } from '@/components/ui/switch'
import { usePOSCategories } from '@/hooks/usePOSCategories'

import type { Category, Product } from '@/types/pos'


type CartItem = Product & {
  quantity: number
}

const categories_local: Category[] = [
  { id: 0, name: 'Todos', nameKey: 'pos.categories.all', icon: '🏪' },
  { id: 1, name: 'Liquor', nameKey: 'pos.categories.liquor', icon: '🍷' },
  { id: 2, name: 'Beer', nameKey: 'pos.categories.beer', icon: '🍺' },
  { id: 3, name: 'Cigarrettes', nameKey: 'pos.categories.cigarettes', icon: '🚬' },
  { id: 4, name: 'Snacks', nameKey: 'pos.categories.snacks', icon: '🥜' },
  { id: 5, name: 'Beverages', nameKey: 'pos.categories.beverages', icon: '🥤' },
  { id: 6, name: 'Candy', nameKey: 'pos.categories.candy', icon: '🍬' },
  { id: 7, name: 'Personal Care', nameKey: 'pos.categories.personal_care', icon: '🧴' },
  { id: 8, name: 'Household', nameKey: 'pos.categories.household', icon: '🧽' },
  { id: 9, name: 'Phone Cards', nameKey: 'pos.categories.phone_cards', icon: '📱' }
]

// const initialProducts: Product[] = [
//   // Alcohol
//   { id: 1, name: 'Red Wine', nameKey: 'pos.products.red_wine', price: 15.00, category: 'alcohol', image: '/api/placeholder/200/200', sku: 'ALC-RED-001', isAvailable: true, productIcon: '🍷', stock: 5 },
//   { id: 2, name: 'Whiskey', nameKey: 'pos.products.whiskey', price: 25.00, category: 'alcohol', image: '/api/placeholder/200/200', sku: 'ALC-WHI-001', isAvailable: true, productIcon: '🥃', stock: 12 },

//   // Beer
//   { id: 3, name: 'Lager Beer', nameKey: 'pos.products.lager_beer', price: 3.50, category: 'beer', image: '/api/placeholder/200/200', sku: 'BER-LAG-001', isAvailable: true, productIcon: '🍺', stock: 20 },
//   { id: 4, name: 'IPA Beer', nameKey: 'pos.products.ipa_beer', price: 4.20, category: 'beer', image: '/api/placeholder/200/200', sku: 'BER-IPA-001', isAvailable: true, productIcon: '🍻', stock: 7 },

//   // Cigarettes
//   { id: 5, name: 'Marlboro Pack', nameKey: 'pos.products.marlboro_pack', price: 6.00, category: 'cigarettes', image: '/api/placeholder/200/200', sku: 'CIG-MAR-001', isAvailable: true, productIcon: '🚬', stock: 30 },
//   { id: 6, name: 'Camel Pack', nameKey: 'pos.products.camel_pack', price: 5.50, category: 'cigarettes', image: '/api/placeholder/200/200', sku: 'CIG-CAM-001', isAvailable: true, productIcon: '🚬', stock: 2 },

//   // Snacks
//   { id: 7, name: 'Potato Chips', nameKey: 'pos.products.potato_chips', price: 2.00, category: 'snacks', image: '/api/placeholder/200/200', sku: 'SNK-POT-001', isAvailable: true, productIcon: '🥔', stock: 15 },
//   { id: 8, name: 'Salted Peanuts', nameKey: 'pos.products.salted_peanuts', price: 1.50, category: 'snacks', image: '/api/placeholder/200/200', sku: 'SNK-PEA-001', isAvailable: true, productIcon: '🥜', stock: 8 },

//   // Beverages
//   { id: 9, name: 'Coca-Cola', nameKey: 'pos.products.coca_cola', price: 1.80, category: 'beverages', image: '/api/placeholder/200/200', sku: 'BEV-COC-001', isAvailable: true, productIcon: '🥤', stock: 50 },
//   { id: 10, name: 'Orange Juice', nameKey: 'pos.products.orange_juice', price: 2.50, category: 'beverages', image: '/api/placeholder/200/200', sku: 'BEV-ORA-001', isAvailable: true, productIcon: '🧃', stock: 3 },

//   // Candy
//   { id: 11, name: 'Chocolate Bar', nameKey: 'pos.products.chocolate_bar', price: 1.20, category: 'candy', image: '/api/placeholder/200/200', sku: 'CAN-CHO-001', isAvailable: true, productIcon: '🍫', stock: 18 },
//   { id: 12, name: 'Gummy Bears', nameKey: 'pos.products.gummy_bears', price: 1.00, category: 'candy', image: '/api/placeholder/200/200', sku: 'CAN-GUM-001', isAvailable: true, productIcon: '🧸', stock: 0 },

//   // Personal Care
//   { id: 13, name: 'Shampoo', nameKey: 'pos.products.shampoo', price: 5.00, category: 'personal_care', image: '/api/placeholder/200/200', sku: 'PER-SHA-001', isAvailable: true, productIcon: '🧴', stock: 6 },
//   { id: 14, name: 'Toothpaste', nameKey: 'pos.products.toothpaste', price: 2.50, category: 'personal_care', image: '/api/placeholder/200/200', sku: 'PER-TOO-001', isAvailable: true, productIcon: '🦷', stock: 25 },

//   // Household
//   { id: 15, name: 'Laundry Detergent', nameKey: 'pos.products.laundry_detergent', price: 8.00, category: 'household', image: '/api/placeholder/200/200', sku: 'HOU-LAU-001', isAvailable: true, productIcon: '🧽', stock: 10 },
//   { id: 16, name: 'Dish Soap', nameKey: 'pos.products.dish_soap', price: 3.00, category: 'household', image: '/api/placeholder/200/200', sku: 'HOU-DIS-001', isAvailable: true, productIcon: '🧼', stock: 1 },

//   // Phone Cards
//   { id: 17, name: 'Phone Card $10', nameKey: 'pos.products.phone_card_10', price: 10.00, category: 'phone_cards', image: '/api/placeholder/200/200', sku: 'PHC-010-001', isAvailable: true, productIcon: '📱', stock: 40 },
//   { id: 18, name: 'Phone Card $20', nameKey: 'pos.products.phone_card_20', price: 20.00, category: 'phone_cards', image: '/api/placeholder/200/200', sku: 'PHC-020-001', isAvailable: true, productIcon: '📞', stock: 9 }
// ]



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
    preparationTime: 0,
    ingredients: '',
    allergens: '',
    isAvailable: true,
    productIcon: '',
    supplier: '',
    lowStockThreshold: 5
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
        preparationTime: 0,
        ingredients: '',
        allergens: '',
        isAvailable: true,
        productIcon: '',
        supplier: '',
        lowStockThreshold: 5
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
      return
    }

    try {
      setSaving(true)
      await new Promise(resolve => setTimeout(resolve, 800))

      const categoryPrefix = form.categoryName?.substring(0, 3).toUpperCase() || 'PRD'

      onSave({
        ...form,
        name: form.name?.trim(),
        sku: form.sku?.trim().toUpperCase() || `${categoryPrefix}-${Date.now().toString().slice(-3)}`,
        barcode: form.barcode?.trim() || '',
        stock: form.stock || 0,
        supplier: form.supplier?.trim() || '',
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

  const isValid = form.name?.trim() && form.categoryId && (form.price || 0) > 0

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
                    placeholder={t('inventory.product_name_placeholder', 'e.g. Red Wine')}
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
                    placeholder={t('inventory.sku_placeholder', 'e.g. ALC-RED-001')}
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
                  placeholder={t('inventory.price_placeholder', 'e.g. 15.00')}
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
                  placeholder={t('inventory.stock_placeholder', 'e.g. 20')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">{t('inventory.low_stock_threshold')}</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  value={form.lowStockThreshold || ''}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: parseInt(e.target.value) || 5 })}
                  placeholder={t('inventory.threshold_placeholder', 'e.g. 5')}
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
                <CategorySelector
                  value={form.categoryId}
                  categoryName={form.categoryName}
                  onChange={(id, name) => {
                    setForm({
                      ...form,
                      categoryId: id,
                      categoryName: name
                    })
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">{t('inventory.supplier')}</Label>
                <BrandSelector
                  value={form.brandId}          
                  brandName={form.brandName}     
                  onChange={(id, name) => {
                    setForm({
                      ...form,
                      brandId: id,     
                      brandName: name  
                    })
                  }}
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

  const { categories, loading: loadingCategories } = usePOSCategories()
  const {
    products,
    loading,
    error,
    refetch,
    createProduct: handleCreateProductAPI,
    updateProduct: handleUpdateProductAPI,
    deleteProduct: handleDeleteProductAPI,
    validateStock: validateCartStock
  } = usePOSProducts()

  const [selectedCategory, setSelectedCategory] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showAddProduct, setShowAddProduct] = useState<boolean>(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showCheckout, setShowCheckout] = useState<boolean>(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const barcodeInputRef = useRef<HTMLInputElement | null>(null)
  const barcodeBufferRef = useRef('')
  const barcodeTimerRef = useRef<NodeJS.Timeout | null>(null)



  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 0 || product.categoryId === selectedCategory
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, searchQuery])











  const handleBarcodeSearch = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return

    const product = products.find(p => p.barcode === barcode)
    if (!product) {
      toast.error('Producto no encontrado')
      return
    }

    const validation = await validateCartStock([
      {
        id: product.id,
        name: product.name,
        nameKey: product.nameKey,
        price: product.price,
        quantity: 1
      }
    ])

    if (validation) {
      addToCart(product)
      setBarcodeInput('')
    } else {
      toast.error((', '))
    }
  }, [products, validateCartStock])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.key === 'Enter' && barcodeBufferRef.current) {
        e.preventDefault()
        const scannedCode = barcodeBufferRef.current.trim()
        barcodeBufferRef.current = ''
        handleBarcodeSearch(scannedCode)
        return
      }

      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key
      }

      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current)
      }
      barcodeTimerRef.current = setTimeout(() => {
        barcodeBufferRef.current = ''
      }, 200)
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => {
      window.removeEventListener('keypress', handleKeyPress)
      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current)
      }
    }
  }, [handleBarcodeSearch]) // 👈 aquí agregas la dependencia



  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t('pos.loading_products')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">Error al cargar productos</p>
          <p className="text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            {t('pos.try_again')}
          </Button>
        </div>
      </div>
    )
  }




  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (editingProduct) {
        await handleUpdateProductAPI(editingProduct.id, productData)
      } else {
        await handleCreateProductAPI(productData)
      }
      setEditingProduct(null)
      setShowAddProduct(false)
    } catch (error) {
      // El error ya se muestra en el hook
      console.error('Failed to save product:', error)
    }
  }





  const handleDeleteProduct = async (id: number) => {
    try {
      await handleDeleteProductAPI(id)
    } catch (error) {
      // El error ya se muestra en el hook
      console.error('Failed to delete product:', error)
    }
  }

 const handleProcessPayment = async (checkoutData: any) => {
  try {
    // Validar stock antes de procesar
    const cartItems = checkoutData.cart.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      name: item.name,
      nameKey: item.nameKey,
      price: item.price
    }))

    const isValid = await validateCartStock(cartItems)

    if (!isValid) {
      throw new Error('Stock insuficiente para algunos productos')
    }

    // Procesar el checkout
    const result = await processCheckout(checkoutData)

    toast.success(result.message)

    // Limpiar carrito
    setCart([])
    setShowCheckout(false)

    await refetch()

    return result
  } catch (error: any) {
    console.error('Error processing payment:', error)
    toast.error(error.message || 'Error al procesar el pago')
    throw error
  }
}








  const addToCart = (product: Product) => {
    if (product.isAvailable === false) {
      toast.error('Producto no disponible')
      return
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      const newQuantity = existingItem ? existingItem.quantity + 1 : 1

      // Verificar stock
      if (newQuantity > (product.stock || 0)) {
        toast.error(`Stock insuficiente. Disponible: ${product.stock || 0}`)
        return prevCart
      }

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


  const updateQuantity = (productId: string | number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId)
      return
    }

    // Buscar producto para verificar stock
    const product = products.find(p => p.id === productId)
    if (product && newQuantity > (product.stock || 0)) {
      toast.error(`Stock máximo disponible: ${product.stock || 0}`)
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

  const removeFromCart = (productId: string | number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }


  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)

  const handleCloseEditor = () => {
    setEditingProduct(null)
    setShowAddProduct(false)
  }




  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">{t('pos.title')}</h1>
            <Button
              className="gap-2"
              onClick={() => {
                setEditingProduct(null)
                setShowAddProduct(true)
              }}
            >
              <Plus className="w-4 h-4" />
              {t('pos.buttons.add_product')}
            </Button>
          </div>

          {/* Barra de búsqueda con código de barras */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('pos.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative w-full sm:w-64">
              <Barcode className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={barcodeInputRef}
                placeholder={t('pos.barcode_placeholder', 'Escanear código de barras')}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleBarcodeSearch(barcodeInput)
                  }
                }}
                className="pl-10 font-mono"
              />
            </div>
          </div>
        </div>
      </Card>

     {/* Main Grid: Sidebar | Content | Cart */}
<div className="grid grid-cols-1 lg:grid-cols-14 gap-4">
  
  {/* Categories Sidebar - 2 columns */}
  <div className="lg:col-span-2">
    <Card className="p-3 sticky top-4">
      <h3 className="text-sm font-semibold mb-3 px-2">{t('app.categories', 'Categorías')}</h3>
      <div className="flex flex-col gap-1">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="justify-start gap-2 h-9"
          >
            <span className="text-base">{cat.icon}</span>
            <span className="text-xs">{cat.name}</span>
          </Button>
        ))}
      </div>
    </Card>
  </div>

  {/* Products Table - 9 columns */}
  <div className="lg:col-span-9">
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-lg">{t('pos.products_title')}</CardTitle>
          <Badge variant="secondary" className="text-sm">
            {filteredProducts.length} {t('app.total')}
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('pos.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">{t('pos.product_title')}</TableHead>
                <TableHead className="font-semibold">{t('app.sku')}</TableHead>
                <TableHead className="font-semibold">{t('pos.barcode', 'Código Barras')}</TableHead>
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
                    <div className="font-medium">{t(product.nameKey, product.name)}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Box className="h-3 w-3 text-muted-foreground" />
                      <span>{product.sku}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Barcode className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-sm">{product.barcode || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {product.categoryName || 'Sin categoría'}
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
                  <TableCell>{getStockStatus(product, t)}</TableCell>
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
  </div>

  {/* Cart Sidebar - 3 columns */}
  <div className="lg:col-span-3">
    <Card className="p-4 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">{t('pos.cart.title')}</h2>
        <Badge variant="secondary" className="text-xs">
          {cart.length}
        </Badge>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🛒</div>
          <p className="text-sm text-muted-foreground">{t('pos.cart.empty')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4 max-h-96 overflow-y-auto pr-1">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs truncate">
                    {t(item.nameKey, item.name)}
                  </h4>
                  <p className="text-muted-foreground text-xs">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
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
                  <span className="w-5 text-center text-xs font-medium">{item.quantity}</span>
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
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
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

          <div className="border-t pt-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">{t('pos.cart.total')}:</span>
              <span className="text-xl font-bold">${cartTotal.toFixed(2)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowCheckout(true)}
              disabled={cart.length === 0}
            >
              {t('pos.buttons.checkout')}
            </Button>
          </div>
        </>
      )}
    </Card>
  </div>
</div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={showCheckout}
        onOpenChange={setShowCheckout}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        onProcessPayment={handleProcessPayment}
      />

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

