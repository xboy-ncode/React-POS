// lib/api-client.ts
import axios from 'axios';

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
  codigo_barras?: string; // 👈 Nuevo parámetro
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

  // 🔍 Buscar producto por código de barras
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
    const today = new Date().toISOString().split('T')[0];
    try {
      const [ventas, productos, clientes] = await Promise.all([
        ventasService.getResumen({ fecha_desde: today, fecha_hasta: today }).catch(() => ({ monto_total: 0 })),
        productosService.getAll({ limit: 1000 }).catch(() => ({ pagination: { total: 0 } })),
        clientesService.getAll({ limit: 1 }).catch(() => ({ pagination: { total: 0 } })),
      ]);

      return {
        ventasHoy: parseFloat(ventas.monto_total || '0'),
        totalProductos: productos.pagination?.total || 0,
        totalClientes: clientes.pagination?.total || 0,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { ventasHoy: 0, totalProductos: 0, totalClientes: 0 };
    }
  },

  getInventoryStatus: async () => {
    try {
      const response = await productosService.getAll({ limit: 1000 });
      const productos = response.productos || [];

      const inStock = productos.filter((p) => p.stock > 10).length;
      const lowStock = productos.filter((p) => p.stock > 0 && p.stock <= 10).length;
      const outOfStock = productos.filter((p) => p.stock === 0).length;

      return [
        { name: 'In Stock', value: inStock, color: '#22c55e' },
        { name: 'Low Stock', value: lowStock, color: '#f59e0b' },
        { name: 'Out of Stock', value: outOfStock, color: '#ef4444' },
      ];
    } catch {
      return [
        { name: 'In Stock', value: 0, color: '#22c55e' },
        { name: 'Low Stock', value: 0, color: '#f59e0b' },
        { name: 'Out of Stock', value: 0, color: '#ef4444' },
      ];
    }
  },
};

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
