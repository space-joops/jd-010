import Game from '@/components/d29/Game';

export const metadata = {
  title: 'Orbital Elevator Cargo',
  description: 'Time your deceleration to stop the cargo exactly at the orbital station.',
};

export default function OrbitalCargoPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Game />
    </div>
  );
}
