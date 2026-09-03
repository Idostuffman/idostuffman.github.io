import { redirect } from "next/navigation";
import { getContent } from "@/content/getContent";
import { isAuthenticated } from "@/lib/auth";
import { StagePicker } from "@/components/admin/StagePicker";
import { StageGate } from "@/components/admin/StageGate";

export default async function StagePage() {
  const content = await getContent();
  if (content.settings.stagePickerPublic) return <StagePicker />;

  const remote = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (remote || process.env.STATIC_EXPORT === "1") return <StageGate />;

  if (!(await isAuthenticated())) redirect("/admin/login?next=/stage");
  return <StagePicker />;
}
