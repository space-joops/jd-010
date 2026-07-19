import Game from "../../components/d35/Game";

export const metadata = {
  title: "Space Net Catcher",
  description: "Catch space debris with your giant net!",
};

export default function Page() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Game />
    </div>
  );
}
