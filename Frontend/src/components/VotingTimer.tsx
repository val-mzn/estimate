import { ClockIcon } from "@phosphor-icons/react";

interface VotingTimerProps {
    formattedTime: string;
    isRunning: boolean;
}

export default function VotingTimer({ formattedTime, isRunning }: VotingTimerProps) {
    if (!isRunning) {
        return null;
    }

    return (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
            <ClockIcon size={18} className="text-primary" weight="bold" />
            <span className="font-mono font-semibold text-sm text-primary">{formattedTime}</span>
        </div>
    );
}

