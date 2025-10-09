import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { IfCan } from '../lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'

import { Search, Plus, Edit2, Trash2, User, CreditCard, Loader2, AlertCircle, MapPin } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog'
import { toast } from 'sonner'

type Customer = {
  id_cliente: number
  dni: string
  nombre: string
  apellido_paterno?: string
  apellido_materno?: string
  nombreCompleto?: string
  direccion?: string
  telefono?: string 
  correo?: string
  fecha_registro?: string
  fuente_datos?: 'RENIEC' | 'Manual'
  datos_completos?: any
}

export default function Customers() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Customer[]>([])
  const [filteredItems, setFilteredItems] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  useEffect(() => {
    const filtered = items.filter(item => {
      const nombreCompleto = `${item.apellido_paterno || ''} ${item.apellido_materno || ''}, ${item.nombre || ''}`.trim()
      return (
        item.dni.includes(searchTerm) ||
        nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.telefono && item.telefono.includes(searchTerm)) ||
        (item.correo && item.correo.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })
    setFilteredItems(filtered)
  }, [items, searchTerm])

  async function load() {
    try {
      setLoading(true)
      const response = await api('/customers?limit=100')
      const mapped = (response?.clientes || []).map((c: any) => ({
        ...c,
        nombreCompleto: `${c.apellido_paterno || ''} ${c.apellido_materno || ''}, ${c.nombre || ''}`.trim()
      }))
      setItems(mapped)
    } catch (error) {
      console.error('Failed to load customers:', error)
      toast.error(t('app.load_error'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  async function removeItem(id: number) {
    try {
      await api(`/customers/${id}`, { method: 'DELETE' })
      toast.success(t('app.customer_deleted'))
      await load()
    } catch (error: any) {
      console.error('Failed to delete customer:', error)
      const errorMsg = error?.error || t('app.delete_error')
      toast.error(errorMsg)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setEditing(null)
      load()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('app.customers')}</h1>
          <p className="text-muted-foreground">
            {t('app.manage_customers_description')}
          </p>
        </div>
        <IfCan permission={['customers:write']}>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditing(null)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('app.add')}
              </Button>
            </DialogTrigger>
            <CustomerEditor item={editing} onClose={() => handleOpenChange(false)} />
          </Dialog>
        </IfCan>
      </div>

      {/* Search and Stats */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('app.customer_list')}</CardTitle>
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
                placeholder={t('app.search_customers')}
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
                  <TableHead className="font-semibold">{t('app.dni')}</TableHead>
                  <TableHead className="font-semibold">{t('app.full_name')}</TableHead>
                  <TableHead className="font-semibold">{t('app.source')}</TableHead>
                  <TableHead className="font-semibold">{t('app.contact')}</TableHead>
                  <TableHead className="font-semibold text-right">{t('app.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        <span className="text-muted-foreground">{t('app.loading')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-center space-y-2">
                        <p className="text-muted-foreground">
                          {searchTerm ?
                            t('app.no_customers_found') :
                            t('app.no_customers')
                          }
                        </p>
                        {!searchTerm && (
                          <IfCan permission={['customers:write']}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditing(null)
                                setOpen(true)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {t('app.add_first_customer')}
                            </Button>
                          </IfCan>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((customer) => (
                    <TableRow key={customer.id_cliente} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          <span>{customer.dni}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {customer.nombreCompleto}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.fuente_datos === 'RENIEC' ? 'default' : 'secondary'} className="text-xs">
                          {customer.fuente_datos || 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {customer.telefono && (
                            <div className="flex items-center space-x-1">
                              <span className="text-muted-foreground">📱</span>
                              <span>{customer.telefono}</span>
                            </div>
                          )}
                          {customer.correo && (
                            <div className="flex items-center space-x-1">
                              <span className="text-muted-foreground">✉️</span>
                              <span className="truncate max-w-32">{customer.correo}</span>
                            </div>
                          )}
                          {!customer.telefono && !customer.correo && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <IfCan permission={['customers:write']}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditing(customer)
                                setOpen(true)
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </IfCan>
                          <IfCan permission={['customers:write']}>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('app.delete_customer')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('app.delete_customer_confirmation_dni', {
                                      name: customer.nombreCompleto,
                                      dni: customer.dni
                                    })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('app.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => removeItem(customer.id_cliente)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {t('app.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </IfCan>
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

function CustomerEditor({ item, onClose }: { item: Customer | null, onClose: () => void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState<Partial<Customer>>({
    dni: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    direccion: '',
    telefono: undefined,
    correo: ''
  })

  const [saving, setSaving] = useState(false)
  const [loadingReniec, setLoadingReniec] = useState(false)
  const [dniInput, setDniInput] = useState('')

  useEffect(() => {
    if (item) {
      setForm(item)
      setDniInput(item.dni)
    } else {
      setForm({
        dni: '',
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        direccion: '',
        telefono: undefined,
        correo: ''
      })
      setDniInput('')
    }
  }, [item])

  // Consultar DNI en la API (que internamente consulta BD local y RENIEC)
  async function consultarDNI(dni: string) {
    if (dni.length !== 8) {
      toast.error(t('app.dni_must_be_8_digits'))
      return
    }

    setLoadingReniec(true)
    try {
      const data = await api(`/customers/dni/${dni}`)
      
      if (data) {
        setForm({
          dni: data.dni,
          nombre: data.nombre,
          apellido_paterno: data.apellido_paterno,
          apellido_materno: data.apellido_materno,
          direccion: data.direccion,
          telefono: data.telefono,
          correo: data.correo,
          fuente_datos: data.fuente_datos,
          datos_completos: data.datos_completos
        })
        
        if (data.fuente_datos === 'RENIEC') {
          toast.success(t('app.data_from_reniec'))
        } else {
          toast.success(t('app.data_from_database'))
        }
      }
    } catch (error: any) {
      console.error('Error consultando DNI:', error)
      if (error?.error?.includes('no encontrado')) {
        toast.error(t('app.dni_not_found'))
      } else if (error?.error?.includes('Token')) {
        toast.error(t('app.reniec_token_error'))
      } else if (error?.error?.includes('no disponible')) {
        toast.error(t('app.reniec_unavailable'))
      } else {
        toast.error(t('app.reniec_error'))
      }
    } finally {
      setLoadingReniec(false)
    }
  }

  async function save() {
    if (!form.dni?.trim() || !form.nombre?.trim()) {
      toast.error(t('app.fill_required_fields'))
      return
    }

    try {
      setSaving(true)
      const method = item ? 'PUT' : 'POST'
      const path = item ? `/customers/${item.id_cliente}` : '/customers'
      
      await api(path, {
        method,
        body: JSON.stringify({
          dni: form.dni.trim(),
          nombre: form.nombre.trim(),
          apellido_paterno: form.apellido_paterno?.trim() || null,
          apellido_materno: form.apellido_materno?.trim() || null,
          direccion: form.direccion?.trim() || null,
          telefono: form.telefono? Number(form.telefono) : null,
          correo: form.correo?.trim() || null,
          fuente_datos: form.fuente_datos || 'Manual',
          datos_completos: form.datos_completos || null
        })
      })

      toast.success(item ? t('app.customer_updated') : t('app.customer_created'))
      onClose()
    } catch (error: any) {
      console.error('Failed to save customer:', error)
      const errorMsg = error?.error || t('app.save_error')
      toast.error(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const isValid = form.dni?.trim() && form.nombre?.trim()

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>
            {item ? t('app.edit_customer') : t('app.add_customer')}
          </span>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* DNI Section */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {t('app.dni')} <span className="text-destructive">*</span>
              </Label>
              {!item && (
                <Badge variant="outline" className="text-xs">
                  {t('app.auto_complete')}
                </Badge>
              )}
            </div>

            <div className="flex space-x-2">
              <Input
                placeholder="12345678"
                value={dniInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                  setDniInput(value)
                  setForm(prev => ({ ...prev, dni: value }))
                }}
                className="font-mono"
                maxLength={8}
                disabled={loadingReniec || !!item}
              />
              {!item && (
                <Button
                  type="button"
                  onClick={() => consultarDNI(dniInput)}
                  disabled={dniInput.length !== 8 || loadingReniec}
                  className="whitespace-nowrap"
                >
                  {loadingReniec ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>{t('app.consulting')}</span>
                    </div>
                  ) : (
                    t('app.search_dni')
                  )}
                </Button>
              )}
            </div>
            
            {!item && (
              <div className="flex items-start space-x-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <p>{t('app.dni_search_info')}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-4">  

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nombre">
              {t('app.first_names')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              value={form.nombre || ''}
              onChange={(e) => setForm({ ...form, nombre: e.target.value.toUpperCase() })}
              placeholder="JUAN CARLOS"
              className="uppercase"
              readOnly={loadingReniec}
              />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apellido_paterno">{t('app.paternal_surname')}</Label>
            <Input
              id="apellido_paterno"
              value={form.apellido_paterno || ''}
              onChange={(e) => setForm({ ...form, apellido_paterno: e.target.value.toUpperCase() })}
              placeholder="PÉREZ"
              className="uppercase"
              readOnly={loadingReniec}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apellido_materno">{t('app.maternal_surname')}</Label>
            <Input
              id="apellido_materno"
              value={form.apellido_materno || ''}
              onChange={(e) => setForm({ ...form, apellido_materno: e.target.value.toUpperCase() })}
              placeholder="GARCÍA"
              className="uppercase"
              readOnly={loadingReniec}
            />
          </div>
        </div>

        {/* Address */}
         <div className="space-y-3 mt-4">
          <Label htmlFor="direccion" className="flex items-center space-x-1">
          <MapPin className="h-3 w-3" />
          <span>{t('app.address')}</span>
          </Label>
          <Input
          id="direccion"
          value={form.direccion || ''}
          onChange={(e) => setForm({ ...form, direccion: e.target.value.toUpperCase() })}
          placeholder="AV. AREQUIPA 1234 - LIMA - LIMA - PERÚ"
          className="uppercase"
          readOnly={loadingReniec}
          />
        </div>

          </Card>
        {/* Contact Information */}
        <Card className="p-4">
          <h4 className="font-medium mb-3">{t('app.additional_contact')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">
                {t('app.phone')} <span className="text-muted-foreground text-xs">({t('app.optional')})</span>
              </Label>
              <Input
                id="telefono"
                value={form.telefono || ''}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="999 888 777"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correo">
                {t('app.email')} <span className="text-muted-foreground text-xs">({t('app.optional')})</span>
              </Label>
              <Input
                id="correo"
                type="email"
                value={form.correo || ''}
                onChange={(e) => setForm({ ...form, correo: e.target.value.toLowerCase() })}
                placeholder="cliente@ejemplo.com"
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={saving || loadingReniec}>
          {t('app.cancel')}
        </Button>
        <Button
          onClick={save}
          disabled={!isValid || saving || loadingReniec}
          className="min-w-[80px]"
        >
          {saving ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
              <span>{t('app.saving')}</span>
            </div>
          ) : (
            t('app.save')
          )}
        </Button>
      </div>
    </DialogContent>
  )
}