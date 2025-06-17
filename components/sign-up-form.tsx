"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!username.trim()) {
      setError("Username is required");
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
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="card-organic">
        <div className="space-y-2 mb-6">
          <h2 className="text-2xl font-semibold text-organic-title">Sign up</h2>
          <p className="text-organic-subtitle">Create a new account to start your eco journey</p>
        </div>
        
        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-organic-title font-medium">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Your username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-organic"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-organic-title font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-organic"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-organic-title font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a secure password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-organic"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="repeat-password" className="text-organic-title font-medium">
              Repeat Password
            </Label>
            <Input
              id="repeat-password"
              type="password"
              placeholder="Confirm your password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="input-organic"
            />
          </div>
          
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="button-organic w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Creating an account..." : "Sign up"}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-organic-subtitle">
            Already have an account?{" "}
            <Link 
              href="/auth/login" 
              className="text-organic-primary hover:text-organic-primary/80 transition-colors font-medium underline-offset-4 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
