import Game from '@/components/d24/Game';

export const metadata = {
  title: 'Solar Sail Deployment | D24',
  description: 'Control a solar sail ship catching stellar winds.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full">
        <Game />
      </div>
    </div>
  );
}
