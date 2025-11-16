import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Label } from './ui/label';
import type { Participant } from '../types';
import { getAbstentionPercentage } from '../utils/estimateUtils';

interface FinalEstimateProps {
    value: number | '?' | null;
    medianEstimate: number | null;
    hasNoNumericEstimates?: boolean;
    readOnly?: boolean;
    numericCardSet?: number[];
    participants?: Participant[];
    onValueChange?: (value: number | '?' | null) => void;
    onPreviewChange?: (value: number | '?' | null) => void;
    getPreviousCardValue?: (value: number) => number | null;
    getNextCardValue?: (value: number) => number | null;
    onSave?: () => void;
}

export default function FinalEstimate({
    value,
    medianEstimate,
    hasNoNumericEstimates = false,
    readOnly = false,
    numericCardSet = [],
    participants = [],
    onValueChange,
    onPreviewChange,
    onSave,
}: FinalEstimateProps) {
    const { t } = useTranslation();
    
    const shouldRecommendAbstention = useMemo(() => {
        if (hasNoNumericEstimates) return true;
        if (medianEstimate === null && participants.length > 0) {
            const abstentionPercentage = getAbstentionPercentage(participants);
            return abstentionPercentage >= 50;
        }
        return false;
    }, [hasNoNumericEstimates, medianEstimate, participants]);
    
    const defaultValue = shouldRecommendAbstention ? '?' : medianEstimate;
    const [localValue, setLocalValue] = useState<number | '?' | null>(value ?? defaultValue);
    const [isLocalChange, setIsLocalChange] = useState(false);
    
    // Mettre à jour localValue quand value change depuis l'extérieur (socket)
    useEffect(() => {
        if (!isLocalChange) {
            if (value !== null) {
                setLocalValue(value);
            } else {
                setLocalValue(defaultValue);
            }
        }
    }, [value, defaultValue, isLocalChange]);
    
    const currentValue = isLocalChange ? localValue : (value ?? localValue ?? defaultValue);

    // Créer la liste des cartes à afficher
    const cardSet = useMemo(() => {
        const cards: (number | '?')[] = [...numericCardSet];
        // Toujours inclure "?" pour permettre l'abstention
        cards.push('?');
        return cards;
    }, [numericCardSet]);

    const handleCardClick = (cardValue: number | '?') => {
        if (readOnly) return;
        
        const newValue = cardValue;
        setLocalValue(newValue);
        setIsLocalChange(true);
        
        // Émettre la prévisualisation en temps réel
        if (onPreviewChange) {
            onPreviewChange(newValue);
        }
        
        // Réinitialiser isLocalChange après un court délai pour permettre la synchronisation
        setTimeout(() => {
            setIsLocalChange(false);
        }, 100);
    };

    const handleSave = () => {
        if (!onValueChange) return;
        
        // Sauvegarder la valeur actuelle
        if (currentValue !== null) {
            onValueChange(currentValue);
        }
        
        // Fermer la fiche après sauvegarde
        if (onSave) {
            onSave();
        }
    };

    return (
        <>
            <Label className="text-lg font-semibold block">
                {t('room.finalEstimate')}
            </Label>
            {shouldRecommendAbstention ? (
                <p className="text-sm text-muted-foreground">
                    {t('room.recommendedEstimate', { value: '?' })}
                </p>
            ) : medianEstimate !== null && !hasNoNumericEstimates && (
                <p className="text-sm text-muted-foreground">
                    {t('room.recommendedEstimate', { value: medianEstimate })}
                </p>
            )}
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                    {cardSet.map((card) => {
                        const cardValue = card === '?' ? '?' : card;
                        const isSelected = currentValue === cardValue;
                        return (
                            <Button
                                key={card}
                                onClick={() => handleCardClick(card)}
                                disabled={readOnly}
                                variant={isSelected ? 'default' : 'outline'}
                                className="w-16 h-16 rounded-lg font-semibold text-base"
                            >
                                {card}
                            </Button>
                        );
                    })}
                </div>
                {!readOnly && (
                    <Button
                        onClick={handleSave}
                        size="lg"
                        className="w-full"
                    >
                        {t('common.validate')}
                    </Button>
                )}
            </div>
        </>
    );
}

