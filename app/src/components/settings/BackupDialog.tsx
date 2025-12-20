import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Database,
    FileJson,
    FileText,
    Table as TableIcon,
    Sheet,
    Loader2,
    Download,
    CheckCircle2,
    AlertCircle,
    Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { backupService } from '@/lib/api-client';

interface BackupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type BackupFormat = 'sql' | 'json' | 'csv' | 'xlsx';

interface TableOption {
    value: string;
    label: string;
    description?: string;
}

const AVAILABLE_TABLES: TableOption[] = [
    { value: 'categorias', label: 'Categorías', description: 'Categorías de productos' },
    { value: 'clientes', label: 'Clientes', description: 'Información de clientes' },
    { value: 'compras', label: 'Compras', description: 'Registro de compras' },
    { value: 'comprobantes', label: 'Comprobantes', description: 'Comprobantes de venta' },
    { value: 'detalle_compras', label: 'Detalle de Compras', description: 'Líneas de compras' },
    { value: 'detalle_ventas', label: 'Detalle de Ventas', description: 'Líneas de ventas' },
    { value: 'facturas', label: 'Facturas', description: 'Facturas emitidas' },
    { value: 'marcas', label: 'Marcas', description: 'Marcas de productos' },
    { value: 'productos', label: 'Productos', description: 'Catálogo de productos' },
    { value: 'proveedores', label: 'Proveedores', description: 'Información de proveedores' },
    { value: 'ventas', label: 'Ventas', description: 'Registro de ventas' },
];

const FORMAT_OPTIONS = [
    {
        value: 'sql' as BackupFormat,
        label: 'SQL Database',
        description: 'Volcado completo de base de datos',
        icon: Database,
        color: 'text-blue-500',
        disabled: false,
        note: 'Incluye estructura y datos',
        supportsMultipleTables: true,
    },
    {
        value: 'xlsx' as BackupFormat,
        label: 'Excel (XLSX)',
        description: 'Hoja de cálculo con múltiples pestañas',
        icon: Sheet,
        color: 'text-emerald-500',
        disabled: false,
        note: 'Recomendado para análisis',
        supportsMultipleTables: true,
    },
    {
        value: 'json' as BackupFormat,
        label: 'JSON',
        description: 'Formato de intercambio de datos',
        icon: FileJson,
        color: 'text-yellow-500',
        disabled: false,
        note: 'Fácil de procesar',
        supportsMultipleTables: true,
    },
    {
        value: 'csv' as BackupFormat,
        label: 'CSV',
        description: 'Valores separados por comas',
        icon: FileText,
        color: 'text-orange-500',
        disabled: false,
        note: 'Solo una tabla por archivo',
        supportsMultipleTables: false,
    },
];

