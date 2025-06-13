import { Skeleton } from "../../components/ui/skeleton";

const CalendarSkeleton = () => {
  return (
    <div className="px-0 py-2 w-full">
      {/* Top Cards */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className={`p-3 rounded-xl border animate-pulse transition-all duration-300 ${
              i === 1
                ? "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
                : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-3 w-20 bg-blue-200" />
                <Skeleton className="h-6 w-10 bg-blue-300" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full bg-blue-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Section */}
      <div className="p-1 md:p-2 mb-0 bg-white/70 rounded-xl border-0 shadow-lg animate-pulse">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-8 w-16 bg-gray-200" />
          <Skeleton className="h-8 w-32 bg-gray-300" />
          <Skeleton className="h-8 w-16 bg-gray-200" />
        </div>

        {/* Weekdays */}
        <div className="w-full grid grid-cols-7 gap-0.5 mb-1">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-4 bg-gray-100 rounded" />
          ))}
        </div>

        {/* Calendar Grid (35 days) */}
        <div className="w-full grid grid-cols-7 gap-0.5">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="aspect-square">
              <Skeleton className="h-full w-full bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Bottom Section Skeleton */}
        <div className="mt-3 space-y-2">
          <Skeleton className="h-5 w-40 bg-gray-200" />
          <div className="flex gap-3">
            <Skeleton className="h-5 w-20 bg-gray-100" />
            <Skeleton className="h-5 w-20 bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSkeleton;
