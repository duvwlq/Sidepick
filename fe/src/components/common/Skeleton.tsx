type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-[12px] bg-[#EFEFEF] ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="flex w-full flex-col gap-[10px] rounded-[10px] border border-[#EEEEEE] bg-[#F8F8F8] p-[16px]">
      <div className="flex gap-[6px]">
        <Skeleton className="h-[20px] w-[72px] rounded-[999px]" />
        <Skeleton className="h-[20px] w-[64px] rounded-[999px]" />
      </div>
      <Skeleton className="h-[20px] w-[70%]" />
      <div className="grid grid-cols-2 gap-[8px]">
        <Skeleton className="h-[16px] w-full" />
        <Skeleton className="h-[16px] w-full" />
        <Skeleton className="h-[16px] w-full" />
        <Skeleton className="h-[16px] w-full" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex w-full flex-col gap-[10px] bg-[#FFFFFF] px-[16px] py-[12px]">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

export function PageMessage({
  message,
  tone = 'default',
}: {
  message: string;
  tone?: 'default' | 'error';
}) {
  return (
    <div
      className={`w-full rounded-[10px] border px-[16px] py-[20px] text-center text-[14px] leading-[20px] ${
        tone === 'error'
          ? 'border-[#F5D3D3] bg-[#FFF5F5] text-[#D33B3B]'
          : 'border-[#EEEEEE] bg-[#F8F8F8] text-[#666666]'
      }`}
    >
      {message}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <PageMessage message={message} tone="error" />;
}

export function LoadingState({
  message,
  className = '',
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`w-full rounded-[10px] border border-[#EEEEEE] bg-[#F8F8F8] px-[16px] py-[20px] text-center text-[14px] leading-[20px] text-[#666666] ${className}`.trim()}
    >
      {message}
    </div>
  );
}
