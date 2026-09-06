import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { siteConfig } from "@/lib/config";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {siteConfig.platformName} Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {siteConfig.businessName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {siteConfig.tagline}
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
