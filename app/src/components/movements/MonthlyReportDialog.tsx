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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { usePdfTicket } from '@/hooks/usePdfTicket'
import { toast } from 'sonner'

export function MonthlyReportDialog() {
    const { generateMonthlyReport } = usePdfTicket()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString())
    const [selectedYear, setSelectedYear] = useState(currentYear.toString())

    const months = [
        { value: '1', label: 'Enero' },
        { value: '2', label: 'Febrero' },
        { value: '3', label: 'Marzo' },
        { value: '4', label: 'Abril' },
        { value: '5', label: 'Mayo' },
        { value: '6', label: 'Junio' },
        { value: '7', label: 'Julio' },
        { value: '8', label: 'Agosto' },
        { value: '9', label: 'Septiembre' },
        { value: '10', label: 'Octubre' },
        { value: '11', label: 'Noviembre' },
        { value: '12', label: 'Diciembre' }
    ]

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

   const handleGenerate = async () => {
    const toastId = toast.loading('Generando reporte mensual...')
    setLoading(true)

    try {
        const result = await generateMonthlyReport(
            parseInt(selectedMonth),
            parseInt(selectedYear)
        )

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
                <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Reporte Mensual
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Generar Reporte Mensual
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona el mes y año para generar el reporte de ventas en PDF
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="month">Mes</Label>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger id="month">
                                <SelectValue placeholder="Seleccionar mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(month => (
                                    <SelectItem key={month.value} value={month.value}>
                                        {month.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="year">Año</Label>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger id="year">
                                <SelectValue placeholder="Seleccionar año" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(year => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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