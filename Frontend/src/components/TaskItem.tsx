import type { Task } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskItemProps {
    task: Task;
    isCurrent: boolean;
    isEstimated: boolean;
    isCreator: boolean;
    onClick: () => void;
    onDelete: () => void;
}

export default function TaskItem({
    task,
    isCurrent,
    isEstimated,
    isCreator,
    onClick,
    onDelete,
}: TaskItemProps) {
    const isQuestionMark = task.finalEstimate === '?';
    
    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative p-4 rounded-lg border cursor-pointer transition-colors',
                isCurrent
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : isEstimated
                    ? isQuestionMark
                        ? 'border-destructive/30 bg-destructive/10'
                        : 'border-primary/30 bg-primary/10'
                    : 'border-border bg-card hover:bg-accent'
            )}
        >
            <div className="flex items-start justify-between gap-3">
                {isEstimated && (
                    <div className="flex-shrink-0">
                        <Badge
                            variant={isQuestionMark ? 'destructive' : 'default'}
                            className="font-semibold text-sm px-2.5 py-1"
                        >
                            {task.finalEstimate}
                        </Badge>
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">
                        {task.title}
                    </h3>
                </div>
                {isCreator && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>
            {isCurrent && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            )}
        </div>
    );
}

