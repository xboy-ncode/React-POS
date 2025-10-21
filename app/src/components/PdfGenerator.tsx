import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Receipt, FileSpreadsheet, Download, Loader2 } from 'lucide-react'
import { usePdfTicket } from '@/hooks/usePdfTicket'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface PdfGeneratorProps {
    saleId: number
    defaultType?: 'ticket' | 'boleta' | 'factura'
    onGenerated?: () => void
}

export function PdfGenerator({ saleId, defaultType = 'ticket', onGenerated }: PdfGeneratorProps) {
    const [selectedType, setSelectedType] = useState<'ticket' | 'boleta' | 'factura'>(defaultType)
    const [loading, setLoading] = useState(false)
    const { generatePdfTicket } = usePdfTicket()

    const handleGenerate = async () => {
        try {
            setLoading(true)
            await generatePdfTicket(saleId, selectedType)
            toast.success(`${getTypeName(selectedType)} generado correctamente`)
            onGenerated?.()
        } catch (error: any) {
            console.error('Error generando PDF:', error)
            toast.error(error.message || 'Error al generar el comprobante')
        } finally {
            setLoading(false)
        }
    }

    const getTypeName = (type: string) => {
        switch (type) {
            case 'ticket': return 'Ticket'
            case 'boleta': return 'Boleta Electrónica'
            case 'factura': return 'Factura Electrónica'
            default: return 'Comprobante'
        }
    }

    return (
        <div className="space-y-4">
            <RadioGroup value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Ticket */}
                    <Card
                        className={`cursor-pointer transition-all ${selectedType === 'ticket' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                            }`}
                        onClick={() => setSelectedType('ticket')}
                    >
                        <CardHeader className="text-center pb-3">
                            <div className="mx-auto mb-2">
                                <Receipt className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle className="text-base">Ticket de Venta</CardTitle>
                            <CardDescription className="text-xs">Formato 80mm</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center pb-4">
                            <RadioGroupItem value="ticket" id="ticket" className="sr-only" />
                            <Label htmlFor="ticket" className="cursor-pointer text-xs text-muted-foreground">
                                Ideal para impresoras térmicas
                            </Label>
                        </CardContent>
                    </Card>

                    {/* Boleta */}
                    <Card
                        className={`cursor-pointer transition-all ${selectedType === 'boleta' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                            }`}
                        onClick={() => setSelectedType('boleta')}
                    >
                        <CardHeader className="text-center pb-3">
                            <div className="mx-auto mb-2">
                                <FileText className="h-10 w-10 text-blue-500" />
                            </div>
                            <CardTitle className="text-base">Boleta Electrónica</CardTitle>
                            <CardDescription className="text-xs">Formato A4</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center pb-4">
                            <RadioGroupItem value="boleta" id="boleta" className="sr-only" />
                            <Label htmlFor="boleta" className="cursor-pointer text-xs text-muted-foreground">
                                Comprobante para clientes finales
                            </Label>
                        </CardContent>
                    </Card>

                    {/* Factura */}
                    <Card
                        className={`cursor-pointer transition-all ${selectedType === 'factura' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                            }`}
                        onClick={() => setSelectedType('factura')}
                    >
                        <CardHeader className="text-center pb-3">
                            <div className="mx-auto mb-2">
                                <FileSpreadsheet className="h-10 w-10 text-green-500" />
                            </div>
                            <CardTitle className="text-base">Factura Electrónica</CardTitle>
                            <CardDescription className="text-xs">Formato A4</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center pb-4">
                            <RadioGroupItem value="factura" id="factura" className="sr-only" />
                            <Label htmlFor="factura" className="cursor-pointer text-xs text-muted-foreground">
                                Comprobante para empresas
                            </Label>
                        </CardContent>
                    </Card>
                </div>
            </RadioGroup>

            <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full"
                size="lg"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                    </>
                ) : (
                    <>
                        <Download className="mr-2 h-4 w-4" />
                        Generar {getTypeName(selectedType)}
                    </>
                )}
            </Button>
        </div>
    )
}

// Componente de diálogo para usar en tablas
export function PdfGeneratorDialog({
    saleId,
    open,
    onOpenChange
}: {
    saleId: number
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Generar Comprobante</DialogTitle>
                    <DialogDescription>
                        Selecciona el tipo de comprobante que deseas generar para la venta #{saleId}
                    </DialogDescription>
                </DialogHeader>
                <PdfGenerator
                    saleId={saleId}
                    onGenerated={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    )
}

// Botones rápidos para usar en tablas
export function QuickPdfButtons({ saleId }: { saleId: number }) {
    const [loading, setLoading] = useState<string | null>(null)
    const { generatePdfTicket } = usePdfTicket()

    const handleQuickGenerate = async (type: 'ticket' | 'boleta' | 'factura') => {
        try {
            setLoading(type)
            await generatePdfTicket(saleId, type)
            toast.success(`${type === 'ticket' ? 'Ticket' : type === 'boleta' ? 'Boleta' : 'Factura'} generado`)
        } catch (error: any) {
            toast.error('Error al generar comprobante')
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="flex gap-2">
            <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickGenerate('ticket')}
                disabled={loading !== null}
            >
                {loading === 'ticket' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    <Receipt className="h-3 w-3" />
                )}
            </Button>
            <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickGenerate('boleta')}
                disabled={loading !== null}
            >
                {loading === 'boleta' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    <FileText className="h-3 w-3" />
                )}
            </Button>
            <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickGenerate('factura')}
                disabled={loading !== null}
            >
                {loading === 'factura' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    <FileSpreadsheet className="h-3 w-3" />
                )}
            </Button>
        </div>
    )
}