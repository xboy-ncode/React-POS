
import { useEffect, useState } from 'react'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { api } from '../lib/api'
import { useTranslation } from 'react-i18next'
import { IfCan } from '../lib/permissions'

type Item = { id: string; name: string; sku: string; price: number; stock: number }

export default function Inventory() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Item[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const d = await api('/products?limit=100')
      setItems(d?.items || [])
    } catch {
      setItems([])
    }
  }

  const columns: Column<Item>[] = [
    { key: 'name', title: t('app.name')! },
    { key: 'sku', title: t('app.sku')! },
    { key: 'price', title: t('app.price')!, render: (r) => `$${r.price.toFixed(2)}` },
    { key: 'stock', title: t('app.stock')! },
    { key: 'actions', title: t('app.actions')!, render: (r) => (
      <div className="flex gap-2">
  <IfCan permission={['inventory:write']}><Button variant="outline" size="sm" onClick={() => { setEditing(r); setOpen(true) }}>{t('app.edit')}</Button></IfCan>
  <IfCan permission={['inventory:write']}><Button variant="outline" size="sm" onClick={() => removeItem(r.id)}>{t('app.delete')}</Button></IfCan>
      </div>
    )}
  ]

  async function removeItem(id: string) {
    await api(`/products/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">{t('app.inventory')}</h1>
  <IfCan permission={['inventory:write']}><Button variant="default" onClick={() => { setEditing(null); setOpen(true) }}>{t('app.add')}</Button></IfCan>
      </div>
      <Card className="p-4">
        <DataTable data={items} columns={columns} />
      </Card>
      {open && <Editor close={() => { setOpen(false); load() }} item={editing} />}
    </div>
  )
}

function Editor({ item, close }: { item: Item | null, close: ()=>void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState<Item>(item || { id: '', name: '', sku: '', price: 0, stock: 0 })

  async function save() {
    const method = item ? 'PUT' : 'POST'
    const path = item ? `/products/${item.id}` : '/products'
    await api(path, { method, body: JSON.stringify(form) })
    close()
  }

  return (
    <div className="fixed inset-0 bg-black/30 grid place-items-center">
      <Card className="p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">{item ? t('app.edit') : t('app.add')}</h2>
        <div className="grid gap-3">
          <Input placeholder={t('app.name')!} value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
          <Input placeholder="SKU" value={form.sku} onChange={(e)=>setForm({...form, sku: e.target.value})} />
          <Input type="number" placeholder={t('app.price')!} value={form.price} onChange={(e)=>setForm({...form, price: parseFloat(e.target.value)})} />
          <Input type="number" placeholder={t('app.stock')!} value={form.stock} onChange={(e)=>setForm({...form, stock: parseInt(e.target.value)})} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={close}>{t('app.cancel')}</Button>
          <Button variant="default" onClick={save}>{t('app.save')}</Button>
        </div>
      </Card>
    </div>
  )
}
