import { Professional } from '../types';
import { isDefaultSalon } from '../config/salon';
import { LEV_AGENDA_COLORS, LEV_AGENDA_TONES } from '../data/levBrand';

// Cores reserva para profissionais sem cor hex cadastrada (tons claros, legíveis
// sobre o fundo escuro da agenda).
export const FALLBACK_PALETTE: readonly string[] = ['#c4b491', '#9fb8ad', '#c9a3a3', '#a7b4d1', '#d1b48c', '#b5a6c9'];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// Fundo escuro de onde sai o tom do cartão e o texto claro sobre ele. Com a
// primeira cor reserva (#c4b491) dá o mesmo tom que a agenda já usava (#332d24).
const CARD_BASE = '#0f0b09';
const CARD_TEXT = '#f7f0e5';
const CARD_MIX = 0.2;

export function agendaColorFor(professional: Pick<Professional, 'id' | 'color'>, index: number): string {
  if (isDefaultSalon() && LEV_AGENDA_COLORS[professional.id]) return LEV_AGENDA_COLORS[professional.id];
  if (HEX_COLOR.test(professional.color || '')) return professional.color;
  const position = ((index % FALLBACK_PALETTE.length) + FALLBACK_PALETTE.length) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[position];
}

const toRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16)
];

const rgba = ([r, g, b]: [number, number, number], alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

export type AgendaTone = { borderColor: string; backgroundColor: string; color: string };

// Estilo do cartão de atendimento na agenda: borda na cor da profissional,
// fundo escuro puxado para essa cor e texto claro.
export function agendaToneFor(professional: Pick<Professional, 'id' | 'color'>, index: number): AgendaTone {
  const accent = toRgb(agendaColorFor(professional, index));
  const levTone = isDefaultSalon() ? LEV_AGENDA_TONES[professional.id] : undefined;
  if (levTone) {
    return { borderColor: rgba(accent, 0.8), backgroundColor: rgba(toRgb(levTone.background), 0.95), color: levTone.text };
  }
  const base = toRgb(CARD_BASE);
  const mixed = base.map((channel, i) => Math.round(channel + (accent[i] - channel) * CARD_MIX)) as [number, number, number];
  return { borderColor: rgba(accent, 0.8), backgroundColor: rgba(mixed, 0.95), color: CARD_TEXT };
}
