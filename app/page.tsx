import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Brain,
  Leaf,
  MessageCircle,
  TrendingUp,
  Shield,
  ChevronRight,
  Star,
  Users,
  Heart,
  BarChart3,
  Wind,
  Sprout,
  Waves,
  TreePine,
  Flower2,
  Sun,
  Moon,
  Globe,
  Sparkles,
  Target,
  Award,
  CheckCircle,
  Cloud,
  Droplets,
  Mountain,
  Bird,
  Coffee,
  Map,
  Navigation,
  Compass,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50/80 to-stone-50/60">
      {/* Header */}
      <header className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#2596be] rounded-2xl flex items-center justify-center shadow-lg">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-[#2596be] bg-clip-text text-transparent">
              Jurnalin
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="hover:bg-gray-100 text-gray-700 hover:text-[#2596be] font-medium">
                Masuk
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-[#2596be] hover:bg-[#1f7a9c] text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6">
                Daftar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center relative">
        {/* Natural decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-[#2596be]/20 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-16 w-32 h-32 bg-[#2596be]/15 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-[#2596be]/25 rounded-full blur-lg"></div>

        {/* Floating elements */}
        <div className="absolute top-1/4 right-1/4 animate-float">
          <Cloud className="w-12 h-12 text-gray-300/60" />
        </div>
        <div className="absolute bottom-1/3 left-1/5 animate-float delay-1000">
          <Bird className="w-10 h-10 text-[#2596be]/40" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <Badge variant="secondary" className="mb-8 bg-[#2596be]/10 text-[#2596be] border-[#2596be]/20 px-6 py-3 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-2" />
            Ruang Aman untuk Kesehatan Mental
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-10 bg-gradient-to-r from-gray-800 via-[#2596be] to-[#1f7a9c] bg-clip-text text-transparent leading-tight">
            Ruang Cerita
            <span className="block text-gray-700">yang Memahami</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Temukan kedamaian melalui jurnal harian yang tidak hanya mendengarkan,
            tapi juga <span className="text-[#2596be] font-medium">memahami perasaanmu</span> dan
            hubungannya dengan <span className="text-[#1f7a9c] font-medium">lingkungan sekitarmu</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-[#2596be] hover:bg-[#1f7a9c] text-white px-10 py-5 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full font-semibold">
                <Heart className="mr-3 w-5 h-5" />
                Mulai Healing Journey
                <ChevronRight className="ml-3 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-10 py-5 text-lg rounded-full font-medium">
                <Coffee className="mr-3 w-5 h-5" />
                Coba Demo
              </Button>
            </Link>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-[#2596be] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-[#2596be] mb-2">25K+</div>
              <p className="text-gray-600 font-medium">Sahabat Jurnalin</p>
            </div>
            <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-[#2596be] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-[#2596be] mb-2">94%</div>
              <p className="text-gray-600 font-medium">Merasa Lebih Baik</p>
            </div>
            <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <div className="w-16 h-16 bg-[#2596be] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-[#2596be] mb-2">100K+</div>
              <p className="text-gray-600 font-medium">Cerita Tersimpan</p>
            </div>
          </div>
        </div>
      </section>

      {/* App Screenshots Section */}
      <section className="py-20 bg-white/60 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-[#2596be]/10 text-[#2596be] border-[#2596be]/20 px-4 py-2 rounded-full">
              <Zap className="w-4 h-4 mr-2" />
              Preview Aplikasi
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-800">
              Interface yang <span className="text-[#2596be]">Menenangkan</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Jelajahi fitur-fitur Jurnalin melalui tampilan aplikasi yang dirancang untuk kenyamanan dan kedamaian
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {/* Journal Screen */}
            <div className="text-center group">
              <div className="bg-gradient-to-br from-white to-[#2596be]/5 rounded-3xl p-8 shadow-lg border border-gray-200 h-full">
                <div className="w-16 h-16 bg-[#2596be] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Jurnal Harian</h3>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-4 h-64 flex items-center justify-center mb-4 border border-gray-300">
                  <div className="text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Tampilan jurnal harian</p>
                    <p className="text-gray-400 text-xs">Interface yang clean dan menenangkan</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Interface menulis yang nyaman dengan guided prompts untuk membantu refleksi
                </p>
              </div>
            </div>


            {/* Analytics Screen */}
            <div className="text-center group">
              <div className="bg-gradient-to-br from-white to-[#2596be]/5 rounded-3xl p-8 shadow-lg border border-gray-200 h-full">
                <div className="w-16 h-16 bg-[#2596be] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Analytics Dashboard</h3>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-4 h-64 flex items-center justify-center mb-4 border border-gray-300 overflow-hidden">
                  <Image
                    src="/analytics.png"
                    alt="Analytics Dashboard Preview"
                    width={1200}
                    height={600}
                    className="w-full h-full object-cover rounded-xl"
                    priority
                  />
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Tracking progress emotional well-being dengan chart yang informatif
              </p>
            </div>


            {/* Garden Screen */}
            <div className="text-center group">
              <div className="bg-gradient-to-br from-white to-[#2596be]/5 rounded-3xl p-8 shadow-lg border border-gray-200 h-full">
                <div className="w-16 h-16 bg-[#2596be] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <TreePine className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Virtual Garden</h3>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-4 h-64 flex items-center justify-center mb-4 border border-gray-300">
                  <div className="text-center">
                    <TreePine className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Taman virtual personal</p>
                    <p className="text-gray-400 text-xs">Tumbuh seiring konsistensi menulis</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Gamifikasi yang menyenangkan untuk memotivasi konsistensi self-care
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Green Map Feature Section */}
      <section className="py-28 bg-gradient-to-br from-[#2596be]/5 to-white/80 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-[#2596be]/10 text-[#2596be] border-[#2596be]/20 px-4 py-2 rounded-full">
              <Map className="w-4 h-4 mr-2" />
              Fitur Baru
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-800">
              Green Map <span className="text-[#2596be]">Explorer</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Temukan area hijau terdekat dan pantau kualitas udara di sekitarmu untuk mendukung kesehatan mental optimal
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature Description */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-[#2596be] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Peta Area Hijau Real-time</h3>
                  <p className="text-gray-600">
                    Eksplor taman, hutan kota, dan ruang terbuka hijau di sekitarmu dengan data yang selalu terupdate
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-[#2596be] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Wind className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Monitoring Kualitas Udara</h3>
                  <p className="text-gray-600">
                    Pantau tingkat polusi udara (AQI), pollen count, dan faktor lingkungan lain yang mempengaruhi mood
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-[#2596be] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Navigation className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Rute Healing Terbaik</h3>
                  <p className="text-gray-600">
                    Dapatkan rekomendasi rute menuju area hijau dengan kualitas udara terbaik berdasarkan lokasimu
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-[#2596be] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Korelasi Lingkungan-Mood</h3>
                  <p className="text-gray-600">
                    Analisis bagaimana kunjungan ke area hijau mempengaruhi pola mood dan kesehatan mentalmu
                  </p>
                </div>
              </div>
            </div>

            {/* Map Preview */}
            <div className="relative">
              <div className="bg-gradient-to-br from-white to-[#2596be]/5 rounded-3xl p-8 shadow-2xl border border-gray-200">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 h-96 relative overflow-hidden border border-gray-300">
                  {/* Mock Map */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-blue-100 to-emerald-100">
                    {/* Map Grid */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="grid grid-cols-8 gap-4 h-full">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="border-r border-gray-300 last:border-r-0"></div>
                        ))}
                      </div>
                    </div>

                    {/* Green Areas */}
                    <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-green-400/30 rounded-full blur-lg"></div>
                    <div className="absolute top-1/3 right-1/3 w-32 h-32 bg-emerald-300/40 rounded-full blur-xl"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-teal-400/30 rounded-full blur-lg"></div>

                    {/* Air Quality Indicators */}
                    <div className="absolute top-8 left-8 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Kualitas Udara</p>
                          <p className="text-xs text-green-600">BAIK - AQI 45</p>
                        </div>
                      </div>
                    </div>

                    {/* User Location */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 bg-[#2596be] rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </div>
                      <div className="absolute inset-0 w-8 h-8 bg-[#2596be] rounded-full animate-ping"></div>
                    </div>

                    {/* Green Spots */}
                    <div className="absolute top-16 right-16 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <TreePine className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-gray-700">Taman Menteng</span>
                      </div>
                    </div>

                    <div className="absolute bottom-20 left-20 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <TreePine className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-gray-700">Hutan Kota</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-gray-600 text-sm">
                    Interactive map untuk eksplorasi area hijau dan monitoring kualitas udara real-time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-28 bg-white/60 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-[#2596be]/10"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-[#2596be]/10 text-[#2596be] border-[#2596be]/20 px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Fitur Unggulan
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-800">
              Teman <span className="text-[#2596be]">Seperjalanan</span> mu
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Setiap fitur dirancang untuk mendampingi perjalanan kesehatan mentalmu dengan lembut
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Existing features... */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-[#2596be]/5 rounded-3xl overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-[#2596be] rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800 font-semibold">Jurnal Harian</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Ruang menulis yang nyaman dengan panduan lembut untuk membantu memahami perasaan dan pikiranmu.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-[#2596be]/5 rounded-3xl overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-[#2596be] rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800 font-semibold">Teman AI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Pendengar yang memahami ceritamu dan memberikan insight tentang pola emosi secara personal.
                </p>
              </CardContent>
            </Card>

            {/* Green Map Feature Card */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-green-50 rounded-3xl overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <Map className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800 font-semibold">Green Map</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Eksplor area hijau terdekat dan pantau kualitas udara untuk mendukung healing journey-mu.
                </p>
              </CardContent>
            </Card>

            {/* Rest of existing features... */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-[#2596be]/5 rounded-3xl overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-[#2596be] rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800 font-semibold">Pendengar Empatik</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Teman bicara yang selalu ada 24/7 untuk mendengarkan ceritamu dengan penuh pengertian.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-[#2596be]/5 rounded-3xl overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-[#2596be] rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800 font-semibold">Progress Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Lihat perkembangan perjalananmu dengan visualisasi yang mudah dipahami dan menyemangati.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-[#2596be]/5 rounded-3xl overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-[#2596be] rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <TreePine className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800 font-semibold">Taman Pribadi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Taman virtual yang tumbuh seiring konsistensimu merawat diri, sebagai refleksi perjalanan healing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works & Testimonials sections remain the same... */}

      {/* Enhanced CTA Section */}
      <section className="py-28 bg-gradient-to-br from-[#2596be] via-[#1f7a9c] to-[#2596be] relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-8 bg-white/20 text-white border-white/30 px-6 py-3 rounded-full text-lg backdrop-blur-sm">
              <Award className="w-5 h-5 mr-2" />
              Mulai Perjalanan Healing-mu
            </Badge>

            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white leading-tight">
              Beri Ruang untuk
              <span className="block">Dirimu Bercerita</span>
            </h2>

            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Bergabung dengan 25.000+ sahabat Jurnalin yang telah menemukan ketenangan
              melalui cerita dan refleksi.
              <span className="font-semibold text-white"> Setiap perasaan berharga untuk didengarkan. 🌱</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link href="/auth/sign-up">
                <Button size="lg" className="bg-white text-[#2596be] hover:bg-blue-50 px-12 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-full">
                  <CheckCircle className="mr-3 w-6 h-6" />
                  Mulai Menulis Sekarang
                  <ChevronRight className="ml-3 w-6 h-6" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 px-12 py-6 text-xl backdrop-blur-sm rounded-full font-semibold">
                  <Users className="mr-3 w-6 h-6" />
                  Sudah Punya Akun?
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Shield className="w-12 h-12 text-white mx-auto mb-4" />
                <p className="text-white font-semibold">Privasi Terjaga</p>
                <p className="text-blue-100 text-sm">Ceritamu hanya untukmu</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Map className="w-12 h-12 text-white mx-auto mb-4" />
                <p className="text-white font-semibold">Green Map</p>
                <p className="text-blue-100 text-sm">Eksplor area hijau terdekat</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <Sparkles className="w-12 h-12 text-white mx-auto mb-4" />
                <p className="text-white font-semibold">Setup Instan</p>
                <p className="text-blue-100 text-sm">Langsung mulai dalam 2 menit</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer remains the same... */}
    </div>
  );
}