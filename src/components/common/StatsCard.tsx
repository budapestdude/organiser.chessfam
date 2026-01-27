import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  change?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gold';
}

export default function StatsCard({ title, value, icon: Icon, change, color = 'blue' }: StatsCardProps) {
  const bgColorClasses = {
    blue: 'bg-blue-500/10',
    green: 'bg-green-500/10',
    yellow: 'bg-yellow-500/10',
    red: 'bg-red-500/10',
    purple: 'bg-purple-500/10',
    gold: 'bg-gold-500/10',
  };

  const strokeColors = {
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444',
    purple: '#8b5cf6',
    gold: '#f59e0b',
  };

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/60 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-2 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change}% from yesterday
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${bgColorClasses[color]}`}>
          <Icon className="w-6 h-6" style={{ stroke: strokeColors[color] }} />
        </div>
      </div>
    </div>
  );
}
