import { useState } from 'react';
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
    isCreator?: boolean;
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
    isCreator = false,
    isRevealed = false,
    onReveal,
}: VotingSectionProps) {
    const [showWarningModal, setShowWarningModal] = useState(false);
    const allVoted = votedParticipants === totalParticipants && totalParticipants > 0;
    const shouldShowButton = isCreator && !isRevealed && onReveal;

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
                isCreator={isCreator}
                currentTaskId={currentTaskId}
            />
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-1">Votre estimation</h3>
                <p className="text-sm text-muted-foreground">Sélectionnez une valeur ci-dessous</p>
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
                        Révéler les estimations
                    </Button>
                </div>
            )}

            <WarningModal
                isOpen={showWarningModal}
                onClose={() => setShowWarningModal(false)}
                onConfirm={handleConfirmReveal}
                title="Révéler les estimations"
                message={`Tous les participants n'ont pas encore terminé leur estimation (${votedParticipants}/${totalParticipants}). Voulez-vous vraiment révéler les estimations maintenant ?`}
                confirmText="Révéler quand même"
                cancelText="Annuler"
            />
        </div>
    );
}

