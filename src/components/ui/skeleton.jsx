import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-slate-200/80 dark:bg-zinc-800/80",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
export default Skeleton;
