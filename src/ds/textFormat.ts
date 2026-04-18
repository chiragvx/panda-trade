import React from 'react';

const ACRONYMS = new Set([
  'API',
  'AIS',
  'BSE',
  'CPU',
  'ETF',
  'FIRMS',
  'GTT',
  'GPU',
  'IV',
  'MCX',
  'NASA',
  'NSE',
  'OAuth',
  'OI',
  'OS',
  'P&L',
  'TLS',
  'URI',
  'URL',
  'VIX',
  'VWAP',
]);

const isLegacyCaps = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!/[A-Z]/.test(trimmed)) return false;
  return trimmed === trimmed.toUpperCase();
};

const normalizeWord = (word: string) => {
  if (!word) return word;
  if (ACRONYMS.has(word)) return word;
  if (/^[A-Z0-9&+-]{1,4}$/.test(word)) return word;
  const lower = word.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export const humanizeLabel = (value: string) => {
  const cleaned = value.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return cleaned;
  if (!isLegacyCaps(cleaned)) return cleaned;
  return cleaned
    .split(' ')
    .map(normalizeWord)
    .join(' ');
};

export const maybeHumanizeNode = (value: React.ReactNode): React.ReactNode => {
  if (typeof value === 'string') return humanizeLabel(value);
  return value;
};
