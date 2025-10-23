// hooks/usePdfTicket.ts - VERSIÓN ACTUALIZADA CON VARIABLES DE ENTORNO
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { saveAs } from 'file-saver'
import { useCallback } from 'react'
import { ventasService } from '@/lib/api-client'
import businessConfig, {
    formatCurrency,
    calculateIGV,
    getInvoiceTypeName,
    generateInvoiceNumber
} from '@/config/business.config'

// Tipos de comprobante
export type ComprobanteType = 'ticket' | 'boleta' | 'factura'

// Configuración de anchos según tipo de comprobante
const PAPER_CONFIGS = {
    ticket: { width: 226.77, maxWidth: 200 },   // 80mm
    boleta: { width: 595.28, maxWidth: 515 },   // A4 - Ajustado de 555 a 515
    factura: { width: 595.28, maxWidth: 515 }   // A4 - Ajustado de 555 a 515
}

interface SaleItem {
    id_producto?: number;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;

    // NUEVO: Agregar campos de descuentos
    precio_original?: number;
    descuento_oferta?: number;
    descuento_mayorista?: number;
    descuento_total?: number;
    es_oferta?: boolean;
    es_mayorista?: boolean;
}

interface SaleData {
    id_venta: number
    numero_comprobante?: string
    tipo_comprobante?: string
    fecha_venta: string
    total: number
    subtotal?: number
    igv?: number
    cliente_nombre?: string
    cliente_documento?: string
    cliente_direccion?: string
    metodo_pago: string
    subtotal_sin_descuentos?: number;
    total_descuentos?: number;
    items: SaleItem[];

}

// Utilidad para envolver texto
function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const width = font.widthOfTextAtSize(testLine, fontSize)

        if (width > maxWidth) {
            if (currentLine) {
                lines.push(currentLine)
                currentLine = word
            } else {
                lines.push(word)
                currentLine = ''
            }
        } else {
            currentLine = testLine
        }
    }

    if (currentLine) {
        lines.push(currentLine)
    }

    return lines
}

// Función para dibujar texto centrado
function drawCenteredText(
    page: PDFPage,
    text: string,
    y: number,
    font: PDFFont,
    size: number,
    maxWidth: number,
    color = rgb(0, 0, 0)
) {
    const textWidth = font.widthOfTextAtSize(text, size)
    const pageWidth = page.getWidth()
    const margin = (pageWidth - maxWidth) / 2

    // ✅ Calcular X centrado dentro del área disponible
    const x = margin + (maxWidth - textWidth) / 2

    page.drawText(text, {
        x: Math.max(margin + 5, x), // Margen mínimo de seguridad
        y,
        size,
        font,
        color
    })

    return y
}

// Función para dibujar línea horizontal
function drawLine(page: PDFPage, y: number, maxWidth: number) {
    const margin = (page.getWidth() - maxWidth) / 2
    page.drawLine({
        start: { x: margin, y },
        end: { x: page.getWidth() - margin, y },
        thickness: 0.5,
        color: rgb(0, 0, 0)
    })
}

