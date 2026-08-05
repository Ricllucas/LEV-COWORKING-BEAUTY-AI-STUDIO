import React from 'react';
import { LEV_BANNER_DATA_URL, LEV_LOGO_DATA_URL } from '../../assets/brandImages';

interface LogoProps {
  variant?: 'horizontal' | 'symbol' | 'monochrome' | 'stacked';
  theme?: 'light' | 'dark' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'horizontal', size = 'md', className = '' }) => {
  const isSymbol = variant === 'symbol' || variant === 'stacked';
  const horizontalSizes = {
    sm: 'h-8 w-[112px]',
    md: 'h-11 w-[168px] sm:w-[190px]',
    lg: 'h-16 w-[250px] sm:h-20 sm:w-[340px]',
    xl: 'h-20 w-[310px] sm:h-28 sm:w-[470px]'
  };
  const symbolSizes = {
    sm: 'h-9 w-9',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
    xl: 'h-28 w-28 sm:h-36 sm:w-36'
  };

  return (
    <span className={`inline-flex items-center justify-center overflow-hidden rounded-lg bg-[#f8f4ec] ${className}`}>
      <img
        src={isSymbol ? LEV_LOGO_DATA_URL : LEV_BANNER_DATA_URL}
        alt="LEV Coworking Beauty"
        className={`${isSymbol ? symbolSizes[size] : horizontalSizes[size]} block object-contain`}
        width={isSymbol ? 512 : 1088}
        height={isSymbol ? 512 : 500}
        loading="eager"
        decoding="async"
      />
    </span>
  );
};
