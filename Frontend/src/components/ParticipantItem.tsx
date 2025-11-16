import { useTranslation } from 'react-i18next';
import type { Participant } from '../types';
import { getNameColor } from '../utils/roomUtils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { TableCell, TableRow } from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { MoreVertical, UserMinus, UserCheck, UserX } from 'lucide-react';

interface ParticipantItemProps {
    participant: Participant;
    isCreator?: boolean;
    roomCode?: string;
    onRemove?: (participantId: string) => void;
    onChangeRole?: (participantId: string, role: 'participant' | 'spectator') => void;
}

export default function ParticipantItem({ participant, isCreator, roomCode, onRemove, onChangeRole }: ParticipantItemProps) {
    const { t } = useTranslation();
    const badgeColor = getNameColor(participant.name);
    const participantIsCreator = participant.role === 'creator';
    const participationMode = participant.participationMode;
    const canManage = isCreator && !participantIsCreator && (onRemove || onChangeRole);
    const currentRole = participant.role;

    const getRoleBadge = () => {
        if (participantIsCreator) {
            return <Badge>{t('participants.creator')}</Badge>;
        }
        if (participant.role === 'participant') {
            return <Badge>{t('role.participant')}</Badge>;
        }
        if (participant.role === 'spectator') {
            return <Badge>{t('role.spectator')}</Badge>;
        }
        return null;
    };

    const getParticipationBadge = () => {
        if (participantIsCreator && participationMode === 'participant') {
            return <Badge>{t('role.participant')}</Badge>;
        }
        if (participantIsCreator && participationMode === 'spectator') {
            return <Badge>{t('role.spectator')}</Badge>;
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
                    {canManage && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {onChangeRole && (
                                    <>
                                        {currentRole !== 'participant' && (
                                            <DropdownMenuItem
                                                onClick={() => onChangeRole(participant.id, 'participant')}
                                            >
                                                <UserCheck className="w-4 h-4 mr-2" />
                                                {t('participants.setAsParticipant')}
                                            </DropdownMenuItem>
                                        )}
                                        {currentRole !== 'spectator' && (
                                            <DropdownMenuItem
                                                onClick={() => onChangeRole(participant.id, 'spectator')}
                                            >
                                                <UserX className="w-4 h-4 mr-2" />
                                                {t('participants.setAsSpectator')}
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                )}
                                {onChangeRole && onRemove && <DropdownMenuSeparator />}
                                {onRemove && (
                                    <DropdownMenuItem
                                        onClick={() => onRemove(participant.id)}
                                        variant="destructive"
                                    >
                                        <UserMinus className="w-4 h-4 mr-2" />
                                        {t('participants.removeFromRoom')}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </TableCell>
            )}
        </TableRow>
    );
}

