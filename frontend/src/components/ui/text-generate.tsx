import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function TextGenerateEffect({ words, className }: { words: string; className?: string }) {
  const wordsArray = words.split(" ");
  return (
    <div className={cn("font-semibold", className)}>
      <motion.div>
        {wordsArray.map((word, idx) => (
          <motion.span
            key={word + idx}
            className="text-zinc-900 dark:text-white"
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.35, delay: idx * 0.06 }}
          >
            {word}{" "}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
