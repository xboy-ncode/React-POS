// components/dashboard/StatCard.tsx
import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
    // Colores optimizados para dark/light mode
    const colorMap: Record<string, { bg: string; text: string; circle: string }> = {
        blue: { bg: "bg-blue-500/10", text: "text-blue-400", circle: "bg-blue-500/20" },
        green: { bg: "bg-green-500/10", text: "text-green-400", circle: "bg-green-500/20" },
        purple: { bg: "bg-purple-500/10", text: "text-purple-400", circle: "bg-purple-500/20" },
        red: { bg: "bg-red-500/10", text: "text-red-400", circle: "bg-red-500/20" },
        yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", circle: "bg-yellow-500/20" },
        orange: { bg: "bg-orange-500/10", text: "text-orange-400", circle: "bg-orange-500/20" },
        gray: { bg: "bg-muted", text: "text-foreground", circle: "bg-muted/40" },
    };

    const colorSet = colorMap[color] || colorMap.gray;

    return (
        <div
            className={cn(
                "transform transition-all duration-700 hover:scale-105 hover:shadow-lg",
                animated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="bg-card rounded-xl border p-6 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-muted-foreground text-sm font-medium mb-2">{title}</p>
                        {subtitle && <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>}
                        <p className={cn("text-3xl font-bold mb-2", colorSet.text)}>{value}</p>
                        <div className="flex items-center">
                            {change >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                            )}
                            <span
                                className={cn(
                                    "text-sm font-medium",
                                    change >= 0 ? "text-green-600" : "text-red-600"
                                )}
                            >
                                {change >= 0 ? "+" : ""}
                                {change}% vs yesterday
                            </span>
                        </div>
                    </div>
                    {/* Ícono con círculo detrás */}
                    <div className="relative flex items-center justify-center">
                        <div className={cn("absolute w-12 h-12 rounded-full", colorSet.circle)}></div>
                        <Icon className={cn("w-7 h-7", colorSet.text)} />
                    </div>
                </div>
            </div>
        </div>
    );
}
