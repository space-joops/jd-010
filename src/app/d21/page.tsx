import Game from '@/components/d21/Game';

export const metadata = {
  title: 'D-21 Space Elevator',
  description: 'Space Elevator Construction Mini Game',
};

export default function D21Page() {
  return (
    <main className="min-h-screen bg-[#0b1026] flex items-center justify-center p-4">
      <Game />
    </main>
  );
}
