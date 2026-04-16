'use client';

import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ className = '', glow, children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-card border border-border p-5 transition-all duration-300
        ${glow ? 'gradient-border hover:shadow-lg hover:shadow-primary/5' : 'hover:border-border/80'}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
