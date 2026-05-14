function Bone({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
}

export function SkeletonListPage({ rows = 5 }) {
  return (
    <div className="p-4 md:p-6 max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-6 w-32" />
          <Bone className="h-4 w-20" />
        </div>
        <Bone className="h-9 w-32 rounded-xl" />
      </div>
      {/* Filters */}
      <div className="flex gap-3">
        <Bone className="h-8 w-48 rounded-lg" />
        <Bone className="h-8 w-40 rounded-lg" />
      </div>
      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex gap-4">
          {[120, 100, 80, 60].map((w, i) => <Bone key={i} className={`h-3 w-${w === 120 ? '28' : w === 100 ? '24' : w === 80 ? '20' : '16'}`} />)}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
            <Bone className="h-4 w-28" />
            <Bone className="h-4 w-24" />
            <Bone className="h-4 w-20 ml-auto" />
            <Bone className="h-6 w-16 rounded-full" />
            <Bone className="h-6 w-6 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><Bone className="h-6 w-40" /><Bone className="h-4 w-28" /></div>
        <Bone className="h-9 w-28 rounded-xl" />
      </div>
      {[1, 2, 3].map(s => (
        <div key={s}>
          <Bone className="h-3 w-16 mb-3" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                <Bone className="w-9 h-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Bone className="h-3 w-20" />
                  <Bone className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Bone key={i} className={`h-4 ${i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  )
}
