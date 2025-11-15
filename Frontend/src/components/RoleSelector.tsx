import { Label } from './ui/label';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

interface RoleSelectorProps {
    role: 'participant' | 'spectator';
    onRoleChange: (role: 'participant' | 'spectator') => void;
}

export default function RoleSelector({ role, onRoleChange }: RoleSelectorProps) {
    return (
        <div className="space-y-2">
            <Label>Rôle</Label>
            <Tabs value={role} onValueChange={(value) => {
                if (value === 'participant' || value === 'spectator') {
                    onRoleChange(value);
                }
            }} className="w-full">
                <TabsList className="w-full">
                    <TabsTrigger value="participant" className="flex-1">
                        Participant
                    </TabsTrigger>
                    <TabsTrigger value="spectator" className="flex-1">
                        Spectateur
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}

