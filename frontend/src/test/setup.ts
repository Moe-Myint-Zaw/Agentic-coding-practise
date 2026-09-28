import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
  initReactI18next: vi.fn(() => Promise.resolve()),
}))

vi.mock('i18next', () => ({
  init: vi.fn(() => Promise.resolve()),
  use: vi.fn(),
  changeLanguage: vi.fn(),
  language: 'en',
}))

vi.mock('i18next-browser-languagedetector', () => ({
  default: vi.fn(),
}))