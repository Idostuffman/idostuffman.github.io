import { getContentAtBuild } from "@/content/getContent";
import { BasementRoom } from "@/components/basement/BasementRoom";

export async function generateStaticParams() {
  const content = await getContentAtBuild();
  return content.basement.rooms.map((r) => ({ room: r.slug }));
}

export default async function RoomPage({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params;
  return <BasementRoom slug={room} />;
}
