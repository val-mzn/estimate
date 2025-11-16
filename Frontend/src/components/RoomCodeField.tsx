import { useRef, useEffect } from 'react';
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
    maxLength = 5,
    required = false,
    disabled = false,
}: RoomCodeFieldProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Initialiser les refs
        inputRefs.current = inputRefs.current.slice(0, maxLength);
        
        // Focus initial sur le premier champ vide au montage
        if (!value && inputRefs.current[0]) {
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 0);
        }
    }, [maxLength]);

    const handleInputChange = (index: number, char: string) => {
        // Filtrer pour ne garder que les caractères alphanumériques
        const filteredChar = char.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        if (filteredChar) {
            const newValue = value.split('');
            // Remplir avec des caractères vides si nécessaire
            while (newValue.length < maxLength) {
                newValue.push('');
            }
            newValue[index] = filteredChar;
            const updatedValue = newValue.join('').slice(0, maxLength);
            
            // Créer un événement synthétique pour onChange
            const syntheticEvent = {
                target: { value: updatedValue }
            } as React.ChangeEvent<HTMLInputElement>;
            
            onChange(syntheticEvent);
            
            // Passer au champ suivant si disponible
            if (index < maxLength - 1 && filteredChar) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (value[index]) {
                // Si le champ a un caractère, le supprimer
                const newValue = value.split('');
                newValue[index] = '';
                const updatedValue = newValue.join('').slice(0, maxLength);
                
                const syntheticEvent = {
                    target: { value: updatedValue }
                } as React.ChangeEvent<HTMLInputElement>;
                
                onChange(syntheticEvent);
            } else if (index > 0) {
                // Si le champ est vide, aller au champ précédent et le supprimer
                inputRefs.current[index - 1]?.focus();
                const newValue = value.split('');
                newValue[index - 1] = '';
                const updatedValue = newValue.join('').slice(0, maxLength);
                
                const syntheticEvent = {
                    target: { value: updatedValue }
                } as React.ChangeEvent<HTMLInputElement>;
                
                onChange(syntheticEvent);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < maxLength - 1) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, maxLength);
        
        if (pastedData) {
            // Construire la nouvelle valeur en commençant à partir de l'index actuel
            const currentValue = value.split('');
            while (currentValue.length < maxLength) {
                currentValue.push('');
            }
            
            for (let i = 0; i < pastedData.length && (index + i) < maxLength; i++) {
                currentValue[index + i] = pastedData[i];
            }
            
            const updatedValue = currentValue.join('').slice(0, maxLength);
            
            const syntheticEvent = {
                target: { value: updatedValue }
            } as React.ChangeEvent<HTMLInputElement>;
            
            onChange(syntheticEvent);
            
            // Focus sur le dernier champ rempli ou le premier vide
            const nextIndex = Math.min(index + pastedData.length, maxLength - 1);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    const handleFocus = (index: number) => {
        inputRefs.current[index]?.select();
    };

    return (
        <div className="space-y-3">
            <Label htmlFor={id}>{label}</Label>
            <div className="flex justify-center gap-2">
                {Array.from({ length: maxLength }).map((_, index) => (
                    <Input
                        key={index}
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        id={index === 0 ? id : `${id}-${index}`}
                        type="text"
                        value={value[index] || ''}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={(e) => handlePaste(index, e)}
                        onFocus={() => handleFocus(index)}
                        maxLength={1}
                        required={required && index === 0}
                        disabled={disabled}
                        className="w-12 h-14 text-center text-2xl font-mono tracking-widest uppercase border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder=""
                        autoComplete="off"
                    />
                ))}
            </div>
        </div>
    );
}

