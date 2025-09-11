
import { useEffect, useState } from 'react'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { api } from '../lib/api'
import { useTranslation } from 'react-i18next'
import { IfCan } from '../lib/permissions'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

type Customer = { id: string; name: string; email: string; phone?: string }

export default function Customers() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const d = await api('/customers?limit=100')
      setItems(d?.items || [])
    } catch { setItems([]) }
  }

  const cols: Column<Customer>[] = [
    { key: 'name', title: t('app.name')! },
    { key: 'email', title: t('app.email')! },
    { key: 'phone', title: 'Phone' },
    { key: 'actions', title: t('app.actions')!, render: (r) => (
      <div className="flex gap-2">
        <IfCan permission={['customers:write']}><button className="btn btn-outline" onClick={() => { setEditing(r); setOpen(true) }}>{t('app.edit')}</button></IfCan>
        <IfCan permission={['customers:write']}><button className="btn btn-outline" onClick={() => removeItem(r.id)}>{t('app.delete')}</button></IfCan>
      </div>
    )}
  ]

  async function removeItem(id: string) { await api(`/customers/${id}`, { method: 'DELETE' }); load() }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">{t('app.customers')}</h1>
        <IfCan permission={['customers:write']}>
          <Button variant="default" onClick={() => { setEditing(null); setOpen(true) }}>{t('app.add')}</Button>
        </IfCan>
      </div>
      <Card className="p-4">
        <DataTable data={items} columns={cols} />
      </Card>
      {open && <Editor close={() => { setOpen(false); load() }} item={editing} />}
    </div>
  )
}

function Editor({ item, close }: { item: Customer | null, close: ()=>void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState<Customer>(item || { id: '', name: '', email: '', phone: '' })

  async function save() {
    const method = item ? 'PUT' : 'POST'
    const path = item ? `/customers/${item.id}` : '/customers'
    await api(path, { method, body: JSON.stringify(form) })
    close()
  }

  return (
    <div className="fixed inset-0 bg-black/30 grid place-items-center">
      <Card className="p-6 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">{item ? t('app.edit') : t('app.add')}</h2>
        <div className="grid gap-3">
          <Input placeholder={t('app.name')!} value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
          <Input placeholder={t('app.email')!} value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} />
          <Input placeholder="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={close}>{t('app.cancel')}</Button>
          <Button variant="default" onClick={save}>{t('app.save')}</Button>
        </div>
      </Card>
    </div>
  )
}
