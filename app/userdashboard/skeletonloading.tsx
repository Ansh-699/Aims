import { Skeleton } from "../../components/ui/skeleton";

const CalendarSkeleton = () => {
  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:bg-gradient-to-br dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 min-h-fit py-2">
      <div className="w-full px-2 md:px-4 py-2">
        {/* Top Cards */}
        <div className="grid grid-cols-2 gap-2 mb-3 pb-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border animate-pulse transition-all duration-300 hover:shadow-lg ${
                i === 1
                  ? "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-200 dark:border-blue-700/50"
                  : "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-200 dark:border-red-700/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24 md:w-28 bg-blue-200/50 dark:bg-gray-600/50" />
                  <Skeleton className="h-6 md:h-7 w-12 md:w-16 bg-blue-300/50 dark:bg-gray-500/50" />
                </div>
                <div className="p-2 bg-blue-100/50 dark:bg-blue-800/50 rounded-full">
                  <Skeleton className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-blue-200/50 dark:bg-gray-600/50" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Section - Only the calendar, no daily schedule */}
        <div className="w-full p-1 md:p-2 bg-white/90 dark:bg-gray-800/90 border border-blue-200 dark:border-blue-700 shadow-lg backdrop-blur-sm rounded-xl animate-pulse">
          {/* Header */}
          <div className="flex justify-between items-center mb-0">
            <Skeleton className="h-8 md:h-10 w-16 md:w-20 bg-gray-200/50 dark:bg-gray-600/50 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 md:h-6 md:w-6 bg-indigo-300/50 dark:bg-indigo-600/50 rounded" />
              <Skeleton className="h-6 md:h-8 w-32 md:w-40 bg-gray-300/50 dark:bg-gray-500/50 rounded-lg" />
              <Skeleton className="h-4 w-4 bg-indigo-300/50 dark:bg-indigo-600/50 rounded" />
            </div>
            <Skeleton className="h-8 md:h-10 w-16 md:w-20 bg-gray-200/50 dark:bg-gray-600/50 rounded-lg" />
          </div>

          {/* Weekdays */}
          <div className="w-full grid grid-cols-7 gap-0.5 mb-0">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
              <div key={i} className="text-center py-2">
                <Skeleton className="h-3 md:h-4 w-6 md:w-8 mx-auto bg-gray-200/50 dark:bg-gray-700/50 rounded" />
              </div>
            ))}
          </div>

          {/* Calendar Grid - Matches actual calendar height */}
          <div className="w-full grid grid-cols-7 gap-0.5">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-10 md:h-12">
                <Skeleton className="h-full w-full bg-gray-100/50 dark:bg-gray-700/50 rounded-lg border transition-all duration-200">
                  <div className="h-full flex flex-col justify-center items-center p-1">
                    <Skeleton className="h-3 md:h-4 w-4 md:w-5 bg-gray-200/50 dark:bg-gray-600/50 rounded mb-0.5" />
                    <Skeleton className="h-2 md:h-2.5 w-3 md:w-4 bg-gray-300/50 dark:bg-gray-500/50 rounded" />
                  </div>
                </Skeleton>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSkeleton;
