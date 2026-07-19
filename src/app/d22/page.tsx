import Game from '@/components/d22/Game';

export const metadata = {
  title: 'Space Station Assembly | D22',
  description: 'Assemble space station modules in this Tetris-style puzzle.',
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
