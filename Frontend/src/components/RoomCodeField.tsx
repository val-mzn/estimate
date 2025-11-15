import { Label } from './ui/label';
import { Input } from './ui/input';

interface RoomCodeFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    maxLength?: number;
    required?: boolean;
    disabled?: boolean;
}

export default function RoomCodeField({
    id,
    label,
    value,
    onChange,
    placeholder,
    maxLength,
    required = false,
    disabled = false,
}: RoomCodeFieldProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                maxLength={maxLength}
                required={required}
                disabled={disabled}
                className="text-center text-2xl font-mono tracking-widest uppercase"
            />
            <p className="text-xs text-muted-foreground text-center">
                {value.length}/{maxLength || 5} caractères
            </p>
        </div>
    );
}

