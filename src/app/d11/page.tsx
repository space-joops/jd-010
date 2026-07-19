import Game from '@/components/d11/Game';

export const metadata = {
  title: 'Mars Rover - Solar Panel Cleaning',
  description: 'Clean the dust off the Mars rover solar panels!',
};

export default function MarsRoverGamePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full">
        <Game />
      </div>
    </div>
  );
}
