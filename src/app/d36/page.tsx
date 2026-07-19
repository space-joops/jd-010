import Game from '../../components/d36/Game';

export const metadata = {
  title: 'D36 - Orbital Repair',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-[#050814] flex items-center justify-center p-4">
      <Game />
    </div>
  );
}
