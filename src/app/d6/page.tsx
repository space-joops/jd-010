import Game from '@/components/d6/Game';

export const metadata = {
  title: 'd6 - Lagrange Point',
  description: 'Balance game at the Lagrange points',
};

export default function LagrangePointPage() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center sm:p-4">
      <Game />
    </main>
  );
}
