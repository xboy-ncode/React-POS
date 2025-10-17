// lib/sales-adapter.ts
import { apiClient } from './api-client'

export interface SaleDetail {
    id_detalle: number
    id_venta: number
    id_producto: number
    cantidad: number
    precio_unitario: string
    subtotal: string
    producto_nombre: string
}

export interface Sale {
    id_venta: number
    id_cliente: number | null
    id_usuario: number
    fecha: string
    total: string
    moneda: string
    metodo_pago: string
    cliente_nombre?: string
    cliente_dni?: string
    vendedor: string
    dni?: string
    nombre?: string
    apellido_paterno?: string
    apellido_materno?: string
    direccion?: string | null
    telefono?: string | null
    correo?: string | null
    detalles?: SaleDetail[]
}

export interface SalesResponse {
    ventas: Sale[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
}

export interface SalesFilters {
    page?: number
    limit?: number
    fecha_desde?: string
    fecha_hasta?: string
    cliente?: string
}

// 🪙 Utilidad para formatear monedas
const normalizeCurrency = (code: string) => {
    switch (code?.toUpperCase()) {
        case 'PEN':
            return 'S/'
        case 'USD':
            return '$'
        case 'EUR':
            return '€'
        default:
            return code
    }
}

export const salesAdapter = {
    async getSales(filters: SalesFilters = {}): Promise<SalesResponse> {
        const params = new URLSearchParams()

        if (filters.page) params.append('page', filters.page.toString())
        if (filters.limit) params.append('limit', filters.limit.toString())
        if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
        if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)
        if (filters.cliente) params.append('cliente', filters.cliente)

        const response = await apiClient.get(`/sales?${params.toString()}`)
        const data = response.data as SalesResponse

        // 🔹 Normaliza la moneda de todas las ventas
        data.ventas = data.ventas.map(v => ({
            ...v,
            moneda: normalizeCurrency(v.moneda),
        }))

        return data
    },

    async getSaleById(id: number): Promise<Sale> {
        const response = await apiClient.get(`/sales/${id}`)
        const sale = response.data as Sale

        // 🔹 Normaliza la moneda individual
        return {
            ...sale,
            moneda: normalizeCurrency(sale.moneda),
        }
    },

    async getSalesReport(filters: { fecha_desde?: string; fecha_hasta?: string }) {
        const params = new URLSearchParams()
        if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde)
        if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta)

        const response = await apiClient.get(`/sales/reportes/resumen?${params.toString()}`)
        const data = response.data

        // 🔹 Si el reporte también incluye moneda
        if (data?.moneda) {
            data.moneda = normalizeCurrency(data.moneda)
        }

        return data
    },
}
