// components/dashboard/WeeklyPerformance.tsx
import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';

type Props = {
    data?: { day: string; sales: number }[];
    animated?: boolean;
};

export default function WeeklyPerformance({
    data = [
        { day: 'Mon', sales: 2100 },
        { day: 'Tue', sales: 2340 },
        { day: 'Wed', sales: 1890 },
        { day: 'Thu', sales: 2650 },
        { day: 'Fri', sales: 3200 },
        { day: 'Sat', sales: 3800 },
        { day: 'Sun', sales: 2900 },
    ],
    animated = true,
}: Props) {
    return (
        <div
            className={`mt-8 bg-white rounded-2xl p-6 shadow-lg transition-all duration-1000 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
            style={{ transitionDelay: '1600ms' }}
        >
            <div className="flex items-center mb-6">
                <BarChartIcon className="w-6 h-6 text-indigo-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-800">Weekly Performance</h3>
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
