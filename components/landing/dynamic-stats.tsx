"use client";

import { useEffect, useState } from 'react';

interface LandingStats {
  totalStudents: number;
  totalProfessors: number;
  totalClasses: number;
  totalGradeEntries: number;
  aiToolsUsed: number;
  scholarshipsAvailable: number;
}

interface DynamicStatsProps {
  variant?: 'light' | 'dark';
  layout?: '4-stats' | '6-stats';
}

export function DynamicStats({ variant = 'light', layout = '4-stats' }: DynamicStatsProps) {
  const [stats, setStats] = useState<LandingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching stats from /api/landing-stats');
        const response = await fetch('/api/landing-stats');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Response is not JSON:', text.substring(0, 200));
          throw new Error('Response is not JSON');
        }
        
        const data = await response.json();
        console.log('Stats fetched successfully:', data);
        
        // Check if the response indicates an error
        if (data.error) {
          console.warn('API returned error, using fallback stats:', data.message);
        }
        
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Fallback to default stats
        setStats({
          totalStudents: 0,
          totalProfessors: 0,
          totalClasses: 0,
          totalGradeEntries: 0,
          aiToolsUsed: 0,
          scholarshipsAvailable: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    const gridCols = layout === '6-stats' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-4';
    const maxWidth = layout === '6-stats' ? 'max-w-6xl' : 'max-w-3xl';
    const statCount = layout === '6-stats' ? 6 : 4;
    
    return (
      <div className={`grid ${gridCols} gap-8 ${maxWidth} mx-auto animate-fade-in-up delay-800`}>
        {[...Array(statCount)].map((_, i) => (
          <div key={i} className="text-center">
            <div className={`text-3xl md:text-4xl font-bold mb-2 ${
              variant === 'dark' 
                ? 'text-white' 
                : 'text-green-600 dark:text-green-400'
            }`}>
              <div className={`w-16 h-8 rounded animate-pulse mx-auto ${
                variant === 'dark' 
                  ? 'bg-white/20' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>
            </div>
            <div className={`text-sm ${
              variant === 'dark' 
                ? 'text-green-100' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              <div className={`w-20 h-4 rounded animate-pulse mx-auto ${
                variant === 'dark' 
                  ? 'bg-white/20' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const gridCols = layout === '6-stats' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-4';
  const maxWidth = layout === '6-stats' ? 'max-w-6xl' : 'max-w-3xl';

  const statsData = layout === '6-stats' ? [
    {
      value: stats.totalStudents > 0 ? `${stats.totalStudents.toLocaleString()}+` : '0+',
      label: 'Students Tracked',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      value: stats.totalProfessors > 0 ? `${stats.totalProfessors.toLocaleString()}+` : '0+',
      label: 'Professors',
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      value: stats.totalClasses > 0 ? `${stats.totalClasses.toLocaleString()}+` : '0+',
      label: 'Classes',
      color: 'text-teal-600 dark:text-teal-400'
    },
    {
      value: stats.totalGradeEntries > 0 ? `${stats.totalGradeEntries.toLocaleString()}+` : '0+',
      label: 'Grade Entries',
      color: 'text-cyan-600 dark:text-cyan-400'
    },
    {
      value: stats.aiToolsUsed > 0 ? `${stats.aiToolsUsed.toLocaleString()}+` : '0+',
      label: 'AI Tools Used',
      color: 'text-lime-600 dark:text-lime-400'
    },
    {
      value: stats.scholarshipsAvailable > 0 ? `${stats.scholarshipsAvailable.toLocaleString()}+` : '0+',
      label: 'Scholarships',
      color: 'text-orange-600 dark:text-orange-400'
    }
  ] : [
    {
      value: stats.totalStudents > 0 ? `${stats.totalStudents.toLocaleString()}+` : '0+',
      label: 'Students Tracked',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      value: stats.totalClasses > 0 ? `${stats.totalClasses.toLocaleString()}+` : '0+',
      label: 'Classes',
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      value: stats.totalGradeEntries > 0 ? `${stats.totalGradeEntries.toLocaleString()}+` : '0+',
      label: 'Grade Entries',
      color: 'text-teal-600 dark:text-teal-400'
    },
    {
      value: stats.aiToolsUsed > 0 ? `${stats.aiToolsUsed.toLocaleString()}+` : '0+',
      label: 'AI Tools Used',
      color: 'text-lime-600 dark:text-lime-400'
    }
  ];

  return (
    <div className={`grid ${gridCols} gap-8 ${maxWidth} mx-auto animate-fade-in-up delay-800`}>
      {statsData.map((stat, index) => (
        <div key={index} className="text-center">
          <div className={`text-3xl md:text-4xl font-bold mb-2 ${
            variant === 'dark' 
              ? 'text-white' 
              : stat.color
          }`}>
            {stat.value}
          </div>
          <div className={`text-sm ${
            variant === 'dark' 
              ? 'text-green-100' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
