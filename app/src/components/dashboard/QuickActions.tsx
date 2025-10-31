// components/dashboard/QuickActions.tsx
import React from "react";
import { Button } from "../ui/button";
import { Plus, Package, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { DailyReportDialog } from "../movements/DailyReportDialog";
import { MonthlyReportDialog } from "../movements/MonthlyReportDialog";

type QuickActionsProps = {
    animated?: boolean;
};

type ActionVariant = "default" | "secondary" | "outline" | "link" | "destructive" | "ghost";

export default function QuickActions({ animated = true }: QuickActionsProps) {
    const actions: { label: string; icon: React.ElementType; variant: ActionVariant }[] = [

    ];

const { t } = useTranslation();

    return (
        <div
            className={cn(
                "bg-background rounded-xl border p-6 shadow-sm mt-8 transition-all duration-700",
                animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{ transitionDelay: "800ms" }}
        >
            <h3 className="text-lg font-semibold text-foreground mb-5">{t('app.quick_actions')}</h3>
            <div className="flex flex-wrap gap-4">
                            <div className="flex gap-3">
                                <DailyReportDialog />
                                <MonthlyReportDialog />
                            </div>
                {actions.map((action, idx) => {
                    const Icon = action.icon;
                    return (
                        <Button
                            key={idx}
                            variant={action.variant}
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <Icon className="w-4 h-4" />
                            <span>{action.label}</span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
