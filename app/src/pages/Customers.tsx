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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Search, Plus, Edit2, Trash2, User, Calendar, MapPin, Heart, CreditCard, Loader2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog'
import { toast } from 'sonner'

type Customer = {
  id: string
  dni: string
  nombres: string
  apellidos: string
  nombreCompleto: string
  fechaNacimiento: string
  sexo: 'M' | 'F'
  estadoCivil: string
  direccion: string
  telefono?: string
  email?: string
  createdAt?: string
  updatedAt?: string
}

// Mock data para simular respuesta de RENIEC
const mockReniecData = {
  '12345678': {
    dni: '12345678',
    nombres: 'JUAN CARLOS',
    apellidos: 'PÉREZ GARCÍA',
    nombreCompleto: 'PÉREZ GARCÍA, JUAN CARLOS',
    fechaNacimiento: '1985-03-15',
    sexo: 'M' as const,
    estadoCivil: 'SOLTERO',
    direccion: 'AV. AREQUIPA 1234 - LIMA - LIMA - PERÚ'
  },
  '87654321': {
    dni: '87654321',
    nombres: 'MARÍA ELENA',
    apellidos: 'RODRIGUEZ LÓPEZ',
    nombreCompleto: 'RODRIGUEZ LÓPEZ, MARÍA ELENA',
    fechaNacimiento: '1990-07-22',
    sexo: 'F' as const,
    estadoCivil: 'CASADA',
    direccion: 'JR. CUSCO 567 - CALLAO - CALLAO - PERÚ'
  },
  '11111111': {
    dni: '11111111',
    nombres: 'CARLOS ALBERTO',
    apellidos: 'MENDOZA SILVA',
    nombreCompleto: 'MENDOZA SILVA, CARLOS ALBERTO',
    fechaNacimiento: '1975-12-03',
    sexo: 'M' as const,
    estadoCivil: 'DIVORCIADO',
    direccion: 'CAL. LAS FLORES 890 - AREQUIPA - AREQUIPA - PERÚ'
  }
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
    const filtered = items.filter(item =>
      item.dni.includes(searchTerm) ||
      item.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.telefono && item.telefono.includes(searchTerm)) ||
      (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredItems(filtered)
  }, [items, searchTerm])

  async function load() {
    try {
      setLoading(true)
      const d = await api('/customers?limit=100')
      setItems(d?.items || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  async function removeItem(id: string) {
    try {
      await api(`/customers/${id}`, { method: 'DELETE' })
      await load()
    } catch (error) {
      console.error('Failed to delete customer:', error)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setEditing(null)
      load()
    }
  }

  const formatAge = (fechaNacimiento: string) => {
    const today = new Date()
    const birthDate = new Date(fechaNacimiento)
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1
    }
    return age
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
                  <TableHead className="font-semibold">{t('app.age_gender')}</TableHead>
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
                    <TableRow key={customer.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          <span>{customer.dni}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{customer.nombreCompleto}</div>
                          <div className="text-xs text-muted-foreground flex items-center space-x-1">
                            <Heart className="h-3 w-3" />
                            <span>{customer.estadoCivil}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{formatAge(customer.fechaNacimiento)} años</span>
                          </div>
                          <Badge variant={customer.sexo === 'M' ? 'default' : 'secondary'} className="text-xs">
                            {customer.sexo === 'M' ? t('app.male') : t('app.female')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {customer.telefono && (
                            <div className="flex items-center space-x-1">
                              <span className="text-muted-foreground">📱</span>
                              <span>{customer.telefono}</span>
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center space-x-1">
                              <span className="text-muted-foreground">✉️</span>
                              <span className="truncate max-w-32">{customer.email}</span>
                            </div>
                          )}
                          {!customer.telefono && !customer.email && (
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
                                    onClick={() => removeItem(customer.id)}
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
  const [form, setForm] = useState<Partial<Customer>>(
    item || { 
      dni: '', 
      nombres: '', 
      apellidos: '', 
      nombreCompleto: '', 
      fechaNacimiento: '', 
      sexo: 'M', 
      estadoCivil: '', 
      direccion: '',
      telefono: '',
      email: '' 
    }
  )
  const [saving, setSaving] = useState(false)
  const [loadingReniec, setLoadingReniec] = useState(false)
  const [dniInput, setDniInput] = useState(item?.dni || '')

  useEffect(() => {
    if (item) {
      setForm(item)
      setDniInput(item.dni)
    } else {
      setForm({ 
        dni: '', 
        nombres: '', 
        apellidos: '', 
        nombreCompleto: '', 
        fechaNacimiento: '', 
        sexo: 'M', 
        estadoCivil: '', 
        direccion: '',
        telefono: '',
        email: '' 
      })
      setDniInput('')
    }
  }, [item])


  // Simular consulta a RENIEC
  async function consultarReniec(dni: string) {
    if (dni.length !== 8) return

    setLoadingReniec(true)
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1500))
      // Usar datos mock
      const reniecData = mockReniecData[dni as keyof typeof mockReniecData]
      if (reniecData) {
        setForm(prevForm => ({
          ...prevForm,
          ...reniecData
        }))
      } else {
        // Simular DNI no encontrado
        toast.error(t('app.dni_not_found'))
      }
    } catch (error) {
      console.error('Error consultando RENIEC:', error)
      toast.error(t('app.dni_not_found'))
    } finally {
      setLoadingReniec(false)
    }
  }

  // Simular consulta a BD
  async function consultarBD(dni: string) {
    if (dni.length !== 8) return

    setLoadingReniec(true)
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1500))
      // Usar datos mock (simulación igual que RENIEC)
      const bdData = mockReniecData[dni as keyof typeof mockReniecData]
      if (bdData) {
        setForm(prevForm => ({
          ...prevForm,
          ...bdData
        }))
      } else {
        showToast(t('app.dni_not_found'), 'error')
      }
    } catch (error) {
      console.error('Error consultando BD:', error)
      showToast(t('app.reniec_error'), 'error')
    } finally {
      setLoadingReniec(false)
    }
  }

  async function save() {
    if (!form.dni?.trim() || !form.nombreCompleto?.trim()) {
      return
    }

    try {
      setSaving(true)
      const method = item ? 'PUT' : 'POST'
      const path = item ? `/customers/${item.id}` : '/customers'
      await api(path, { 
        method, 
        body: JSON.stringify({
          ...form,
          dni: form.dni?.trim(),
          nombres: form.nombres?.trim(),
          apellidos: form.apellidos?.trim(),
          nombreCompleto: form.nombreCompleto?.trim(),
          direccion: form.direccion?.trim(),
          telefono: form.telefono?.trim() || undefined,
          email: form.email?.trim() || undefined
        })
      })
      onClose()
    } catch (error) {
      console.error('Failed to save customer:', error)
    } finally {
      setSaving(false)
    }
  }

  const isValid = form.dni?.trim() && form.nombreCompleto?.trim()

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
          <>
            <Button
              type="button"
           
              onClick={() => consultarReniec(dniInput)}
              disabled={dniInput.length !== 8 || loadingReniec}
              className="whitespace-nowrap"
            >
              {loadingReniec ? (
                <div className="flex items-center space-x-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{t('app.consulting')}</span>
                </div>
              ) : (
                t('app.consult_reniec')
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => consultarBD(dniInput)}
              disabled={dniInput.length !== 8 || loadingReniec}
              className="whitespace-nowrap"
            >
              {t('app.manual_entry')}
            </Button>
          </>
              )}
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombres">
              {t('app.first_names')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombres"
              value={form.nombres || ''}
              onChange={(e) => setForm({ ...form, nombres: e.target.value.toUpperCase() })}
              placeholder="JUAN CARLOS"
              className="uppercase"
              readOnly={loadingReniec}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apellidos">
              {t('app.last_names')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="apellidos"
              value={form.apellidos || ''}
              onChange={(e) => setForm({ ...form, apellidos: e.target.value.toUpperCase() })}
              placeholder="PÉREZ GARCÍA"
              className="uppercase"
              readOnly={loadingReniec}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fechaNacimiento">{t('app.birth_date')}</Label>
            <Input
              id="fechaNacimiento"
              type="date"
              value={form.fechaNacimiento || ''}
              onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
              readOnly={loadingReniec}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sexo">{t('app.gender')}</Label>
            <Select
              value={form.sexo || 'M'}
              onValueChange={(value: 'M' | 'F') => setForm({ ...form, sexo: value })}
              disabled={loadingReniec}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">{t('app.male')}</SelectItem>
                <SelectItem value="F">{t('app.female')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estadoCivil">{t('app.marital_status')}</Label>
            <Input
              id="estadoCivil"
              value={form.estadoCivil || ''}
              onChange={(e) => setForm({ ...form, estadoCivil: e.target.value.toUpperCase() })}
              placeholder="SOLTERO"
              className="uppercase"
              readOnly={loadingReniec}
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
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
              <Label htmlFor="email">
                {t('app.email')} <span className="text-muted-foreground text-xs">({t('app.optional')})</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase() })}
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