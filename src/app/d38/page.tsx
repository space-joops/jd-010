import Game from '@/components/d38/Game';

export const metadata = {
  title: 'Gas Giant Probe (d38)',
  description: 'A React mini-game for space nerds. Survive the storms of a gas giant.',
};

export default function GasGiantProbePage() {
  return (
    <div className="min-h-screen bg-[#0b1026] flex items-center justify-center p-4">
      <Game />
    </div>
  );
}
