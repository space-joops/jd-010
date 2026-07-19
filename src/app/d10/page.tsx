import Game from '@/components/d10/Game';

export const metadata = {
  title: 'Asteroid Mining | d10',
  description: 'A high-quality React mini-game for space nerds.',
};

export default function Page() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <Game />
    </main>
  );
}
