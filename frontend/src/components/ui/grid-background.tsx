import { cn } from "../../lib/utils";

export function GridBackground({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("relative flex w-full items-center justify-center bg-white dark:bg-black", className)}>
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
        )}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}

export function DotBackground({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative w-full bg-white dark:bg-black", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#3f3f46_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute inset-0 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_10%,black)] dark:bg-black" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