// ==================== TICKET (80mm) ====================
async function generateTicket(
    pdfDoc: PDFDocument,
    sale: SaleData,
    font: PDFFont,
    fontBold: PDFFont
): Promise<void> {
    const { maxWidth } = PAPER_CONFIGS.ticket
    const margin = 13

    // Calcular altura necesaria
    let estimatedHeight = 400 + (sale.items.length * 60)
    const page = pdfDoc.addPage([PAPER_CONFIGS.ticket.width, estimatedHeight])

    let yPosition = estimatedHeight - 30

    // === ENCABEZADO ===
    yPosition = drawCenteredText(
        page,
        businessConfig.name,
        yPosition,
        fontBold,
        10,
        maxWidth
    )
    yPosition -= 15

    yPosition = drawCenteredText(
        page,
        `RUC: ${businessConfig.ruc}`,
        yPosition,
        font,
        8,
        maxWidth
    )
    yPosition -= 12

    if (businessConfig.address) {
        const dirLines = wrapText(businessConfig.address, maxWidth, font, 7)
        for (const line of dirLines) {
            yPosition = drawCenteredText(page, line, yPosition, font, 7, maxWidth)
            yPosition -= 10
        }
    }

    if (businessConfig.phone) {
        yPosition = drawCenteredText(
            page,
            `Tel: ${businessConfig.phone}`,
            yPosition,
            font,
            7,
            maxWidth
        )
        yPosition -= 15
    }

    drawLine(page, yPosition, maxWidth)
    yPosition -= 15

    // === DATOS DEL COMPROBANTE ===
    yPosition = drawCenteredText(
        page,
        'TICKET DE VENTA',
        yPosition,
        fontBold,
        9,
        maxWidth
    )
    yPosition -= 12

    const numeroComprobante = sale.numero_comprobante ||
        generateInvoiceNumber('ticket', sale.id_venta)

    yPosition = drawCenteredText(
        page,
        `N° ${numeroComprobante}`,
        yPosition,
        font,
        8,
        maxWidth
    )
    yPosition -= 12

    const fecha = new Date(sale.fecha_venta).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
    yPosition = drawCenteredText(page, fecha, yPosition, font, 7, maxWidth)
    yPosition -= 15

    drawLine(page, yPosition, maxWidth)
    yPosition -= 15

    // === CLIENTE (opcional) ===
    if (sale.cliente_nombre) {
        page.drawText('Cliente:', { x: margin, y: yPosition, size: 7, font: fontBold })
        yPosition -= 10

        const clienteLines = wrapText(sale.cliente_nombre, maxWidth - 20, font, 7)
        for (const line of clienteLines) {
            page.drawText(line, { x: margin, y: yPosition, size: 7, font })
            yPosition -= 10
        }

        if (sale.cliente_documento) {
            page.drawText(`Doc: ${sale.cliente_documento}`, {
                x: margin,
                y: yPosition,
                size: 7,
                font
            })
            yPosition -= 15
        } else {
            yPosition -= 5
        }

        drawLine(page, yPosition, maxWidth)
        yPosition -= 12
    }

    // === PRODUCTOS ===
    page.drawText('DESCRIPCIÓN', { x: margin, y: yPosition, size: 7, font: fontBold })
    page.drawText('CANT', { x: maxWidth - 80, y: yPosition, size: 7, font: fontBold })
    page.drawText('P.U.', { x: maxWidth - 50, y: yPosition, size: 7, font: fontBold })
    page.drawText('TOTAL', { x: maxWidth - 15, y: yPosition, size: 7, font: fontBold })
    yPosition -= 10

    drawLine(page, yPosition, maxWidth)
    yPosition -= 10

    // === PRODUCTOS CON DESCUENTOS ===
    for (const item of sale.items) {
        const nombreProducto = item.nombre || 'Producto'
        const itemLines = wrapText(nombreProducto, maxWidth - 100, font, 7)

        // Primera línea del producto
        for (let i = 0; i < itemLines.length; i++) {
            page.drawText(itemLines[i], { x: margin, y: yPosition, size: 7, font })

            if (i === 0) {
                const cantidad = Number(item.cantidad) || 0
                const precioUnit = Number(item.precio_unitario) || 0
                const subtotal = Number(item.subtotal) || 0

                page.drawText(cantidad.toString(), {
                    x: maxWidth - 75,
                    y: yPosition,
                    size: 7,
                    font
                })

                // Si tiene descuento, mostrar precio original tachado
                if (item.precio_original && item.precio_original > precioUnit) {
                    // Mostrar precio con descuento
                    page.drawText(precioUnit.toFixed(2), {
                        x: maxWidth - 50,
                        y: yPosition,
                        size: 7,
                        font,
                        color: rgb(0, 0.5, 0) // Verde para precio con descuento
                    })
                } else {
                    page.drawText(precioUnit.toFixed(2), {
                        x: maxWidth - 50,
                        y: yPosition,
                        size: 7,
                        font
                    })
                }

                page.drawText(subtotal.toFixed(2), {
                    x: maxWidth - 15,
                    y: yPosition,
                    size: 7,
                    font
                })
            }
            yPosition -= 10
        }

        // NUEVO: Mostrar tipo de descuento aplicado
        if (item.es_oferta || item.es_mayorista) {
            let descText = ''
            if (item.es_oferta && item.es_mayorista) {
                descText = '(Oferta + Mayorista)'
            } else if (item.es_oferta) {
                descText = '(Oferta)'
            } else if (item.es_mayorista) {
                descText = '(Precio Mayorista)'
            }

            if (descText) {
                page.drawText(descText, {
                    x: margin + 10,
                    y: yPosition,
                    size: 6,
                    font,
                    color: rgb(0, 0.5, 0)
                })
                yPosition -= 8
            }

            // Mostrar ahorro si existe
            if (item.descuento_total && item.descuento_total > 0) {
                const ahorro = item.descuento_total * item.cantidad
                page.drawText(`Ahorro: ${formatCurrency(ahorro)}`, {
                    x: margin + 10,
                    y: yPosition,
                    size: 6,
                    font,
                    color: rgb(0.8, 0, 0)
                })
                yPosition -= 8
            }
        }

        yPosition -= 3
    }

    yPosition -= 5
    drawLine(page, yPosition, maxWidth)
    yPosition -= 15

    // === TOTALES CON DESCUENTOS ===
    // Agregar resumen de descuentos si existen
    if (sale.total_descuentos && sale.total_descuentos > 0) {
        yPosition -= 10
        drawLine(page, yPosition, maxWidth)
        yPosition -= 12

        page.drawText('RESUMEN DE DESCUENTOS', {
            x: margin,
            y: yPosition,
            size: 7,
            font: fontBold
        })
        yPosition -= 10

        // Calcular descuentos por tipo
        let totalOferta = 0
        let totalMayorista = 0

        sale.items.forEach(item => {
            if (item.descuento_oferta) {
                totalOferta += item.descuento_oferta * item.cantidad
            }
            if (item.descuento_mayorista) {
                totalMayorista += item.descuento_mayorista * item.cantidad
            }
        })

        if (totalOferta > 0) {
            page.drawText('Desc. Ofertas:', { x: margin, y: yPosition, size: 6, font })
            page.drawText(`-${formatCurrency(totalOferta)}`, {
                x: maxWidth - 15,
                y: yPosition,
                size: 6,
                font,
                color: rgb(0.8, 0, 0)
            })
            yPosition -= 8
        }

        if (totalMayorista > 0) {
            page.drawText('Desc. Mayorista:', { x: margin, y: yPosition, size: 6, font })
            page.drawText(`-${formatCurrency(totalMayorista)}`, {
                x: maxWidth - 15,
                y: yPosition,
                size: 6,
                font,
                color: rgb(0.8, 0, 0)
            })
            yPosition -= 8
        }

        yPosition -= 5
        page.drawText('TOTAL AHORRADO:', {
            x: margin,
            y: yPosition,
            size: 7,
            font: fontBold
        })
        page.drawText(formatCurrency(sale.total_descuentos), {
            x: maxWidth - 15,
            y: yPosition,
            size: 7,
            font: fontBold,
            color: rgb(0, 0.5, 0)
        })
        yPosition -= 12
    }

    const totalValue = Number(sale.total) || 0
    page.drawText('Sub-Total:', { x: maxWidth - 90, y: yPosition, size: 10, font: fontBold })
        page.drawText(formatCurrency(totalValue), {
        x: maxWidth - 15,
        y: yPosition,
        size: 10,
        font: fontBold
    })
        yPosition -= 15

        page.drawText('Impuestos:', { x: maxWidth - 90, y: yPosition, size: 10, font: fontBold })
        page.drawText(formatCurrency(totalValue * 0.18), {
        x: maxWidth - 15,
        y: yPosition,
        size: 10,
        font: fontBold
    })
        yPosition -= 15
        
    page.drawText('TOTAL:', { x: maxWidth - 90, y: yPosition, size: 10, font: fontBold })
    page.drawText(formatCurrency(totalValue + (totalValue * 0.18)), {
        x: maxWidth - 15,
        y: yPosition,
        size: 10,
        font: fontBold
    })
    yPosition -= 15

    // === MÉTODO DE PAGO ===
    drawLine(page, yPosition, maxWidth)
    yPosition -= 12

    page.drawText('MÉTODO DE PAGO:', { x: margin, y: yPosition, size: 7, font: fontBold })
    page.drawText(sale.metodo_pago.toUpperCase(), {
        x: maxWidth - 40,
        y: yPosition,
        size: 7,
        font
    })
    yPosition -= 20

    // === PIE DE PÁGINA ===
    yPosition = drawCenteredText(
        page,
        businessConfig.invoiceFooter,
        yPosition,
        fontBold,
        8,
        maxWidth
    )

    // Agregar website si está configurado
    if (businessConfig.website) {
        yPosition -= 12
        yPosition = drawCenteredText(
            page,
            businessConfig.website,
            yPosition,
            font,
            7,
            maxWidth,
            rgb(0.4, 0.4, 0.4)
        )
    }
}

