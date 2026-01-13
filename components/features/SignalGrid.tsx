import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { SignalCard } from './SignalCard';
import type { RankedSignal } from '../../types';

interface SignalGridProps {
  signals: RankedSignal[];
}

export const SignalGrid: React.FC<SignalGridProps> = ({ signals }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current) {
      gsap.fromTo(
        gridRef.current.children,
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.5, 
          stagger: 0.05, 
          ease: "power2.out",
          clearProps: "all" // Important for hover effects to work after animation
        }
      );
    }
  }, [signals]);

  if (signals.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg">No signals found matching criteria.</p>
        <p className="text-sm mt-2">Try adjusting filters or wait for next scan.</p>
      </div>
    );
  }

  return (
    <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {signals.map((signal) => (
        <SignalCard key={signal.symbol} data={signal} />
      ))}
    </div>
  );
};
