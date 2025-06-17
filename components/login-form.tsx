"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="card-organic">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold font-organik text-organic-title mb-2">
            Selamat Datang! 🌱
          </h1>
          <p className="text-organic-secondary">
            Masuk ke akun Eco Journal Anda untuk melanjutkan perjalanan ramah lingkungan
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-organic-title font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="contoh@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-organic"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-organic-title font-medium">
                Password
              </Label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-organic-secondary hover:text-organic-accent transition-colors"
              >
                Lupa password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Masukkan password Anda"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-organic"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="button-organic w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Masuk...
              </span>
            ) : (
              "Masuk 🌿"
            )}
          </Button>

          <div className="text-center">
            <p className="text-organic-secondary">
              Belum punya akun?{" "}
              <Link
                href="/auth/sign-up"
                className="text-organic-accent hover:text-organic-primary font-medium transition-colors"
              >
                Daftar di sini
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
