'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, ImagePlus, Zap, Settings, ArrowRight, Sparkles, TrendingUp, Shield, Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';

const quickActions = [
  {
    href: '/create',
    label: 'Create Character',
    description: 'Upload a photo & extract forensic-level details',
    icon: ImagePlus,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    href: '/characters',
    label: 'My Characters',
    description: 'View & manage your character library',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    href: '/generate',
    label: 'Generate Content',
    description: 'Create photos & videos with sponsorship',
    icon: Zap,
    gradient: 'from-orange-500 to-yellow-500',
  },
  {
    href: '/settings',
    label: 'AI Settings',
    description: 'Configure providers & API keys',
    icon: Settings,
    gradient: 'from-green-500 to-emerald-500',
  },
];

const features = [
  { icon: Sparkles, title: 'Forensic Analysis', desc: 'Extract every visual detail for 100% character consistency' },
  { icon: TrendingUp, title: 'Sponsorship Ready', desc: 'Generate promotional content with natural product integration' },
  { icon: Shield, title: 'Multi-Provider', desc: 'Gemini, OpenAI, Anthropic, Qwen, and custom APIs' },
  { icon: Layers, title: 'Local Storage', desc: 'All data stored securely in your browser — no server needed' },
];

export default function DashboardPage() {
  const { characters, activeProvider } = useAppStore();

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-br from-primary/15 via-accent/8 to-transparent border border-primary/15 p-6 sm:p-8 lg:p-10"
      >
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
            Welcome to <span className="gradient-text">AI Influencer Studio</span>
          </h1>
          <p className="text-muted-foreground mt-2 sm:mt-3 max-w-xl text-sm sm:text-base">
            Create hyper-consistent AI characters, generate stunning content,
            and manage brand sponsorships.
          </p>

          <div className="flex flex-wrap gap-2.5 mt-4 sm:mt-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/60 border border-border text-xs sm:text-sm font-medium">
              <Users className="w-3.5 h-3.5 text-primary" />
              {characters.length} Characters
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/60 border border-border text-xs sm:text-sm font-medium">
              <span className={`w-2 h-2 rounded-full ${activeProvider ? 'bg-success' : 'bg-warning'}`} />
              {activeProvider ? activeProvider.name : 'No provider'}
            </div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link href={action.href}>
                  <Card className="h-full group cursor-pointer hover:border-primary/25">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-linear-to-br ${action.gradient} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm flex items-center gap-1.5">
                      {action.label}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{action.description}</p>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Platform Capabilities</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
              >
                <Card className="text-center py-6 sm:py-8">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{f.desc}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
