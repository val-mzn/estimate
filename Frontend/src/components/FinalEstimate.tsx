import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface FinalEstimateProps {
    value: number | '?' | null;
    medianEstimate: number | null;
    hasNoNumericEstimates?: boolean;
    readOnly?: boolean;
    numericCardSet?: number[];
    onValueChange?: (value: number | '?' | null) => void;
    getPreviousCardValue?: (value: number) => number | null;
    getNextCardValue?: (value: number) => number | null;
}

export default function FinalEstimate({
    value,
    medianEstimate,
    hasNoNumericEstimates = false,
    readOnly = false,
    onValueChange,
    getPreviousCardValue,
    getNextCardValue,
}: FinalEstimateProps) {
    const displayValue = value ?? (hasNoNumericEstimates ? '?' : medianEstimate);
    const currentValue = value ?? (hasNoNumericEstimates ? '?' : medianEstimate);

    return (
        <>
            <Label className="text-lg font-semibold mb-4 block">
                Estimation finale
            </Label>
            <div className="flex items-center justify-center gap-3">
                {!readOnly && !hasNoNumericEstimates && (
                    <Button
                        onClick={() => {
                            if (typeof currentValue === 'number' && onValueChange && getPreviousCardValue) {
                                const previousValue = getPreviousCardValue(currentValue);
                                if (previousValue !== null) {
                                    onValueChange(previousValue);
                                }
                            }
                        }}
                        disabled={typeof currentValue !== 'number'}
                        variant="outline"
                        size="icon"
                        className="h-12 w-12"
                    >
                        <CaretDownIcon size={24} weight="bold" />
                    </Button>
                )}
                {hasNoNumericEstimates ? (
                    <div className="w-40 px-6 py-4 text-2xl font-bold text-center bg-destructive/10 border border-destructive/30 rounded-lg">
                        ?
                    </div>
                ) : (
                    <Input
                        type="text"
                        value={displayValue === null ? '-' : String(displayValue)}
                        readOnly
                        className="h-12 w-40 text-xl font-semibold text-center"
                    />
                )}
                {!readOnly && !hasNoNumericEstimates && (
                    <Button
                        onClick={() => {
                            if (typeof currentValue === 'number' && onValueChange && getNextCardValue) {
                                const nextValue = getNextCardValue(currentValue);
                                if (nextValue !== null) {
                                    onValueChange(nextValue);
                                }
                            }
                        }}
                        disabled={typeof currentValue !== 'number'}
                        variant="outline"
                        size="icon"
                        className="h-12 w-12"
                    >
                        <CaretUpIcon size={24} weight="bold" />
                    </Button>
                )}
            </div>
        </>
    );
}

