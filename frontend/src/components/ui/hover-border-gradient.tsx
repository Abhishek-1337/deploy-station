import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "div",
  duration = 1,
  clockwise = true,
}: {
  children: React.ReactNode;
  containerClassName?: string;
  className?: string;
  as?: any;
  duration?: number;
  clockwise?: boolean;
}) {
  return (
    <Tag className={cn("relative flex h-full w-full overflow-hidden rounded-xl p-[1px]", containerClassName)}>
      <div className="absolute inset-0 rounded-xl">
        <MovingBorder duration={duration} clockwise={clockwise} />
      </div>
      <div className={cn("relative flex h-full w-full items-center justify-center rounded-[11px] bg-white dark:bg-zinc-900", className)}>
        {children}
      </div>
    </Tag>
  );
}

function MovingBorder({ duration, clockwise }: { duration: number; clockwise: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-xl bg-[conic-gradient(from_0deg_at_50%_50%,#a5b4fc_0deg,#34d399_120deg,#f472b6_240deg,#a5b4fc_360deg)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{}}
      animate={{ rotate: clockwise ? 360 : -360 }}
      transition={{ duration: duration * 3, repeat: Infinity, ease: "linear" }}
    />
  );
}

// simpler static gradient button for primary CTA
export function GradientButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200",
        className
      )}
      {...props}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-500 opacity-0 blur-xl transition duration-500 group-hover:opacity-20" />
      <span className="relative">{children}</span>
    </button>
  );
}
