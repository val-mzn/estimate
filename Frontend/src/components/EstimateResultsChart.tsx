import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { getAllEstimatesFromParticipants } from '../utils/estimateUtils';
import type { Participant } from '../types';
import type { ChartConfig } from '@/components/ui/chart';

interface EstimateResultsChartProps {
    estimates: number[];
    median: number;
    cardSet: string[];
    participants: Participant[];
}

export default function EstimateResultsChart({ median, cardSet, participants }: EstimateResultsChartProps) {
    const { t } = useTranslation();
    
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

    return (
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                <ReferenceLine
                    x={median.toString()}
                    stroke={colors.secondary}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    label={{
                        value: t('chart.median'),
                        position: 'top',
                        fontSize: 12,
                        fontWeight: 600
                    }}
                />
            </BarChart>
        </ChartContainer>
    );
}