// ==================== BOLETA ELECTRÓNICA (A4) ====================
async function generateBoleta(
    pdfDoc: PDFDocument,
    sale: SaleData,
    font: PDFFont,
    fontBold: PDFFont
): Promise<void> {
    const { maxWidth } = PAPER_CONFIGS.boleta
    const page = pdfDoc.addPage([595.28, 842]) // A4
    const margin = 40
    let yPosition = 800

    // === ENCABEZADO CON RECUADRO ===
    // Recuadro del RUC
    page.drawRectangle({
        x: page.getWidth() - 200,
        y: yPosition - 80,
        width: 160,
        height: 80,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5
    })

    // Datos empresa (izquierda)
    page.drawText(businessConfig.name, {
        x: margin,
        y: yPosition,
        size: 14,
        font: fontBold
    })
    yPosition -= 20

    page.drawText(`Dirección: ${businessConfig.address}`, {
        x: margin,
        y: yPosition,
        size: 9,
        font
    })
    yPosition -= 15

    if (businessConfig.phone) {
        page.drawText(`Teléfono: ${businessConfig.phone}`, {
            x: margin,
            y: yPosition,
            size: 9,
            font
        })
        yPosition -= 15
    }

    if (businessConfig.email) {
        page.drawText(`Email: ${businessConfig.email}`, {
            x: margin,
            y: yPosition,
            size: 9,
            font
        })
    }

    // RUC y tipo de comprobante (derecha)
    const rucY = 785
    drawCenteredText(
        page,
        'RUC N° ' + businessConfig.ruc,
        rucY,
        fontBold,
        11,
        160
    )

    drawCenteredText(
        page,
        'BOLETA DE VENTA',
        rucY - 25,
        fontBold,
        12,
        160
    )

    drawCenteredText(
        page,
        'ELECTRÓNICA',
        rucY - 40,
        font,
        10,
        160
    )

    const numeroComprobante = sale.numero_comprobante ||
        generateInvoiceNumber('boleta', sale.id_venta)

    drawCenteredText(
        page,
        numeroComprobante,
        rucY - 60,
        fontBold,
        11,
        160
    )

    yPosition = 680

    // === DATOS DEL CLIENTE ===
    page.drawRectangle({
        x: margin,
        y: yPosition - 60,
        width: maxWidth,
        height: 60,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1
    })

    page.drawText('SEÑOR(ES):', { x: margin + 10, y: yPosition - 20, size: 9, font: fontBold })
    page.drawText(sale.cliente_nombre || 'CLIENTE VARIOS', {
        x: margin + 90,
        y: yPosition - 20,
        size: 9,
        font
    })

    page.drawText('DNI/RUC:', { x: margin + 10, y: yPosition - 40, size: 9, font: fontBold })
    page.drawText(sale.cliente_documento || '-', {
        x: margin + 90,
        y: yPosition - 40,
        size: 9,
        font
    })

    page.drawText('FECHA:', { x: 350, y: yPosition - 20, size: 9, font: fontBold })
    const fechaBoleta = new Date(sale.fecha_venta).toLocaleDateString('es-PE')
    page.drawText(fechaBoleta, { x: 410, y: yPosition - 20, size: 9, font })

    page.drawText('DIRECCIÓN:', { x: margin + 10, y: yPosition - 55, size: 9, font: fontBold })
    page.drawText(sale.cliente_direccion || '-', {
        x: margin + 90,
        y: yPosition - 55,
        size: 9,
        font
    })

    yPosition -= 80

    // === TABLA DE PRODUCTOS ===
    // Encabezado
    page.drawRectangle({
        x: margin,
        y: yPosition - 25,
        width: maxWidth,
        height: 25,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1
    })

    page.drawText('CANT.', { x: margin + 10, y: yPosition - 18, size: 9, font: fontBold })
    page.drawText('DESCRIPCIÓN', { x: margin + 80, y: yPosition - 18, size: 9, font: fontBold })
    page.drawText('P. UNIT', { x: margin + 350, y: yPosition - 18, size: 9, font: fontBold })
    page.drawText('IMPORTE', { x: margin + 450, y: yPosition - 18, size: 9, font: fontBold })

    yPosition -= 25

    // Items con conversión de tipos
    for (const item of sale.items) {
        page.drawRectangle({
            x: margin,
            y: yPosition - 20,
            width: maxWidth,
            height: 20,
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.5
        })

        const cantidad = Number(item.cantidad) || 0
        page.drawText(cantidad.toString(), {
            x: margin + 15,
            y: yPosition - 15,
            size: 9,
            font
        })

        const nombreProducto = item.nombre || 'Producto sin nombre'
        const descripcion = nombreProducto.length > 40
            ? nombreProducto.substring(0, 40) + '...'
            : nombreProducto
        page.drawText(descripcion, {
            x: margin + 80,
            y: yPosition - 15,
            size: 9,
            font
        })

        const precioUnitario = Number(item.precio_unitario) || 0
        page.drawText(precioUnitario.toFixed(2), {
            x: margin + 360,
            y: yPosition - 15,
            size: 9,
            font
        })

        const subtotal = Number(item.subtotal) || 0
        page.drawText(subtotal.toFixed(2), {
            x: margin + 470,
            y: yPosition - 15,
            size: 9,
            font
        })

        yPosition -= 20
    }

    yPosition -= 20

    // === TOTALES ===
    if (sale.subtotal) {
        page.drawText('OP. GRAVADA:', {
            x: margin + 350,
            y: yPosition,
            size: 9,
            font: fontBold
        })
        const subtotalValue = Number(sale.subtotal) || 0
        page.drawText(formatCurrency(subtotalValue), {
            x: margin + 470,
            y: yPosition,
            size: 9,
            font
        })
        yPosition -= 15

        page.drawText(`IGV (${businessConfig.igvRate}%):`, {
            x: margin + 350,
            y: yPosition,
            size: 9,
            font: fontBold
        })
        const igvValue = Number(sale.igv) || calculateIGV(subtotalValue)
        page.drawText(formatCurrency(igvValue), {
            x: margin + 470,
            y: yPosition,
            size: 9,
            font
        })
        yPosition -= 20
    }

    page.drawRectangle({
        x: margin + 340,
        y: yPosition - 20,
        width: 215,
        height: 20,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1
    })

    page.drawText('TOTAL:', {
        x: margin + 350,
        y: yPosition - 15,
        size: 11,
        font: fontBold
    })
    const totalValue = Number(sale.total) || 0
    page.drawText(formatCurrency(totalValue), {
        x: margin + 470,
        y: yPosition - 15,
        size: 11,
        font: fontBold
    })

    yPosition -= 40

    // === PIE DE PÁGINA ===
    page.drawText('Representación impresa de la Boleta de Venta Electrónica', {
        x: margin,
        y: yPosition,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4)
    })

    yPosition -= 15
    page.drawText(businessConfig.invoiceWebsiteText, {
        x: margin,
        y: yPosition,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4)
    })
}

