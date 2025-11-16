import { type ReactNode } from 'react';
import { Badge as ShadcnBadge, badgeVariants } from './ui/badge';
import { cn } from '@/lib/utils';
import { type VariantProps } from 'class-variance-authority';

const customBadgeVariants = {
    manager: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    participant: 'bg-blue-100 text-blue-800 border-blue-200',
    spectator: 'bg-gray-100 text-gray-800 border-gray-200',
    voted: 'bg-green-100 text-green-700 border-green-200',
} as const;

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
    children: ReactNode;
    className?: string;
    variant?: 'manager' | 'participant' | 'spectator' | 'voted' | 'default' | 'secondary' | 'destructive' | 'outline';
}

export default function Badge({ variant = 'participant', children, className }: BadgeProps) {
    const isCustomVariant = variant === 'manager' || variant === 'participant' || variant === 'spectator' || variant === 'voted';
    
    if (isCustomVariant) {
        return (
            <span className={cn(badgeVariants({ variant: 'outline' }), customBadgeVariants[variant], className)}>
                {children}
            </span>
        );
    }
    
    return (
        <ShadcnBadge variant={variant} className={className}>
            {children}
        </ShadcnBadge>
    );
}

