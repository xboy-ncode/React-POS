
import { useEffect, useState } from 'react'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { api } from '../lib/api'
import { useTranslation } from 'react-i18next'
import { IfCan } from '../lib/permissions'
import type { Role, Permission } from '../store/auth'
import { ROLE_DEFAULT_PERMS } from '../store/auth'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

type User = { id: string; name: string; email: string; role: Role; permissions?: Permission[] }

export default function Users() {
  const { t } = useTranslation()
  const [items, setItems] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const d = await api('/users?limit=100')
      setItems(d?.items || [])
    } catch { setItems([]) }
  }

  const cols: Column<User>[] = [
    { key: 'name', title: t('app.name')! },
    { key: 'email', title: t('app.email')! },
    { key: 'role', title: t('app.role')! },
    { key: 'actions', title: t('app.actions')!, render: (r) => (
      <div className="flex gap-2">
        <IfCan permission={['users:write']}><Button variant="outline" size="sm" onClick={() => { setEditing(r); setOpen(true) }}>{t('app.edit')}</Button></IfCan>
        <IfCan permission={['users:write']}><Button variant="outline" size="sm" onClick={() => removeItem(r.id)}>{t('app.delete')}</Button></IfCan>
      </div>
    )}
  ]

  async function removeItem(id: string) { await api(`/users/${id}`, { method: 'DELETE' }); load() }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">{t('app.users')}</h1>
        <IfCan permission={['users:write']}><Button variant="default" onClick={() => { setEditing(null); setOpen(true) }}>{t('app.add')}</Button></IfCan>
      </div>
      <Card className="p-4">
        <DataTable data={items} columns={cols} />
      </Card>
      {open && <Editor close={() => { setOpen(false); load() }} item={editing} />}
    </div>
  )
}

function Editor({ item, close }: { item: User | null, close: ()=>void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState<User>(item || { id: '', name: '', email: '', role: 'cashier' })

  async function save() {
    const method = item ? 'PUT' : 'POST'
    const path = item ? `/users/${item.id}` : '/users'
    // Ensure permissions are set if missing
    const payload = { ...form, permissions: form.permissions ?? ROLE_DEFAULT_PERMS[form.role] }
    await api(path, { method, body: JSON.stringify(payload) })
    close()
  }

  const allPerms: Permission[] = ['inventory:read','inventory:write','sales:read','sales:write','customers:read','customers:write','users:read','users:write','settings:write']

  function togglePerm(p: Permission) {
    const has = form.permissions?.includes(p)
    const next = has ? (form.permissions || []).filter(x => x !== p) : [ ...(form.permissions || []), p ]
    setForm({ ...form, permissions: next })
  }

  return (
    <div className="fixed inset-0 bg-black/30 grid place-items-center">
      <Card className="p-6 w-full max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">{item ? t('app.edit') : t('app.add')}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder={t('app.name')!} value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
          <Input placeholder={t('app.email')!} value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} />
          <select className="input" value={form.role} onChange={(e)=>setForm({...form, role: e.target.value as any})}>
            <option value="admin">admin</option>
            <option value="manager">manager</option>
            <option value="cashier">cashier</option>
          </select>
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl2 p-3">
            <div className="text-sm font-medium mb-2">{t('app.permissions')}</div>
            <div className="grid grid-cols-2 gap-2">
              {allPerms.map((p) => (
                <label key={p} className="flex items-center gap-2">
                  <input type="checkbox" checked={!!form.permissions?.includes(p)} onChange={()=>togglePerm(p)} />
                  <span className="text-xs">{p}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={close}>{t('app.cancel')}</Button>
          <Button variant="default" onClick={save}>{t('app.save')}</Button>
        </div>
      </Card>
    </div>
  )
}
