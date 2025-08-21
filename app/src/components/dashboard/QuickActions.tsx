// components/dashboard/QuickActions.tsx
import React from 'react';
import { Button } from '@mui/material';
import { Plus, Package, UserPlus } from 'lucide-react';

type QuickActionsProps = {
    animated?: boolean;
};

export default function QuickActions({ animated = true }: QuickActionsProps) {
    const actions = [
        { label: 'Add Sale', icon: Plus, color: 'blue' },
        { label: 'Add Product', icon: Package, color: 'green' },
        { label: 'Add Customer', icon: UserPlus, color: 'purple' },
    ];

    return (
        <div
            className={`bg-white rounded-2xl p-6 shadow-lg mt-8 transition-all duration-1000 ${animated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
            style={{ transitionDelay: '1800ms' }}
        >
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
                {actions.map((action, idx) => {
                    const Icon = action.icon;
                    return (
                        <Button
                            key={idx}
                            className={`flex items-center space-x-2 rounded-xl px-4 py-2 shadow-sm hover:shadow-md transition-all bg-${action.color}-600 hover:bg-${action.color}-700 text-white`}
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
