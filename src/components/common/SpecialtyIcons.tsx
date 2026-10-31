import React from 'react';

interface SpecialtyIconProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Icon 1: Nail Care / Unha Raiz / Manicure Tradicional & Cutilagem
 * Unique SVG: Nail polish brush with sleek nail tip and subtle shine
 */
export const NailCareIcon: React.FC<SpecialtyIconProps> = ({ className = "w-5 h-5", size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || "currentColor"}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
  >
    {/* Nail shape */}
    <path d="M9 3h6a3 3 0 0 1 3 3v7a6 6 0 0 1-12 0V6a3 3 0 0 1 3-3z" />
    {/* Cuticle line */}
    <path d="M8 12a4 4 0 0 0 8 0" strokeDasharray="2 1" />
    {/* Polish brush stroke / accent */}
    <path d="M12 16v5" />
    <path d="M10 21h4" />
    {/* Sparkle shine */}
    <path d="M15 6l1.5-1.5" />
    <circle cx="16" cy="8" r="0.8" fill={color || "currentColor"} />
  </svg>
);

/**
 * Icon 2: Lash, Brow & Makeup / Cílios, Sobrancelha & Maquiagem
 * Unique SVG: Arched eyebrow, curled eyelashes & makeup brush flare
 */
export const LashBrowsIcon: React.FC<SpecialtyIconProps> = ({ className = "w-5 h-5", size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || "currentColor"}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
  >
    {/* Eyebrow arch */}
    <path d="M3 8c3-3 8-4 13-2 3 1 5 3 5 3" />
    {/* Eye curve */}
    <path d="M5 14c3.5 3 10.5 3 14 0" />
    {/* Curled Lashes */}
    <path d="M7 13.5l-1.5-2.5" />
    <path d="M10 14.5l-0.5-3" />
    <path d="M13 14.5l0.5-3" />
    <path d="M16 13.5l1.5-2.5" />
    {/* Makeup brush sparkle dot */}
    <circle cx="19" cy="6" r="1.2" fill={color || "currentColor"} />
    <path d="M19 3v1.5" />
  </svg>
);

/**
 * Icon 3: Gel Nails & Nail Art / Unhas em Gel & Alongamento
 * Unique SVG: Sculpted extension nail with diamond gem facet and UV glow
 */
export const GelNailsIcon: React.FC<SpecialtyIconProps> = ({ className = "w-5 h-5", size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || "currentColor"}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
  >
    {/* Long Sculpted Gel Nail */}
    <path d="M8 21V9a4 4 0 0 1 8 0v12" />
    {/* Nail Tip Gel Arc */}
    <path d="M8 13c2.5-1.5 5.5-1.5 8 0" />
    {/* Diamond / Crystal facet in center */}
    <path d="M12 3l2 2.5-2 2.5-2-2.5L12 3z" />
    {/* Light rays */}
    <path d="M7 4l1.5 1.5" />
    <path d="M17 4l-1.5 1.5" />
  </svg>
);

/**
 * Icon 4: Spa de Noivas & Penteados / Bridal Tiara & Hairstyling
 * Unique SVG: Delicate bridal crown tiara + hair wave
 */
export const BrideSpaIcon: React.FC<SpecialtyIconProps> = ({ className = "w-5 h-5", size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || "currentColor"}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
  >
    {/* Tiara base */}
    <path d="M4 17h16" />
    {/* Tiara crown peaks */}
    <path d="M4 17l3-7 5 5 5-5 3 7" />
    {/* Jewels on peaks */}
    <circle cx="12" cy="15" r="1" fill={color || "currentColor"} />
    <circle cx="7" cy="10" r="1" fill={color || "currentColor"} />
    <circle cx="17" cy="10" r="1" fill={color || "currentColor"} />
    {/* Hair wave flow below */}
    <path d="M3 21c4-1.5 8 1.5 12 0s6-1.5 6-1.5" />
  </svg>
);

/**
 * Icon 5: Admin / Gestão Real
 */
export const AdminShieldIcon: React.FC<SpecialtyIconProps> = ({ className = "w-5 h-5", size, color }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || "currentColor"}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    width={size}
    height={size}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 6l1.5 3 3.5.5-2.5 2.5.6 3.5-3.1-1.6-3.1 1.6.6-3.5L7 9.5l3.5-.5L12 6z" fill={color || "currentColor"} />
  </svg>
);

/**
 * Helper function to select the appropriate specialty icon based on professional ID, name, or service category
 */
export function getSpecialtyIcon(
  key: string,
  className = "w-5 h-5",
  color?: string
): React.ReactNode {
  const k = key.toLowerCase();

  if (k.includes('elisangela') || k.includes('unha raiz') || k.includes('cutilagem') || k.includes('pedicure') || k.includes('manicure')) {
    return <NailCareIcon className={className} color={color} />;
  }

  if (k.includes('talitha') || k.includes('sobrancelha') || k.includes('maquiagem') || k.includes('cílios') || k.includes('cilios') || k.includes('lash') || k.includes('brows')) {
    return <LashBrowsIcon className={className} color={color} />;
  }

  if (k.includes('nayara') || k.includes('gel') || k.includes('nail') || k.includes('alongamento') || k.includes('blindagem')) {
    return <GelNailsIcon className={className} color={color} />;
  }

  if (k.includes('noiva') || k.includes('penteado') || k.includes('spa') || k.includes('noivas')) {
    return <BrideSpaIcon className={className} color={color} />;
  }

  if (k.includes('admin') || k.includes('gestão')) {
    return <AdminShieldIcon className={className} color={color} />;
  }

  return <NailCareIcon className={className} color={color} />;
}
