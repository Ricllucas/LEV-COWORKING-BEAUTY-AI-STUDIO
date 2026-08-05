import React from 'react';
import { LEV_LOGO_DATA_URL } from '../../assets/brandImages';

interface LogoProps {
  variant?: 'horizontal' | 'symbol' | 'monochrome' | 'stacked';
  theme?: 'light' | 'dark' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-9 w-9',
    md: 'h-12 w-12',
    lg: 'h-32 w-32 sm:h-40 sm:w-40',
    xl: 'h-44 w-44 sm:h-56 sm:w-56'
  };

  return (
    <span className={`inline-flex items-center justify-center overflow-hidden rounded-xl bg-[#f8f4ec] shadow-[0_12px_40px_rgba(196,180,145,0.18)] ${className}`}>
      <img
        src={LEV_LOGO_DATA_URL}
        alt="LEV Coworking Beauty"
        className={`${sizes[size]} block object-contain`}
        width={512}
        height={512}
        loading="eager"
        decoding="async"
      />
    </span>
  );
};
