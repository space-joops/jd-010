import Game from '@/components/d19/Game';

export const metadata = {
  title: 'Comet Sample Return',
  description: 'A space action mini-game',
};

export default function D19Page() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Game />
    </div>
  );
}
