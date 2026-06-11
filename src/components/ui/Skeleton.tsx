"use client";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer-bg rounded-xl", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-3 shadow-card">
      <Skeleton className="w-full h-36 rounded-2xl mb-3" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2 mb-3" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }: SkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
