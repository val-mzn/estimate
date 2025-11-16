import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function HomePage() {
    const { t } = useTranslation();
    
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <Card className="shadow-xl">
                    <CardContent className="p-8 space-y-8 text-center">
                        <div className="space-y-3">
                            <h1 className="text-4xl font-bold text-foreground">{t('home.title')}</h1>
                            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent w-full" />
                            <p className="text-muted-foreground text-sm">
                                {t('home.description')}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Button asChild className="w-full" size="lg">
                                <Link to="/create-room">
                                    {t('home.createRoom')}
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full" size="lg">
                                <Link to="/join-room">
                                    {t('home.joinRoom')}
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

