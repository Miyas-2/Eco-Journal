'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Plus, Flower2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    name: 'Beranda',
    href: '/protected',
    icon: Home,
  },
  {
    name: 'Riwayat',
    href: '/protected/journal/history',
    icon: History,
  },
  {
    name: 'Tulis',
    href: '/protected/journal/new',
    icon: Plus,
    isMain: true,
  },
  {
    name: 'Taman',
    href: '/protected/garden',
    icon: Flower2,
  },
  {
    name: 'Profil',
    href: '/protected/profile',
    icon: User,
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-50/95 to-white/95 backdrop-blur-md border-t border-stone-200/50 z-50 safe-area-pb">
      <div className="flex items-center justify-around px-6 py-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ease-out",
                item.isMain
                  ? "bg-gradient-to-br from-emerald-400 via-teal-400 to-blue-400 text-white shadow-lg shadow-emerald-200/40 scale-110 -mt-4 hover:shadow-xl hover:shadow-emerald-200/60 active:scale-105"
                  : isActive
                  ? "text-emerald-600 bg-emerald-50/80 shadow-sm hover:bg-emerald-100/80"
                  : "text-stone-500 hover:text-emerald-600 hover:bg-stone-100/50 active:scale-95"
              )}
            >
              <Icon 
                className={cn(
                  "mb-1 transition-all duration-200",
                  item.isMain ? "h-7 w-7 drop-shadow-sm" : "h-5 w-5",
                  isActive && !item.isMain ? "stroke-[2.5]" : "stroke-2"
                )} 
              />
              <span className={cn(
                "text-xs font-medium transition-all duration-200",
                item.isMain ? "hidden" : "block",
                "font-sans tracking-wide",
                isActive && !item.isMain ? "font-semibold" : "font-medium"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}