// ==================== FACTURA ELECTRÓNICA (A4) ====================
async function generateFactura(
    pdfDoc: PDFDocument,
    sale: SaleData,
    font: PDFFont,
    fontBold: PDFFont
): Promise<void> {
    const { maxWidth } = PAPER_CONFIGS.factura
    const page = pdfDoc.addPage([595.28, 842]) // A4
    const margin = 40
    let yPosition = 800

    // === ENCABEZADO CON RECUADRO ===
    page.drawRectangle({
        x: page.getWidth() - 200,
        y: yPosition - 80,
        width: 160,
        height: 80,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5
    })

    // Datos empresa
    page.drawText(businessConfig.name, {
        x: margin,
        y: yPosition,
        size: 14,
        font: fontBold
    })
    yPosition -= 20

    page.drawText(`Dirección: ${businessConfig.address}`, {
        x: margin,
        y: yPosition,
        size: 9,
        font
    })
    yPosition -= 15

    if (businessConfig.phone) {
        page.drawText(`Teléfono: ${businessConfig.phone}`, {
            x: margin,
            y: yPosition,
            size: 9,
            font
        })
        yPosition -= 15
    }

    if (businessConfig.email) {
        page.drawText(`Email: ${businessConfig.email}`, {
            x: margin,
            y: yPosition,
            size: 9,
            font
        })
    }

    // RUC y tipo de comprobante
    const rucY = 785
    drawCenteredText(page, 'RUC N° ' + businessConfig.ruc, rucY, fontBold, 11, 160)
    drawCenteredText(page, 'FACTURA', rucY - 25, fontBold, 14, 160)
    drawCenteredText(page, 'ELECTRÓNICA', rucY - 42, font, 10, 160)

    const numeroComprobante = sale.numero_comprobante ||
        generateInvoiceNumber('factura', sale.id_venta)

    drawCenteredText(
        page,
        numeroComprobante,
        rucY - 62,
        fontBold,
        11,
        160
    )

    yPosition = 680

    // === DATOS DEL CLIENTE ===
    page.drawRectangle({
        x: margin,
        y: yPosition - 80,
        width: maxWidth,
        height: 80,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1
    })

    page.drawText('SEÑOR(ES):', { x: margin + 10, y: yPosition - 20, size: 9, font: fontBold })
    page.drawText(sale.cliente_nombre || 'CLIENTE', {
        x: margin + 90,
        y: yPosition - 20,
        size: 9,
        font
    })

    page.drawText('RUC:', { x: margin + 10, y: yPosition - 40, size: 9, font: fontBold })
    page.drawText(sale.cliente_documento || '-', {
        x: margin + 90,
        y: yPosition - 40,
        size: 9,
        font
    })

    page.drawText('FECHA EMISIÓN:', { x: 350, y: yPosition - 20, size: 9, font: fontBold })
    const fechaFactura = new Date(sale.fecha_venta).toLocaleDateString('es-PE')
    page.drawText(fechaFactura, { x: 460, y: yPosition - 20, size: 9, font })

    page.drawText('DIRECCIÓN:', { x: margin + 10, y: yPosition - 60, size: 9, font: fontBold })
    page.drawText(sale.cliente_direccion || '-', {
        x: margin + 90,
        y: yPosition - 60,
        size: 9,
        font
    })

    page.drawText('COND. PAGO:', { x: 350, y: yPosition - 40, size: 9, font: fontBold })
    page.drawText(sale.metodo_pago.toUpperCase(), { x: 460, y: yPosition - 40, size: 9, font })

    yPosition -= 100

    // === TABLA DE PRODUCTOS ===
    // Encabezado
    page.drawRectangle({
        x: margin,
        y: yPosition - 25,
        width: maxWidth,
        height: 25,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1
    })

    page.drawText('CANT.', { x: margin + 10, y: yPosition - 18, size: 9, font: fontBold })
    page.drawText('DESCRIPCIÓN', { x: margin + 80, y: yPosition - 18, size: 9, font: fontBold })
    page.drawText('P. UNIT', { x: margin + 350, y: yPosition - 18, size: 9, font: fontBold })
    page.drawText('VALOR VENTA', { x: margin + 440, y: yPosition - 18, size: 9, font: fontBold })

    yPosition -= 25

    // Items con conversión de tipos
    for (const item of sale.items) {
        page.drawRectangle({
            x: margin,
            y: yPosition - 20,
            width: maxWidth,
            height: 20,
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.5
        })

        const cantidad = Number(item.cantidad) || 0
        page.drawText(cantidad.toString(), {
            x: margin + 15,
            y: yPosition - 15,
            size: 9,
            font
        })

        const nombreProducto = item.nombre || 'Producto'
        const descripcion = nombreProducto.length > 40
            ? nombreProducto.substring(0, 40) + '...'
            : nombreProducto
        page.drawText(descripcion, {
            x: margin + 80,
            y: yPosition - 15,
            size: 9,
            font
        })

        const precioUnitario = Number(item.precio_unitario) || 0
        page.drawText(precioUnitario.toFixed(2), {
            x: margin + 360,
            y: yPosition - 15,
            size: 9,
            font
        })

        const subtotal = Number(item.subtotal) || 0
        page.drawText(subtotal.toFixed(2), {
            x: margin + 470,
            y: yPosition - 15,
            size: 9,
            font
        })

        yPosition -= 20
    }

    yPosition -= 20

    // === TOTALES ===
    if (sale.subtotal) {
        page.drawText('OP. GRAVADA:', {
            x: margin + 350,
            y: yPosition,
            size: 9,
            font: fontBold
        })
        const subtotalValue = Number(sale.subtotal) || 0
        page.drawText(formatCurrency(subtotalValue), {
            x: margin + 470,
            y: yPosition,
            size: 9,
            font
        })
        yPosition -= 15

        page.drawText(`IGV (${businessConfig.igvRate}%):`, {
            x: margin + 350,
            y: yPosition,
            size: 9,
            font: fontBold
        })
        const igvValue = Number(sale.igv) || calculateIGV(subtotalValue)
        page.drawText(formatCurrency(igvValue), {
            x: margin + 470,
            y: yPosition,
            size: 9,
            font
        })
        yPosition -= 20
    }

    page.drawRectangle({
        x: margin + 340,
        y: yPosition - 25,
        width: 215,
        height: 25,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5
    })

    page.drawText('IMPORTE TOTAL:', {
        x: margin + 350,
        y: yPosition - 18,
        size: 11,
        font: fontBold
    })
    const totalValue = Number(sale.total) || 0
    page.drawText(formatCurrency(totalValue), {
        x: margin + 470,
        y: yPosition - 18,
        size: 11,
        font: fontBold
    })

    yPosition -= 50

    // === PIE DE PÁGINA ===
    page.drawText('Representación impresa de la Factura Electrónica', {
        x: margin,
        y: yPosition,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4)
    })

    yPosition -= 12
    page.drawText(businessConfig.invoiceWebsiteText, {
        x: margin,
        y: yPosition,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4)
    })

    yPosition -= 12
    page.drawText(businessConfig.invoiceAuthText, {
        x: margin,
        y: yPosition,
        size: 7,
        font,
        color: rgb(0.4, 0.4, 0.4)
    })
}

