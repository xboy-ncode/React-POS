// types/sales.ts
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

export interface SalesReport {
  total_ventas: number
  monto_total: string
  promedio_venta: string
  clientes_atendidos: number
}