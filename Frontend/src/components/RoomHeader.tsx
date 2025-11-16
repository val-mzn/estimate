import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Check, Copy, LogOut, User, CreditCard } from 'lucide-react';
import ChangeNameModal from './ChangeNameModal';
import ChangeCardSetModal from './ChangeCardSetModal';

interface RoomHeaderProps {
    roomName: string;
    roomCode: string;
    isManager: boolean;
    isRevealed: boolean;
    hasCurrentTask: boolean;
    currentUserName: string;
    currentCardSet: string[];
    anonymousVotes: boolean;
    onLeave: () => void;
    onChangeName: (name: string) => void;
    onChangeCardSet: (cardSet: string) => void;
    onChangeAnonymousVotes: (anonymousVotes: boolean) => void;
}

export default function RoomHeader({
    roomName,
    roomCode,
    isManager,
    currentUserName,
    currentCardSet,
    anonymousVotes,
    onLeave,
    onChangeName,
    onChangeCardSet,
    onChangeAnonymousVotes,
}: RoomHeaderProps) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [showChangeNameModal, setShowChangeNameModal] = useState(false);
    const [showChangeCardSetModal, setShowChangeCardSetModal] = useState(false);

    const copyRoomLink = async () => {
        const roomUrl = `${window.location.origin}/join-room?code=${roomCode}`;
        try {
            await navigator.clipboard.writeText(roomUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Error copying:', err);
        }
    };

    return (
        <>
            <Card className="mb-6">
                <CardContent className="flex flex-row justify-between items-center">
                    <div>
                        <p className="text-2xl font-bold capitalize">
                            {roomName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {t('roomHeader.code', { code: roomCode })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setShowChangeNameModal(true)}
                            variant="outline"
                        >
                            <User className="w-4 h-4 mr-1.5" />
                            {t('roomHeader.changeName')}
                        </Button>
                        {isManager && (
                            <>
                                <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
                                    <span className="text-sm whitespace-nowrap">{t('roomHeader.anonymousVotes')}</span>
                                    <Switch
                                        checked={anonymousVotes}
                                        onCheckedChange={onChangeAnonymousVotes}
                                    />
                                </div>
                                <Button
                                    onClick={() => setShowChangeCardSetModal(true)}
                                    variant="outline"
                                >
                                    <CreditCard className="w-4 h-4 mr-1.5" />
                                    {t('roomHeader.changeCardSet')}
                                </Button>
                            </>
                        )}
                        <Button
                            onClick={copyRoomLink}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 mr-1.5" />
                                    <span>{t('roomHeader.copied')}</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-1.5" />
                                    {t('roomHeader.copyLink')}
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={onLeave}
                            variant="destructive"
                        >
                            <LogOut className="w-5 h-5 mr-2" />
                            {t('roomHeader.leave')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <ChangeNameModal
                isOpen={showChangeNameModal}
                onClose={() => setShowChangeNameModal(false)}
                currentName={currentUserName}
                onConfirm={onChangeName}
            />
            {isManager && (
                <ChangeCardSetModal
                    isOpen={showChangeCardSetModal}
                    onClose={() => setShowChangeCardSetModal(false)}
                    currentCardSet={currentCardSet}
                    onConfirm={onChangeCardSet}
                />
            )}
        </>
    );
}

