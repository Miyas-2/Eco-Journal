import Link from "next/link";
import { CheckCircle, Mail, Globe, Heart, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50/80 font-organik relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pattern-organic"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-emerald-200/30 rounded-full blur-xl animate-organic-float"></div>
      <div className="absolute top-32 right-16 w-16 h-16 bg-teal-200/30 rounded-full blur-lg animate-organic-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-sky-200/20 rounded-full blur-2xl animate-organic-float" style={{ animationDelay: '4s' }}></div>
      <div className="absolute bottom-32 right-1/3 w-18 h-18 bg-purple-200/20 rounded-full blur-xl animate-organic-float" style={{ animationDelay: '6s' }}></div>
      
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 md:p-6 lg:p-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            {/* Logo & Brand Section */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-teal-400 to-blue-400 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200/40 animate-organic-float">
                  <div className="relative">
                    <Globe className="h-8 w-8 text-white absolute animate-soft-pulse" />
                    <Heart className="h-4 w-4 text-white absolute top-2 left-2 animate-gentle-bounce" style={{ animationDelay: '1s' }} />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                    AtmosFeel
                  </h1>
                  <p className="text-xs text-stone-500 font-medium">
                    Jurnal Emosi & Lingkungan
                  </p>
                </div>
              </div>
            </div>

            {/* Success Card */}
            <div className="card-organic rounded-3xl p-8 bg-white/95 backdrop-blur-lg border border-stone-200/30 shadow-xl">
              {/* Success Icon */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200/40 animate-organic-float">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-stone-700 mb-3">
                  Selamat! Akun Berhasil Dibuat! 🎉
                </h2>
                <p className="text-stone-500 leading-relaxed">
                  Terima kasih telah bergabung dengan komunitas AtmosFeel
                </p>
              </div>

              {/* Email Verification Notice */}
              <div className="card-organic rounded-2xl p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-200/30 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/40 flex-shrink-0 mt-1">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-700 mb-2">
                      Periksa Email Anda
                    </h3>
                    <p className="text-sm text-stone-600 leading-relaxed mb-3">
                      Kami telah mengirimkan email konfirmasi ke alamat email yang Anda daftarkan. 
                      Silakan periksa inbox (atau folder spam) dan klik link konfirmasi untuk mengaktifkan akun Anda.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      <span>Email mungkin membutuhkan beberapa menit untuk sampai</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-stone-700 text-center mb-4">
                  Langkah Selanjutnya:
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-stone-50 to-white border border-stone-200/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      1
                    </div>
                    <span className="text-sm text-stone-600">Buka email dan klik link konfirmasi</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-stone-50 to-white border border-stone-200/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-400 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      2
                    </div>
                    <span className="text-sm text-stone-600">Masuk ke akun AtmosFeel Anda</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-stone-50 to-white border border-stone-200/50">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      3
                    </div>
                    <span className="text-sm text-stone-600">Mulai menulis jurnal emosi pertama Anda</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button asChild className="btn-organic-primary w-full h-12 text-base font-semibold">
                  <Link href="/auth/login" className="flex items-center gap-2">
                    Masuk ke AtmosFeel
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full h-10 text-sm border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300 rounded-xl transition-all duration-300">
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Kembali ke Beranda
                  </Link>
                </Button>
              </div>
            </div>

            {/* Welcome Benefits
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-organic rounded-2xl p-4 text-center bg-gradient-to-br from-emerald-50/50 to-white/80 border border-emerald-200/30">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200/40">
                  <span className="text-lg">🎯</span>
                </div>
                <h3 className="font-semibold text-stone-700 mb-1 text-sm">Mulai Perjalanan</h3>
                <p className="text-xs text-stone-500">Tulis jurnal pertama dan dapatkan insight emosi</p>
              </div>
              
              <div className="card-organic rounded-2xl p-4 text-center bg-gradient-to-br from-teal-50/50 to-white/80 border border-teal-200/30">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-200/40">
                  <span className="text-lg">🌟</span>
                </div>
                <h3 className="font-semibold text-stone-700 mb-1 text-sm">Fitur Premium</h3>
                <p className="text-xs text-stone-500">Akses gratis ke semua fitur analisis AI</p>
              </div>
            </div> */}

            {/* Support Information
            <div className="card-organic rounded-2xl p-4 bg-gradient-to-r from-stone-50/50 to-white/80 border border-stone-200/30 text-center">
              <p className="text-xs text-stone-600 leading-relaxed mb-2">
                Tidak menerima email konfirmasi? Periksa folder spam atau{" "}
                <Link href="/auth/resend-verification" className="text-emerald-600 hover:underline font-medium">
                  kirim ulang email
                </Link>
              </p>
              <p className="text-xs text-stone-500">
                Butuh bantuan? Hubungi{" "}
                <Link href="/support" className="text-emerald-600 hover:underline font-medium">
                  tim support AtmosFeel
                </Link>
              </p>
            </div> */}

            {/* Community Welcome
            <div className="card-organic rounded-3xl p-6 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-200/30 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200/40">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-stone-700 mb-2">
                Selamat Datang di Komunitas AtmosFeel! 💚
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                Anda kini menjadi bagian dari komunitas yang peduli dengan kesehatan mental dan lingkungan. 
                Mari bersama-sama menciptakan kehidupan yang lebih seimbang dan berkelanjutan.
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}