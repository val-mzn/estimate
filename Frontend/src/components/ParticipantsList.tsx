import type { Participant } from '../types';
import ParticipantItem from './ParticipantItem';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody } from './ui/table';

interface ParticipantsListProps {
    participants: Participant[];
    isCreator: boolean;
    onRemoveParticipant?: (participantId: string) => void;
}

export default function ParticipantsList({ participants, isCreator, onRemoveParticipant }: ParticipantsListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">
                    Participants
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
                                onRemove={onRemoveParticipant}
                            />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

