'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-primary/8 flex items-center justify-center mb-4 animate-float">
        {icon}
      </div>
      <h3 className="font-semibold text-base sm:text-lg text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
