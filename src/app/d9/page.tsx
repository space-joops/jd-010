import Game from '@/components/d9/Game';

export const metadata = {
  title: 'Max-Q: Staging Simulator',
  description: 'A space rocket staging simulation game.',
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Game />
    </main>
  );
}
