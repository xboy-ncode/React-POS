import { invoiceService } from '@/lib/api-client'

interface Factura {
  numero: number
}

export async function getNextInvoiceNumber(serie: string): Promise<number> {
  try {
    // Aseguramos que 'serie' siempre sea string
    const response = await invoiceService.getAll({
      serie: String(serie),
      limit: 1,
    })

    const facturas: Factura[] = response.facturas || []

    if (facturas.length === 0) return 1

    // Encontrar el número mayor de las facturas existentes
    const maxNumero = Math.max(...facturas.map((f) => f.numero || 0))
    return maxNumero + 1
  } catch (error) {
    console.error('Error al obtener facturas:', error)
    throw new Error('No se pudo obtener el número de factura')
  }
}
