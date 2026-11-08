import React, { useState, useEffect } from 'react';

interface ProfessionalAvatarProps {
  src?: string;
  name: string;
  className?: string;
  sizeClassName?: string;
  textClassName?: string;
  /** Gold ring around the photo; public pages show photos without it. */
  bordered?: boolean;
}

export const ProfessionalAvatar: React.FC<ProfessionalAvatarProps> = ({
  src,
  name,
  className = '',
  sizeClassName = 'w-16 h-16',
  textClassName = 'text-xl',
  bordered = true
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initial = name ? name.trim().charAt(0).toUpperCase() : 'P';

  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center ${bordered ? 'bg-stone-900 border-2 border-[#c4b491] shadow-md text-[#c4b491]' : 'bg-[var(--brand-surface,#F3EBDD)] text-[var(--brand-accent,#c4b491)]'} justify-center shrink-0 font-serif font-bold select-none ${sizeClassName} ${className}`}
    >
      {/* Centered fallback initial letter */}
      <span className={textClassName}>{initial}</span>

      {/* Image overlay */}
      {src && !hasError && (
        <img
          src={src}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover rounded-full"
          onError={() => setHasError(true)}
          loading="eager"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};
