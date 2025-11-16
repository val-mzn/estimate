import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { ChevronLeft } from 'lucide-react';

export default function BackButton() {
    const { t } = useTranslation();
    
    return (
        <Button variant="ghost" asChild className="mb-2">
            <Link to="/">
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
            </Link>
        </Button>
    );
}

