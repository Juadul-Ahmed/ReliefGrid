
"use client";

interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({
  className = "",
}: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse motion-reduce:animate-none rounded-md bg-surface-secondary ${className}`}
    />
  );
}

interface SkeletonTextProps {
  className?: string;
  lines?: number;
}

export function SkeletonText({
  className = "",
  lines = 1,
}: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBlock
          key={index}
          className="h-4 w-full max-w-[90%] sm:max-w-full"
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
  children?: React.ReactNode;
}

export function SkeletonCard({
  className = "",
  children,
}: SkeletonCardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-5 ${className}`}
    >
      {children}
    </div>
  );
}

interface SkeletonTableRowProps {
  className?: string;
  cellCount?: number;
}

export function SkeletonTableRow({
  className = "",
  cellCount = 5,
}: SkeletonTableRowProps) {
  return (
    <div
      key={className}
      className={`grid grid-cols-2 gap-4 sm:grid-cols-5 px-5 py-4 ${className}`}
    >
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-3 w-16" />
      </div>

      {Array.from({ length: cellCount - 1 }).map((_, index) => (
        <SkeletonBlock
          key={index}
          className="h-4 w-24 hidden sm:block"
        />
      ))}
      <SkeletonBlock className="h-6 w-20 rounded-md" />
    </div>
  );
}

interface SkeletonChartCardProps {
  className?: string;
  height?: number;
}

export function SkeletonChartCard({
  className = "",
  height = 260,
}: SkeletonChartCardProps) {
  return (
    <section
      className={`rounded-xl border border-border bg-surface p-5 min-h-[${height}px] ${className}`}
    >
      <div className="mb-4">
        <SkeletonBlock className="h-5 w-36" />
        <SkeletonBlock className="mt-1 h-3 w-48" />
      </div>
      <div style={{ minHeight: height - 80 }}>
        <SkeletonBlock className="h-full w-full rounded-md" />
      </div>
    </section>
  );
}

interface SkeletonMapPlaceholderProps {
  className?: string;
  height?: number;
}

export function SkeletonMapPlaceholder({
  className = "",
  height = 500,
}: SkeletonMapPlaceholderProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface-secondary p-5 min-h-[${height}px] ${className}`}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <SkeletonBlock className="size-16 rounded-full mb-4" />
        <p className="text-sm text-muted">Loading map...</p>
      </div>
    </div>
  );
}

interface SkeletonStatCardProps {
  className?: string;
}

export function SkeletonStatCard({
  className = "",
}: SkeletonStatCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-9 w-20" />
        </div>
        <SkeletonBlock className="size-11 rounded-xl" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <SkeletonBlock className="h-4 w-12" />
        <SkeletonBlock className="h-4 w-32" />
      </div>
    </div>
  );
}

interface SkeletonDetailItemProps {
  className?: string;
}

export function SkeletonDetailItem({
  className = "",
}: SkeletonDetailItemProps) {
  return (
    <div className={className}>
      <SkeletonBlock className="h-4 w-32" />
      <SkeletonBlock className="mt-1 h-4 w-48" />
    </div>
  );
}

interface SkeletonListItemProps {
  className?: string;
  withAvatar?: boolean;
}

export function SkeletonListItem({
  className = "",
  withAvatar = true,
}: SkeletonListItemProps) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 divide-y divide-border ${className}`}
    >
      {withAvatar && <SkeletonBlock className="size-10 shrink-0 rounded-lg" />}
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-40 max-w-full" />
        <SkeletonBlock className="h-3 w-52 max-w-full" />
      </div>
      <SkeletonBlock className="h-3 w-20 shrink-0" />
    </div>
  );
}

interface SkeletonSectionHeaderProps {
  className?: string;
}

export function SkeletonSectionHeader({
  className = "",
}: SkeletonSectionHeaderProps) {
  return (
    <div className={`border-b border-border px-5 py-4 space-y-2 ${className}`}>
      <SkeletonBlock className="h-5 w-48" />
      <SkeletonBlock className="h-3 w-56" />
    </div>
  );
}
