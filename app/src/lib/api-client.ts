// lib/api-client.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
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

// ============================================
// SERVICES
// ============================================

// Auth Service
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

// Productos Service (ruta correcta: /products)
export const productosService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoria?: string;
    marca?: string;
    activo?: string;
  }) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
};

// Ventas Service (ruta correcta: /sales)
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

// Compras Service (ruta correcta: /purchases)
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

// Clientes Service (ruta correcta: /customers)
export const clientesService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
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

// Dashboard Service
export const dashboardService = {
  getStats: async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const [ventas, productos, clientes] = await Promise.all([
        ventasService.getResumen({ fecha_desde: today, fecha_hasta: today }).catch(() => ({ monto_total: 0 })),
        productosService.getAll({ limit: 1000 }).catch(() => ({ pagination: { total: 0 } })),
        clientesService.getAll({ limit: 1 }).catch(() => ({ pagination: { total: 0 } }))
      ]);

      return {
        ventasHoy: parseFloat(ventas.monto_total || '0'),
        totalProductos: productos.pagination?.total || 0,
        totalClientes: clientes.pagination?.total || 0,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        ventasHoy: 0,
        totalProductos: 0,
        totalClientes: 0,
      };
    }
  },

  getInventoryStatus: async () => {
    try {
      const response = await productosService.getAll({ limit: 1000 });
      const productos = response.productos || [];

      const inStock = productos.filter((p: any) => p.stock > 10).length;
      const lowStock = productos.filter((p: any) => p.stock > 0 && p.stock <= 10).length;
      const outOfStock = productos.filter((p: any) => p.stock === 0).length;

      return [
        { name: 'In Stock', value: inStock, color: '#22c55e' },
        { name: 'Low Stock', value: lowStock, color: '#f59e0b' },
        { name: 'Out of Stock', value: outOfStock, color: '#ef4444' },
      ];
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [
        { name: 'In Stock', value: 0, color: '#22c55e' },
        { name: 'Low Stock', value: 0, color: '#f59e0b' },
        { name: 'Out of Stock', value: 0, color: '#ef4444' },
      ];
    }
  },

  getTopProducts: async () => {
    try {
      const response = await ventasService.getAll({ limit: 100 });
      const ventas = response.ventas || [];

      if (ventas.length === 0) {
        return [];
      }

      const productSales: Record<string, { name: string; sold: number; revenue: number }> = {};

      for (const venta of ventas.slice(0, 20)) {
        try {
          const detalles = await ventasService.getById(venta.id_venta);
          detalles.detalles?.forEach((detalle: any) => {
            const id = detalle.id_producto;
            if (!productSales[id]) {
              productSales[id] = {
                name: detalle.producto_nombre,
                sold: 0,
                revenue: 0,
              };
            }
            productSales[id].sold += detalle.cantidad;
            productSales[id].revenue += parseFloat(detalle.subtotal);
          });
        } catch (error) {
          console.error('Error loading sale details:', error);
        }
      }

      return Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4)
        .map((p) => ({
          name: p.name,
          sold: p.sold,
          revenue: `$${p.revenue.toFixed(2)}`,
          trend: Math.floor(Math.random() * 30) - 10,
        }));
    } catch (error) {
      console.error('Error getting top products:', error);
      return [];
    }
  },

  getRecentTransactions: async () => {
    try {
      const response = await ventasService.getAll({ limit: 4 });
      const ventas = response.ventas || [];

      return ventas.map((venta: any) => ({
        id: `#TXN${String(venta.id_venta).padStart(3, '0')}`,
        customer: venta.cliente_nombre || 'Cliente General',
        amount: parseFloat(venta.total),
        time: getRelativeTime(venta.fecha),
        status: 'completed' as const,
      }));
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  },

  getSalesTrend: async () => {
    try {
      const today = new Date();
      const data = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        try {
          const ventas = await ventasService.getResumen({
            fecha_desde: dateStr,
            fecha_hasta: dateStr,
          });

          data.push({
            time: date.toLocaleDateString('en-US', { weekday: 'short' }),
            sales: parseFloat(ventas.monto_total || '0'),
          });
        } catch (error) {
          data.push({
            time: date.toLocaleDateString('en-US', { weekday: 'short' }),
            sales: 0,
          });
        }
      }

      return data;
    } catch (error) {
      console.error('Error getting sales trend:', error);
      return [];
    }
  },

  getWeeklyPerformance: async () => {
    try {
      const today = new Date();
      const data = [];
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];

        try {
          const ventas = await ventasService.getResumen({
            fecha_desde: dateStr,
            fecha_hasta: dateStr,
          });

          data.push({
            day: days[i],
            sales: parseFloat(ventas.monto_total || '0'),
          });
        } catch (error) {
          data.push({
            day: days[i],
            sales: 0,
          });
        }
      }

      return data;
    } catch (error) {
      console.error('Error getting weekly performance:', error);
      return [];
    }
  },
};

// Helper function
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