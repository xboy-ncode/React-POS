// components/dashboard/SalesTrendChart.tsx
import React from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

type SalesTrendChartProps = {
    data: { time: string; sales: number }[];
    animated?: boolean;
};

export default function SalesTrendChart({ data, animated = true }: SalesTrendChartProps) {
    return (
        <div
            className={`bg-white rounded-2xl p-6 shadow-lg transition-all duration-1000 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
            style={{ transitionDelay: '800ms' }}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="text-xl font-semibold text-gray-800">Sales Trend Today</h3>
                </div>
            </div>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip />
                        <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fill="url(#salesGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
