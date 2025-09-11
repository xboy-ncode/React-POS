import React, { useState } from 'react'
import { Search, Plus, ShoppingCart, X, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  icon: string
}

type Product = {
  id: number
  name: string
  price: number
  category: string
  image: string
}

type CartItem = Product & {
  quantity: number
}

const categories: Category[] = [
  { id: 'all', name: 'All', icon: '📦' },
  { id: 'snack', name: 'Snack', icon: '🍟' },
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
  { id: 'hamburger', name: 'Hamburger', icon: '🍔' },
  { id: 'coffee', name: 'Coffee', icon: '☕' },
  { id: 'drink', name: 'Drink', icon: '🍹' },
  { id: 'pasta', name: 'Pasta', icon: '🍝' }
]

const products: Product[] = [
  { id: 1, name: 'Margherita Pizza', price: 10.00, category: 'pizza', image: '/api/placeholder/200/200' },
  { id: 2, name: 'Vegetarian Pizza', price: 12.00, category: 'pizza', image: '/api/placeholder/200/200' },
  { id: 3, name: 'Pepperoni Pizza', price: 16.00, category: 'pizza', image: '/api/placeholder/200/200' },
  { id: 4, name: 'Supreme Pizza', price: 18.00, category: 'pizza', image: '/api/placeholder/200/200' },
  { id: 5, name: 'Gourmet Burger', price: 18.40, category: 'hamburger', image: '/api/placeholder/200/200' },
  { id: 6, name: 'Classic Burger', price: 21.15, category: 'hamburger', image: '/api/placeholder/200/200' },
  { id: 7, name: 'Chicken Burger', price: 10.15, category: 'hamburger', image: '/api/placeholder/200/200' },
  { id: 8, name: 'Latte', price: 4.00, category: 'coffee', image: '/api/placeholder/200/200' },
  { id: 9, name: 'Cappuccino', price: 12.00, category: 'coffee', image: '/api/placeholder/200/200' },
  { id: 10, name: 'Espresso', price: 5.00, category: 'coffee', image: '/api/placeholder/200/200' }
]

export default function POSSystem() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showAddProduct, setShowAddProduct] = useState<boolean>(false)
  const [newProduct, setNewProduct] = useState<{ name: string; price: string; category: string }>({
    name: '',
    price: '',
    category: ''
  })

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const addToCart = (product: Product) => {
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

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.category) {
      console.log('Adding product:', newProduct)
      setShowAddProduct(false)
      setNewProduct({ name: '', price: '', category: '' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Product Name
                    </label>
                    <Input
                      placeholder="Americano, Pepperoni Pizza etc."
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Price
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Category
                      </label>
                      <Select
                        value={newProduct.category}
                        onValueChange={(value) => setNewProduct(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.slice(1).map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.icon} {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowAddProduct(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleAddProduct}
                    >
                      Add Product
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" className="gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0H8v0z" />
              </svg>
              Tables
            </Button>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search menu..."
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
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex flex-col h-auto py-4 px-3 gap-2"
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-xs font-medium">{category.name}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Product Grid */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <Card
                  key={product.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                  onClick={() => addToCart(product)}
                >
                  <div className="aspect-square bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
                    <span className="text-6xl">
                      {product.category === 'pizza' && '🍕'}
                      {product.category === 'hamburger' && '🍔'}
                      {product.category === 'coffee' && '☕'}
                      {product.category === 'drink' && '🍹'}
                      {product.category === 'snack' && '🍟'}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        ${product.price.toFixed(2)}
                      </span>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
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
              <h2 className="text-lg font-semibold">Cart</h2>
              <Badge variant="secondary">{cart.length} items</Badge>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-muted-foreground text-xs">${item.price.toFixed(2)} each</p>
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
                      <span className="font-semibold">Total:</span>
                      <span className="text-xl font-bold">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button className="w-full" size="lg">
                    Checkout
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}