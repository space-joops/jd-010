import Game from '../../components/d30/Game';

export const metadata = {
  title: 'Exoplanet Atmosphere Analysis',
  description: 'Identify the missing absorption lines to discover the atmospheric elements!',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Game />
    </div>
  );
}
