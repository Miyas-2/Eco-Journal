import BottomNavigation from '@/components/navigation/bottom-nav';
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DevToolsNavigation from '@/components/navigation/devtools-nav';
import SimpleChatBot from '@/components/chat/SimpleChatBot';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* DevTools Navigation */}
      <DevToolsNavigation user={user} />
      <SimpleChatBot />

      {/* Main Content */}
      <main className="pb-24 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </div>
  );
}