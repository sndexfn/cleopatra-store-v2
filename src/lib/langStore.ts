import { create } from 'zustand';

type LanguageState = {
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
};

export const useLangStore = create<LanguageState>((set) => ({
  lang: 'ar',
  setLang: (lang) => set({ lang }),
}));
