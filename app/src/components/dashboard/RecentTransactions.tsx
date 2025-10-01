// components/dashboard/RecentTransactions.tsx

import { DollarSign, Receipt } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

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
            className={cn(
                "bg-background rounded-xl border p-6 shadow-sm transition-all duration-700",
                animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{ transitionDelay: "600ms" }}
        >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center">
                    <Receipt className="w-6 h-6 text-primary mr-2" />
                    <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
                </div>
                <Button variant="link" size="sm" className="px-0 h-auto text-sm font-medium">View All</Button>
            </div>
            <div className="space-y-2">
                {data.map((tx) => (
                    <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors duration-200"
                    >
                        <div className="flex items-center">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center mr-4",
                                tx.status === "completed"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-yellow-100 text-yellow-600"
                            )}>
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">{tx.customer}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <span className="mr-3">{tx.id}</span>
                                    <span>{tx.time}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-green-600 text-base">${tx.amount}</p>
                            <span
                                className={cn(
                                    "text-xs px-2 py-1 rounded-full",
                                    tx.status === "completed"
                                        ? "bg-green-100 text-green-600"
                                        : "bg-yellow-100 text-yellow-600"
                                )}
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
