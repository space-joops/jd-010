import Game from '@/components/d13/Game';

export const metadata = {
  title: 'Constellation Mapping | d13',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <Game />
    </div>
  );
}
