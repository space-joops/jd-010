import Game from "@/components/d40/Game";

export const metadata = {
  title: "Supernova Escape - d40",
};

export default function Page() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Game />
    </div>
  );
}
