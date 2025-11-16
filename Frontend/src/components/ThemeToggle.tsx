import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useThemeStore } from '../stores/themeStore';

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();
  const { t } = useTranslation();

  return (
    <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark')}>
      <SelectTrigger className="w-[120px] h-10">
        <SelectValue>
          {theme === 'dark' ? (
            <span className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              {t('theme.dark')}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              {t('theme.light')}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">
          <span className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            {t('theme.light')}
          </span>
        </SelectItem>
        <SelectItem value="dark">
          <span className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            {t('theme.dark')}
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

