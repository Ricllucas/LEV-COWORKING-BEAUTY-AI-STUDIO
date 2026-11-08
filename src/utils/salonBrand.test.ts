import { describe, expect, it } from 'vitest';
import { brandLogoUrl, brandStyle, emphasisParts, resolveBrand, withProfessionalNames } from './salonBrand';
import { LEV_BRAND } from '../data/levBrand';
import { NEUTRAL_BRAND, bundledDataFor } from '../data/salonDefaults';
import { INITIAL_SETTINGS } from '../data/initialData';

const neutro = bundledDataFor('demo').settings;

describe('resolveBrand', () => {
  it('LEV sem marca gravada: igual à marca de fábrica da LEV', () => {
    expect(resolveBrand(INITIAL_SETTINGS, 'lev')).toEqual(LEV_BRAND);
  });

  it('LEV mantém o nome curto "LEV" (mensagens às clientes dependem dele)', () => {
    expect(LEV_BRAND.shortName).toBe('LEV');
  });

  it('cores gravadas por cima da marca neutra, uma a uma', () => {
    const brand = resolveBrand({ ...neutro, brand: { colors: { primary: '#2F6F73' } } }, 'demo');
    expect(brand.colors.primary).toBe('#2F6F73');
    expect(brand.colors.text).toBe(NEUTRAL_BRAND.colors.text);
    expect(brand.colors.accent).toBe(NEUTRAL_BRAND.colors.accent);
    expect(brand.colors.background).toBe(NEUTRAL_BRAND.colors.background);
    expect(brand.colors.surface).toBe(NEUTRAL_BRAND.colors.surface);
  });

  it('outro salão sem marca não mostra nada da LEV', () => {
    const json = JSON.stringify(resolveBrand(neutro, 'demo'));
    for (const word of ['LEV', 'Elisangela', 'Talitha', 'Nayara']) {
      expect(json).not.toContain(word);
    }
  });

  it('marca neutra: sem fotos, sem avaliações e sem portfólio', () => {
    const brand = resolveBrand(neutro, 'demo');
    expect(brand.works).toEqual([]);
    expect(brand.featureImageUrl).toBe('');
    expect(brand.googleReviews).toBeNull();
    expect(brand.portfolioEnabled).toBe(false);
  });

  it('campos gravados substituem os de fábrica', () => {
    const brand = resolveBrand({ ...neutro, brand: { shortName: 'Aurora', heroTitle: 'Olá', googleReviews: null } }, 'demo');
    expect(brand.shortName).toBe('Aurora');
    expect(brand.heroTitle).toBe('Olá');
    expect(brand.heroText).toBe(NEUTRAL_BRAND.heroText);
  });

  it('não altera a marca de fábrica nem a gravada', () => {
    const before = JSON.stringify(LEV_BRAND);
    const override = { colors: { primary: '#000000' } };
    const settings = { ...INITIAL_SETTINGS, brand: override };
    const brand = resolveBrand(settings, 'lev');
    brand.colors.text = '#FFFFFF';
    brand.highlights.push({ title: 'x', desc: 'y' });
    brand.works.push({ url: 'x', alt: 'y' });
    brand.googleReviews?.reviews.push({ author: 'x', text: 'y', rating: 5 });
    expect(JSON.stringify(LEV_BRAND)).toBe(before);
    expect(override).toEqual({ colors: { primary: '#000000' } });
    expect(resolveBrand(INITIAL_SETTINGS, 'lev')).toEqual(LEV_BRAND);
  });
});

describe('brandStyle', () => {
  it('define as 5 variáveis de cor', () => {
    expect(brandStyle(LEV_BRAND)).toEqual({
      '--brand-text': '#3D312A',
      '--brand-primary': '#8C7249',
      '--brand-accent': '#A1865B',
      '--brand-bg': '#FCF9F2',
      '--brand-surface': '#F3EBDD'
    });
  });
});

describe('withProfessionalNames', () => {
  it('troca {profissionais} pelos nomes carregados', () => {
    expect(withProfessionalNames('{profissionais}', ['Elisangela', 'Talitha', 'Nayara'])).toBe('Elisangela, Talitha e Nayara');
    expect(withProfessionalNames('Com {profissionais}', ['Ana', 'Bia'])).toBe('Com Ana e Bia');
    expect(withProfessionalNames('{profissionais}', ['Ana'])).toBe('Ana');
    expect(withProfessionalNames('Sem lista', ['Ana'])).toBe('Sem lista');
  });
});

describe('emphasisParts', () => {
  it('separa os trechos em *destaque*', () => {
    expect(emphasisParts('Beleza para *Noivas*')).toEqual([
      { text: 'Beleza para ', emphasis: false },
      { text: 'Noivas', emphasis: true }
    ]);
    expect(emphasisParts('Sem destaque')).toEqual([{ text: 'Sem destaque', emphasis: false }]);
  });
});

describe('brandLogoUrl', () => {
  it('LEV usa o logo embutido; outro salão usa o do cadastro', () => {
    expect(brandLogoUrl(INITIAL_SETTINGS, 'lev')).toBe(LEV_BRAND.logoUrl);
    expect(brandLogoUrl({ ...neutro, logoUrl: '/salao-exemplo/logo.svg' }, 'demo')).toBe('/salao-exemplo/logo.svg');
    expect(brandLogoUrl({ ...neutro, logoUrl: '/a.svg', brand: { logoUrl: '/b.svg' } }, 'demo')).toBe('/b.svg');
  });
});
