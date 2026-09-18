import i18next from 'i18next';
import en from '../locales/en.json';
import mm from '../locales/mm.json';

i18next.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    mm: { translation: mm },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
