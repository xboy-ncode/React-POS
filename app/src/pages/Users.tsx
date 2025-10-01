import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { IfCan } from '../lib/permissions'
import type { Role, Permission } from '../store/auth'
import { ROLE_DEFAULT_PERMS } from '../store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Search, Plus, Edit2, Trash2, Users2, Mail, Shield, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog'
import { Checkbox } from '../components/ui/checkbox'
import { Separator } from '../components/ui/separator'

type User = { 
  id: string
  name: string
  email: string
  role: Role
  permissions?: Permission[]
  createdAt?: string
  updatedAt?: string
  lastLogin?: string
  isActive?: boolean
}

const roleColors: Record<Role, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  cashier: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
}

const permissionCategories = {
  inventory: ['inventory:read', 'inventory:write'],
  sales: ['sales:read', 'sales:write'],
  customers: ['customers:read', 'customers:write'],
  users: ['users:read', 'users:write'],
  settings: ['settings:write']
}

export default function Users() {
  const { t } = useTranslation()
  const [items, setItems] = useState<User[]>([])
  const [filteredItems, setFilteredItems] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  useEffect(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredItems(filtered)
  }, [items, searchTerm])

  async function load() {
    try {
      setLoading(true)
      const d = await api('/users?limit=100')
      setItems(d?.items || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  async function removeItem(id: string) {
    try {
      await api(`/users/${id}`, { method: 'DELETE' })
      await load()
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setEditing(null)
      load()
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const getPermissionCount = (permissions?: Permission[]) => {
    return permissions?.length || 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('app.users')}</h1>
          <p className="text-muted-foreground">
            {t('app.manage_users_description')}
          </p>
        </div>
        <IfCan permission={['users:write']}>
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
            <UserEditor item={editing} onClose={() => handleOpenChange(false)} />
          </Dialog>
        </IfCan>
      </div>

      {/* Search and Stats */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('app.user_list')}</CardTitle>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-sm">
                {filteredItems.length} {t('app.total')}
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>{filteredItems.filter(u => u.role === 'admin').length} {t('app.admins')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{filteredItems.filter(u => u.role === 'manager').length} {t('app.managers')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{filteredItems.filter(u => u.role === 'cashier').length} {t('app.cashiers')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('app.search_users')}
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
                  <TableHead className="font-semibold">{t('app.user')}</TableHead>
                  <TableHead className="font-semibold">{t('app.role_permissions')}</TableHead>
                  <TableHead className="font-semibold">{t('app.status')}</TableHead>
                  <TableHead className="font-semibold">{t('app.last_activity')}</TableHead>
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
                            t('app.no_users_found') :
                            t('app.no_users')
                          }
                        </p>
                        {!searchTerm && (
                          <IfCan permission={['users:write']}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEditing(null)
                                setOpen(true)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {t('app.add_first_user')}
                            </Button>
                          </IfCan>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Users2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{user.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Badge className={roleColors[user.role]} variant="secondary">
                            {t(`app.${user.role}`)}
                          </Badge>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Shield className="h-3 w-3" />
                            <span>
                              {getPermissionCount(user.permissions)} {t('app.permissions_count')}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            user.isActive !== false ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm">
                            {user.isActive !== false ? t('app.active') : t('app.inactive')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {user.lastLogin ? formatDate(user.lastLogin) : t('app.never')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <IfCan permission={['users:write']}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditing(user)
                                setOpen(true)
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </IfCan>
                          <IfCan permission={['users:write']}>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('app.delete_user')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('app.delete_user_confirmation', { 
                                      name: user.name, 
                                      email: user.email 
                                    })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('app.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => removeItem(user.id)}
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

function UserEditor({ item, onClose }: { item: User | null, onClose: () => void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState<Partial<User>>(
    item || { 
      name: '', 
      email: '', 
      role: 'cashier',
      permissions: ROLE_DEFAULT_PERMS.cashier,
      isActive: true
    }
  )
  const [saving, setSaving] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordCopied, setPasswordCopied] = useState(false)

  useEffect(() => {
    if (item) {
      setForm({
        ...item,
        permissions: item.permissions ?? ROLE_DEFAULT_PERMS[item.role]
      })
    } else {
      // Generate password for new users
      const password = generatePassword()
      setGeneratedPassword(password)
      setForm({ 
        name: '', 
        email: '', 
        role: 'cashier',
        permissions: ROLE_DEFAULT_PERMS.cashier,
        isActive: true
      })
    }
  }, [item])

  useEffect(() => {
    // Update permissions when role changes
    if (form.role && !item) {
      setForm(prev => ({
        ...prev,
        permissions: ROLE_DEFAULT_PERMS[form.role as Role]
      }))
    }
  }, [form.role, item])

  function generatePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  function togglePermission(permission: Permission) {
    const currentPerms = form.permissions || []
    const hasPermission = currentPerms.includes(permission)
    const newPermissions = hasPermission
      ? currentPerms.filter(p => p !== permission)
      : [...currentPerms, permission]
    
    setForm({ ...form, permissions: newPermissions })
  }

  function selectAllInCategory(category: string) {
    const categoryPerms = permissionCategories[category as keyof typeof permissionCategories]
    const currentPerms = form.permissions || []
    const hasAll = categoryPerms.every(p => currentPerms.includes(p as Permission))
    
    if (hasAll) {
      // Remove all category permissions
      setForm({
        ...form,
        permissions: currentPerms.filter(p => !categoryPerms.includes(p))
      })
    } else {
      // Add all category permissions
      const newPerms = Array.from(new Set([...currentPerms, ...categoryPerms as Permission[]]))
      setForm({ ...form, permissions: newPerms })
    }
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(generatedPassword)
    setPasswordCopied(true)
    setTimeout(() => setPasswordCopied(false), 2000)
  }

  async function save() {
    if (!form.name?.trim() || !form.email?.trim()) {
      return
    }

    try {
      setSaving(true)
      const method = item ? 'PUT' : 'POST'
      const path = item ? `/users/${item.id}` : '/users'
      
      const payload: any = {
        ...form,
        name: form.name?.trim(),
        email: form.email?.trim(),
        permissions: form.permissions ?? ROLE_DEFAULT_PERMS[form.role as Role]
      }

      // Add password for new users
      if (!item && generatedPassword) {
        payload.password = generatedPassword
      }

      await api(path, { 
        method, 
        body: JSON.stringify(payload)
      })
      onClose()
    } catch (error) {
      console.error('Failed to save user:', error)
    } finally {
      setSaving(false)
    }
  }

  const isValid = form.name?.trim() && form.email?.trim()


  return (
    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Users2 className="h-5 w-5" />
          <span>
            {item ? t('app.edit_user') : t('app.add_user')}
          </span>
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        {/* Basic Information */}
        <Card className="p-4">
          <div className="space-y-4">
            <h4 className="font-medium flex items-center space-x-2">
              <Users2 className="h-4 w-4" />
              <span>{t('app.basic_information')}</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('app.name')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('app.user_name_placeholder')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t('app.email')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase() })}
                  placeholder={t('app.user_email_placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t('app.role')}</Label>
                <Select
                  value={form.role || 'cashier'}
                  onValueChange={(value: Role) => setForm({ ...form, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t('app.admin')}</SelectItem>
                    <SelectItem value="manager">{t('app.manager')}</SelectItem>
                    <SelectItem value="cashier">{t('app.cashier')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <span>{t('app.status')}</span>
                </Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={form.isActive !== false}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: !!checked })}
                  />
                  <Label htmlFor="isActive" className="text-sm">
                    {t('app.user_is_active')}
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Password for new users */}
        {!item && generatedPassword && (
          <Card className="p-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <h4 className="font-medium text-green-800 dark:text-green-200">
                  {t('app.generated_password')}
                </h4>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={generatedPassword}
                    readOnly
                    className="bg-white dark:bg-gray-900 pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="h-6 w-6 p-0"
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={copyPassword}
                      className="h-6 w-6 p-0"
                    >
                      {passwordCopied ? <CheckCircle className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-green-700 dark:text-green-300">
                {t('app.password_instructions')}
              </p>
            </div>
          </Card>
        )}

        {/* Permissions */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>{t('app.permissions')}</span>
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPermissions(!showPermissions)}
              >
                {showPermissions ? t('app.hide_permissions') : t('app.show_permissions')}
              </Button>
            </div>

            {showPermissions && (
              <div className="space-y-4">
                {Object.entries(permissionCategories).map(([category, perms]) => {
                  const hasAll = perms.every(p => form.permissions?.includes(p as Permission))

                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium capitalize">
                          {t(`app.${category}`)}
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => selectAllInCategory(category)}
                          className="text-xs"
                        >
                          {hasAll ? t('app.unselect_all') : t('app.select_all')}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-4 border-l-2 border-muted">
                        {perms.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission}
                              checked={form.permissions?.includes(permission as Permission) || false}
                              onCheckedChange={() => togglePermission(permission as Permission)}
                            />
                            <Label htmlFor={permission} className="text-xs">
                              {permission}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {category !== 'settings' && <Separator />}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          {t('app.cancel')}
        </Button>
        <Button 
          onClick={save} 
          disabled={!isValid || saving}
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