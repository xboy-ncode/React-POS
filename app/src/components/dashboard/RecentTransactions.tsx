// components/dashboard/RecentTransactions.tsx
import { DollarSign, Receipt, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { SaleDetailsDialog } from "@/components/sales/SaleDetailsDialog"
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type Transaction = {
    id: number;
    customer: string;
    amount: number;
    time: string;
    status: "completed" | "pending";
};

type Props = {
    data?: Transaction[];
    animated?: boolean;
};

export default function RecentTransactions({


    data = [
        { id: 1, customer: "John Doe", amount: 45.67, time: "2 min ago", status: "completed" },
        { id: 2, customer: "Sarah Smith", amount: 23.45, time: "5 min ago", status: "completed" },
        { id: 3, customer: "Mike Johnson", amount: 78.9, time: "8 min ago", status: "pending" },
        { id: 4, customer: "Anna Davis", amount: 156.32, time: "12 min ago", status: "completed" },
        { id: 5, customer: "Luis Fernández", amount: 92.15, time: "15 min ago", status: "completed" },
        { id: 6, customer: "María López", amount: 51.2, time: "20 min ago", status: "pending" },
    ],
    animated = true,
}: Props) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [scrollIndex, setScrollIndex] = useState(0);

    const visibleData = data.slice(scrollIndex, scrollIndex + 5);

    const canScrollUp = scrollIndex > 0;
    const canScrollDown = scrollIndex + 5 < data.length;

    const scrollUp = () => setScrollIndex((i) => Math.max(0, i - 1));
    const scrollDown = () => setScrollIndex((i) => Math.min(data.length - 5, i + 1));
    const [openDialog, setOpenDialog] = useState(false)
    const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)

    const handleOpenDetails = (id: number) => {
        setSelectedSaleId(id)
        setOpenDialog(true)
    }

    return (
        <>
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
                    <h3 className="text-lg font-semibold text-foreground">
                        {t("dashboard.recent_transactions")}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {/* Scroll indicators */}
                    {data.length > 5 && (
                        <div className="flex items-center gap-1 mr-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7"
                                disabled={!canScrollUp}
                                onClick={scrollUp}
                                aria-label="Scroll up"
                            >
                                <ChevronUp className="w-4 h-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground px-1">
                                {scrollIndex + 1}-{Math.min(scrollIndex + 5, data.length)} / {data.length}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7"
                                disabled={!canScrollDown}
                                onClick={scrollDown}
                                aria-label="Scroll down"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                    <Button
                        variant="link"
                        size="sm"
                        className="px-0 h-auto text-sm font-medium"
                        onClick={() => navigate('/movements')}
                    >
                        {t("app.view_all")}
                    </Button>
                </div>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-hidden">
                {visibleData.map((tx, index) => (
                    <div
                        key={tx.id}
                        onClick={() => handleOpenDetails(tx.id)}
                        className={cn(
                            "flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-all duration-200",
                            animated && "animate-in fade-in slide-in-from-bottom-2"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex items-center">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center mr-4",
                                    tx.status === "completed"
                                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                                )}
                            >
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">{tx.customer}</p>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <span className="mr-3">{t('dashboard.transaction_number')} {tx.id}</span>
                                    <span>{tx.time}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-green-600 dark:text-green-400 text-base">
                                {/* Change your currency as you wish */}
                                S/{tx.amount.toFixed(2)}
                            </p>
                            {/* Transaction Status (Is not necessary if you dont manage status on your transaction's database) */}
                            {/* <span
                                className={cn(
                                    "inline-block mt-1 text-xs px-2 py-1 rounded-full",
                                    tx.status === "completed"
                                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                                )}
                            >
                                {t(`dashboard.${tx.status}`)}
                            </span> */}
                        </div>
                    </div>
                ))}
            </div>

            {/* Alternative: Floating scroll buttons (uncomment if preferred) */}
            {/* {data.length > 5 && (
                <div className="absolute bottom-6 right-6 flex flex-col gap-1 bg-background/95 backdrop-blur-sm rounded-lg p-1 border shadow-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        disabled={!canScrollUp}
                        onClick={scrollUp}
                    >
                        <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        disabled={!canScrollDown}
                        onClick={scrollDown}
                    >
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                </div>
            )} */}
        </div>

<SaleDetailsDialog
  saleId={selectedSaleId}
  open={openDialog}
  onOpenChange={setOpenDialog}
/>


</>

    );
    
}