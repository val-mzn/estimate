import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { isActiveParticipant } from '../utils/estimateUtils';
import type { Participant } from '../types';
import EstimateMetricItem from './EstimateMetricItem';

interface EstimateMetricsProps {
    participants: Participant[];
    averageEstimate: number | null;
    medianEstimate: number | null;
}

export default function EstimateMetrics({
    participants,
    averageEstimate,
    medianEstimate
}: EstimateMetricsProps) {
    const { t } = useTranslation();

    const metrics = useMemo(() => {
        const activeParticipants = participants.filter(isActiveParticipant);
        const totalActive = activeParticipants.length;

        // Compter les votes numériques
        const numericVotes = activeParticipants.filter(p => {
            if (!p.currentEstimate) return false;
            const numValue = parseFloat(p.currentEstimate);
            return !isNaN(numValue) && isFinite(numValue);
        }).length;

        // Compter les abstentions (non voté ou vote non numérique)
        const abstentions = activeParticipants.filter(p => {
            if (!p.currentEstimate) return true; // N'a pas voté
            const numValue = parseFloat(p.currentEstimate);
            return isNaN(numValue) || !isFinite(numValue); // Vote non numérique
        }).length;

        const abstentionPercentage = totalActive > 0
            ? Math.round((abstentions / totalActive) * 100)
            : 0;

        return {
            voteCount: numericVotes,
            average: averageEstimate,
            median: medianEstimate,
            abstentionPercentage,
        };
    }, [participants, averageEstimate, medianEstimate]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <EstimateMetricItem label={t('metrics.voteCount')} value={metrics.voteCount} />
            <EstimateMetricItem label={t('metrics.average')} value={metrics.average !== null ? metrics.average as number : '-'} />
            <EstimateMetricItem label={t('metrics.median')} value={metrics.median !== null ? metrics.median as number : '-'} />
            <EstimateMetricItem label={t('metrics.abstention')} value={metrics.abstentionPercentage.toString() + '%'} />
        </div>
    );
}

