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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex items-center justify-around px-4 py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                item.isMain
                  ? "bg-blue-500 text-white shadow-lg scale-110 -mt-3"
                  : isActive
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon 
                className={cn(
                  "mb-1",
                  item.isMain ? "h-6 w-6" : "h-5 w-5"
                )} 
              />
              <span className={cn(
                "text-xs font-medium",
                item.isMain ? "hidden" : "block"
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