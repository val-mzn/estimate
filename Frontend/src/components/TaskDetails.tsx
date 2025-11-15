import { useState } from 'react';
import { useRoomStore } from '../stores/roomStore';
import { useTaskDetailsStore } from '../stores/taskDetailsStore';
import { useVotingTimer } from '../hooks/useVotingTimer';
import EstimateResultsChart from './EstimateResultsChart';
import VotingSection from './VotingSection';
import VoteProgress from './VoteProgress';
import FinalEstimate from './FinalEstimate';
import VotingTimer from './VotingTimer';
import { hasNoNumericEstimates } from '../utils/estimateUtils';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import WarningModal from './WarningModal';

interface TaskDetailsProps {
    cardSet: string[];
}

export default function TaskDetails({ cardSet }: TaskDetailsProps) {
    const { room } = useRoomStore();
    const [showWarningModal, setShowWarningModal] = useState(false);
    const {
        currentTask,
        isParticipant,
        isCreator,
        currentUserEstimate,
        estimatesForCurrentTask,
        averageEstimate,
        medianEstimate,
        votedParticipants,
        totalParticipants,
        numericCardSet,
        onEstimate,
        onFinalEstimateChange,
        onReveal,
        findClosestCardValue,
        getPreviousCardValue,
        getNextCardValue,
    } = useTaskDetailsStore();

    const { formattedTime, isRunning } = useVotingTimer(
        currentTask?.id ?? null,
        currentUserEstimate,
        room?.isRevealed ?? false
    );

    if (!currentTask || !room) {
        return null;
    }

    const isRevealedState = room.isRevealed;
    const cardSetWithQuestion = [...cardSet, '?'];
    const hasNoNumeric = hasNoNumericEstimates(room.participants);

    if (!onEstimate || !onFinalEstimateChange) {
        return null;
    }

    const shouldShowResults = isRevealedState && (
        (averageEstimate !== null && medianEstimate !== null && estimatesForCurrentTask.length > 0) ||
        hasNoNumeric
    );

    const allVoted = votedParticipants === totalParticipants && totalParticipants > 0;

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
        <Card>
            <CardContent>
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex-1">
                            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                                Estimation de la fiche : {currentTask.title}
                            </h2>
                        </div>
                        <VotingTimer formattedTime={formattedTime} isRunning={isRunning} />
                    </div>
                </div>

            {shouldShowResults ? (
                <>
                    {hasNoNumeric ? (
                        <Alert variant="destructive">
                            <AlertDescription className="text-center">
                                <p className="text-lg font-semibold mb-1">Aucune estimation numérique disponible</p>
                                <p className="text-sm">Toutes les estimations sont des emojis, des symboles</p>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <EstimateResultsChart
                            estimates={estimatesForCurrentTask}
                            median={medianEstimate ?? 0}
                            cardSet={cardSet}
                            participants={room.participants}
                        />
                    )}
                    <FinalEstimate
                        value={currentTask.finalEstimate}
                        medianEstimate={hasNoNumeric ? null : medianEstimate}
                        hasNoNumericEstimates={hasNoNumeric}
                        readOnly={!isCreator}
                        numericCardSet={numericCardSet}
                        onValueChange={isCreator ? onFinalEstimateChange : undefined}
                        getPreviousCardValue={isCreator ? getPreviousCardValue : undefined}
                        getNextCardValue={isCreator ? getNextCardValue : undefined}
                    />
                </>
            ) : (
                <>
                    {isParticipant ? (
                        <VotingSection
                            cardSet={cardSetWithQuestion}
                            currentUserEstimate={currentUserEstimate}
                            votedParticipants={votedParticipants}
                            totalParticipants={totalParticipants}
                            participants={room.participants}
                            currentTaskId={currentTask.id}
                            onEstimate={onEstimate}
                            isCreator={isCreator}
                            isRevealed={isRevealedState}
                            onReveal={onReveal || undefined}
                        />
                    ) : (
                        <>
                            <VoteProgress 
                                votedParticipants={votedParticipants} 
                                totalParticipants={totalParticipants}
                                participants={room.participants}
                                isCreator={isCreator}
                                currentTaskId={currentTask.id}
                            />
                            {isCreator && !isRevealedState && onReveal && (
                                <div className="mb-6">
                                    <Button
                                        onClick={handleRevealClick}
                                        size="lg"
                                        className="w-full"
                                    >
                                        Révéler les estimations
                                    </Button>
                                </div>
                            )}
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <p className="text-foreground font-medium">Vous êtes spectateur</p>
                                <p className="text-sm text-muted-foreground mt-1">Vous pouvez observer les estimations</p>
                            </div>
                        </>
                    )}
                </>
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
            </CardContent>
        </Card>
    );
}

