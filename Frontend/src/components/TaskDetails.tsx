import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoomStore } from '../stores/roomStore';
import { useTaskDetailsStore } from '../stores/taskDetailsStore';
import { useVotingTimer } from '../hooks/useVotingTimer';
import EstimateResultsChart from './EstimateResultsChart';
import EstimateMetrics from './EstimateMetrics';
import VotingSection from './VotingSection';
import VoteProgress from './VoteProgress';
import FinalEstimate from './FinalEstimate';
import VotingTimer from './VotingTimer';
import { hasNoNumericEstimates, isActiveParticipant } from '../utils/estimateUtils';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import WarningModal from './WarningModal';
import { EyeIcon } from '@phosphor-icons/react';

interface TaskDetailsProps {
    cardSet: string[];
}

export default function TaskDetails({ cardSet }: TaskDetailsProps) {
    const { t } = useTranslation();
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
        onFinalEstimatePreview,
        onFinalEstimateChange,
        onReveal,
        onHide,
        onCloseTask,
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
    const hasNoNumeric = hasNoNumericEstimates(room.participants);

    if (!onEstimate || !onFinalEstimateChange) {
        return null;
    }

    const hasVotes = room.participants.some(p => 
        isActiveParticipant(p) && p.currentEstimate !== null
    );
    
    const shouldShowResults = isRevealedState && (hasVotes || hasNoNumeric);

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
                                {isRevealedState ? t('taskDetails.resultForTask', { title: currentTask.title }) : t('taskDetails.estimateForTask', { title: currentTask.title })}
                            </h2>
                        </div>
                        <VotingTimer formattedTime={formattedTime} isRunning={isRunning} />
                    </div>
                </div>

                {shouldShowResults ? (
                    <div className="flex flex-col gap-4">
                        <div>
                            <EstimateResultsChart
                                estimates={estimatesForCurrentTask}
                                median={medianEstimate ?? 0}
                                cardSet={cardSet}
                                participants={room.participants}
                            />
                            <EstimateMetrics
                                participants={room.participants}
                                averageEstimate={averageEstimate}
                                medianEstimate={medianEstimate}
                            />
                        </div>
                        
                        <FinalEstimate
                            value={currentTask.finalEstimate}
                            medianEstimate={hasNoNumeric ? null : medianEstimate}
                            hasNoNumericEstimates={hasNoNumeric}
                            readOnly={!isCreator}
                            numericCardSet={numericCardSet}
                            participants={room.participants}
                            onPreviewChange={isCreator ? onFinalEstimatePreview ?? undefined : undefined}
                            onValueChange={isCreator ? onFinalEstimateChange ?? undefined : undefined}
                            getPreviousCardValue={isCreator ? getPreviousCardValue : undefined}
                            getNextCardValue={isCreator ? getNextCardValue : undefined}
                            onSave={isCreator ? onCloseTask ?? undefined : undefined}
                        />
                        {isCreator && onHide && (

                            <Button
                                onClick={onHide}
                                variant="outline"
                                size="lg"
                                className="w-full"
                            >
                                {t('voting.hideEstimates')}
                            </Button>

                        )}
                    </div>
                ) : (
                    <>
                        {isParticipant ? (
                            <VotingSection
                                cardSet={cardSet}
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
                                            {t('voting.revealEstimates')}
                                        </Button>
                                    </div>
                                )}
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                                        <EyeIcon className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-foreground font-medium">{t('taskDetails.youAreSpectator')}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{t('taskDetails.canObserveEstimates')}</p>
                                </div>
                            </>
                        )}
                    </>
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
            </CardContent>
        </Card>
    );
}

