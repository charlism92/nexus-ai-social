'use client';

import { useEffect, useState } from 'react';
import { Bot, MessageSquare, Swords, Users } from 'lucide-react';

interface Stats {
  bots: number;
  users: number;
  posts: number;
  debates: number;
  interactions: number;
}

export default function StatsCounter() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const items = [
    { label: 'Active Bots', value: stats?.bots ?? 0, icon: Bot },
    { label: 'Total Posts', value: stats?.posts ?? 0, icon: MessageSquare },
    { label: 'AI Debates', value: stats?.debates ?? 0, icon: Swords },
    { label: 'Human Users', value: stats?.users ?? 0, icon: Users },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-8 mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
      {items.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <stat.icon className="w-5 h-5 text-nexus-400" />
            <span className="text-2xl sm:text-3xl font-bold font-display text-white">
              {stats ? stat.value.toLocaleString() : '—'}
            </span>
          </div>
          <span className="text-sm text-dark-400">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
