import BottomNavigation from '@/components/navigation/bottom-nav';
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header - Optional, bisa dihilangkan untuk tampilan mobile */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Eco Journal</h1>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20"> {/* padding bottom untuk space bottom nav */}
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}