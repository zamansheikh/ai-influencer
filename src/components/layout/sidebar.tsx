'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Sparkles,
  ImagePlus,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Sparkles },
  { href: '/characters', label: 'Characters', icon: Users },
  { href: '/create', label: 'Create New', icon: ImagePlus },
  { href: '/generate', label: 'Generate Content', icon: Zap },
  { href: '/settings', label: 'AI Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, characters } = useAppStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="h-screen sticky top-0 bg-card border-r border-border flex flex-col z-40"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="overflow-hidden"
          >
            <h1 className="font-bold text-lg gradient-text whitespace-nowrap">AI Influencer</h1>
          </motion.div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="ml-auto p-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
                  transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                />
              )}
              <Icon className="w-5 h-5 shrink-0 relative z-10" />
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative z-10 whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Stats */}
      {sidebarOpen && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{characters.length} characters</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success" />
              Ready
            </span>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
