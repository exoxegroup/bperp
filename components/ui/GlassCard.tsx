import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  intensity = 'medium',
  hoverEffect = false,
  ...props 
}) => {
  const baseStyles = "rounded-xl border border-white/10 backdrop-blur-md transition-all duration-300";
  
  const intensityStyles = {
    low: "bg-slate-900/40",
    medium: "bg-slate-800/60 shadow-lg",
    high: "bg-slate-800/80 shadow-xl border-white/20"
  };

  const hoverStyles = hoverEffect ? "hover:scale-[1.01] hover:bg-slate-800/70 hover:shadow-2xl hover:border-blue-500/30" : "";

  return (
    <div 
      className={twMerge(clsx(baseStyles, intensityStyles[intensity], hoverStyles, className))}
      {...props}
    >
      {children}
    </div>
  );
};
