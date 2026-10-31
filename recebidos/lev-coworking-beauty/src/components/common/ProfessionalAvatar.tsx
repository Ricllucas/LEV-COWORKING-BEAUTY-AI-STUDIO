import React, { useState, useEffect } from 'react';

interface ProfessionalAvatarProps {
  src?: string;
  name: string;
  className?: string;
  sizeClassName?: string;
  textClassName?: string;
}

export const ProfessionalAvatar: React.FC<ProfessionalAvatarProps> = ({
  src,
  name,
  className = '',
  sizeClassName = 'w-16 h-16',
  textClassName = 'text-xl'
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initial = name ? name.trim().charAt(0).toUpperCase() : 'P';

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-stone-900 border-2 border-[#c4b491] shadow-md flex items-center justify-center shrink-0 text-[#c4b491] font-serif font-bold select-none ${sizeClassName} ${className}`}
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
