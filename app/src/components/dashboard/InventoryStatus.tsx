// components/dashboard/InventoryStatus.tsx
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Package } from 'lucide-react';

type InventoryItem = {
    name: string;
    value: number;
    color: string;
};

type Props = {
    data?: InventoryItem[];
    animated?: boolean;
};

export default function InventoryStatus({
    data = [
        { name: 'In Stock', value: 1000, color: '#22c55e' },
        { name: 'Low Stock', value: 200, color: '#f59e0b' },
        { name: 'Out of Stock', value: 84, color: '#ef4444' },
    ],
    animated = true,
}: Props) {
    return (
        <div
            className={`bg-white rounded-2xl p-6 shadow-lg transition-all duration-1000 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
            style={{ transitionDelay: '1000ms' }}
        >
            <div className="flex items-center mb-6">
                <Package className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-800">Inventory Status</h3>
            </div>
            <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="space-y-3">
                {data.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                        <div className="flex items-center">
                            <div
                                className="w-3 h-3 rounded-full mr-3"
                                style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-sm text-gray-600">{item.name}</span>
                        </div>
                        <span className="font-semibold text-gray-800">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
