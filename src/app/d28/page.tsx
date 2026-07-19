import React from 'react';
import LunarRoverGame from '@/components/d28/Game';

export const metadata = {
  title: 'Lunar Rover Battery Survival',
  description: 'A space-themed mini-game',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0b1026] flex items-center justify-center p-4">
      <LunarRoverGame />
    </div>
  );
}
