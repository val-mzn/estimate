import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

interface ChangeNameModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    onConfirm: (name: string) => void;
}

export default function ChangeNameModal({ isOpen, onClose, currentName, onConfirm }: ChangeNameModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState(currentName);

    useEffect(() => {
        if (isOpen) {
            setName(currentName);
        }
    }, [isOpen, currentName]);

    const handleSubmit = () => {
        if (!name.trim() || name.trim() === currentName) return;
        
        onConfirm(name.trim());
        onClose();
    };

    const handleClose = () => {
        setName(currentName);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('roomHeader.changeName')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t('roomHeader.newName')}</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('roomHeader.newNamePlaceholder')}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && name.trim() && name.trim() !== currentName) {
                                    handleSubmit();
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSubmit} disabled={!name.trim() || name.trim() === currentName}>
                        {t('common.validate')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

