import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Progress } from "@/components/ui/progress";
import type { Participant } from '../types';
import { isActiveParticipant } from '../utils/estimateUtils';

interface VoteProgressProps {
    votedParticipants: number;
    totalParticipants: number;
    participants?: Participant[];
    isManager?: boolean;
    currentTaskId?: string | null;
}

export default function VoteProgress({ 
    votedParticipants, 
    totalParticipants, 
    participants = [],
    isManager = false,
    currentTaskId = null
}: VoteProgressProps) {
    const { t } = useTranslation();
    const voteProgress = totalParticipants > 0 ? (votedParticipants / totalParticipants) * 100 : 0;

    const notVotedParticipants = useMemo(() => {
        if (!isManager || !currentTaskId) return [];
        
        return participants.filter((p) => {
            return isActiveParticipant(p) && 
                   (p.currentEstimate === null || p.currentEstimate === undefined);
        });
    }, [participants, isManager, currentTaskId]);

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                    {t('voting.votes')}
                </span>
                <span className="text-sm text-muted-foreground">
                    {votedParticipants} / {totalParticipants}
                </span>
            </div>
            <Progress value={voteProgress} />
            {isManager && notVotedParticipants.length > 0 && (
                <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">
                        {t('voting.waiting')} :
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {notVotedParticipants.map((participant) => (
                            <span
                                key={participant.id}
                                className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                            >
                                {participant.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

