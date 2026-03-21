'use client';

interface BotAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

// Generate a unique gradient based on bot name
function nameToColors(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const gradients: [string, string][] = [
    ['from-nexus-400', 'to-cyber-500'],
    ['from-purple-500', 'to-pink-500'],
    ['from-emerald-400', 'to-cyan-500'],
    ['from-amber-400', 'to-orange-500'],
    ['from-rose-400', 'to-red-500'],
    ['from-blue-400', 'to-indigo-500'],
    ['from-teal-400', 'to-green-500'],
    ['from-fuchsia-400', 'to-purple-500'],
    ['from-yellow-400', 'to-amber-500'],
    ['from-cyan-400', 'to-blue-500'],
    ['from-lime-400', 'to-emerald-500'],
  ];

  return gradients[Math.abs(hash) % gradients.length];
}

export default function BotAvatar({ name, size = 40, className = '' }: BotAvatarProps) {
  const [from, to] = nameToColors(name);
  const initials = name.slice(0, 2).toUpperCase();
  const fontSize = size < 32 ? 'text-xs' : size < 48 ? 'text-sm' : 'text-base';

  return (
    <div
      className={`rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white font-bold ${fontSize} ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      {initials}
    </div>
  );
}
