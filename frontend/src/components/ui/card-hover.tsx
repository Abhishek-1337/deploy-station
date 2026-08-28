import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function HoverCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "group relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40",
        className
      )}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/0 via-transparent to-emerald-500/0 opacity-0 transition duration-500 group-hover:from-violet-500/[0.07] group-hover:to-emerald-500/[0.07] group-hover:opacity-100 dark:group-hover:from-violet-500/[0.08]" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
