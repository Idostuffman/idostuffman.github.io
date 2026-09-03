import { SecretPage } from "@/components/secrets/SecretPage";
import { getContentAtBuild } from "@/content/getContent";

export async function generateStaticParams() {
  const content = await getContentAtBuild();
  return content.secrets.map((s) => ({ slug: s.slug }));
}

export default async function Secret({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SecretPage slug={slug} />;
}
