import Game from '@/components/d17/Game';

export const metadata = {
  title: 'Pulsar Timing | Space Rhythm Game',
  description: 'A rhythmic timing game based on pulsar signals.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Game />
    </div>
  );
}
