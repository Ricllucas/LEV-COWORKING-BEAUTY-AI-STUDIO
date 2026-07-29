import React from 'react';

interface LogoProps {
  variant?: 'horizontal' | 'symbol' | 'monochrome' | 'stacked';
  theme?: 'light' | 'dark' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  theme = 'dark',
  size = 'md',
  className = '',
  showSubtitle = true
}) => {
  // Color tokens
  let primaryColor = '#c4b491'; // Champagne Gold Accent
  let textColor = '#ffffff';     // Clean White
  let secondaryColor = '#8a7e65'; // Muted Gold

  if (theme === 'light') {
    primaryColor = '#D4AF37';
    textColor = '#2C221E';
    secondaryColor = '#A88B42';
  } else if (theme === 'monochrome') {
    primaryColor = '#ffffff';
    textColor = '#ffffff';
    secondaryColor = '#ffffff';
  }

  // Size configurations
  const sizeMap = {
    sm: { symbolSize: 36, fontSize: 'text-sm', height: 'h-8' },
    md: { symbolSize: 52, fontSize: 'text-lg', height: 'h-12' },
    lg: { symbolSize: 72, fontSize: 'text-2xl', height: 'h-16' },
    xl: { symbolSize: 100, fontSize: 'text-4xl', height: 'h-24' }
  };

  const currentSize = sizeMap[size];

  // Symbol Vector Component
  const SymbolSVG = () => (
    <svg
      width={currentSize.symbolSize}
      height={currentSize.symbolSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Outer Circle */}
      <circle
        cx="50"
        cy="50"
        r="44"
        stroke={primaryColor}
        strokeWidth="2.2"
        fill="none"
      />

      {/* 'lev' inner text in elegant serif font */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fill={textColor}
        fontFamily="Playfair Display, Cormorant Garamond, Georgia, serif"
        fontSize="34"
        fontWeight="400"
        letterSpacing="-0.5px"
      >
        lev
      </text>

      {/* Botanical Leaf Branch on Bottom-Left Arc */}
      <g stroke={primaryColor} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Main sprig stem wrapping bottom left */}
        <path d="M 18 64 C 20 78, 34 88, 50 88" strokeWidth="2.2" />
        {/* Leaves */}
        <path d="M 22 72 Q 15 70, 16 64 Q 23 66, 22 72 Z" fill={primaryColor} fillOpacity="0.15" />
        <path d="M 28 80 Q 22 81, 21 75 Q 28 75, 28 80 Z" fill={primaryColor} fillOpacity="0.15" />
        <path d="M 37 86 Q 32 90, 31 84 Q 37 82, 37 86 Z" fill={primaryColor} fillOpacity="0.15" />
        <path d="M 23 66 Q 28 60, 31 64" />
        <path d="M 30 76 Q 35 71, 38 75" />
      </g>
    </svg>
  );

  if (variant === 'symbol') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <SymbolSVG />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Symbol */}
      <SymbolSVG />

      {/* Vertical Divider */}
      <div
        className="w-[1.5px] rounded-full self-stretch my-1 opacity-80"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Right Text Block */}
      <div className="flex flex-col justify-center leading-none py-0.5">
        {/* COWORKING */}
        <span
          className="font-sans font-light tracking-[0.28em] text-xs sm:text-sm uppercase"
          style={{ color: textColor }}
        >
          COWORKING
        </span>

        {/* — beauty — */}
        {showSubtitle && (
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="h-[1px] w-6 sm:w-8 opacity-70"
              style={{ backgroundColor: secondaryColor }}
            />
            <span
              className="italic font-serif text-lg sm:text-xl font-normal"
              style={{
                fontFamily: "'Playfair Display', 'Cormorant Garamond', 'Dancing Script', serif",
                color: primaryColor,
                letterSpacing: '0.05em'
              }}
            >
              beauty
            </span>
            <span
              className="h-[1px] w-6 sm:w-8 opacity-70"
              style={{ backgroundColor: secondaryColor }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
