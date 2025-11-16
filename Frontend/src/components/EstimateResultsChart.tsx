import { useMemo, useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { getAllEstimatesFromParticipants, isActiveParticipant } from '../utils/estimateUtils';
import { getNameColor } from '../utils/roomUtils';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { Participant } from '../types';
import type { ChartConfig } from '@/components/ui/chart';

interface EstimateResultsChartProps {
    estimates?: number[];
    median?: number;
    cardSet: string[];
    participants: Participant[];
}

export default function EstimateResultsChart({ cardSet, participants }: EstimateResultsChartProps) {
    const { t } = useTranslation();
    const chartRef = useRef<HTMLDivElement>(null);
    const [barPositions, setBarPositions] = useState<{ x: number; width: number }[]>([]);

    const chartConfig = useMemo(() => ({
        count: {
            label: t('chart.votes'),
        },
        numeric: {
            label: t('chart.numericValue'),
        },
        nonNumeric: {
            label: t('chart.nonNumericValue'),
        },
    } satisfies ChartConfig), [t]);

    const colors = useMemo(() => {
        if (typeof window === 'undefined') {
            return {
                primary: 'oklch(0.6231 0.1880 259.8145)',
                mutedForeground: 'oklch(0.5510 0.0234 264.3637)',
                secondary: 'oklch(0.9670 0.0029 264.5419)',
            };
        }
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        return {
            primary: computedStyle.getPropertyValue('--primary').trim() || 'oklch(0.6231 0.1880 259.8145)',
            mutedForeground: computedStyle.getPropertyValue('--muted-foreground').trim() || 'oklch(0.5510 0.0234 264.3637)',
            secondary: computedStyle.getPropertyValue('--secondary').trim() || 'oklch(0.9670 0.0029 264.5419)',
        };
    }, []);

    const allEstimates = getAllEstimatesFromParticipants(participants);

    const numericDistribution: Record<number, number> = {};
    const nonNumericDistribution: Record<string, number> = {};

    allEstimates.forEach(est => {
        const numValue = parseFloat(est);
        if (!isNaN(numValue) && isFinite(numValue)) {
            numericDistribution[numValue] = (numericDistribution[numValue] || 0) + 1;
        } else {
            nonNumericDistribution[est] = (nonNumericDistribution[est] || 0) + 1;
        }
    });

    const numericCardSet = cardSet
        .filter(card => card !== '?')
        .map(card => parseFloat(card))
        .filter(val => !isNaN(val))
        .sort((a, b) => a - b);

    const allNumericValues = Array.from(new Set([
        ...numericCardSet,
        ...Object.keys(numericDistribution).map(k => parseFloat(k))
    ])).sort((a, b) => a - b);

    const numericChartData = allNumericValues.map(value => ({
        value: value.toString(),
        count: numericDistribution[value] || 0,
        isNumeric: true,
        numericValue: value,
        fill: colors.primary,
    }));

    const nonNumericKeys = Object.keys(nonNumericDistribution).sort();
    const nonNumericChartData = nonNumericKeys.map(key => ({
        value: key,
        count: nonNumericDistribution[key] || 0,
        isNumeric: false,
        numericValue: numericCardSet.length > 0 ? Math.max(...numericCardSet) + 1 : 0,
        fill: colors.mutedForeground,
    }));

    const chartData = [...numericChartData, ...nonNumericChartData];

    const participantsByVote = useMemo(() => {
        const grouped: Record<string, Participant[]> = {};

        participants
            .filter(p => isActiveParticipant(p) && p.currentEstimate)
            .forEach(participant => {
                const vote = participant.currentEstimate!;
                if (!grouped[vote]) {
                    grouped[vote] = [];
                }
                grouped[vote].push(participant);
            });

        return grouped;
    }, [participants]);

    // Calculer les positions des barres après le rendu
    useEffect(() => {
        if (!chartRef.current) return;

        const updatePositions = () => {
            const bars = chartRef.current?.querySelectorAll('.recharts-bar-rectangle');
            if (!bars || bars.length === 0) return;

            const positions = Array.from(bars).map((bar) => {
                const rect = bar.getBoundingClientRect();
                const containerRect = chartRef.current!.getBoundingClientRect();
                return {
                    x: rect.left - containerRect.left + rect.width / 2,
                    width: rect.width,
                };
            });

            setBarPositions(positions);
        };

        // Attendre que le graphique soit complètement rendu
        const timer = setTimeout(updatePositions, 100);

        // Mettre à jour lors du redimensionnement
        window.addEventListener('resize', updatePositions);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updatePositions);
        };
    }, [chartData, participants]);

    return (
        <div className="w-full relative">
            <div ref={chartRef} className="relative">
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="value"
                            tick={{ fontSize: 12, fontWeight: 600 }}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                        />
                        <ChartTooltip
                            cursor={{ fill: `color-mix(in oklch, ${colors.secondary} 10%, transparent)` }}
                            content={<ChartTooltipContent />}
                        />
                        <Bar
                            dataKey="count"
                            radius={[4, 4, 0, 0]}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.fill}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </div>

            <div className="absolute bottom-10 w-full h-full">
                {chartData.map((entry, index) => {
                    const voters = participantsByVote[entry.value] || [];
                    const position = barPositions[index];

                    if (!position || voters.length === 0) return null;

                    return (
                        <div
                            key={entry.value}
                            className="absolute flex flex-col gap-1 items-center bottom-0"
                            style={{
                                left: `${position.x}px`,
                                transform: 'translateX(-50%)',
                                maxWidth: '120px',
                            }}
                        >
                            {voters.map(participant => {
                                const badgeColor = getNameColor(participant.name);
                                return (

                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarFallback
                                            className="text-[11px] font-semibold"
                                            style={{ backgroundColor: badgeColor }}
                                        >
                                            {participant.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}