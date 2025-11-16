import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VoteProgress from './VoteProgress';
import EstimateCard from './EstimateCard';
import { Button } from './ui/button';
import WarningModal from './WarningModal';
import type { Participant } from '../types';

interface VotingSectionProps {
    cardSet: string[];
    currentUserEstimate: string | null;
    votedParticipants: number;
    totalParticipants: number;
    participants?: Participant[];
    currentTaskId?: string | null;
    onEstimate: (value: string) => void;
    isManager?: boolean;
    isRevealed?: boolean;
    onReveal?: () => void;
}

export default function VotingSection({
    cardSet,
    currentUserEstimate,
    votedParticipants,
    totalParticipants,
    participants = [],
    currentTaskId = null,
    onEstimate,
    isManager = false,
    isRevealed = false,
    onReveal,
}: VotingSectionProps) {
    const { t } = useTranslation();
    const [showWarningModal, setShowWarningModal] = useState(false);
    const allVoted = votedParticipants === totalParticipants && totalParticipants > 0;
    const shouldShowButton = isManager && !isRevealed && onReveal;

    const handleRevealClick = () => {
        if (allVoted) {
            onReveal?.();
        } else {
            setShowWarningModal(true);
        }
    };

    const handleConfirmReveal = () => {
        setShowWarningModal(false);
        onReveal?.();
    };

    return (
        <div>
            <VoteProgress 
                votedParticipants={votedParticipants} 
                totalParticipants={totalParticipants}
                participants={participants}
                isManager={isManager}
                currentTaskId={currentTaskId}
            />
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-1">{t('voting.yourEstimate')}</h3>
                <p className="text-sm text-muted-foreground">{t('voting.selectValue')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
                {cardSet.map((card) => (
                    <EstimateCard
                        key={card}
                        card={card}
                        isSelected={currentUserEstimate === card}
                        onClick={() => onEstimate(card)}
                    />
                ))}
            </div>

            {shouldShowButton && (
                <div className="mt-6">
                    <Button
                        onClick={handleRevealClick}
                        size="lg"
                        className="w-full"
                    >
                        {t('voting.revealEstimates')}
                    </Button>
                </div>
            )}

            <WarningModal
                isOpen={showWarningModal}
                onClose={() => setShowWarningModal(false)}
                onConfirm={handleConfirmReveal}
                title={t('voting.revealEstimates')}
                message={t('voting.notAllVoted', { voted: votedParticipants, total: totalParticipants })}
                confirmText={t('voting.revealAnyway')}
                cancelText={t('common.cancel')}
            />
        </div>
    );
}

