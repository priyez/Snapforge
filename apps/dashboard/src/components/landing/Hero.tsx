import { motion } from 'motion/react';
import { Link } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Camera01Icon } from '@hugeicons/core-free-icons';
import { TerminalPill } from './TerminalPill';

export function Hero() {
  return (
    <section className="relative pt-48 pb-32 px-6">
      {/* Abstract 3D Background Element (CSS) */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/4 right-20 w-64 h-64 bg-white/5 border border-white/10 rotate-12 rounded-3xl backdrop-blur-3xl animate-pulse pointer-events-none hidden lg:block"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.95] text-gradient">
              It's not a screenshot,<br />
              it's <span className="text-white">SnapForge.</span>
            </h1>
            <p className="text-sm md:text-md text-zinc-400 max-w-xl font-medium leading-relaxed">
              The easiest high-performance API for pixel-perfect website screenshots. Optimized for developers who care about speed and reliability.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <TerminalPill text="npm install @snapforge/sdk" />
            <Link to="/docs" className="btn btn-primary px-8 h-12 gap-2">
              Read the docs
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative flex justify-center lg:justify-end"
        >
          {/* CSS 3D Box Placeholder */}
          <div className="relative w-80 h-80 perspective-[1000px] group">
            <div className="absolute inset-0 bg-zinc-900 border border-white/10 rounded-2xl rotate-y-[-20deg] rotate-x-[10deg] shadow-2xl group-hover:rotate-y-0 group-hover:rotate-x-0 transition-transform duration-1000 ease-out flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <HugeiconsIcon icon={Camera01Icon} size={80} className="text-white/20" />
              <div className="absolute bottom-6 left-6 right-6 h-12 bg-white/5 rounded-lg border border-white/5 flex items-center px-4 gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "70%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="h-full bg-white/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