// ==================== HOOK PRINCIPAL ====================
export function usePdfTicket() {
    const generatePdfTicket = useCallback(async (
        id: number,
        type: ComprobanteType = 'ticket'
    ) => {
        try {
            // Obtener datos de la venta
            const response = await ventasService.getById(id)

            // Mapear datos al formato esperado - sin datos de empresa hardcodeados
            const sale: SaleData = {
                id_venta: response.id_venta,
                numero_comprobante: response.numero_comprobante,
                tipo_comprobante: response.tipo_comprobante,
                fecha_venta: response.fecha_venta,
                total: parseFloat(response.total),
                subtotal: response.subtotal ? parseFloat(response.subtotal) : undefined,
                igv: response.igv ? parseFloat(response.igv) : undefined,
                cliente_nombre: response.cliente_nombre,
                cliente_documento: response.cliente_documento,
                cliente_direccion: response.cliente_direccion,
                metodo_pago: response.metodo_pago,
                items: response.items || response.detalles || []
            }

            // Crear documento PDF
            const pdfDoc = await PDFDocument.create()
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

            // Generar según tipo
            switch (type) {
                case 'ticket':
                    await generateTicket(pdfDoc, sale, font, fontBold)
                    break
                case 'boleta':
                    await generateBoleta(pdfDoc, sale, font, fontBold)
                    break
                case 'factura':
                    await generateFactura(pdfDoc, sale, font, fontBold)
                    break
            }

            // Guardar PDF
            const pdfBytes = await pdfDoc.save()
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })

            const fileName = type === 'factura'
                ? `Factura_${sale.numero_comprobante || sale.id_venta}.pdf`
                : type === 'boleta'
                    ? `Boleta_${sale.numero_comprobante || sale.id_venta}.pdf`
                    : `Ticket_${sale.id_venta}.pdf`

            saveAs(blob, fileName)

            return sale
        } catch (error) {
            console.error('Error generando PDF:', error)
            throw error
        }
    }, [])

    // Función adicional para generar PDF con datos personalizados
    const generateCustomPdfTicket = useCallback(async (
        saleData: SaleData,
        type: ComprobanteType = 'ticket'
    ) => {
        try {
            // Crear documento PDF
            const pdfDoc = await PDFDocument.create()
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)



            // Generar según tipo
            switch (type) {
                case 'ticket':
                    await generateTicketWithDiscounts(pdfDoc, saleData, font, fontBold)
                    break
                case 'boleta':
                    await generateBoleta(pdfDoc, saleData, font, fontBold)
                    break
                case 'factura':
                    await generateFactura(pdfDoc, saleData, font, fontBold)
                    break
            }

            // Guardar PDF
            const pdfBytes = await pdfDoc.save()
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })

            const fileName = type === 'factura'
                ? `Factura_${saleData.numero_comprobante || saleData.id_venta}.pdf`
                : type === 'boleta'
                    ? `Boleta_${saleData.numero_comprobante || saleData.id_venta}.pdf`
                    : `Ticket_${saleData.id_venta}.pdf`

            saveAs(blob, fileName)

            return saleData
        } catch (error) {
            console.error('Error generando PDF personalizado:', error)
            throw error
        }
    }, [])


    async function generateMonthlyReport(month: number, year: number) {
        const fechaDesde = `${year}-${String(month).padStart(2, '0')}-01`
        const fechaHasta = `${year}-${String(month).padStart(2, '0')}-31`

        // Obtener resumen + detalle desde tu backend
        const { resumen, detalle } = await ventasService.getResumen({
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta
        })

        const pdfDoc = await PDFDocument.create()
        let page = pdfDoc.addPage([595.28, 842]) // A4
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const margin = 40
        let y = 800

        // === LOGO Y ENCABEZADO ===
        if (businessConfig.printConfig.showLogo && businessConfig.printConfig.logoUrl) {
            try {
                const logoBytes = await fetch(businessConfig.printConfig.logoUrl).then(res => res.arrayBuffer())
                const logoImage = await pdfDoc.embedPng(logoBytes)
                const logoWidth = 90
                const logoHeight = (logoImage.height / logoImage.width) * logoWidth
                page.drawImage(logoImage, {
                    x: margin,
                    y: y - logoHeight,
                    width: logoWidth,
                    height: logoHeight
                })
            } catch {
                console.warn('⚠️ No se pudo cargar el logo')
            }
        }

        // Nombre de empresa
        page.drawText(businessConfig.name, {
            x: margin + 110,
            y,
            size: 14,
            font: fontBold,
            color: rgb(0, 0, 0)
        })
        y -= 18

        page.drawText(`RUC: ${businessConfig.ruc}`, {
            x: margin + 110,
            y,
            size: 10,
            font,
        })
        y -= 14

        page.drawText(`Dirección: ${businessConfig.address}`, {
            x: margin + 110,
            y,
            size: 9,
            font
        })
        y -= 14

        if (businessConfig.phone)
            page.drawText(`Tel: ${businessConfig.phone}`, { x: margin + 110, y, size: 9, font })
        if (businessConfig.email)
            page.drawText(`Email: ${businessConfig.email}`, { x: margin + 230, y, size: 9, font })

        y -= 30
        page.drawText('REPORTE MENSUAL DE VENTAS', { x: margin, y, size: 13, font: fontBold })
        y -= 15
        page.drawText(`Período: ${format(new Date(fechaDesde), 'MMMM yyyy', { locale: es })}`, {
            x: margin,
            y,
            size: 10,
            font
        })

        y -= 25
        page.drawLine({
            start: { x: margin, y },
            end: { x: 555, y },
            thickness: 1,
            color: rgb(0, 0, 0)
        })
        y -= 20

        // === ENCABEZADO TABLA ===
        const headers = ['Fecha', 'Cliente', 'Vendedor', 'Método', 'Moneda', 'Total']
        const positions = [margin, margin + 80, margin + 250, margin + 340, margin + 420, margin + 500]

        headers.forEach((h, i) => {
            page.drawText(h, { x: positions[i], y, size: 9, font: fontBold })
        })
        y -= 15

        // === DETALLE DE VENTAS ===
        for (const venta of detalle) {
            if (y < 80) {
                page = pdfDoc.addPage([595.28, 842])
                y = 780
            }

            const fechaFmt = format(new Date(venta.fecha), 'dd/MM/yyyy')
            const cliente = venta.cliente_nombre || 'Cliente Varios'
            const vendedor = venta.vendedor || '-'
            const metodo = venta.metodo_pago || '-'
            const moneda = venta.moneda === 'PEN' ? 'S/' : venta.moneda
            const total = `${moneda} ${parseFloat(venta.total).toFixed(2)}`

            const row = [fechaFmt, cliente, vendedor, metodo, moneda, total]

            row.forEach((text, i) => {
                page.drawText(String(text).substring(0, 25), {
                    x: positions[i],
                    y,
                    size: 9,
                    font
                })
            })
            y -= 14
        }

        y -= 20
        page.drawLine({
            start: { x: margin, y },
            end: { x: 555, y },
            thickness: 1,
            color: rgb(0, 0, 0)
        })
        y -= 20

        // === RESUMEN GENERAL ===
        page.drawText(`Total de Ventas: ${resumen.total_ventas}`, { x: margin, y, size: 10, font })
        y -= 14
        page.drawText(`Monto Total: ${formatCurrency(parseFloat(resumen.monto_total))}`, { x: margin, y, size: 10, font })
        y -= 14
        page.drawText(`Promedio de Venta: ${formatCurrency(parseFloat(resumen.promedio_venta))}`, { x: margin, y, size: 10, font })
        y -= 14
        page.drawText(`Clientes Atendidos: ${resumen.clientes_atendidos}`, { x: margin, y, size: 10, font })
        y -= 40

        // === PIE DE PÁGINA ===
        page.drawText(businessConfig.invoiceFooter, {
            x: margin,
            y,
            size: 8,
            font,
            color: rgb(0.3, 0.3, 0.3)
        })
        y -= 12
        page.drawText(businessConfig.invoiceWebsiteText, {
            x: margin,
            y,
            size: 8,
            font,
            color: rgb(0.4, 0.4, 0.4)
        })
        y -= 12
        page.drawText(businessConfig.invoiceAuthText, {
            x: margin,
            y,
            size: 7,
            font,
            color: rgb(0.4, 0.4, 0.4)
        })

        // === EXPORTAR ===
        const pdfBytes = await pdfDoc.save()
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        window.open(url)

        return resumen
    }


    async function generateTicketWithDiscounts(
        pdfDoc: PDFDocument,
        sale: SaleData,
        font: PDFFont,
        fontBold: PDFFont
    ): Promise<void> {
        const { maxWidth } = PAPER_CONFIGS.ticket
        const margin = 13

        // Calcular altura necesaria
        let estimatedHeight = 400 + (sale.items.length * 60)
        const page = pdfDoc.addPage([PAPER_CONFIGS.ticket.width, estimatedHeight])

        let yPosition = estimatedHeight - 30

        // === ENCABEZADO ===
        yPosition = drawCenteredText(
            page,
            businessConfig.name,
            yPosition,
            fontBold,
            10,
            maxWidth
        )
        yPosition -= 15

        yPosition = drawCenteredText(
            page,
            `RUC: ${businessConfig.ruc}`,
            yPosition,
            font,
            8,
            maxWidth
        )
        yPosition -= 12

        if (businessConfig.address) {
            const dirLines = wrapText(businessConfig.address, maxWidth, font, 7)
            for (const line of dirLines) {
                yPosition = drawCenteredText(page, line, yPosition, font, 7, maxWidth)
                yPosition -= 10
            }
        }

        if (businessConfig.phone) {
            yPosition = drawCenteredText(
                page,
                `Tel: ${businessConfig.phone}`,
                yPosition,
                font,
                7,
                maxWidth
            )
            yPosition -= 15
        }

        drawLine(page, yPosition, maxWidth)
        yPosition -= 15

        // === DATOS DEL COMPROBANTE ===
        yPosition = drawCenteredText(
            page,
            'TICKET DE VENTA',
            yPosition,
            fontBold,
            9,
            maxWidth
        )
        yPosition -= 12

        const numeroComprobante = sale.numero_comprobante ||
            generateInvoiceNumber('ticket', sale.id_venta)

        yPosition = drawCenteredText(
            page,
            `N° ${numeroComprobante}`,
            yPosition,
            font,
            8,
            maxWidth
        )
        yPosition -= 12

        const fecha = new Date(sale.fecha_venta).toLocaleString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        yPosition = drawCenteredText(page, fecha, yPosition, font, 7, maxWidth)
        yPosition -= 15

        drawLine(page, yPosition, maxWidth)
        yPosition -= 15

        // === CLIENTE (opcional) ===
        if (sale.cliente_nombre) {
            page.drawText('Cliente:', { x: margin, y: yPosition, size: 7, font: fontBold })
            yPosition -= 10

            const clienteLines = wrapText(sale.cliente_nombre, maxWidth - 20, font, 7)
            for (const line of clienteLines) {
                page.drawText(line, { x: margin, y: yPosition, size: 7, font })
                yPosition -= 10
            }

            if (sale.cliente_documento) {
                page.drawText(`Doc: ${sale.cliente_documento}`, {
                    x: margin,
                    y: yPosition,
                    size: 7,
                    font
                })
                yPosition -= 15
            } else {
                yPosition -= 5
            }

            drawLine(page, yPosition, maxWidth)
            yPosition -= 12
        }

        // === PRODUCTOS ===
        page.drawText('DESCRIPCIÓN', { x: margin, y: yPosition, size: 7, font: fontBold })
        page.drawText('CANT', { x: maxWidth - 80, y: yPosition, size: 7, font: fontBold })
        page.drawText('P.U.', { x: maxWidth - 50, y: yPosition, size: 7, font: fontBold })
        page.drawText('TOTAL', { x: maxWidth - 15, y: yPosition, size: 7, font: fontBold })
        yPosition -= 10

        drawLine(page, yPosition, maxWidth)
        yPosition -= 10


        // === PRODUCTOS CON DESCUENTOS ===
        for (const item of sale.items) {
            const nombreProducto = item.nombre || 'Producto'
            const itemLines = wrapText(nombreProducto, maxWidth - 100, font, 7)

            // Mostrar nombre del producto
            for (let i = 0; i < itemLines.length; i++) {
                page.drawText(itemLines[i], { x: margin, y: yPosition, size: 7, font })

                if (i === 0) {
                    const cantidad = Number(item.cantidad) || 0
                    const precioUnit = Number(item.precio_unitario) || 0
                    const subtotal = Number(item.subtotal) || 0

                    page.drawText(cantidad.toString(), {
                        x: maxWidth - 75,
                        y: yPosition,
                        size: 7,
                        font
                    })

                    // Mostrar precio con indicador si tiene descuento
                    const tieneDescuento = item.es_oferta || item.es_mayorista
                    page.drawText(precioUnit.toFixed(2), {
                        x: maxWidth - 50,
                        y: yPosition,
                        size: 7,
                        font,
                        color: tieneDescuento ? rgb(0, 0.5, 0) : rgb(0, 0, 0)
                    })

                    page.drawText(subtotal.toFixed(2), {
                        x: maxWidth - 15,
                        y: yPosition,
                        size: 7,
                        font
                    })
                }
                yPosition -= 10
            }

            // Mostrar información de descuentos si aplica
            if (item.es_oferta || item.es_mayorista) {
                // Tipo de descuento
                let tipoDescuento = ''
                if (item.es_oferta && item.es_mayorista) {
                    tipoDescuento = 'Oferta + Mayorista'
                } else if (item.es_oferta) {
                    tipoDescuento = 'Oferta Especial'
                } else if (item.es_mayorista) {
                    tipoDescuento = `Precio Mayorista (${item.cantidad} unid.)`
                }

                page.drawText(`  ${tipoDescuento}`, {
                    x: margin + 5,
                    y: yPosition,
                    size: 6,
                    font,
                    color: rgb(0, 0.5, 0)
                })
                yPosition -= 8

                // Mostrar precios originales y ahorro
                if (item.precio_original && item.precio_original > item.precio_unitario) {
                    const ahorro = (item.precio_original - item.precio_unitario) * item.cantidad
                    const porcentaje = ((item.precio_original - item.precio_unitario) / item.precio_original * 100).toFixed(0)

                    page.drawText(`  Antes: S/.${item.precio_original.toFixed(2)} (-${porcentaje}%)`, {
                        x: margin + 5,
                        y: yPosition,
                        size: 6,
                        font,
                        color: rgb(0.5, 0.5, 0.5)
                    })

                    page.drawText(`Ahorra: S/.${ahorro.toFixed(2)}`, {
                        x: maxWidth - 60,
                        y: yPosition,
                        size: 6,
                        font,
                        color: rgb(0.8, 0, 0)
                    })
                    yPosition -= 8
                }
            }

            yPosition -= 3
        }

        // ... código de totales ...

        // === RESUMEN DE AHORROS ===
        if (sale.total_descuentos && sale.total_descuentos > 0) {
            yPosition -= 10
            drawLine(page, yPosition, maxWidth)
            yPosition -= 12

            page.drawText('🎉 AHORRO TOTAL:', {
                x: margin,
                y: yPosition,
                size: 8,
                font: fontBold
            })

            page.drawText(`S/.${sale.total_descuentos.toFixed(2)}`, {
                x: maxWidth - 15,
                y: yPosition,
                size: 8,
                font: fontBold,
                color: rgb(0, 0.5, 0)
            })
            yPosition -= 15
        }

        yPosition -= 5
        drawLine(page, yPosition, maxWidth)
        yPosition -= 15

        // === TOTALES CON DESCUENTOS ===
        // Agregar resumen de descuentos si existen
        if (sale.total_descuentos && sale.total_descuentos > 0) {
            yPosition -= 10
            drawLine(page, yPosition, maxWidth)
            yPosition -= 12

            page.drawText('RESUMEN DE DESCUENTOS', {
                x: margin,
                y: yPosition,
                size: 7,
                font: fontBold
            })
            yPosition -= 10

            // Calcular descuentos por tipo
            let totalOferta = 0
            let totalMayorista = 0

            sale.items.forEach(item => {
                if (item.descuento_oferta) {
                    totalOferta += item.descuento_oferta * item.cantidad
                }
                if (item.descuento_mayorista) {
                    totalMayorista += item.descuento_mayorista * item.cantidad
                }
            })

            if (totalOferta > 0) {
                page.drawText('Desc. Ofertas:', { x: margin, y: yPosition, size: 6, font })
                page.drawText(`-${formatCurrency(totalOferta)}`, {
                    x: maxWidth - 15,
                    y: yPosition,
                    size: 6,
                    font,
                    color: rgb(0.8, 0, 0)
                })
                yPosition -= 8
            }

            if (totalMayorista > 0) {
                page.drawText('Desc. Mayorista:', { x: margin, y: yPosition, size: 6, font })
                page.drawText(`-${formatCurrency(totalMayorista)}`, {
                    x: maxWidth - 15,
                    y: yPosition,
                    size: 6,
                    font,
                    color: rgb(0.8, 0, 0)
                })
                yPosition -= 8
            }

            yPosition -= 5
            page.drawText('TOTAL AHORRADO:', {
                x: margin,
                y: yPosition,
                size: 7,
                font: fontBold
            })
            page.drawText(formatCurrency(sale.total_descuentos), {
                x: maxWidth - 15,
                y: yPosition,
                size: 7,
                font: fontBold,
                color: rgb(0, 0.5, 0)
            })
            yPosition -= 12
        }

        const totalValue = Number(sale.total) || 0
        page.drawText('TOTAL:', { x: maxWidth - 90, y: yPosition, size: 10, font: fontBold })
        page.drawText(formatCurrency(totalValue), {
            x: maxWidth - 15,
            y: yPosition,
            size: 10,
            font: fontBold
        })
        yPosition -= 15

        // === MÉTODO DE PAGO ===
        drawLine(page, yPosition, maxWidth)
        yPosition -= 12

        page.drawText('MÉTODO DE PAGO:', { x: margin, y: yPosition, size: 7, font: fontBold })
        page.drawText(sale.metodo_pago.toUpperCase(), {
            x: maxWidth - 40,
            y: yPosition,
            size: 7,
            font
        })
        yPosition -= 20

        // === PIE DE PÁGINA ===
        yPosition = drawCenteredText(
            page,
            businessConfig.invoiceFooter,
            yPosition,
            fontBold,
            8,
            maxWidth
        )

        // Agregar website si está configurado
        if (businessConfig.website) {
            yPosition -= 12
            yPosition = drawCenteredText(
                page,
                businessConfig.website,
                yPosition,
                font,
                7,
                maxWidth,
                rgb(0.4, 0.4, 0.4)
            )
        }
    }


    // Agregar esta función junto a las existentes
    // const generateCustomPdfTicket = useCallback(async (
    //     saleData: any,
    //     type: ComprobanteType = 'ticket'
    // ) => {
    //     try {
    //         const pdfDoc = await PDFDocument.create()
    //         const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    //         const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    //         // Usar items con descuentos si existen
    //         const saleWithDiscounts = {
    //             ...saleData,
    //             items: saleData.items_con_descuentos || saleData.items || []
    //         }

    //         switch (type) {
    //             case 'ticket':
    //                 await generateTicketWithDiscounts(pdfDoc, saleWithDiscounts, font, fontBold)
    //                 break
    //             case 'boleta':
    //                 await generateBoletaWithDiscounts(pdfDoc, saleWithDiscounts, font, fontBold)
    //                 break
    //             case 'factura':
    //                 await generateFacturaWithDiscounts(pdfDoc, saleWithDiscounts, font, fontBold)
    //                 break
    //         }

    //         const pdfBytes = await pdfDoc.save()
    //         const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })

    //         const fileName = type === 'factura'
    //             ? `Factura_${saleData.numero_comprobante || saleData.id_venta}.pdf`
    //             : type === 'boleta'
    //                 ? `Boleta_${saleData.numero_comprobante || saleData.id_venta}.pdf`
    //                 : `Ticket_${saleData.id_venta}.pdf`

    //         saveAs(blob, fileName)
    //         return saleData
    //     } catch (error) {
    //         console.error('Error generando PDF:', error)
    //         throw error
    //     }
    // }, [])


    return {
        generatePdfTicket,
        generateCustomPdfTicket,
        generateMonthlyReport,
        businessConfig // Exportar la configuración por si se necesita en otros lugares
    }
}