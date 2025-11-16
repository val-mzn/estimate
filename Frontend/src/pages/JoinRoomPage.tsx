import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSocket } from '../hooks/useSocket';
import { useRoomStore } from '../stores/roomStore';
import BackButton from '../components/BackButton';
import FormField from '../components/FormField';
import RoomCodeField from '../components/RoomCodeField';
import RoleSelector from '../components/RoleSelector';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const LAST_USER_NAME_KEY = 'estimate_last_user_name';

export default function JoinRoomPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [roomCode, setRoomCode] = useState('');
    const [userName, setUserName] = useState('');
    const [role, setRole] = useState<'participant' | 'spectator'>('participant');
    const [isLoading, setIsLoading] = useState(false);
    
    const { joinRoom } = useSocket({
        onError: (err) => {
            toast.error(err.message);
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

        // Récupérer le code depuis location.state ou les query params
        const codeFromState = (location.state as { roomCode?: string })?.roomCode;
        const codeFromParams = searchParams.get('code');
        const codeToUse = codeFromState || codeFromParams;
        
        if (codeToUse) {
            const upperCode = codeToUse.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
            setRoomCode(upperCode);
        }
    }, [location.state, searchParams]);

    const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
        setRoomCode(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomCode.length !== 5 || !userName.trim()) {
            toast.error(t('joinRoom.fillAllFields'));
            return;
        }
        
        setIsLoading(true);
        reset();
        
        // Sauvegarder le nom dans localStorage
        const trimmedUserName = userName.trim();
        localStorage.setItem(LAST_USER_NAME_KEY, trimmedUserName);
        
        joinRoom(
            {
                roomCode,
                userName: trimmedUserName,
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
                        <PageHeader title={t('joinRoom.title')} description={t('joinRoom.description')} />

                        <form onSubmit={handleSubmit} className="space-y-5">
                        <RoomCodeField
                            id="roomCode"
                            label={t('joinRoom.roomCode')}
                            value={roomCode}
                            onChange={handleRoomCodeChange}
                            placeholder={t('joinRoom.roomCodePlaceholder')}
                            maxLength={5}
                            required
                            disabled={isLoading}
                        />

                        <FormField
                            id="userName"
                            label={t('joinRoom.userName')}
                            value={userName}
                            onChange={(e) => {
                                setUserName(e.target.value);
                            }}
                            placeholder={t('joinRoom.userNamePlaceholder')}
                            required
                            disabled={isLoading}
                        />

                        <RoleSelector role={role} onRoleChange={setRole} />

                        <Button
                            type="submit"
                            disabled={roomCode.length !== 5 || !userName.trim() || isLoading}
                            className="w-full"
                            size="lg"
                        >
                            {isLoading ? t('joinRoom.joining') : t('joinRoom.joinButton')}
                        </Button>
                    </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

