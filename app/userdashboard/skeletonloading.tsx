import { Skeleton } from "../../components/ui/skeleton";

const CalendarSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 md:p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-gray-200" />
                <Skeleton className="h-8 w-16 bg-gray-300" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 md:p-6 mb-6 bg-white/70 rounded-xl border-0 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-20 bg-gray-200" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 bg-gray-300 rounded-full" />
            <Skeleton className="h-6 w-32 bg-gray-200" />
          </div>
          <Skeleton className="h-8 w-16 bg-gray-200" />
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-6 bg-gray-100 rounded" />
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="aspect-square">
              <Skeleton className="h-full w-full bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <Skeleton className="h-6 w-48 bg-gray-200" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-24 bg-gray-100" />
            <Skeleton className="h-6 w-24 bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSkeleton;