import Link from "next/link";
import { PocketContents } from "@/components/inventory/Pocket";

export default function PocketPage() {
  return (
    <div className="page page--narrow">
      <p className="mono tiny">
        <Link href="/games">← the room</Link>
      </p>
      <h1 className="huge hand" style={{ fontWeight: 400 }}>
        pocket
      </h1>
      <PocketContents />
    </div>
  );
}
