export function CardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-white/10 rounded-lg" />
        <div className="h-4 w-24 bg-white/10 rounded" />
      </div>
      <div className="h-8 w-20 bg-white/10 rounded mb-2" />
      <div className="h-3 w-32 bg-white/10 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-6 w-48 bg-white/10 rounded mb-6" />
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-white/10 rounded" />
          ))}
        </div>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-4 bg-white/5 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-6 w-48 bg-white/10 rounded mb-6" />
      <div className="h-80 bg-white/5 rounded-lg flex items-end justify-around gap-2 p-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white/10 rounded-t"
            style={{ height: `${Math.random() * 60 + 20}%`, width: '100%' }}
          />
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(cards)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-6 w-48 bg-white/10 rounded mb-6" />
      <div className="space-y-4">
        {[...Array(items)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
            <div className="w-12 h-12 bg-white/10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-white/10 rounded" />
              <div className="h-3 w-1/2 bg-white/10 rounded" />
            </div>
            <div className="h-6 w-16 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="glass-card p-6 animate-pulse">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="h-8 w-64 bg-white/10 rounded mb-4" />
            <div className="flex gap-4">
              <div className="h-4 w-32 bg-white/10 rounded" />
              <div className="h-4 w-32 bg-white/10 rounded" />
            </div>
          </div>
          <div className="h-10 w-24 bg-white/10 rounded-lg" />
        </div>
        <div className="grid grid-cols-4 gap-4 pt-6 border-t border-white/10">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-3 w-16 bg-white/10 rounded mb-2" />
              <div className="h-6 w-20 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card p-6 animate-pulse">
        <div className="h-80 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}
