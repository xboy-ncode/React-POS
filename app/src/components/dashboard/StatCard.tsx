// components/dashboard/StatCard.tsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

type StatCardProps = {
    icon: React.ElementType;
    title: string;
    value: string | number;
    change: number;
    color: string;
    subtitle?: string;
    delay?: number;
    animated?: boolean;
};

export default function StatCard({
    icon: Icon,
    title,
    value,
    change,
    color,
    subtitle,
    delay = 0,
    animated = true,
}: StatCardProps) {
    return (
        <div
            className={`transform transition-all duration-1000 hover:scale-105 hover:shadow-xl ${animated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden">
                <div
                    className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-full -translate-y-16 translate-x-16 opacity-50`}
                ></div>

                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-gray-600 text-sm font-medium mb-2">{title}</p>
                        {subtitle && <p className="text-xs text-gray-400 mb-3">{subtitle}</p>}
                        <p className={`text-3xl font-bold text-${color}-600 mb-2`}>{value}</p>
                        <div className="flex items-center">
                            {change >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                            )}
                            <span
                                className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}
                            >
                                {change >= 0 ? '+' : ''}
                                {change}% vs yesterday
                            </span>
                        </div>
                    </div>
                    <div className={`p-3 rounded-xl bg-${color}-100`}>
                        <Icon className={`w-8 h-8 text-${color}-600`} />
                    </div>
                </div>
            </div>
        </div>
    );
}
