'use client';

import Link from 'next/link';
import { useState } from 'react';

const HERO_SLIDES = [
  {
    title: "Your thoughts, shaped by the sky.",
    subtitle: "Understand how the air quality and weather influence your mood. A journal that connects your inner world with the environment around you.",
    vibe: "Cloudy with a chance of reflection",
    image: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCJbOA5fkV9R2k6tUqLUztzKTtT-E7S1xbI9HpFUa9a3TtpuARzXCIZHpqR44EDFE4Ls3JiZSfOtJIuQlqeK4oNMbpUH0q0r7ISJ4tKNZ7hd0prXSbL5TsJk3FC2sl_gLonZfXVE2pDzEB-R2aiHzVt4AmuD3cP8DsaxZ8XWYHmklgwiGZam6QlU-FBx5nVdIPzM3RZROvJjG-fegDaKMct7X0GSWLQM9yBUOh8WpuTYCXTco6EyKnCQg-I6oJ952CyglkixNXBP3g")',
  },
  {
    title: "Track Your Mood, See the Pattern.",
    subtitle: "Jurnalin helps you visualize your emotional journey and how it relates to your environment. Spot trends, triggers, and progress over time.",
    vibe: "Every mood matters",
    image: 'url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80")',
  },
  {
    title: "Community Insights, Anonymously Shared.",
    subtitle: "See how others in your area are feeling and how the environment affects the community. All data is anonymized for privacy.",
    vibe: "You're not alone",
    image: 'url("https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80")',
  },
];

