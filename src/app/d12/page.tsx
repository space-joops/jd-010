import Game from '@/components/d12/Game';

export const metadata = {
  title: 'Space Debris Cleanup | D12',
  description: 'Clean up orbiting space debris without hitting satellites.',
};

export default function D12Page() {
  return (
    <main className="min-h-screen bg-[#050814] flex items-center justify-center p-4">
      <Game />
    </main>
  );
}
