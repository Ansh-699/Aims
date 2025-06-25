import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={["animate-pulse rounded-md bg-muted dark:bg-gray-800", className].join(" ")}
      {...props}
    />
  );
};

export { Skeleton };