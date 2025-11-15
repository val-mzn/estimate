import { Button } from './ui/button';

interface EstimateCardProps {
    card: string;
    isSelected: boolean;
    onClick: () => void;
}

export default function EstimateCard({ card, isSelected, onClick }: EstimateCardProps) {
    return (
        <Button
            onClick={onClick}
            variant={isSelected ? 'default' : 'outline'}
            className="w-24 h-24 rounded-lg font-semibold text-lg md:text-xl"
        >
            {card}
        </Button>
    );
}

