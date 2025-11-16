import { useTranslation } from 'react-i18next';
import type { Participant } from '../types';
import ParticipantItem from './ParticipantItem';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody } from './ui/table';

interface ParticipantsListProps {
    participants: Participant[];
    isCreator: boolean;
    roomCode?: string;
    onRemoveParticipant?: (participantId: string) => void;
    onChangeParticipantRole?: (participantId: string, role: 'participant' | 'spectator') => void;
}

export default function ParticipantsList({ participants, isCreator, roomCode, onRemoveParticipant, onChangeParticipantRole }: ParticipantsListProps) {
    const { t } = useTranslation();
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">
                    {t('participants.title')}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({participants.length})
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableBody>
                        {participants.map((participant) => (
                            <ParticipantItem
                                key={participant.id}
                                participant={participant}
                                isCreator={isCreator}
                                roomCode={roomCode}
                                onRemove={onRemoveParticipant}
                                onChangeRole={onChangeParticipantRole}
                            />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

