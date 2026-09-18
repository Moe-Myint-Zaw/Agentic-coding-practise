import { useTheme } from '@/contexts/theme-context';

export const useColorScheme = () => useTheme().colorScheme;
