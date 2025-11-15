import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Check, Copy, LogOut } from 'lucide-react';

interface RoomHeaderProps {
    roomName: string;
    roomCode: string;
    isCreator: boolean;
    isRevealed: boolean;
    hasCurrentTask: boolean;
    onLeave: () => void;
}

export default function RoomHeader({
    roomName,
    roomCode,
    onLeave,
}: RoomHeaderProps) {
    const [copied, setCopied] = useState(false);

    const copyRoomLink = async () => {
        const roomUrl = `${window.location.origin}/join-room?code=${roomCode}`;
        try {
            await navigator.clipboard.writeText(roomUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Erreur lors de la copie:', err);
        }
    };

    return (
        <Card className="mb-6">
            <CardContent className="flex flex-row justify-between items-center">
                <div>
                    <p className="text-2xl font-bold">
                        {roomName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Code: {roomCode}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={copyRoomLink}
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 mr-1.5" />
                                <span>Copié!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-1.5" />
                                Copier le lien
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={onLeave}
                        variant="destructive"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Quitter
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

