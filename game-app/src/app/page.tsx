import dynamic from "next/dynamic";

const Game = dynamic(() => import("@/components/Game"), { ssr: false });

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      <Game />
    </main>
  );
}
