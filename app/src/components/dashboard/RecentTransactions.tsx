// components/dashboard/RecentTransactions.tsx
import React from 'react';
import { DollarSign, Receipt } from 'lucide-react';

type Transaction = {
    id: string;
    customer: string;
    amount: number;
    time: string;
    status: 'completed' | 'pending';
};

type Props = {
    data?: Transaction[];
    animated?: boolean;
};

export default function RecentTransactions({
    data = [
        { id: '#TXN001', customer: 'John Doe', amount: 45.67, time: '2 min ago', status: 'completed' },
        { id: '#TXN002', customer: 'Sarah Smith', amount: 23.45, time: '5 min ago', status: 'completed' },
        { id: '#TXN003', customer: 'Mike Johnson', amount: 78.9, time: '8 min ago', status: 'pending' },
        { id: '#TXN004', customer: 'Anna Davis', amount: 156.32, time: '12 min ago', status: 'completed' },
    ],
    animated = true,
}: Props) {
    return (
        <div
            className={`bg-white rounded-2xl p-6 shadow-lg transition-all duration-1000 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
            style={{ transitionDelay: '1400ms' }}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Receipt className="w-6 h-6 text-purple-600 mr-2" />
                    <h3 className="text-xl font-semibold text-gray-800">Recent Transactions</h3>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All</button>
            </div>
            <div className="space-y-3">
                {data.map((tx) => (
                    <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                    >
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-4">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">{tx.customer}</p>
                                <div className="flex items-center text-sm text-gray-600">
                                    <span className="mr-3">{tx.id}</span>
                                    <span>{tx.time}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-green-600 text-lg">${tx.amount}</p>
                            <span
                                className={`text-xs px-2 py-1 rounded-full ${tx.status === 'completed'
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-yellow-100 text-yellow-600'
                                    }`}
                            >
                                {tx.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
