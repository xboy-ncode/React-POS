// utils/pdf/ticketTemplate.ts
import { format } from 'date-fns'
import QRCode from 'qrcode'
import type { PDFDocument, PDFFont, PDFPage } from 'pdf-lib'

interface TicketTemplateProps {
    pdfDoc: PDFDocument
    page: PDFPage
    font: PDFFont
    sale: any
    logoBase64?: string // base64 opcional del logo
}

export async function generateTicketTemplate({ pdfDoc, page, font, sale, logoBase64 }: TicketTemplateProps) {
    const { nombre, apellido_paterno, total, detalles, fecha, metodo_pago, id_venta } = sale

    const pageWidth = 180 // ancho total del ticket
    const margin = 3
    const contentWidth = pageWidth - (margin * 2) // área útil para el contenido
    const { height } = page.getSize()
    let y = height - margin - 10

    const drawText = (text: string, y: number, size = 8, align: 'left' | 'center' | 'right' = 'left') => {
        const textWidth = font.widthOfTextAtSize(text, size)
        let x = margin
        
        if (align === 'center') {
            x = margin + (contentWidth - textWidth) / 2
        } else if (align === 'right') {
            x = margin + contentWidth - textWidth
        }
        
        page.drawText(text, { x, y, size, font })
    }

    // 🖼️ Logo
    if (logoBase64) {
        const img = await pdfDoc.embedPng(logoBase64)
        const imgDims = img.scale(0.3)
        const imgX = margin + (contentWidth - imgDims.width) / 2
        page.drawImage(img, {
            x: imgX,
            y: y - imgDims.height,
            width: imgDims.width,
            height: imgDims.height
        })
        y -= imgDims.height + 12
    }

    // 🏪 Encabezado
    drawText('Mi Negocio S.A.', y, 10, 'center')
    y -= 12
    drawText('RUC: 12345678901', y, 8, 'center')
    y -= 10
    drawText('Av. Principal 123 - Lima, Perú', y, 8, 'center')
    y -= 12

    drawText('----------------------------------------', y, 8, 'center')
    y -= 12

    // 🧾 Datos
    drawText(`Factura N°: ${id_venta}`, y, 9)
    y -= 10
    drawText(`Fecha: ${format(new Date(fecha), 'dd/MM/yyyy HH:mm')}`, y, 9)
    y -= 10
    drawText(`Cliente: ${nombre} ${apellido_paterno || ''}`, y, 9)
    y -= 12

    drawText('----------------------------------------', y, 8, 'center')
    y -= 12

    // 🛒 Detalles
    detalles?.forEach((d: any) => {
        const nombreProd = d.producto_nombre.slice(0, 22)
        drawText(nombreProd, y, 9)
        y -= 10
        
        // Cantidad y precio unitario a la izquierda
        drawText(`${d.cantidad} x S/${Number(d.precio_unitario).toFixed(2)}`, y, 8)
        
        // Subtotal a la derecha
        drawText(`S/${Number(d.subtotal).toFixed(2)}`, y, 8, 'right')
        y -= 12
    })

    drawText('----------------------------------------', y, 8, 'center')
    y -= 12

    // 💰 Totales
    drawText(`Método: ${metodo_pago}`, y, 9)
    y -= 12
    
    // Total alineado a la derecha
    drawText(`TOTAL: S/${Number(total).toFixed(2)}`, y, 11, 'right')
    y -= 25

    // 📦 QR del número de factura
    const qrData = `https://mi-negocio.com/factura/${id_venta}`
    const qrPng = await QRCode.toDataURL(qrData)
    const qrImage = await pdfDoc.embedPng(qrPng)
    const qrSize = 65
    const qrX = margin + (contentWidth - qrSize) / 2
    page.drawImage(qrImage, {
        x: qrX,
        y: y - qrSize,
        width: qrSize,
        height: qrSize
    })
    y -= qrSize + 15

    drawText('¡Gracias por su compra!', y, 9, 'center')
}