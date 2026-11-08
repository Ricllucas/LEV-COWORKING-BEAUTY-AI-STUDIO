import type React from 'react';
import { CURRENT_SALON_ID, DEFAULT_SALON_ID } from '../config/salon';
import { LEV_BRAND } from '../data/levBrand';
import { NEUTRAL_BRAND } from '../data/salonDefaults';
import type { CoworkingSettings, SalonBrand } from '../types';

// Nota de avaliação vinda do banco: número inteiro de 0 a 5.
export const clampRating = (rating: unknown): number =>
  Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));

// Marca do salão: o que está gravado em `settings.brand` por cima da marca de
// fábrica (LEV para a LEV, neutra para os outros), campo a campo e cor a cor.
export const resolveBrand = (settings: CoworkingSettings, salonId: string): SalonBrand => {
  const factory = salonId === DEFAULT_SALON_ID ? LEV_BRAND : NEUTRAL_BRAND;
  const saved = settings.brand ?? {};
  // Cores uma a uma; cor gravada como `null` fica com a de fábrica.
  const colors = { ...factory.colors };
  for (const [name, value] of Object.entries(saved.colors ?? {}) as [keyof SalonBrand['colors'], string | null | undefined][]) {
    if (value != null) colors[name] = value;
  }
  const merged: SalonBrand = { ...factory, ...saved, colors };
  // Valores gravados como `null` (fora o das avaliações) não apagam a fábrica.
  for (const key of Object.keys(saved) as (keyof SalonBrand)[]) {
    if (key !== 'googleReviews' && merged[key] == null) {
      (merged as Record<keyof SalonBrand, unknown>)[key] = factory[key];
    }
  }
  // Cópia funda das listas e objetos: quem recebe a marca pode mexer nela sem
  // alterar a de fábrica nem a gravada. O logo (texto grande e imutável) não
  // é copiado a cada chamada.
  const { logoUrl, ...rest } = merged;
  const brand: SalonBrand = structuredClone(rest);
  if (logoUrl !== undefined) brand.logoUrl = logoUrl;
  if (brand.googleReviews) {
    brand.googleReviews.reviews = brand.googleReviews.reviews.map(review => ({ ...review, rating: clampRating(review.rating) }));
  }
  return brand;
};

// Marca do salão deste site.
export const currentBrand = (settings: CoworkingSettings): SalonBrand =>
  resolveBrand(settings, CURRENT_SALON_ID);

// Logo do salão sem montar a marca inteira (o Logo aparece em várias telas).
export const brandLogoUrl = (settings: CoworkingSettings, salonId: string = CURRENT_SALON_ID): string => {
  const factory = salonId === DEFAULT_SALON_ID ? LEV_BRAND : NEUTRAL_BRAND;
  return settings.brand?.logoUrl || factory.logoUrl || settings.logoUrl || '';
};

// Cores da marca como variáveis CSS, aplicadas na raiz de cada página pública
// (as classes usam `bg-(--brand-bg)`, `text-(--brand-text)` etc.).
export const brandStyle = (brand: SalonBrand): React.CSSProperties => ({
  '--brand-text': brand.colors.text,
  '--brand-primary': brand.colors.primary,
  '--brand-accent': brand.colors.accent,
  '--brand-bg': brand.colors.background,
  '--brand-surface': brand.colors.surface
} as React.CSSProperties);

// "{profissionais}" vira "Ana, Bia e Carla".
export const withProfessionalNames = (text: string, names: string[]): string => {
  if (!text.includes('{profissionais}')) return text;
  const list = names.length <= 1
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
  return text.split('{profissionais}').join(list);
};

// Divide um texto com trechos em `*destaque*`: os de índice ímpar são destaque.
export const emphasisParts = (text: string): { text: string; emphasis: boolean }[] =>
  text.split('*').map((part, index) => ({ text: part, emphasis: index % 2 === 1 })).filter(part => part.text);
