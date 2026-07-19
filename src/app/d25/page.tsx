import Game from '@/components/d25/Game';

export const metadata = {
  title: 'Orbit Disruption Defense | D25',
  description: 'Defend your satellite with a rotating shield.',
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
