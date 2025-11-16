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

interface ChangeCardSetModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentCardSet: string[];
    onConfirm: (cardSet: string) => void;
}

export default function ChangeCardSetModal({ isOpen, onClose, currentCardSet, onConfirm }: ChangeCardSetModalProps) {
    const { t } = useTranslation();
    const [cardSet, setCardSet] = useState(currentCardSet.join(', '));

    useEffect(() => {
        if (isOpen) {
            setCardSet(currentCardSet.join(', '));
        }
    }, [isOpen, currentCardSet]);

    const handleSubmit = () => {
        if (!cardSet.trim()) return;
        
        onConfirm(cardSet.trim());
        onClose();
    };

    const handleClose = () => {
        setCardSet(currentCardSet.join(', '));
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('roomHeader.changeCardSet')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="cardSet">{t('createRoom.cardSet')}</Label>
                        <Input
                            id="cardSet"
                            type="text"
                            value={cardSet}
                            onChange={(e) => setCardSet(e.target.value)}
                            placeholder={t('createRoom.cardSetPlaceholder')}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && cardSet.trim()) {
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
                    <Button onClick={handleSubmit} disabled={!cardSet.trim()}>
                        {t('common.validate')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

