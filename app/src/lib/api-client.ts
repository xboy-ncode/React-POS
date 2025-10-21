// lib/api-client.ts
import axios from 'axios';
import type { Sale, SalesReport } from '@/types/sales'


// ======================================================
// CONFIGURACIÓN BASE
// ======================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 🔐 Interceptor para agregar token JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🚫 Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ======================================================
// TIPOS DE PRODUCTO
// ======================================================

export interface ProductoParams {
  page?: number;
  limit?: number;
  search?: string;
  categoria?: string;
  marca?: string;
  activo?: string;
  codigo_barras?: string;
}

export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion?: string;
  codigo?: string;
  codigo_barras?: string;
  id_categoria?: number;
  categoria_nombre?: string;
  id_marca?: number;
  marca_nombre?: string;
  stock: number;
  precio_unitario: string | number;
  moneda: string;
  activo: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface ProductoCreate {
  nombre: string;
  descripcion?: string;
  codigo?: string;
  codigo_barras?: string;
  id_categoria?: number;
  id_marca?: number;
  stock?: number;
  precio_unitario: number;
  moneda?: string;
  activo?: boolean;
}

export interface ProductoUpdate {
  nombre?: string;
  descripcion?: string;
  codigo?: string;
  codigo_barras?: string;
  id_categoria?: number;
  id_marca?: number;
  stock?: number;
  precio_unitario?: number;
  moneda?: string;
  activo?: boolean;
}

export interface PaginatedResponse<T> {
  productos?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ======================================================
// TIPOS DE CATEGORÍA
// ======================================================

export interface CategoriaBackend {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface CategoriasResponse {
  categorias: CategoriaBackend[];
  total?: number;
}

export interface CategoriaParams {
  activo?: boolean;
  page?: number;
  limit?: number;
}

// ======================================================
// AUTH SERVICE
// ======================================================

export const authService = {
  login: async (nombre_usuario: string, clave: string) => {
    const response = await apiClient.post('/auth/login', { nombre_usuario, clave });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },
};

// ======================================================
// CATEGORÍAS SERVICE
// ======================================================

export const categoriasService = {
  getAll: async (params?: CategoriaParams): Promise<CategoriasResponse> => {
    const queryParams: Record<string, any> = {};
    
    if (params?.activo !== undefined) {
      queryParams.activo = params.activo;
    }
    if (params?.page !== undefined) {
      queryParams.page = params.page;
    }
    if (params?.limit !== undefined) {
      queryParams.limit = params.limit;
    }

    const response = await apiClient.get('/categories', { params: queryParams });
    return response.data;
  },

  getById: async (id: number): Promise<CategoriaBackend> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

getbyName: async (name: string): Promise<CategoriaBackend | null> => { 
  const response = await apiClient.get(`/categories/by-name`, { params: { nombre: name } });
  const categoria: CategoriaBackend = response.data.categoria;
  return categoria || null;
},

getIdbyName: async (name: string): Promise<number | null> => { 
  const categoria = await categoriasService.getbyName(name);
  return categoria ? categoria.id_categoria : null;
},


  create: async (data: Omit<CategoriaBackend, 'id_categoria'>): Promise<{ message: string; categoria: CategoriaBackend }> => {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Omit<CategoriaBackend, 'id_categoria'>>): Promise<{ message: string; categoria: CategoriaBackend }> => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },
};

// ======================================================
// PRODUCTOS SERVICE
// ======================================================

export const productosService = {
  getAll: async (params?: ProductoParams): Promise<PaginatedResponse<Producto>> => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Producto> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  searchByBarcode: async (barcode: string): Promise<Producto | null> => {
    try {
      const response = await apiClient.get('/products', {
        params: { codigo_barras: barcode, activo: 'true', limit: 1 },
      });
      const productos = response.data.productos;
      return productos?.length > 0 ? productos[0] : null;
    } catch (error) {
      console.error('Error searching by barcode:', error);
      return null;
    }
  },

  create: async (data: ProductoCreate): Promise<{ message: string; producto: Producto }> => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  update: async (id: number, data: ProductoUpdate): Promise<{ message: string; producto: Producto }> => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string; producto_eliminado: any }> => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
};

// ======================================================
// VENTAS SERVICE
// ======================================================

export const ventasService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    cliente?: string;
  }) => {
    const response = await apiClient.get('/sales', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/sales/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/sales', data);
    return response.data;
  },

  getResumen: async (params?: { fecha_desde?: string; fecha_hasta?: string }) => {
    const response = await apiClient.get('/sales/reportes/resumen', { params });
    return response.data;
  },



};

// ======================================================
// INVOICEs SERVICE
// ======================================================

