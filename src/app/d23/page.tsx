import Game from '@/components/d23/Game';

export const metadata = {
  title: 'Light Speed Time Delay | D23',
  description: 'Control a spaceship with relativistic time delay.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0b1026] flex items-center justify-center p-4">
      <div className="w-full">
        <Game />
      </div>
    </div>
  );
}
