import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />
      <div className="bg-[#f8fafd] dark:bg-[#101a22] min-h-screen flex items-center justify-center px-4" style={{ fontFamily: 'Lexend, sans-serif' }}>
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </>
  );
}