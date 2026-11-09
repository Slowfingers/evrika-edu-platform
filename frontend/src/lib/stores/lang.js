import { writable, derived } from 'svelte/store';
import { browser } from '$app/env';
import { translations } from '#lib/i18n/translations.js';

const SUPPORTED = ['ru', 'uz', 'en'];
const DEFAULT_LANG = 'ru';

function getInitialLang() {
  if (!browser) return DEFAULT_LANG;
  let stored;
  try { stored = localStorage.getItem('evrika_lang'); } catch {};
  if (stored && SUPPORTED.includes(stored)) return stored;
  return DEFAULT_LANG;
}

export const lang = writable(getInitialLang());

if (browser) {
  lang.subscribe(value => {
    try { localStorage.setItem('evrika_lang', value); } catch {}
    document.documentElement.lang = value;
  });
}

// Реактивная функция перевода
export const t = derived(lang, ($lang) => {
  const tr = translations[$lang] || translations[DEFAULT_LANG];
  return (key, ...args) => {
    const val = tr[key];
    if (val === undefined) return key;
    if (typeof val === 'function') return val(...args);
    return val;
  };
});

export const LANGS = [
  { code: 'ru', label: 'Рус', flag: '🇷🇺' },
  { code: 'uz', label: "O'zb", flag: '🇺🇿' },
  { code: 'en', label: 'Eng', flag: '🇬🇧' }
];
