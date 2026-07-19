import Game from '@/components/d33/Game';

export const metadata = {
  title: 'd33 - Oort Cloud Slingshot',
  description: 'Slingshot through the Oort cloud in this fast-paced space game.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Game />
    </div>
  );
}