export const invoiceService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    cliente?: string;
    serie?: string;
  }) => {
    const response = await apiClient.get('/invoices', { params }) 
    return response.data
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/invoices/${id}`) 
    return response.data
  },

  create: async (data: any) => {
    const response = await apiClient.post('/invoices/venta', data) 
    return response.data
  }
}

// ======================================================
// COMPRAS SERVICE
// ======================================================

export const comprasService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    proveedor?: string;
  }) => {
    const response = await apiClient.get('/purchases', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/purchases/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/purchases', data);
    return response.data;
  },

  getResumen: async (params?: { fecha_desde?: string; fecha_hasta?: string }) => {
    const response = await apiClient.get('/purchases/reportes/resumen', { params });
    return response.data;
  },
};

// ======================================================
// CLIENTES SERVICE
// ======================================================

export const clientesService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  getByDni: async (dni: string) => {
    const response = await apiClient.get(`/customers/dni/${dni}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },
};

// ======================================================
// DASHBOARD SERVICE
// ======================================================

export const dashboardService = {
  getStats: async () => {
    const today = new Date().toISOString().split('T')[0]
    try {
      const [ventas, productos, clientes] = await Promise.all([
        ventasService.getResumen({ fecha_desde: today, fecha_hasta: today }).catch(() => ({ monto_total: 0 })),
        productosService.getAll({ limit: 1000 }).catch(() => ({ pagination: { total: 0 } })),
        clientesService.getAll({ limit: 1 }).catch(() => ({ pagination: { total: 0 } })),
      ])

      return {
        ventasHoy: parseFloat(ventas.monto_total || '0'),
        totalProductos: productos.pagination?.total || 0,
        totalClientes: clientes.pagination?.total || 0,
      }
    } catch (error) {
      console.error('Error getting stats:', error)
      return { ventasHoy: 0, totalProductos: 0, totalClientes: 0 }
    }
  },

  getInventoryStatus: async () => {
    try {
      const response = await productosService.getAll({ limit: 1000 })
      const productos: any[] = response.productos || []

      const inStock = productos.filter((p) => Number(p.stock) > 10).length
      const lowStock = productos.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 10).length
      const outOfStock = productos.filter((p) => Number(p.stock) === 0).length

      return [
        { name: 'In Stock', value: inStock, color: '#22c55e' },
        { name: 'Low Stock', value: lowStock, color: '#f59e0b' },
        { name: 'Out of Stock', value: outOfStock, color: '#ef4444' },
      ]
    } catch {
      return [
        { name: 'In Stock', value: 0, color: '#22c55e' },
        { name: 'Low Stock', value: 0, color: '#f59e0b' },
        { name: 'Out of Stock', value: 0, color: '#ef4444' },
      ]
    }
  },

  getTopProducts: async () => {
    try {
      const response = await productosService.getAll({ limit: 1000 })
      const productos: any[] = response.productos || []

      const topProducts = productos
        .sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))
        .slice(0, 5)
        .map((p) => ({
          id: p.id_producto,
          name: p.nombre,
          sales: Number(p.stock || 0),
          revenue: Number(p.precio_unitario || 0) * Number(p.stock || 0),
        }))

      return topProducts
    } catch (error) {
      console.error('Error getting top products:', error)
      return []
    }
  },

  getRecentTransactions: async () => {
    try {
      const response = await ventasService.getAll({ limit: 10 })
      const ventas: Sale[] = response.ventas || []

      const transactions = ventas.map((v) => ({
        id: v.id_venta,
        date: v.fecha || new Date().toISOString().split('T')[0],
        customer: v.cliente_nombre || 'Cliente General',
        amount: parseFloat(v.total || '0'),
      }))

      return transactions
    } catch (error) {
      console.error('Error getting recent transactions:', error)
      return []
    }
  },

  getSalesTrend: async () => {
    try {
      const today = new Date()
      const data: { date: string; sales: number }[] = []

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const resumen: Partial<SalesReport> = await ventasService.getResumen({
          fecha_desde: dateStr,
          fecha_hasta: dateStr,
        }).catch(() => ({ monto_total: 0 }))

        data.push({
          date: dateStr,
          sales: parseFloat(resumen.monto_total || '0'),
        })
      }

      return data
    } catch (error) {
      console.error('Error getting sales trend:', error)
      const today = new Date()
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - (6 - i))
        return {
          date: date.toISOString().split('T')[0],
          sales: 0,
        }
      })
    }
  },

  getWeeklyPerformance: async () => {
    try {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const data: { day: string; value: number }[] = []

      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - dayOfWeek + i)
        const dateStr = date.toISOString().split('T')[0]

        const resumen: Partial<SalesReport> = await ventasService.getResumen({
          fecha_desde: dateStr,
          fecha_hasta: dateStr,
        }).catch(() => ({ monto_total: 0 }))

        const sales = parseFloat(resumen.monto_total || '0')
        const target = 2000
        const percentage = Math.min(100, Math.round((sales / target) * 100))

        data.push({
          day: days[i],
          value: percentage,
        })
      }

      return data
    } catch (error) {
      console.error('Error getting weekly performance:', error)
      return [
        { day: 'Sun', value: 0 },
        { day: 'Mon', value: 0 },
        { day: 'Tue', value: 0 },
        { day: 'Wed', value: 0 },
        { day: 'Thu', value: 0 },
        { day: 'Fri', value: 0 },
        { day: 'Sat', value: 0 },
      ]
    }
  },
}

// ======================================================
// HELPER
// ======================================================

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

// Alias para compatibilidad
export const api = apiClient;