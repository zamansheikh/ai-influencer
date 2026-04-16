'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Sparkles,
  ImagePlus,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
  X,
  Menu,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Sparkles },
  { href: '/characters', label: 'Characters', icon: Users },
  { href: '/create', label: 'Create New', icon: ImagePlus },
  { href: '/generate', label: 'Generate', icon: Zap },
  { href: '/settings', label: 'AI Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { characters } = useAppStore();

  // Desktop: expanded/collapsed. Mobile: open/closed drawer
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ========== MOBILE ========== */}

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 glass flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm gradient-text">AI Influencer</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Mobile slide-out drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="md:hidden fixed top-14 left-0 bottom-0 w-[260px] bg-card border-r border-border z-50 flex flex-col"
          >
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${isActive ? 'bg-primary/10 text-foreground border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-4 px-3 text-xs text-muted-foreground">
                {characters.length} character{characters.length !== 1 ? 's' : ''} saved
              </div>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass">
        <nav className="flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-[48px]
                  ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ========== DESKTOP ========== */}
      <motion.aside
        initial={false}
        animate={{ width: desktopExpanded ? 240 : 64 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="hidden md:flex h-screen sticky top-0 bg-card/50 border-r border-border flex-col z-40 shrink-0"
      >
        {/* Logo row */}
        <div className={`flex items-center h-14 border-b border-border shrink-0 ${desktopExpanded ? 'px-4 gap-2.5' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {desktopExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bold text-sm gradient-text whitespace-nowrap flex-1"
            >
              AI Influencer
            </motion.span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!desktopExpanded ? item.label : undefined}
                className={`relative flex items-center rounded-xl text-[13px] font-medium transition-all duration-200
                  ${desktopExpanded ? 'gap-2.5 px-3 py-2' : 'justify-center px-0 py-2.5'}
                  ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktopNav"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
                    transition={{ type: 'spring', duration: 0.35, bounce: 0.12 }}
                  />
                )}
                <Icon className="w-[18px] h-[18px] shrink-0 relative z-10" />
                {desktopExpanded && (
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

        {/* Footer with collapse toggle */}
        <div className="border-t border-border shrink-0">
          {desktopExpanded && (
            <div className="px-3 pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{characters.length} characters</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Ready
              </span>
            </div>
          )}
          <div className={`p-2 ${desktopExpanded ? '' : 'flex justify-center'}`}>
            <button
              onClick={() => setDesktopExpanded(!desktopExpanded)}
              className={`p-2 rounded-xl hover:bg-secondary transition-colors cursor-pointer text-muted-foreground hover:text-foreground
                ${desktopExpanded ? 'w-full flex items-center gap-2 px-3' : ''}`}
              title={desktopExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {desktopExpanded ? (
                <>
                  <PanelLeftClose className="w-4 h-4" />
                  <span className="text-xs">Collapse</span>
                </>
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
