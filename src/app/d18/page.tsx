import Game from '@/components/d18/Game';

export default function LunarBaseGamePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-[430px] mx-auto h-[500px] relative overflow-hidden rounded-2xl shadow-[0_0_40px_rgba(11,16,38,1)] border border-[#2a345c]">
        <Game />
      </div>
    </div>
  );
}
