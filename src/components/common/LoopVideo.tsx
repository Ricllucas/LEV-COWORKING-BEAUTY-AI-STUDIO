import React, { useEffect, useRef } from 'react';

interface LoopVideoProps {
  src: string;
  poster: string;
  label: string;
  className?: string;
}

// Muted looping clip that only downloads and plays while it is on screen.
export const LoopVideo: React.FC<LoopVideoProps> = ({ src, poster, label, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!video.src) video.src = src;
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    }, { threshold: 0.25 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [src]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      aria-label={label}
      muted
      loop
      playsInline
      preload="none"
      className={className}
    />
  );
};
