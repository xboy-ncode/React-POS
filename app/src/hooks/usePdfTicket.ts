// hooks/usePdfTicket.ts
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { saveAs } from 'file-saver'
import { useCallback } from 'react'
import { generateTicketTemplate } from '@/utils/pdf/ticketTemplate'
import { ventasService, invoiceService } from '@/lib/api-client'

export function usePdfTicket() {

    const generatePdfTicket = async (id: number, type: 'sale' | 'invoice' = 'sale') => {
        try {
            // Obtener datos según el tipo
            const data = type === 'invoice'
                ? await invoiceService.getById(id)
                : await ventasService.getById(id)


            const sale = await ventasService.getById(id)

            const pdfDoc = await PDFDocument.create()
            const page = pdfDoc.addPage([164, 600]) // 58mm x largo dinámico
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

            await generateTicketTemplate({ pdfDoc, page, font, sale, logoBase64: data.logoBase64 })

            const pdfBytes = await pdfDoc.save()
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
            saveAs(blob, `Ticket_Venta_${sale.id_venta}.pdf`)


            return data

        } catch (error) {
            console.error('Error generando PDF:', error)
            throw error
        }
    }

    return { generatePdfTicket }
}
