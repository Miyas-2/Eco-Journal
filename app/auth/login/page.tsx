import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/80 font-organik relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pattern-organic"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-emerald-200/30 rounded-full blur-xl animate-organic-float"></div>
      <div className="absolute top-32 right-16 w-16 h-16 bg-teal-200/30 rounded-full blur-lg animate-organic-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-sky-200/20 rounded-full blur-2xl animate-organic-float" style={{ animationDelay: '4s' }}></div>
      
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 md:p-6 lg:p-10">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}