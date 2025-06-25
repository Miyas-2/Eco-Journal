"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Leaf, Heart, Globe } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Terjadi kesalahan saat masuk");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      {/* Logo & Brand Section - Compact */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-400 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/40">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
              AtmosFeel
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Jurnal Emosi & Lingkungan
            </p>
          </div>
        </div>
      </div>

      {/* Login Card - Compact */}
      <div className="card-organic rounded-2xl p-6 bg-white/95 backdrop-blur-lg border border-stone-200/30 shadow-xl">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-stone-700 mb-2">
            Selamat Datang! 🌱
          </h2>
          <p className="text-sm text-stone-500">
            Masuk untuk melanjutkan perjalanan Anda
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-stone-700 text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="contoh@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input-organic pl-10 h-10"
                disabled={isLoading}
              />
              <Mail className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-stone-700 text-sm font-medium">
                Password
              </Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Lupa?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password Anda"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input-organic pl-10 pr-10 h-10"
                disabled={isLoading}
              />
              <Lock className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl p-3 bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="btn-organic-primary w-full h-11 text-sm font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Masuk...
              </span>
            ) : (
              "Masuk ke AtmosFeel"
            )}
          </Button>

          {/* Sign Up Link */}
          <div className="text-center">
            <div className="rounded-xl p-3 bg-emerald-50/50 border border-emerald-200/30">
              <p className="text-sm text-stone-600 mb-1">
                Belum punya akun?
              </p>
              <Link
                href="/auth/sign-up"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
              >
                Daftar sekarang 🌿
              </Link>
            </div>
          </div>
        </form>
      </div>

      {/* Compact Benefits - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-xl p-3 bg-emerald-50/50 border border-emerald-200/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">📊</span>
            <h3 className="text-xs font-semibold text-stone-700">AI Analisis</h3>
          </div>
          <p className="text-xs text-stone-500">
            Insight emosi mendalam
          </p>
        </div>

        <div className="rounded-xl p-3 bg-teal-50/50 border border-teal-200/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🌍</span>
            <h3 className="text-xs font-semibold text-stone-700">Data Cuaca</h3>
          </div>
          <p className="text-xs text-stone-500">
            Pengaruh lingkungan
          </p>
        </div>

        <div className="rounded-xl p-3 bg-blue-50/50 border border-blue-200/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🔒</span>
            <h3 className="text-xs font-semibold text-stone-700">Aman</h3>
          </div>
          <p className="text-xs text-stone-500">
            Privasi terjamin
          </p>
        </div>

        <div className="rounded-xl p-3 bg-purple-50/50 border border-purple-200/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🏆</span>
            <h3 className="text-xs font-semibold text-stone-700">Pencapaian</h3>
          </div>
          <p className="text-xs text-stone-500">
            Badge & reward
          </p>
        </div>
      </div>

      {/* Footer - Compact */}
      <div className="text-center mt-4">
        <p className="text-xs text-stone-500">
          <Link href="/terms" className="text-emerald-600 hover:underline">Syarat</Link> & <Link href="/privacy" className="text-emerald-600 hover:underline">Privasi</Link>
        </p>
      </div>
    </div>
  );
}
