// ======================================================
// File: src/components/ui/Skeleton.tsx
// ======================================================

/*
  [Skeleton 컴포넌트]
  
  - 로딩 중 실제 콘텐츠의 모양을 미리 보여주는 스켈레톤 UI
  - animate-pulse 애니메이션 사용
  - 다양한 크기와 모양 지원
*/

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// 디바이스 카드 스켈레톤
export function DeviceCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-16 w-full mb-2" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

// 확장된 디바이스 카드 스켈레톤
export function DeviceCardExpandedSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white border border-gray-200 col-span-2">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-32 w-full mb-4" />
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

// 무드 대시보드 스켈레톤
export function MoodDashboardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white border border-gray-200 mb-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-24 w-full mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
}

// 프로필 스켈레톤
export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

