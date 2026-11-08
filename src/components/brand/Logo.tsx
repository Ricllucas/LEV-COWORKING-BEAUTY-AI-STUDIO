import React from 'react';
import { StorageService } from '../../services/storage';
import { brandLogoUrl } from '../../utils/salonBrand';

interface LogoProps {
  variant?: 'horizontal' | 'symbol' | 'monochrome' | 'stacked';
  theme?: 'light' | 'dark' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

// Logo do salão: o da marca (quando a marca traz um) ou o do cadastro.
export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const settings = StorageService.getSettings();
  const src = brandLogoUrl(settings);
  const sizes = {
    sm: 'h-9 w-9',
    md: 'h-12 w-12',
    lg: 'h-32 w-32 sm:h-40 sm:w-40',
    xl: 'h-44 w-44 sm:h-56 sm:w-56'
  };

  return (
    <span className={`inline-flex items-center justify-center overflow-hidden rounded-xl bg-[var(--brand-bg,#f8f4ec)] shadow-[0_12px_40px_color-mix(in_srgb,var(--brand-accent,#c4b491)_18%,transparent)] ${className}`}>
      {src ? (
        <img
          src={src}
          alt={settings.name}
          className={`${sizes[size]} block object-contain`}
          width={512}
          height={512}
          loading="eager"
          decoding="async"
        />
      ) : (
        <span className={`${sizes[size]} flex items-center justify-center font-serif font-semibold text-[var(--brand-text,#3D312A)]`}>
          {(settings.name || '').slice(0, 1)}
        </span>
      )}
    </span>
  );
};
