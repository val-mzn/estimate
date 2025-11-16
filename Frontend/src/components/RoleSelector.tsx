import { useTranslation } from 'react-i18next';
import { Label } from './ui/label';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

interface RoleSelectorProps {
    role: 'participant' | 'spectator';
    onRoleChange: (role: 'participant' | 'spectator') => void;
}

export default function RoleSelector({ role, onRoleChange }: RoleSelectorProps) {
    const { t } = useTranslation();
    
    return (
        <div className="space-y-2">
            <Label>{t('role.label')}</Label>
            <Tabs value={role} onValueChange={(value) => {
                if (value === 'participant' || value === 'spectator') {
                    onRoleChange(value);
                }
            }} className="w-full">
                <TabsList className="w-full">
                    <TabsTrigger value="participant" className="flex-1">
                        {t('role.participant')}
                    </TabsTrigger>
                    <TabsTrigger value="spectator" className="flex-1">
                        {t('role.spectator')}
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}

