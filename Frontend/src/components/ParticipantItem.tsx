import type { Participant } from '../types';
import { getNameColor } from '../utils/roomUtils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { TableCell, TableRow } from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import { X } from 'lucide-react';

interface ParticipantItemProps {
    participant: Participant;
    isCreator?: boolean;
    onRemove?: (participantId: string) => void;
}

export default function ParticipantItem({ participant, isCreator, onRemove }: ParticipantItemProps) {
    const badgeColor = getNameColor(participant.name);
    const participantIsCreator = participant.role === 'creator';
    const participationMode = participant.participationMode;
    const canRemove = isCreator && !participantIsCreator && onRemove;

    const getRoleBadge = () => {
        if (participantIsCreator) {
            return <Badge>Créateur</Badge>;
        }
        if (participant.role === 'participant') {
            return <Badge>Participant</Badge>;
        }
        if (participant.role === 'spectator') {
            return <Badge>Spectateur</Badge>;
        }
        return null;
    };

    const getParticipationBadge = () => {
        if (participantIsCreator && participationMode === 'participant') {
            return <Badge>Participant</Badge>;
        }
        if (participantIsCreator && participationMode === 'spectator') {
            return <Badge>Spectateur</Badge>;
        }
        return null;
    };

    return (
        <TableRow className="group">
            <TableCell>
                <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                        <Avatar>
                            <AvatarFallback className="text-primary-foreground font-semibold text-sm" style={{ backgroundColor: badgeColor }}>
                                {participant.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <p className="font-medium truncate">{participant.name}</p>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex gap-1.5 flex-wrap">
                    {getRoleBadge()}
                    {getParticipationBadge()}
                </div>
            </TableCell>
            {isCreator && (
                <TableCell className="text-right">
                    {canRemove && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onRemove(participant.id)}
                            title="Retirer ce participant"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </TableCell>
            )}
        </TableRow>
    );
}

