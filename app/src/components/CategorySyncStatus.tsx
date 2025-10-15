// components/pos/CategorySyncStatus.tsx
import { useState } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, HardDrive, Cloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { usePOSCategories } from '@/hooks/usePOSCategories'
import { useTranslation } from 'react-i18next'

export function CategorySyncStatus() {
    const { t } = useTranslation()
    const { categories, syncAllLocalCategories, hasLocalCategories } = usePOSCategories()
    const [open, setOpen] = useState(false)
    const [syncing, setSyncing] = useState(false)

    const localCategories = categories.filter(cat => cat.isLocal)
    const serverCategories = categories.filter(cat => !cat.isLocal && cat.id !== 0)

    const handleSync = async () => {
        try {
            setSyncing(true)
            await syncAllLocalCategories()
            setOpen(false)
        } catch (error) {
            console.error('Error syncing categories:', error)
        } finally {
            setSyncing(false)
        }
    }

    if (!hasLocalCategories) {
        return null
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    {localCategories.length} {t('pos.local_categories', 'Categorías locales')}
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5" />
                        {t('pos.category_sync.title', 'Estado de sincronización de categorías')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('pos.category_sync.description',
                            'Estas categorías están almacenadas localmente y se sincronizarán con el servidor al crear productos.'
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Categorías locales pendientes */}
                    {localCategories.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <HardDrive className="w-4 h-4 text-amber-500" />
                                {t('pos.category_sync.local_pending', 'Categorías locales (pendientes)')}
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                    {localCategories.length}
                                </Badge>
                            </h3>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('pos.category_sync.icon', 'Icono')}</TableHead>
                                        <TableHead>{t('pos.category_sync.name', 'Nombre')}</TableHead>
                                        <TableHead>{t('pos.category_sync.status', 'Estado')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {localCategories.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell className="text-2xl">{category.icon}</TableCell>
                                            <TableCell className="font-medium">
                                                {t(category.nameKey, category.name)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                                    <HardDrive className="w-3 h-3 mr-1" />
                                                    {t('pos.category_sync.pending', 'Pendiente')}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Categorías sincronizadas */}
                    {serverCategories.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Cloud className="w-4 h-4 text-blue-500" />
                                {t('pos.category_sync.synced', 'Categorías sincronizadas')}
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                    {serverCategories.length}
                                </Badge>
                            </h3>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('pos.category_sync.icon', 'Icono')}</TableHead>
                                        <TableHead>{t('pos.category_sync.name', 'Nombre')}</TableHead>
                                        <TableHead>{t('pos.category_sync.status', 'Estado')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {serverCategories.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell className="text-2xl">{category.icon}</TableCell>
                                            <TableCell className="font-medium">
                                                {t(category.nameKey, category.name)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    {t('pos.category_sync.synced', 'Sincronizado')}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                {/* Botón de sincronización */}
                {localCategories.length > 0 && (
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            {t('pos.buttons.cancel', 'Cancelar')}
                        </Button>
                        <Button onClick={handleSync} disabled={syncing}>
                            {syncing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    {t('pos.category_sync.syncing', 'Sincronizando...')}
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    {t('pos.category_sync.sync_all', 'Sincronizar todas')}
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}