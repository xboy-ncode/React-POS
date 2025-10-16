// components/dashboard/TopProducts.tsx

import { TrendingUp, TrendingDown, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

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
    const {t} = useTranslation();
    return (
        <div
            className={cn(
                "bg-background rounded-xl border p-6 shadow-sm transition-all duration-700",
                animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{ transitionDelay: "500ms" }}
        >
            <div className="flex items-center mb-5">
                <Store className="w-6 h-6 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-foreground">{t('dashboard.top_products')}</h3>
            </div>
            <div className="space-y-3">
                {data.map((product, index) => (
                    <div
                        key={product.name}
                        className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-accent transition-colors duration-200"
                    >
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mr-4">
                                {index + 1}
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">{product.name}</p>
                                {/* <p className="text-sm text-muted-foreground">{product.sold} {t('dashboard.sold_units')}</p> */}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-green-600 text-base">S/{product.revenue}</p>
                            <div className="flex items-center justify-end">
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
