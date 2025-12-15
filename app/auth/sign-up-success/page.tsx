import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />
      <div className="bg-[#f8fafd] dark:bg-[#101a22] min-h-screen flex items-center justify-center px-4" style={{ fontFamily: 'Lexend, sans-serif' }}>
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 flex flex-col items-center border border-slate-100 dark:border-slate-700">
          <svg className="w-16 h-16 text-emerald-500 mb-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sign Up Successful!</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6 text-center">
            Your account has been created. Please check your email to verify your account before logging in.
          </p>
          <Link href="/auth/login" className="px-6 py-2 rounded-xl bg-[#2b9dee] text-white font-bold hover:bg-[#238ad1] transition">
            Go to Login
          </Link>
        </div>
      </div>
    </>
  );
}