export function BackupDialog({ open, onOpenChange }: BackupDialogProps) {
    const [selectedFormat, setSelectedFormat] = useState<BackupFormat>('xlsx');
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    // Resetear estado cuando se abre el dialog
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setSelectedFormat('xlsx');
            setSelectedTables([]);
        }
        onOpenChange(newOpen);
    };

    // Toggle selección de tabla individual
    const toggleTable = (tableValue: string) => {
        setSelectedTables(prev =>
            prev.includes(tableValue)
                ? prev.filter(t => t !== tableValue)
                : [...prev, tableValue]
        );
    };

    // Seleccionar/deseleccionar todas las tablas
    const toggleSelectAll = () => {
        if (selectedTables.length === AVAILABLE_TABLES.length) {
            setSelectedTables([]);
        } else {
            setSelectedTables(AVAILABLE_TABLES.map(t => t.value));
        }
    };

    const isAllSelected = selectedTables.length === AVAILABLE_TABLES.length;

    // Validación para CSV (solo una tabla)
    const currentFormat = FORMAT_OPTIONS.find(f => f.value === selectedFormat);
    const canExport = selectedTables.length > 0 && 
        (currentFormat?.supportsMultipleTables || selectedTables.length === 1);

    // Manejar exportación
    const handleExport = async () => {
        if (selectedTables.length === 0) {
            toast.error('Selecciona al menos una tabla para exportar');
            return;
        }

        // Validación especial para CSV
        if (selectedFormat === 'csv' && selectedTables.length > 1) {
            toast.error('El formato CSV solo soporta una tabla. Selecciona solo una o usa XLSX.');
            return;
        }

        setIsExporting(true);
        const toastId = toast.loading(`Generando backup y enviando por correo...`);

        try {
            // console.log('🔄 Iniciando exportación:', {
            //     formato: selectedFormat,
            //     tablas: selectedTables,
            //     todasSeleccionadas: isAllSelected,
            //     enviarEmail: true // SIEMPRE true
            // });

            // Determinar qué enviar al backend
            const tableParam = isAllSelected ? 'all' : selectedTables.join(',');

            // console.log('📤 Parámetro de tablas:', tableParam);

            // Llamar al servicio - SIEMPRE con sendEmail = true
            const response = await backupService.exportDatabase(
                selectedFormat, 
                tableParam, 
                true  // ✨ SIEMPRE enviar por email
            );

            // console.log('✅ Respuesta recibida:', {
            //     tipo: response.headers['content-type'],
            //     tamaño: response.data.size,
            //     headers: response.headers
            // });

            // Validar que recibimos datos
            if (!response.data) {
                throw new Error('No se recibieron datos del servidor');
            }

            if (response.data.size === 0) {
                throw new Error('El archivo descargado está vacío');
            }

            // Tipos MIME según formato
            const mimeTypes: Record<BackupFormat, string> = {
                sql: 'application/x-sql',
                json: 'application/json',
                csv: 'text/csv',
                xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };

            // Usar el Content-Type del servidor o el predeterminado
            const contentType = response.headers['content-type'] || mimeTypes[selectedFormat];

            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Generar nombre del archivo
            const date = new Date().toISOString().split('T')[0];
            const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
            
            let filename: string;
            if (isAllSelected) {
                filename = `backup_completo_${date}_${time}.${selectedFormat}`;
            } else if (selectedTables.length === 1) {
                filename = `${selectedTables[0]}_${date}_${time}.${selectedFormat}`;
            } else {
                filename = `backup_${selectedTables.length}tablas_${date}_${time}.${selectedFormat}`;
            }

            link.setAttribute('download', filename);

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            const tableCount = selectedTables.length;
            const tableText = tableCount === 1 ? 'tabla' : 'tablas';
            
            toast.success(
                `Backup ${selectedFormat.toUpperCase()} descargado (${tableCount} ${tableText})\n Email enviado exitosamente`,
                { id: toastId, duration: 5000 }
            );

            // Cerrar el dialog después de un breve delay
            setTimeout(() => {
                onOpenChange(false);
            }, 500);

        } catch (error: any) {
            console.error('❌ Error al exportar:', error);

            let errorMessage = 'Error al generar el backup';

            if (error.message) {
                errorMessage = error.message;
            } else if (error.response) {
                if (error.response.status === 503) {
                    errorMessage = 'Servicio de backup no disponible';
                } else if (error.response.status === 504) {
                    errorMessage = 'Tiempo de espera agotado. Intenta con menos tablas.';
                } else if (error.response.data?.error) {
                    errorMessage = error.response.data.error;
                }
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'La exportación tardó demasiado. Intenta con menos tablas.';
            }

            toast.error(errorMessage, { 
                id: toastId,
                duration: 5000 
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Exportar Base de Datos
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona el formato de exportación y las tablas que deseas incluir en el backup
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto flex flex-col gap-6 py-4 min-h-0 
                scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 
                hover:scrollbar-thumb-muted-foreground/30">
                    {/* Selección de Formato */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Formato de Exportación</Label>
                        <RadioGroup
                            value={selectedFormat}
                            onValueChange={(value) => setSelectedFormat(value as BackupFormat)}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                            {FORMAT_OPTIONS.map((format) => {
                                const Icon = format.icon;
                                return (
                                    <div key={format.value} className="relative">
                                        <RadioGroupItem
                                            value={format.value}
                                            id={format.value}
                                            className="peer sr-only"
                                            disabled={format.disabled}
                                        />
                                        <Label
                                            htmlFor={format.value}
                                            className={`
                                                flex flex-col gap-2 p-4 rounded-lg border-2 cursor-pointer
                                                transition-all duration-200
                                                peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5
                                                hover:bg-accent/50
                                                ${format.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={`h-5 w-5 ${format.color}`} />
                                                <div className="flex-1">
                                                    <div className="font-semibold">{format.label}</div>
                                                    <div className="text-xs text-muted-foreground">{format.description}</div>
                                                </div>
                                                {selectedFormat === format.value && (
                                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground italic">{format.note}</p>
                                        </Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>

                        {/* Advertencia para CSV */}
                        {selectedFormat === 'csv' && selectedTables.length > 1 && (
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>Atención:</strong> El formato CSV solo soporta una tabla por archivo. 
                                    Selecciona solo una tabla o cambia a XLSX para exportar múltiples tablas.
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Selección de Tablas */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">
                                Tablas a Exportar ({selectedTables.length}/{AVAILABLE_TABLES.length})
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={toggleSelectAll}
                                className="h-8"
                            >
                                <CheckCircle2 className={`h-4 w-4 mr-2 ${isAllSelected ? 'text-primary' : ''}`} />
                                {isAllSelected ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                            </Button>
                        </div>

                        <div className="rounded-md border">
                            <ScrollArea className="h-[300px]">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10 border-b">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[50px]">
                                                <Checkbox
                                                    checked={isAllSelected}
                                                    onCheckedChange={toggleSelectAll}
                                                    aria-label="Seleccionar todas las tablas"
                                                />
                                            </TableHead>
                                            <TableHead className="font-semibold">Tabla</TableHead>
                                            <TableHead className="font-semibold hidden sm:table-cell">Descripción</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {AVAILABLE_TABLES.map((table) => (
                                            <TableRow
                                                key={table.value}
                                                className={`cursor-pointer ${selectedTables.includes(table.value) ? 'bg-accent/30' : ''}`}
                                                onClick={() => toggleTable(table.value)}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        id={`table-${table.value}`}
                                                        checked={selectedTables.includes(table.value)}
                                                        onCheckedChange={() => toggleTable(table.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Label
                                                        htmlFor={`table-${table.value}`}
                                                        className="text-sm font-medium cursor-pointer block"
                                                    >
                                                        {table.label}
                                                    </Label>
                                                    {table.description && (
                                                        <p className="text-xs text-muted-foreground sm:hidden mt-1">
                                                            {table.description}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                                                    {table.description}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <TableIcon className="h-4 w-4 text-muted-foreground inline-block" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </div>

                    <Separator />

                    {/* Nota sobre el envío automático por email */}
                    <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>📧 Envío automático:</strong> El backup se descargará y también se enviará automáticamente a tu correo electrónico como respaldo.
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-3 sm:gap-3 flex-col sm:flex-row">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isExporting}
                        className="w-full sm:w-auto"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting || !canExport}
                        className="gap-2 w-full sm:w-auto"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Exportando y enviando...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                <Mail className="h-4 w-4" />
                                Exportar {selectedFormat.toUpperCase()}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}