import { useState, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Upload,
    FileJson,
    FileText,
    Database,
    Sheet,
    Loader2,
    CheckCircle2,
    AlertCircle,
    X,
    FileUp,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { backupService } from '@/lib/api-client';

interface RestoreDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type BackupFormat = 'sql' | 'json' | 'csv' | 'xlsx' | null;

interface FilePreview {
    name: string;
    size: number;
    format: BackupFormat;
    tables?: string[];
}

export function RestoreDialog({ open, onOpenChange }: RestoreDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [clearBefore, setClearBefore] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Resetear estado cuando se abre el dialog
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setSelectedFile(null);
            setFilePreview(null);
            setClearBefore(false);
            setUploadProgress(0);
        }
        onOpenChange(newOpen);
    };

    // Detectar formato del archivo
    const detectFormat = (fileName: string): BackupFormat => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'sql': return 'sql';
            case 'json': return 'json';
            case 'csv': return 'csv';
            case 'xlsx': return 'xlsx';
            default: return null;
        }
    };

    // Formatear tamaño de archivo
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Obtener icono según formato
    const getFormatIcon = (format: BackupFormat) => {
        switch (format) {
            case 'sql': return Database;
            case 'json': return FileJson;
            case 'csv': return FileText;
            case 'xlsx': return Sheet;
            default: return FileUp;
        }
    };

    // Obtener color según formato
    const getFormatColor = (format: BackupFormat) => {
        switch (format) {
            case 'sql': return 'text-blue-500';
            case 'json': return 'text-yellow-500';
            case 'csv': return 'text-orange-500';
            case 'xlsx': return 'text-emerald-500';
            default: return 'text-gray-500';
        }
    };

    // Manejar selección de archivo
    const handleFileSelect = useCallback((file: File) => {
        const format = detectFormat(file.name);
        
        if (!format) {
            toast.error('Formato de archivo no soportado. Use SQL, JSON, CSV o XLSX');
            return;
        }

        setSelectedFile(file);
        setFilePreview({
            name: file.name,
            size: file.size,
            format: format,
        });

        toast.success('Archivo cargado correctamente');
    }, []);

    // Drag & Drop handlers
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);

    // Input file handler
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    // Remover archivo seleccionado
    const handleRemoveFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        setUploadProgress(0);
    };

    // Manejar restauración
    const handleRestore = async () => {
        if (!selectedFile) {
            toast.error('Por favor selecciona un archivo');
            return;
        }

        if (clearBefore) {
            const confirmed = window.confirm(
                '⚠️ ADVERTENCIA: Esto eliminará TODOS los datos actuales antes de importar.\n\n' +
                '¿Estás seguro de que deseas continuar?'
            );
            if (!confirmed) return;
        }

        setIsRestoring(true);
        setUploadProgress(0);
        const toastId = toast.loading('Restaurando base de datos...');

        try {
            // Simular progreso inicial
            setUploadProgress(10);

            // Llamar al servicio de restauración
            const response = await backupService.restoreDatabase(selectedFile, clearBefore, (progress) => {
                setUploadProgress(Math.min(90, progress));
            });

            setUploadProgress(100);

            // Verificar respuesta
            if (response.data.success) {
                const { tablesRestored, rowsInserted, errors } = response.data;

                let message = `✅ Restauración completada\n`;
                message += `📊 Tablas procesadas: ${tablesRestored}\n`;
                message += `📝 Filas insertadas: ${rowsInserted}`;

                if (errors && errors.length > 0) {
                    message += `\n⚠️ Advertencias: ${errors.length}`;
                }

                toast.success(message, { 
                    id: toastId,
                    duration: 6000 
                });

                // Cerrar el dialog después de un breve delay
                setTimeout(() => {
                    onOpenChange(false);
                    // Opcional: recargar la página para reflejar cambios
                    // window.location.reload();
                }, 1000);
            } else {
                throw new Error(response.data.error || 'Error desconocido en la restauración');
            }

        } catch (error: any) {
            console.error('❌ Error al restaurar:', error);

            let errorMessage = 'Error al restaurar la base de datos';

            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            // Mostrar detalles si existen
            if (error.response?.data?.details) {
                errorMessage += `\n\nDetalles: ${error.response.data.details}`;
            }

            toast.error(errorMessage, { 
                id: toastId,
                duration: 8000 
            });

        } finally {
            setIsRestoring(false);
            setUploadProgress(0);
        }
    };

    const FormatIcon = filePreview ? getFormatIcon(filePreview.format) : Upload;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Restaurar Base de Datos
                    </DialogTitle>
                    <DialogDescription>
                        Importa datos desde un archivo de backup (SQL, JSON, CSV o XLSX)
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Zona de Drop */}
                    {!filePreview ? (
                        <div
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                                relative border-2 border-dashed rounded-lg p-8 text-center
                                transition-all duration-200 cursor-pointer
                                ${isDragging 
                                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
                                }
                            `}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept=".sql,.json,.csv,.xlsx"
                                onChange={handleFileInput}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                                <p className="text-lg font-semibold mb-2">
                                    {isDragging ? '¡Suelta el archivo aquí!' : 'Arrastra un archivo o haz clic para seleccionar'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Soporta archivos SQL, JSON, CSV y XLSX
                                </p>
                            </label>
                        </div>
                    ) : (
                        /* Preview del archivo seleccionado */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border-2 border-primary/20 rounded-lg bg-accent/50">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`p-3 rounded-lg bg-background border`}>
                                        <FormatIcon className={`h-6 w-6 ${getFormatColor(filePreview.format)}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{filePreview.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatFileSize(filePreview.size)} • {filePreview.format?.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRemoveFile}
                                    disabled={isRestoring}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Barra de progreso durante la restauración */}
                            {isRestoring && uploadProgress > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Restaurando...</span>
                                        <span className="font-semibold">{uploadProgress}%</span>
                                    </div>
                                    <Progress value={uploadProgress} className="h-2" />
                                </div>
                            )}
                        </div>
                    )}

                    <Separator />

                    {/* Opción de limpiar datos antes de importar */}
                    <div className="space-y-4">
                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                            <Checkbox
                                id="clear-before"
                                checked={clearBefore}
                                onCheckedChange={(checked) => setClearBefore(checked as boolean)}
                                disabled={isRestoring}
                            />
                            <div className="grid gap-1.5 leading-none flex-1">
                                <Label
                                    htmlFor="clear-before"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                                >
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                    Limpiar datos existentes antes de importar
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Si está activado, se eliminarán TODOS los datos actuales antes de la importación.
                                    Esto previene duplicados pero es irreversible.
                                </p>
                            </div>
                        </div>

                        {clearBefore && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>⚠️ Advertencia:</strong> Esta acción eliminará todos los datos existentes.
                                    Asegúrate de tener un backup reciente antes de continuar.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Información adicional */}
                    {filePreview && !isRestoring && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>💡 Tip:</strong> Dependiendo del tamaño del archivo, 
                                la restauración puede tomar varios minutos. No cierres esta ventana durante el proceso.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-3 sm:gap-3 flex-col sm:flex-row">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isRestoring}
                        className="w-full sm:w-auto"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleRestore}
                        disabled={!selectedFile || isRestoring}
                        className="gap-2 w-full sm:w-auto"
                    >
                        {isRestoring ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Restaurando...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" />
                                Restaurar Base de Datos
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}