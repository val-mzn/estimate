import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export function LanguageToggle() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Select value={i18n.language} onValueChange={changeLanguage}>
      <SelectTrigger className="w-[120px] h-10">
        <SelectValue>
          {i18n.language === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="fr">🇫🇷 {t('language.french')}</SelectItem>
        <SelectItem value="en">🇬🇧 {t('language.english')}</SelectItem>
      </SelectContent>
    </Select>
  );
}

