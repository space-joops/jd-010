import Game from '@/components/d8/Game';

export const metadata = {
  title: 'Terraform | Goldilocks Zone',
  description: 'A space terraforming simulation game.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-[#050814] flex items-center justify-center p-4">
      <Game />
    </div>
  );
}
