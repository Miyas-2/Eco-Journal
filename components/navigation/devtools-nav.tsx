// components/navigation/devtools-nav.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Home, 
  BookOpen, 
  Trophy, 
  LogOut, 
  User as UserIcon,
  PlusCircle,
  BarChart3,
  MessageCircle,
  Map,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { signOut } from '@/app/auth/actions';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

interface DevToolsNavigationProps {
  user: User;
}

export default function DevToolsNavigation({ user }: DevToolsNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navigationItems = [
    {
      href: '/protected',
      icon: Home,
      label: 'Dashboard',
      description: 'Activity & mood summary'
    },
    {
      href: '/protected/journal/new',
      icon: PlusCircle,
      label: 'Write Journal',
      description: 'Create new journal entry'
    },
    {
      href: '/protected/journal/history',
      icon: BookOpen,
      label: 'Journal History',
      description: 'View all your journals'
    },
    {
      href: '/protected/chat',
      icon: MessageCircle,
      label: 'AI Chat',
      description: 'Talk with AI companion'
    },
    {
      href: '/protected/map',
      icon: Map,
      label: 'Global Map',
      description: 'Community mood & environment'
    },
    {
      href: '/protected/garden',
      icon: Trophy,
      label: 'Achievements',
      description: 'View achievements & badges'
    },
    {
      href: '/protected/profile',
      icon: BarChart3,
      label: 'Analytics',
      description: 'Mood & pattern analysis'
    }
  ];

  const isActiveLink = (href: string) => {
    if (href === '/protected') {
      return pathname === '/protected';
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getThemeIcon = () => {
    if (!mounted) return <Laptop className="h-4 w-4" />;
    
    if (theme === 'light') return <Sun className="h-4 w-4" />;
    if (theme === 'dark') return <Moon className="h-4 w-4" />;
    return <Laptop className="h-4 w-4" />;
  };

  const getThemeLabel = () => {
    if (!mounted) return 'System';
    
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark';
    return 'System';
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed top-4 left-4 z-50 hidden md:block">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="ghost"
          size="sm"
          className={`w-10 h-10 p-0 rounded-xl transition-all duration-300 ${
            isOpen 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' 
              : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800'
          }`}
        >
          {isOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* DevTools Panel */}
      <div style={{ fontFamily: 'Lexend, sans-serif' }} className={`fixed top-0 left-0 h-full w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-700 dark:text-slate-300 z-40 transform transition-transform duration-300 ease-out hidden md:block border-r border-slate-200 dark:border-slate-800 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="pt-12 pb-3 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#2b9dee]/10 rounded-xl flex items-center justify-center border border-[#2b9dee]/20">
                <span className="text-sm font-bold text-[#2b9dee]">
                  J
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Jurnalin</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Navigation Panel</p>
              </div>
            </div>

            {/* Theme Toggle Button - Moved here below title */}
            <Button 
              onClick={cycleTheme}
              variant="ghost" 
              className="w-full justify-start h-auto p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
            >
              {getThemeIcon()}
              <span className="text-xs ml-2">Theme: {getThemeLabel()}</span>
            </Button>
          </div>

          {/* Navigation Items - with scroll */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block p-2.5 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'bg-[#2b9dee]/10 text-[#2b9dee] border border-[#2b9dee]/20 shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-[#2b9dee]' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${isActive ? 'text-[#2b9dee]' : 'text-slate-700 dark:text-slate-200'}`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 mb-2.5 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-300 dark:border-slate-600 flex-shrink-0">
                <UserIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-800 dark:text-white truncate">
                  {user.email?.split('@')[0]}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <Button 
              onClick={handleSignOut}
              variant="ghost" 
              className="w-full justify-start h-auto p-2.5 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              <span className="text-xs">Sign Out</span>
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center pt-2.5 border-t border-slate-200 dark:border-slate-800 mt-2.5 flex-shrink-0">
            <p className="text-[10px] text-slate-400">
              Powered by Jurnalin AI
            </p>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-30 hidden md:block"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}