import Game from '@/components/d5/Game';

export const metadata = {
  title: 'Event Horizon - Black Hole Arcade',
};

export default function D5Page() {
  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[430px] h-[500px] relative overflow-hidden rounded-3xl shadow-[0_0_40px_#0b1026] ring-1 ring-[#c4b5fd]/20">
        <Game />
      </div>
    </main>
  );
}
