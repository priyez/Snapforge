import { motion } from 'motion/react';

export function LatencyDisplay({ value, label }: { value: string, label: string }) {
  return (
    <div className="relative aspect-[16/9] rounded-xl border border-white/[0.08] bg-zinc-900/50 backdrop-blur-sm flex flex-col items-center justify-center p-12 overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent"></div>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-8xl font-bold tracking-tighter text-white"
      >
        {value}
      </motion.div>
      <div className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-500 mt-4">{label}</div>
    </div>
  );
}
