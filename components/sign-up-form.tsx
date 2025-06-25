"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Globe, Heart, Leaf, Shield, CheckCircle } from "lucide-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Kata sandi tidak cocok. Pastikan kedua kata sandi sama.");
      setIsLoading(false);
      return;
    }

    if (!username.trim()) {
      setError("Nama pengguna harus diisi");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter untuk keamanan yang lebih baik");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
          data: {
            display_name: username.trim(),
          },
        },
      });

      if (error) throw error;

      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Terjadi kesalahan saat mendaftar");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    if (strength === 0) return { level: 0, text: "", color: "" };
    if (strength === 1) return { level: 1, text: "Lemah", color: "text-red-600" };
    if (strength === 2) return { level: 2, text: "Sedang", color: "text-orange-600" };
    if (strength === 3) return { level: 3, text: "Kuat", color: "text-emerald-600" };
    return { level: 4, text: "Sangat Kuat", color: "text-emerald-700" };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      {/* Compact Logo & Brand Section */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-400 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/40">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
              AtmosFeel
            </h1>
            <p className="text-xs text-stone-500">
              Jurnal Emosi & Lingkungan
            </p>
          </div>
        </div>
      </div>

      {/* Compact Sign Up Card */}
      <div className="card-organic rounded-2xl p-6 bg-white/95 backdrop-blur-lg border border-stone-200/30 shadow-xl">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-stone-700 mb-2">
            Bergabung dengan AtmosFeel! 🌱
          </h2>
          <p className="text-sm text-stone-500">
            Mulai perjalanan menuju kehidupan yang lebih sadar
          </p>
        </div>
        
        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm text-stone-700 font-medium flex items-center gap-2">
              <User className="h-3 w-3 text-emerald-600" />
              Nama Pengguna
            </Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="Nama pengguna"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input-organic pl-10 h-10"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-3 w-3 text-stone-400" />
              </div>
              {username.length > 0 && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {username.length >= 3 ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-stone-300" />
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-stone-700 font-medium flex items-center gap-2">
              <Mail className="h-3 w-3 text-emerald-600" />
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
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-3 w-3 text-stone-400" />
              </div>
            </div>
          </div>
          
          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-stone-700 font-medium flex items-center gap-2">
              <Lock className="h-3 w-3 text-emerald-600" />
              Kata Sandi
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Kata sandi"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input-organic pl-10 pr-10 h-10"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-3 w-3 text-stone-400" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400"
              >
                {showPassword ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </button>
            </div>
            
            {/* Compact Password Strength */}
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Kekuatan:</span>
                  <span className={`text-xs ${passwordStrength.color}`}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      passwordStrength.level === 1 ? 'bg-red-400' :
                      passwordStrength.level === 2 ? 'bg-orange-400' :
                      passwordStrength.level === 3 ? 'bg-emerald-400' :
                      passwordStrength.level === 4 ? 'bg-emerald-600' : 'bg-stone-300'
                    }`}
                    style={{ width: `${(passwordStrength.level / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Repeat Password Field */}
          <div className="space-y-2">
            <Label htmlFor="repeat-password" className="text-sm text-stone-700 font-medium flex items-center gap-2">
              <Shield className="h-3 w-3 text-emerald-600" />
              Konfirmasi
            </Label>
            <div className="relative">
              <Input
                id="repeat-password"
                type={showRepeatPassword ? "text" : "password"}
                placeholder="Konfirmasi kata sandi"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="form-input-organic pl-10 pr-16 h-10"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Shield className="h-3 w-3 text-stone-400" />
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                {repeatPassword.length > 0 && (
                  password === repeatPassword ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-red-300" />
                  )
                )}
                <button
                  type="button"
                  onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                  className="text-stone-400 ml-1"
                >
                  {showRepeatPassword ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl p-3 bg-red-50/80 border border-red-200/50">
              <p className="text-xs text-red-700 flex items-center gap-2">
                ⚠️ {error}
              </p>
            </div>
          )}

          {/* Compact Terms */}
          <div className="rounded-xl p-3 bg-emerald-50/50 border border-emerald-200/30">
            <p className="text-xs text-stone-600">
              Dengan mendaftar, Anda menyetujui{" "}
              <Link href="/terms" className="text-emerald-600 underline">
                Syarat & Ketentuan
              </Link>{" "}
              dan{" "}
              <Link href="/privacy" className="text-emerald-600 underline">
                Kebijakan Privasi
              </Link>.
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="btn-organic-primary w-full h-11 text-sm font-semibold" 
            disabled={isLoading || password !== repeatPassword || password.length < 8}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Mendaftar...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Bergabung
                <Leaf className="h-4 w-4" />
              </span>
            )}
          </Button>

          {/* Login Link */}
          <div className="text-center">
            <div className="rounded-xl p-3 bg-blue-50/50 border border-blue-200/30">
              <p className="text-xs text-stone-600 mb-1">
                Sudah punya akun?
              </p>
              <Link
                href="/auth/login"
                className="text-sm text-blue-600 font-semibold hover:underline"
              >
                Masuk 🔑
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

      {/* Compact Community Promise */}
      <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-200/30 text-center">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center mx-auto mb-2">
          <Heart className="h-4 w-4 text-white" />
        </div>
        <h3 className="text-sm font-bold text-stone-700 mb-1">
          Komunitas Peduli 💚
        </h3>
        <p className="text-xs text-stone-600">
          Bergabung dengan ribuan pengguna yang peduli lingkungan dan kesehatan mental.
        </p>
      </div>
    </div>
  );
}
