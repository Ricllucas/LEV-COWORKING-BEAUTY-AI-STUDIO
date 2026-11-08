import React, { useEffect, useState } from 'react';
import { Logo } from '../brand/Logo';
import { StorageService } from '../../services/storage';
import { brandStyle, currentBrand } from '../../utils/salonBrand';

interface SplashScreenProps {
  onFinished: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [fading, setFading] = useState(false);
  const [settings] = useState(() => StorageService.getSettings());

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setFading(true);
    }, 1800);

    const timer2 = setTimeout(() => {
      onFinished();
    }, 2300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-(--brand-bg) transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={brandStyle(currentBrand(settings))}
    >
      <div className="flex flex-col items-center animate-pulse">
        <Logo size="xl" variant="horizontal" theme="dark" />
        <p className="mt-6 text-xs tracking-widest text-(--brand-primary) uppercase font-light">
          Carregando espaço...
        </p>
      </div>

      <div className="absolute bottom-10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-(--brand-accent) animate-ping" />
        <span className="text-[11px] text-(--brand-primary) tracking-wider">
          {settings.name}
        </span>
      </div>
    </div>
  );
};
