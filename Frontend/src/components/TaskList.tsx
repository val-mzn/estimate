import type { Task } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '@/lib/utils';

interface TaskListProps {
    tasks: Task[];
    currentTaskId: string | null;
    isCreator: boolean;
    onSelectTask: (taskId: string) => void;
    onDeleteTask: (taskId: string) => void;
    onAddTask: () => void;
}

export default function TaskList({
    tasks,
    currentTaskId,
    isCreator,
    onSelectTask,
    onDeleteTask,
    onAddTask,
}: TaskListProps) {
    return (
        <Card>
            <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-foreground">Fiches à estimer</CardTitle>
                {isCreator && (
                    <Button onClick={onAddTask}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        Ajouter
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                            <Plus className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium">Aucune fiche</p>
                        <p className="text-sm text-muted-foreground mt-1">Ajoutez une fiche pour commencer</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Titre</TableHead>
                                <TableHead className="w-[100px]">Estimation</TableHead>
                                {isCreator && <TableHead className="w-[80px] text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.map((task) => {
                                const isEstimated = task.finalEstimate !== null;
                                const isCurrent = currentTaskId === task.id;
                                const isQuestionMark = task.finalEstimate === '?';
                                
                                return (
                                    <TableRow
                                        key={task.id}
                                        onClick={() => onSelectTask(task.id)}
                                        className={cn(
                                            'cursor-pointer',
                                            isCurrent && 'bg-primary/10 ring-2 ring-primary/20'
                                        )}
                                    >
                                       
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {task.title}
                                                {isCurrent && (
                                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isEstimated && (
                                                <Badge
                                                    variant={isQuestionMark ? 'destructive' : 'default'}
                                                    className="font-semibold"
                                                >
                                                    {task.finalEstimate}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        {isCreator && (
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteTask(task.id);
                                                    }}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

