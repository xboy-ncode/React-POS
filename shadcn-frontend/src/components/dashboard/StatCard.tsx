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
    // Fallback color classes for shadcn (primary, secondary, etc.)
    const colorMap: Record<string, string> = {
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        purple: "bg-purple-100 text-purple-600",
        red: "bg-red-100 text-red-600",
        yellow: "bg-yellow-100 text-yellow-600",
        orange: "bg-orange-100 text-orange-600",
        gray: "bg-muted text-foreground",
    };
    const cardBg = colorMap[color] ? colorMap[color].split(" ")[0] : "bg-muted";
    const cardText = colorMap[color] ? colorMap[color].split(" ")[1] : "text-foreground";

    return (
        <div
            className={cn(
                "transform transition-all duration-700 hover:scale-105 hover:shadow-lg",
                animated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="bg-background rounded-xl border p-6 shadow-sm relative overflow-hidden">
                <div
                    className={cn(
                        "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br rounded-full -translate-y-16 translate-x-16 opacity-40",
                        cardBg
                    )}
                ></div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-muted-foreground text-sm font-medium mb-2">{title}</p>
                        {subtitle && <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>}
                        <p className={cn("text-3xl font-bold mb-2", cardText)}>{value}</p>
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
                    <div className={cn("p-3 rounded-xl", cardBg)}>
                        <Icon className={cn("w-8 h-8", cardText)} />
                    </div>
                </div>
            </div>
        </div>
    );
}
