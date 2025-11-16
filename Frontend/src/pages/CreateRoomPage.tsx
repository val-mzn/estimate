import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket';
import { useRoomStore } from '../stores/roomStore';
import BackButton from '../components/BackButton';
import ErrorAlert from '../components/ErrorAlert';
import FormField from '../components/FormField';
import RoleSelector from '../components/RoleSelector';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const LAST_USER_NAME_KEY = 'estimate_last_user_name';

export default function CreateRoomPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [roomName, setRoomName] = useState('');
    const [userName, setUserName] = useState('');
    const [cardSet, setCardSet] = useState('0, 0.5, 1, 2, 3, 5, 8, 13, 21, 40, 100, ?, ∞, ☕');
    const [role, setRole] = useState<'participant' | 'spectator'>('participant');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { createRoom } = useSocket({
        onError: (err) => {
            setError(err.message);
            setIsLoading(false);
        },
    });
    
    const { reset } = useRoomStore();

    useEffect(() => {
        // Charger le nom depuis localStorage
        const savedUserName = localStorage.getItem(LAST_USER_NAME_KEY);
        if (savedUserName) {
            setUserName(savedUserName);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomName.trim() || !userName.trim()) {
            setError(t('createRoom.fillAllFields'));
            return;
        }
        
        setIsLoading(true);
        setError(null);
        reset();
        
        // Sauvegarder le nom dans localStorage
        const trimmedUserName = userName.trim();
        localStorage.setItem(LAST_USER_NAME_KEY, trimmedUserName);
        
        createRoom(
            {
                roomName: roomName.trim(),
                userName: trimmedUserName,
                cardSet: cardSet.trim(),
                role,
            },
            (response) => {
                navigate(`/room/${response.roomCode}`);
            }
        );
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <Card className="shadow-xl">
                    <CardContent className="p-8 space-y-6">
                        <BackButton />
                        <PageHeader title={t('createRoom.title')} description={t('createRoom.description')} />

                        {error && <ErrorAlert message={error} />}

                        <form onSubmit={handleSubmit} className="space-y-5">
                        <FormField
                            id="roomName"
                            label={t('createRoom.roomName')}
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder={t('createRoom.roomNamePlaceholder')}
                            required
                            disabled={isLoading}
                        />

                        <FormField
                            id="userName"
                            label={t('createRoom.userName')}
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder={t('createRoom.userNamePlaceholder')}
                            required
                            disabled={isLoading}
                        />

                        <FormField
                            id="cardSet"
                            label={t('createRoom.cardSet')}
                            value={cardSet}
                            onChange={(e) => setCardSet(e.target.value)}
                            placeholder={t('createRoom.cardSetPlaceholder')}
                        />

                        <RoleSelector role={role} onRoleChange={setRole} />

                        <Button
                            type="submit"
                            disabled={isLoading || !roomName.trim() || !userName.trim()}
                            className="w-full"
                            size="lg"
                        >
                            {isLoading ? t('createRoom.creating') : t('createRoom.createButton')}
                        </Button>
                    </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
