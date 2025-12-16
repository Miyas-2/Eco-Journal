'use client';

import { useState } from 'react';
import { 
  Trophy, 
  Star,
  BookOpen,
  Zap,
  CheckCircle,
  Lock,
  Filter
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  points_reward: number;
}

interface AchievementsSectionProps {
  allAchievements: Achievement[];
  earnedAchievementIds: Set<string>;
  totalJournals: number;
  currentStreak: number;
}

export default function AchievementsSection({
  allAchievements,
  earnedAchievementIds,
  totalJournals,
  currentStreak
}: AchievementsSectionProps) {
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  const getAchievementIcon = (achievementName: string, isEarned: boolean) => {
    const name = achievementName.toLowerCase();
    let IconComponent;
    let colorClass = isEarned ? 'text-amber-500' : 'text-slate-400';
    let bgColorClass = isEarned ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-50 dark:bg-slate-700';

    if (name.includes('jurnal') || name.includes('menulis')) {
      IconComponent = BookOpen;
      if (isEarned) {
        colorClass = 'text-blue-500 dark:text-blue-400';
        bgColorClass = 'bg-blue-50 dark:bg-blue-900/20';
      }
    } else if (name.includes('konsisten') || name.includes('berturut')) {
      IconComponent = Zap;
      if (isEarned) {
        colorClass = 'text-orange-500 dark:text-orange-400';
        bgColorClass = 'bg-orange-50 dark:bg-orange-900/20';
      }
    } else if (name.includes('milestone') || name.includes('pencapaian')) {
      IconComponent = Trophy;
      if (isEarned) {
        colorClass = 'text-purple-500 dark:text-purple-400';
        bgColorClass = 'bg-purple-50 dark:bg-purple-900/20';
      }
    } else {
      IconComponent = Star;
      if (isEarned) {
        colorClass = 'text-emerald-500 dark:text-emerald-400';
        bgColorClass = 'bg-emerald-50 dark:bg-emerald-900/20';
      }
    }

    return { IconComponent, colorClass, bgColorClass };
  };

  const getAchievementProgress = (achievement: Achievement) => {
    const name = achievement.name.toLowerCase();
    const description = achievement.description.toLowerCase();

    if (name.includes('jurnal') || description.includes('jurnal')) {
      if (description.includes('10')) return { current: totalJournals, target: 10, percentage: Math.min((totalJournals / 10) * 100, 100) };
      if (description.includes('25')) return { current: totalJournals, target: 25, percentage: Math.min((totalJournals / 25) * 100, 100) };
      if (description.includes('50')) return { current: totalJournals, target: 50, percentage: Math.min((totalJournals / 50) * 100, 100) };
      if (description.includes('100')) return { current: totalJournals, target: 100, percentage: Math.min((totalJournals / 100) * 100, 100) };
    }

    if (name.includes('berturut') || description.includes('berturut')) {
      if (description.includes('7')) return { current: currentStreak, target: 7, percentage: Math.min((currentStreak / 7) * 100, 100) };
      if (description.includes('14')) return { current: currentStreak, target: 14, percentage: Math.min((currentStreak / 14) * 100, 100) };
      if (description.includes('30')) return { current: currentStreak, target: 30, percentage: Math.min((currentStreak / 30) * 100, 100) };
    }

    return { current: 0, target: 0, percentage: 0 };
  };

  const filteredAchievements = allAchievements.filter(achievement => {
    const isEarned = earnedAchievementIds.has(achievement.id);
    
    if (filter === 'earned') return isEarned;
    if (filter === 'locked') return !isEarned;
    return true;
  });

  const earnedCount = allAchievements.filter(a => earnedAchievementIds.has(a.id)).length;
  const lockedCount = allAchievements.length - earnedCount;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-slate-900 dark:text-white text-2xl font-bold">Milestones</h3>
        
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>All</span>
            <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
              {allAchievements.length}
            </span>
          </button>
          
          <button
            onClick={() => setFilter('earned')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'earned'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Earned</span>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              {earnedCount}
            </span>
          </button>
          
          <button
            onClick={() => setFilter('locked')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'locked'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Locked</span>
            <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
              {lockedCount}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredAchievements.map((achievement) => {
          const isEarned = earnedAchievementIds.has(achievement.id);
          const { IconComponent, colorClass, bgColorClass } = getAchievementIcon(achievement.name, isEarned);
          const progress = getAchievementProgress(achievement);
          const inProgress = !isEarned && progress.percentage > 0;

          return (
            <div
              key={achievement.id}
              className={`flex flex-col gap-4 rounded-2xl p-5 border shadow-sm transition-all ${
                isEarned
                  ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:shadow-md'
                  : inProgress
                  ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 relative overflow-hidden'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800/50 opacity-70 grayscale'
              }`}
            >
              {inProgress && (
                <div className="absolute bottom-0 left-0 h-1 bg-[#2b9dee]/20 w-full">
                  <div className="h-full bg-[#2b9dee]" style={{ width: `${progress.percentage}%` }}></div>
                </div>
              )}
              
              <div className="flex justify-between items-start">
                <div className={`size-12 rounded-full flex items-center justify-center ${bgColorClass}`}>
                  <IconComponent className={`h-6 w-6 ${colorClass}`} />
                </div>
                {isEarned ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                ) : inProgress ? (
                  <span className="text-xs font-bold text-[#2b9dee] bg-[#2b9dee]/10 px-2 py-1 rounded">
                    {progress.current}/{progress.target}
                  </span>
                ) : (
                  <Lock className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                )}
              </div>
              
              <div>
                <p className="text-slate-900 dark:text-white font-bold text-lg mb-1">
                  {achievement.name}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {achievement.description}
                </p>
              </div>
              
              {isEarned && (
                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-amber-500">
                    +{achievement.points_reward} points earned
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-300 dark:text-slate-600 mb-4 text-6xl">🏆</div>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {filter === 'earned' 
              ? "No achievements earned yet. Keep journaling to unlock them!"
              : "No locked achievements to show."}
          </p>
        </div>
      )}
    </div>
  );
}