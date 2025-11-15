import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface Task {
    id: string;
    title: string;
}

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (task: Omit<Task, 'id'>) => void;
}

export default function AddTaskModal({ isOpen, onClose, onAdd }: AddTaskModalProps) {
    const [title, setTitle] = useState('');

    const handleSubmit = () => {
        if (!title.trim()) return;
        
        onAdd({ title: title.trim() });
        setTitle('');
        onClose();
    };

    const handleClose = () => {
        setTitle('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajouter une fiche</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="task-title">Numéro de la fiche</Label>
                        <Input
                            id="task-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Fiche #1145"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && title.trim()) {
                                    handleSubmit();
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={!title.trim()}>
                        Ajouter
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

