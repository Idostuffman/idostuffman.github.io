import { GamePlayer } from "@/components/games/GamePlayer";
import { GAMES } from "@/games/registry";

export function generateStaticParams() {
  return GAMES.map((g) => ({ game: g.id }));
}

export default async function GamePage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  return <GamePlayer gameId={game} />;
}
