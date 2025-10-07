// hooks/useDashboardData.ts
import { useState, useEffect } from 'react';
import { dashboardService } from '@/lib/api-client';

export function useDashboardStats() {
    const [stats, setStats] = useState({
        ventasHoy: 0,
        totalProductos: 0,
        totalClientes: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await dashboardService.getStats();
                setStats(data);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Error al cargar estadísticas');
                console.error('Error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading, error };
}

export function useInventoryStatus() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const inventory = await dashboardService.getInventoryStatus();
                setData(inventory);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Error al cargar inventario');
                console.error('Error fetching inventory:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
}

export function useTopProducts() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const products = await dashboardService.getTopProducts();
                setData(products);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Error al cargar productos');
                console.error('Error fetching top products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
}

export function useRecentTransactions() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const transactions = await dashboardService.getRecentTransactions();
                setData(transactions);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Error al cargar transacciones');
                console.error('Error fetching transactions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
}

export function useSalesTrend() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const trend = await dashboardService.getSalesTrend();
                setData(trend);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Error al cargar tendencias');
                console.error('Error fetching sales trend:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
}

export function useWeeklyPerformance() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const performance = await dashboardService.getWeeklyPerformance();
                setData(performance);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Error al cargar performance');
                console.error('Error fetching weekly performance:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
}