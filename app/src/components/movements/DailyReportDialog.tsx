import { useState } from 'react'
import { FileText, Download, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { usePdfTicket } from '@/hooks/usePdfTicket'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function DailyReportDialog() {
    const { generateDailyReport } = usePdfTicket()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    
    // Fecha actual por defecto
    const today = format(new Date(), 'yyyy-MM-dd')
    const [selectedDate, setSelectedDate] = useState(today)

    const handleGenerate = async () => {
        const toastId = toast.loading('Generando reporte diario...')
        setLoading(true)

        try {
            const result = await generateDailyReport(selectedDate)

            toast.success(`Reporte generado con ${result.total_ventas} ventas`, {
                id: toastId,
            })
            setOpen(false)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Error al generar el reporte', { id: toastId })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Reporte Diario
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Generar Reporte Diario
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona la fecha para generar el reporte de ventas en PDF
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Fecha</Label>
                        <Input
                            id="date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={today}
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="flex-1"
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        className="flex-1"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Download className="mr-2 h-4 w-4 animate-pulse" />
                                Generando...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Generar PDF
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}