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

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50/80 font-organik">
      {/* Header dengan Modern Organik style */}
      <header className="bg-gradient-to-r from-white/95 to-stone-50/95 backdrop-blur-lg border-b border-stone-200/30 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Title dengan organic styling */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/40">
                <span className="text-white text-sm font-semibold">🌿</span>
              </div>
              <h1 className="text-xl font-semibold text-stone-700 tracking-wide">
                Atmosfeel
              </h1>
            </div>

            {/* User Avatar dengan organic design */}
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-sage-green-light to-sage-green rounded-2xl flex items-center justify-center shadow-md shadow-emerald-200/20 border-2 border-white/50">
                <span className="text-sm font-semibold text-emerald-800">
                  {userInitial}
                </span>
              </div>
              {/* Optional: Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content dengan organic spacing */}
      <main className="pb-24 px-1"> {/* padding bottom untuk space bottom nav + extra organic spacing */}
        <div className="container-organic">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}