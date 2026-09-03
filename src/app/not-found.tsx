import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page secret__locked">
      <p className="pixel" style={{ fontSize: "2.2rem", margin: 0 }}>
        404
      </p>
      <p className="hand" style={{ fontSize: "1.5rem" }}>
        this page isn&apos;t here. or it&apos;s here and you can&apos;t see it.
      </p>
      <p className="tiny">
        <Link href="/">home</Link> · <Link href="/secrets/nothing">nothing</Link>
      </p>
    </div>
  );
}
