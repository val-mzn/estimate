import { useMemo } from 'react';
import { Progress } from "@/components/ui/progress";
import type { Participant } from '../types';
import { isActiveParticipant } from '../utils/estimateUtils';

interface VoteProgressProps {
    votedParticipants: number;
    totalParticipants: number;
    participants?: Participant[];
    isCreator?: boolean;
    currentTaskId?: string | null;
}

export default function VoteProgress({ 
    votedParticipants, 
    totalParticipants, 
    participants = [],
    isCreator = false,
    currentTaskId = null
}: VoteProgressProps) {
    const voteProgress = totalParticipants > 0 ? (votedParticipants / totalParticipants) * 100 : 0;

    const notVotedParticipants = useMemo(() => {
        if (!isCreator || !currentTaskId) return [];
        
        return participants.filter((p) => {
            return isActiveParticipant(p) && 
                   (p.currentEstimate === null || p.currentEstimate === undefined);
        });
    }, [participants, isCreator, currentTaskId]);

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                    Votes
                </span>
                <span className="text-sm text-muted-foreground">
                    {votedParticipants} / {totalParticipants}
                </span>
            </div>
            <Progress value={voteProgress} />
            {isCreator && notVotedParticipants.length > 0 && (
                <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">
                        En attente :
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

