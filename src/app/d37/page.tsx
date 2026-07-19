import React from 'react';
import Game from '@/components/d37/Game';

export const metadata = {
  title: 'D-37 | Asteroid Dodge',
  description: 'Avoid the asteroid belt and survive as long as you can in this space action arcade game.',
};

export default function D37Page() {
  return (
    <div className="min-h-screen bg-[#050814] flex items-center justify-center p-4 sm:p-8">
      <Game />
    </div>
  );
}
