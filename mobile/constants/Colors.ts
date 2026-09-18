export interface ThemeColors {
  text: string; mutedText: string; background: string; surface: string; input: string;
  border: string; tint: string; accentSoft: string; danger: string;
  tabIconDefault: string; tabIconSelected: string;
}

const tintColorLight = '#087f5b';
const tintColorDark = '#5ee0ad';

const colors: Record<'light' | 'dark', ThemeColors> = {
  light: {
    text: '#17201c', mutedText: '#64706a', background: '#f7f8f4', surface: '#fff', input: '#f0f3f0',
    border: '#d5ddd8', accentSoft: '#dcefe7', danger: '#b42318',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#eef8f3', mutedText: '#a9bbb2', background: '#101713', surface: '#18221d', input: '#202d26',
    border: '#34443b', accentSoft: '#1d4938', danger: '#ff8f85',
    tint: tintColorDark,
    tabIconDefault: '#82958b',
    tabIconSelected: tintColorDark,
  },
};

export default colors;
