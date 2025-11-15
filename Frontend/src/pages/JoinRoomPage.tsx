import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router';
import { useSocket } from '../hooks/useSocket';
import { useRoomStore } from '../stores/roomStore';
import BackButton from '../components/BackButton';
import ErrorAlert from '../components/ErrorAlert';
import FormField from '../components/FormField';
import RoomCodeField from '../components/RoomCodeField';
import RoleSelector from '../components/RoleSelector';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const LAST_USER_NAME_KEY = 'estimate_last_user_name';

export default function JoinRoomPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [roomCode, setRoomCode] = useState('');
    const [userName, setUserName] = useState('');
    const [role, setRole] = useState<'participant' | 'spectator'>('participant');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { joinRoom } = useSocket({
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
        setError(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomCode.length !== 5 || !userName.trim()) {
            setError('Veuillez remplir tous les champs');
            return;
        }
        
        setIsLoading(true);
        setError(null);
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
                        <PageHeader title="Rejoindre une salle" description="Entrez le code de la salle pour participer" />

                        {error && <ErrorAlert message={error} />}

                        <form onSubmit={handleSubmit} className="space-y-5">
                        <RoomCodeField
                            id="roomCode"
                            label="Code de la salle"
                            value={roomCode}
                            onChange={handleRoomCodeChange}
                            placeholder="A1B2C"
                            maxLength={5}
                            required
                            disabled={isLoading}
                        />

                        <FormField
                            id="userName"
                            label="Votre nom"
                            value={userName}
                            onChange={(e) => {
                                setUserName(e.target.value);
                                setError(null);
                            }}
                            placeholder="Ex: Jean Dupont"
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
                            {isLoading ? 'Connexion...' : 'Rejoindre la salle'}
                        </Button>
                    </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

