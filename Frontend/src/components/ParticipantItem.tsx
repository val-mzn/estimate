import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Participant } from '../types';
import { getNameColor } from '../utils/roomUtils';
import { useRoomStore } from '../stores/roomStore';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MoreVertical, UserMinus, UserCheck, UserX, UserPen, Crown } from 'lucide-react';
import { socketService } from '../services/socketService';

interface ParticipantItemProps {
    participant: Participant;
    isManager?: boolean;
    roomCode?: string;
    onRemove?: (participantId: string) => void;
    onChangeRole?: (participantId: string, role: 'participant' | 'spectator') => void;
}

export default function ParticipantItem({ participant, isManager, roomCode, onRemove, onChangeRole }: ParticipantItemProps) {
    const { t } = useTranslation();
    const { currentUser } = useRoomStore();
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [newName, setNewName] = useState(participant.name);
    const badgeColor = getNameColor(participant.name);
    const participantIsManager = participant.role === 'manager';
    const participationMode = participant.participationMode;
    const isCurrentUser = currentUser?.id === participant.id;
    const canManage = isManager && !participantIsManager && (onRemove || onChangeRole || roomCode);
    const canTransferManager = isManager && !isCurrentUser && !participantIsManager && roomCode;
    const currentRole = participant.role;

    const handleRename = () => {
        if (roomCode && newName.trim() && newName.trim() !== participant.name) {
            socketService.changeParticipantName({
                roomCode,
                participantId: participant.id,
                name: newName.trim(),
            });
            setIsRenameDialogOpen(false);
        }
    };

    const handleOpenRenameDialog = () => {
        setNewName(participant.name);
        setIsRenameDialogOpen(true);
    };

    const handleTransferManagerRole = () => {
        if (roomCode) {
            socketService.transferManagerRole({
                roomCode,
                participantId: participant.id,
            });
        }
    };

    useEffect(() => {
        if (!isRenameDialogOpen) {
            setNewName(participant.name);
        }
    }, [participant.name, isRenameDialogOpen]);

    const getRoleBadge = () => {
        if (participantIsManager) {
            return <Badge>{t('participants.manager')}</Badge>;
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
        if (participantIsManager && participationMode === 'participant') {
            return <Badge>{t('role.participant')}</Badge>;
        }
        if (participantIsManager && participationMode === 'spectator') {
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
            {isManager && (
                <TableCell className="text-right">
                    {(canManage || canTransferManager) && (
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
                                {canTransferManager && (
                                    <DropdownMenuItem
                                        onClick={handleTransferManagerRole}
                                    >
                                        <Crown className="w-4 h-4 mr-2" />
                                        {t('participants.transferManagerRole')}
                                    </DropdownMenuItem>
                                )}
                                {canTransferManager && canManage && <DropdownMenuSeparator />}
                                {roomCode && canManage && (
                                    <DropdownMenuItem
                                        onClick={handleOpenRenameDialog}
                                    >
                                        <UserPen className="w-4 h-4 mr-2" />
                                        {t('participants.rename')}
                                    </DropdownMenuItem>
                                )}
                                {onChangeRole && canManage && (
                                    <>
                                        {roomCode && <DropdownMenuSeparator />}
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
                                {onChangeRole && onRemove && canManage && <DropdownMenuSeparator />}
                                {onRemove && canManage && (
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
            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('participants.renameTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('participants.renameDescription', { name: participant.name })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="newName">{t('participants.newName')}</Label>
                            <Input
                                id="newName"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleRename();
                                    }
                                }}
                                placeholder={t('participants.newNamePlaceholder')}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRenameDialogOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleRename}
                            disabled={!newName.trim() || newName.trim() === participant.name}
                        >
                            {t('common.validate')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TableRow>
    );
}

