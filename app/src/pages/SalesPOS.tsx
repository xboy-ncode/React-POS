
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { useTranslation } from 'react-i18next'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

type Product = { id: string; name: string; price: number; sku: string }
type CartLine = Product & { qty: number }

export default function SalesPOS() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const { register, handleSubmit, reset } = useForm<{ query: string }>()

  useEffect(() => {
    // Load products for quick search (consider server-side search in production)
    api('/products?limit=50').then((d) => setProducts(d?.items || []))
      .catch(() => setProducts([]))
  }, [])

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const found = prev.find((x) => x.id === p.id)
      if (found) return prev.map((x) => x.id === p.id ? { ...x, qty: x.qty + 1 } : x)
      return [...prev, { ...p, qty: 1 }]
    })
  }

  const total = cart.reduce((sum, l) => sum + l.price * l.qty, 0)

  const onSearch = ({ query }: { query: string }) => {
    const hit = products.find((p) => p.sku === query || p.name.toLowerCase().includes(query.toLowerCase()))
    if (hit) addToCart(hit)
    reset()
  }

  const checkout = async () => {
    // Send order to backend
    await api('/sales', { method: 'POST', body: JSON.stringify({ lines: cart.map(({id, qty}) => ({ productId: id, qty })) }) })
    alert('Sale completed')
    setCart([])
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-4">
        <form onSubmit={handleSubmit(onSearch)} className="flex gap-2">
          <Input placeholder={t('app.search')!} {...register('query')} />
          <Button variant="outline" type="submit">Go</Button>
        </form>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {products.map((p) => (
            <Card key={p.id} className="p-3 text-left cursor-pointer hover:shadow-soft" onClick={() => addToCart(p)}>
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-muted-foreground">${p.price.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
            </Card>
          ))}
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{t('app.sales')}</h2>
          <div className="text-muted-foreground">Total: <span className="font-semibold">${total.toFixed(2)}</span></div>
        </div>
        <div className="space-y-2">
          {cart.map((l) => (
            <div key={l.id} className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
              <div>
                <div className="font-medium">{l.name}</div>
                <div className="text-xs text-muted-foreground">x{l.qty} • ${l.price.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCart((prev)=>prev.map(x=>x.id===l.id?{...x, qty: Math.max(1,x.qty-1)}:x))}>-</Button>
                <Button variant="outline" size="sm" onClick={() => setCart((prev)=>prev.map(x=>x.id===l.id?{...x, qty: x.qty+1}:x))}>+</Button>
                <Button variant="outline" size="sm" onClick={() => setCart((prev)=>prev.filter(x=>x.id!==l.id))}>×</Button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="default" className="w-full mt-4" onClick={checkout} disabled={!cart.length}>Checkout</Button>
      </Card>
    </div>
  )
}
