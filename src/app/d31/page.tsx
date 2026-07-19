import Game from '@/components/d31/Game';

export const metadata = {
  title: 'd31 - 펄서 항법',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Game />
    </div>
  );
}
