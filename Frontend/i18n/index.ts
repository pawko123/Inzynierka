import i18n, { init } from 'i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import pl from './locales/pl.json';

const Resources = {
	en: { translation: en },
	pl: { translation: pl },
} as const;

type SupportedLng = keyof typeof Resources;

const locales = Localization.getLocales?.() ?? [];
const locale = (locales[0]?.languageCode || 'en').toLowerCase();

const isSupported = (l: string): l is SupportedLng => l in Resources;
const fallbackLng: SupportedLng = 'en';
const initialLng: SupportedLng = isSupported(locale) ? locale : fallbackLng;

type TranslationSchema = typeof Resources.en.translation;
const getCurrentLanguage = (): SupportedLng => {
	const base = (i18n.language || initialLng).split('-')[0].toLowerCase();
	return isSupported(base) ? (base as SupportedLng) : fallbackLng;
};

export const getStrings = (lng?: SupportedLng): TranslationSchema => {
	const l = lng ?? getCurrentLanguage();
	return Resources[l].translation as TranslationSchema;
};

if (!i18n.isInitialized) {
	init({
		compatibilityJSON: 'v4',
		resources: Resources,
		lng: initialLng,
		fallbackLng,
		interpolation: { escapeValue: false },
	}).catch(() => {});
}

export default i18n;
