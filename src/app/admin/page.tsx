import { redirect } from "next/navigation";
import { isAuthenticated, isAdminConfigured } from "@/lib/auth";
import { getContent } from "@/content/getContent";
import { Editor } from "@/components/admin/Editor";
import { SupabaseAdmin } from "@/components/admin/SupabaseAdmin";

export default async function AdminPage() {
  const remote = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (remote || process.env.STATIC_EXPORT === "1") return <SupabaseAdmin />;

  if (!isAdminConfigured()) {
    return (
      <div className="admin">
        <h1>Admin is not configured</h1>
        <p>
          Either set up Supabase (see <code>SUPABASE.md</code>) or, for local editing only, create a <code>.env.local</code> with{" "}
          <code>ADMIN_PASSWORD=…</code> (at least 8 characters) and restart the server.
        </p>
      </div>
    );
  }
  if (!(await isAuthenticated())) redirect("/admin/login");
  return <Editor initial={await getContent()} />;
}
