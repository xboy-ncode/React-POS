// components/dashboard/InventoryStatus.tsx

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Package } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useInventory } from "@/hooks/useInventory";

export default function InventoryStatus({ animated = true }: { animated?: boolean }) {
    const { t } = useTranslation();
    const { stats, loading } = useInventory();

    // Construimos los datos dinámicamente desde los stats
    const data = [
        {
            name: t('dashboard.in_stock', 'En stock'),
            value: stats.totalItems - stats.lowStockItems - stats.outOfStock,
            color: '#22c55e'
        },
        {
            name: t('dashboard.low_stock', 'Stock bajo'),
            value: stats.lowStockItems,
            color: '#f59e0b'
        },
        {
            name: t('dashboard.out_of_stock', 'Agotado'),
            value: stats.outOfStock,
            color: '#ef4444'
        },
    ];

    return (
        <div
            className={cn(
                "bg-background rounded-xl border p-6 shadow-sm transition-all duration-700",
                animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{ transitionDelay: "400ms" }}
        >
            <div className="flex items-center mb-5">
                <Package className="w-6 h-6 text-primary mr-2" />
                <h3 className="text-lg font-semibold text-foreground">
                    {t('dashboard.inventory_status', 'Estado del inventario')}
                </h3>
            </div>

            {loading ? (
                <div className="h-44 flex items-center justify-center text-muted-foreground">
                    {t('dashboard.loading', 'Cargando...')}
                </div>
            ) : (
                <>
                    <div className="h-44 mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={4}
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

                    <div className="space-y-2">
                        {data.map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <span
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: item.color }}
                                    ></span>
                                    <span className="text-sm text-muted-foreground">{item.name}</span>
                                </div>
                                <span className="font-semibold text-foreground">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className="mt-6 flex justify-end">
                <Button variant="outline" size="sm">
                    {t('dashboard.view_details', 'Ver detalles')}
                </Button>
            </div>
        </div>
    );
}
