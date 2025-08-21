// components/dashboard/TopProducts.tsx
import React from 'react';
import { TrendingUp, TrendingDown, Store } from 'lucide-react';

type Product = {
    name: string;
    sold: number;
    revenue: string;
    trend: number;
};

type Props = {
    data?: Product[];
    animated?: boolean;
};

export default function TopProducts({
    data = [
        { name: 'Premium Coffee', sold: 156, revenue: '$780', trend: 12 },
        { name: 'Croissant', sold: 89, revenue: '$356', trend: -3 },
        { name: 'Sandwich Combo', sold: 67, revenue: '$670', trend: 8 },
        { name: 'Fresh Juice', sold: 45, revenue: '$225', trend: 15 },
    ],
    animated = true,
}: Props) {
    return (
        <div
            className={`bg-white rounded-2xl p-6 shadow-lg transition-all duration-1000 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
            style={{ transitionDelay: '1200ms' }}
        >
            <div className="flex items-center mb-6">
                <Store className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-800">Top Products Today</h3>
            </div>
            <div className="space-y-4">
                {data.map((product, index) => (
                    <div
                        key={product.name}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                    >
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4">
                                {index + 1}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">{product.name}</p>
                                <p className="text-sm text-gray-600">{product.sold} units sold</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-green-600 text-lg">{product.revenue}</p>
                            <div className="flex items-center justify-end">
                                {product.trend >= 0 ? (
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                                )}
                                <span
                                    className={`text-xs ${product.trend >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}
                                >
                                    {product.trend >= 0 ? '+' : ''}
                                    {product.trend}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