export default function LandingPage() {
  const [slide, setSlide] = useState(0);

  const nextSlide = () => setSlide((s) => (s + 1) % HERO_SLIDES.length);
  const prevSlide = () => setSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  const hero = HERO_SLIDES[slide];

  return (
    <>
      {/* Google Fonts: Lexend + Material Symbols */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      
      <style jsx global>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>

      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f6f7f8] dark:bg-[#101a22] text-slate-900 dark:text-slate-50 transition-colors duration-200" style={{ fontFamily: 'Lexend, sans-serif' }}>
        {/* Navbar */}
        <div className="sticky top-0 z-50 w-full bg-[#f6f7f8]/80 dark:bg-[#101a22]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <header className="flex items-center justify-between whitespace-nowrap px-6 py-4 lg:px-20 max-w-[1400px] mx-auto w-full">
            <div className="flex items-center gap-3 text-[#0d161b] dark:text-white">
              <div className="size-8 flex items-center justify-center text-[#2b9dee]">
                <span className="material-symbols-outlined text-3xl">spa</span>
              </div>
              <h2 className="text-[#0d161b] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">Jurnalin</h2>
            </div>
            <Link href="/auth/login">
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-[#2b9dee]/10 hover:bg-[#2b9dee]/20 text-[#2b9dee] text-sm font-bold leading-normal tracking-[0.015em] transition-colors">
                <span className="truncate">Log In</span>
              </button>
            </Link>
          </header>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative w-full">
          {/* Abstract background blobs */}
          <div className="absolute top-0 left-0 w-full h-[1000px] overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-cyan-100/50 dark:bg-cyan-900/10 rounded-full blur-3xl opacity-60"></div>
          </div>

          {/* Hero Section */}
          <section className="px-6 pt-12 pb-16 lg:px-20 w-full flex justify-center">
            <div className="max-w-[1200px] w-full">
              <div className="@container">
                <div className="flex flex-col-reverse lg:flex-row gap-12 lg:gap-20 items-center">
                  {/* Left: Content */}
                  <div className="flex flex-col gap-8 flex-1 w-full lg:max-w-[500px]">
                    <div className="flex flex-col gap-4 text-left">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#2b9dee] text-xs font-bold uppercase tracking-wider w-fit">
                        <span className="material-symbols-outlined text-sm">wb_sunny</span>
                        Welcome
                      </span>
                      <h1 className="text-[#0d161b] dark:text-white text-4xl lg:text-6xl font-black leading-[1.1] tracking-[-0.033em]">
                        {hero.title}
                      </h1>
                      <h2 className="text-slate-600 dark:text-slate-300 text-lg font-light leading-relaxed">
                        {hero.subtitle}
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-2">
                      <Link href="/auth/sign-up">
                        <button className="flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-[#2b9dee] hover:bg-[#1a8cd8] text-white shadow-lg shadow-blue-500/20 text-base font-bold leading-normal tracking-[0.015em] transition-all transform active:scale-95">
                          <span className="truncate">Start Journaling</span>
                        </button>
                      </Link>
                      <button className="flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0d161b] dark:text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors">
                        <span className="truncate">Learn More</span>
                      </button>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-4 mt-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <button
                        className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={prevSlide}
                      >
                        <span className="material-symbols-outlined text-slate-500">chevron_left</span>
                      </button>
                      <div className="flex gap-2">
                        {HERO_SLIDES.map((_, idx) => (
                          <div
                            key={idx}
                            className={
                              idx === slide
                                ? "h-2 w-8 rounded-full bg-[#2b9dee] transition-all cursor-pointer"
                                : "h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700 transition-all cursor-pointer"
                            }
                            onClick={() => setSlide(idx)}
                          ></div>
                        ))}
                      </div>
                      <button
                        className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={nextSlide}
                      >
                        <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Image */}
                  <div className="flex-1 w-full flex justify-center lg:justify-end">
                    <div className="relative w-full aspect-square max-w-[500px] max-h-[500px] rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/10">
                      <div 
                        className="w-full h-full bg-cover bg-center transition-transform hover:scale-105 duration-700" 
                        style={{ backgroundImage: hero.image }}
                      >
                      </div>
                      {/* Overlay Card */}
                      <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20 dark:border-slate-700/50 flex items-center gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-[#2b9dee]">
                          <span className="material-symbols-outlined">cloud</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Today&apos;s Vibe</span>
                          <span className="text-sm text-[#0d161b] dark:text-white font-bold">{hero.vibe}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Philosophy Section */}
          <section className="py-24 px-6 relative">
            <div className="max-w-[800px] mx-auto text-center flex flex-col gap-6">
              <span className="material-symbols-outlined text-4xl text-[#2b9dee]/50">water_drop</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0d161b] dark:text-white leading-tight">
                We are not separate from <br/> <span className="text-[#2b9dee]">the air we breathe.</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                Mood isn&apos;t just internal. It&apos;s influenced by invisible tides—barometric pressure, humidity, air quality, and light. Jurnalin helps you see the invisible threads connecting your well-being to your environment, turning abstract feelings into clear insights.
              </p>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 px-6 bg-white/40 dark:bg-white/5 border-y border-slate-100 dark:border-slate-800 backdrop-blur-sm">
            <div className="max-w-[1200px] mx-auto">
              <div className="text-center mb-16">
                <span className="uppercase tracking-widest text-xs font-bold text-slate-400 mb-2 block">Holistic Tracking</span>
                <h3 className="text-2xl font-bold text-[#0d161b] dark:text-white">Everything you need to find balance</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="group p-8 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-soft transition-all duration-300">
                  <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#2b9dee] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">edit_note</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Mindful Journaling</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Freely express your thoughts or use daily guided prompts designed to unblock your mind.</p>
                </div>
                <div className="group p-8 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-soft transition-all duration-300">
                  <div className="size-12 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">air</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Air Quality Data</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Automatic syncing of local AQI, PM2.5, and weather conditions for every entry you make.</p>
                </div>
                <div className="group p-8 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-soft transition-all duration-300">
                  <div className="size-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">psychology</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Emotion Analysis</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Our gentle AI analyzes sentiment to help you track emotional trends over weeks and months.</p>
                </div>
                <div className="group p-8 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-soft transition-all duration-300">
                  <div className="size-12 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">AI Insights</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Receive personalized reflections connecting your mood to the weather patterns outside.</p>
                </div>
                <div className="group p-8 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-soft transition-all duration-300">
                  <div className="size-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">monitoring</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Mood Analytics</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Beautiful, calm charts that visualize your emotional journey alongside environmental health.</p>
                </div>
                <div className="group p-8 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-soft transition-all duration-300">
                  <div className="size-12 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">map</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Environment Map</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">See a heat map of where you feel calmest in your city based on your own data.</p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-24 px-6">
            <div className="max-w-[1000px] mx-auto">
              <div className="text-center mb-16">
                <h3 className="text-2xl font-bold text-[#0d161b] dark:text-white">A simple routine for clarity</h3>
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-start relative">
                <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -z-10"></div>
                <div className="flex-1 flex flex-col items-center text-center gap-4">
                  <div className="size-16 rounded-full bg-white dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-900 shadow-sm flex items-center justify-center text-xl font-bold text-[#2b9dee] relative z-10">1</div>
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Check In</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Take 2 minutes to log how you feel. Use tags, text, or just a color.</p>
                </div>
                <div className="flex-1 flex flex-col items-center text-center gap-4">
                  <div className="size-16 rounded-full bg-white dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-900 shadow-sm flex items-center justify-center text-xl font-bold text-[#2b9dee] relative z-10">2</div>
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Connect</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">We automatically pull in air quality, weather, and location data.</p>
                </div>
                <div className="flex-1 flex flex-col items-center text-center gap-4">
                  <div className="size-16 rounded-full bg-white dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-900 shadow-sm flex items-center justify-center text-xl font-bold text-[#2b9dee] relative z-10">3</div>
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Reflect</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Uncover hidden patterns and learn what environments nourish you.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Map Feature Section (NEW) */}
          <section className="py-24 px-6 relative overflow-hidden bg-[#f6f7f8] dark:bg-[#101a22]">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#2b9dee]/5 rounded-full blur-3xl -z-10"></div>
            <div className="max-w-[1200px] mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1 relative group">
                  <div className="relative w-full aspect-square max-h-[500px] bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 transform transition-transform duration-700 hover:scale-[1.01]">
                    <div className="absolute inset-0 bg-[#f0f4f8] dark:bg-[#1a202c]">
                      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#dbeafe] dark:bg-[#1e3a8a]/20 skew-x-12 origin-top-right"></div>
                      <div className="absolute top-10 left-10 w-32 h-24 rounded-full bg-[#d1fae5] dark:bg-[#065f46]/30 blur-2xl opacity-60"></div>
                      <div className="absolute bottom-20 right-1/3 w-40 h-40 rounded-full bg-[#d1fae5] dark:bg-[#065f46]/30 blur-2xl opacity-60"></div>
                      <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M 20 80 Q 50 50 80 30" fill="none" stroke="#2b9dee" strokeDasharray="2 2" strokeWidth="0.5"></path>
                      </svg>
                    </div>
                    <div className="absolute bottom-[25%] left-[20%] flex flex-col items-center group/pin cursor-pointer transition-transform hover:-translate-y-1">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-rose-500 z-10 relative">
                        <span className="material-symbols-outlined text-sm">favorite</span>
                      </div>
                      <div className="absolute bottom-full mb-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/pin:opacity-100 transition-opacity whitespace-nowrap border border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Feeling Loved</p>
                      </div>
                      <div className="w-2 h-2 bg-slate-400/30 rounded-full blur-[1px] mt-1"></div>
                    </div>
                    <div className="absolute top-[30%] right-[25%] flex flex-col items-center group/pin cursor-pointer">
                      <div className="relative z-10">
                        <div className="w-3 h-3 bg-[#2b9dee] rounded-full animate-ping absolute inset-0 opacity-75"></div>
                        <div className="w-3 h-3 bg-[#2b9dee] rounded-full relative shadow-lg shadow-[#2b9dee]/40 border-2 border-white dark:border-slate-800"></div>
                      </div>
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-xl shadow-soft p-3 border border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Park Zone</span>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                            <span className="material-symbols-outlined text-[10px]">air</span> AQI 12
                          </div>
                        </div>
                        <div className="h-px w-full bg-slate-100 dark:bg-slate-800"></div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">&quot;Felt incredibly peaceful watching the trees sway.&quot;</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-[#2b9dee]/5 rounded-3xl -z-10 hidden lg:block"></div>
                  <div className="absolute -bottom-12 -right-12 w-full h-full border-2 border-[#2b9dee]/5 rounded-3xl -z-20 hidden lg:block"></div>
                </div>
                <div className="order-1 lg:order-2 flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e0f2fe] dark:bg-blue-900/30 text-[#0d161b] dark:text-[#2b9dee] text-xs font-bold uppercase tracking-wider w-fit">
                      <span className="material-symbols-outlined text-sm">map</span>
                      New Feature
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#0d161b] dark:text-white leading-tight">
                      Map your mood to <br /> <span className="text-[#2b9dee]">the world around you.</span>
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                      Discover the hidden geography of your emotions. Our new map feature lets you overlay your journal entries onto environmental data, revealing safe havens and stress zones in your city.
                    </p>
                  </div>
                  <div className="grid gap-6">
                    <div className="flex gap-4 p-4 rounded-xl hover:bg-white hover:shadow-sm dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">
                      <div className="size-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#2b9dee] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">explore</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Explore Emotional Hotspots</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">Visualize where you feel most anxious or calm over time.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 rounded-xl hover:bg-white hover:shadow-sm dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">
                      <div className="size-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">nature_people</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Find Your Green Sanctuary</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">Locate parks and quiet zones with the best air quality near you.</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                      <Link href="/protected/map">
                    <button className="flex items-center gap-2 text-[#2b9dee] hover:text-[#1a8cd8] font-bold transition-colors group">
                      Explore the Map
                      <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Sample Insight Section */}
          <section className="py-24 px-6 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent">
            <div className="max-w-[800px] mx-auto text-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-white/60 dark:bg-white/5 border border-white/20 text-slate-500 dark:text-slate-300 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                <span className="material-symbols-outlined text-sm text-[#2b9dee]">auto_awesome</span>
                Sample Insight
              </span>
              <div className="relative bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl shadow-glow border border-[#2b9dee]/10">
                <span className="material-symbols-outlined text-4xl text-[#2b9dee] mb-6">format_quote</span>
                <p className="text-xl md:text-2xl font-light text-slate-700 dark:text-slate-200 leading-relaxed italic">
                  &quot;It seems your anxiety tends to spike when the PM2.5 levels exceed 100. On days like this, consider indoor activities or using an air purifier to help maintain your calm.&quot;
                </p>
                <div className="mt-8 flex items-center justify-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined">smart_toy</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Jurnalin AI</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis based on your last 14 entries</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy & Who Is It For Section */}
          <section className="py-24 px-6">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col gap-6 p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/30">
                <div className="size-12 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <h3 className="text-2xl font-bold text-[#0d161b] dark:text-white">Private by design</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Your thoughts are personal. Jurnalin uses end-to-end encryption so that no one, not even us, can read your entries. Your location data stays on your device.
                </p>
                <ul className="flex flex-col gap-3 mt-2">
                  <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                    Zero-knowledge encryption
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                    No ads, no data selling
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-8 px-4">
                <h3 className="text-2xl font-bold text-[#0d161b] dark:text-white">Who is Jurnalin for?</h3>
                <div className="flex flex-col gap-6">
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-[#2b9dee] mt-1">self_improvement</span>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">The Mindful</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">People looking to deepen their meditation and self-reflection practice.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-[#2b9dee] mt-1">health_metrics</span>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">The Health Conscious</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Those sensitive to air quality or weather changes affecting their body and mind.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-[#2b9dee] mt-1">query_stats</span>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">The Data Curious</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Individuals who love quantified self metrics and actionable data.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-24 px-6 text-center border-t border-slate-100 dark:border-slate-800 bg-[#f6f7f8] dark:bg-[#101a22]">
            <div className="max-w-[600px] mx-auto flex flex-col items-center gap-6">
              <h2 className="text-3xl font-bold text-[#0d161b] dark:text-white">Ready to find clarity?</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-light mb-4">
                Start your journey towards a more connected and mindful life today.
              </p>
              <Link href="/auth/sign-up">
                <button className="flex min-w-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-8 bg-[#2b9dee] hover:bg-[#1a8cd8] text-white shadow-lg shadow-blue-500/30 text-lg font-bold transition-all transform hover:-translate-y-1">
                  Start Journaling Free
                </button>
              </Link>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">No credit card required. Free plan available forever.</p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#101a22]/50 backdrop-blur-sm">
          <div className="flex flex-col justify-center py-8 px-6 lg:px-20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-[1200px] w-full mx-auto">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">© 2024 Jurnalin. All rights reserved.</p>
              <div className="flex gap-8">
                <Link href="#" className="text-slate-500 dark:text-slate-400 hover:text-[#2b9dee] dark:hover:text-[#2b9dee] transition-colors text-sm font-normal">
                  Privacy Policy
                </Link>
                <Link href="#" className="text-slate-500 dark:text-slate-400 hover:text-[#2b9dee] dark:hover:text-[#2b9dee] transition-colors text-sm font-normal">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}