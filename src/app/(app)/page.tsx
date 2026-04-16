'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  ImagePlus,
  Zap,
  Settings,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';

const quickActions = [
  {
    href: '/create',
    label: 'Create Character',
    description: 'Upload a photo and extract forensic-level character details',
    icon: ImagePlus,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    href: '/characters',
    label: 'My Characters',
    description: 'View and manage your AI influencer character library',
    icon: Users,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    href: '/generate',
    label: 'Generate Content',
    description: 'Create photos and videos with sponsorship integration',
    icon: Zap,
    gradient: 'from-orange-500 to-yellow-500',
  },
  {
    href: '/settings',
    label: 'AI Settings',
    description: 'Configure your AI providers and API keys',
    icon: Settings,
    gradient: 'from-green-500 to-emerald-500',
  },
];

const features = [
  {
    icon: Sparkles,
    title: 'Forensic Analysis',
    description: 'Extract every visual detail from reference photos for 100% character consistency',
  },
  {
    icon: TrendingUp,
    title: 'Sponsorship Ready',
    description: 'Generate promotional content with natural product integration',
  },
  {
    icon: Shield,
    title: 'Multi-Provider',
    description: 'Support for Gemini, OpenAI, Anthropic, and custom APIs',
  },
];

export default function DashboardPage() {
  const { characters, activeProvider } = useAppStore();

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-transparent border border-primary/20 p-8 lg:p-12"
      >
        <div className="relative z-10">
          <h1 className="text-3xl lg:text-4xl font-bold">
            Welcome to <span className="gradient-text">AI Influencer Studio</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-lg">
            Create hyper-consistent AI influencer characters, generate stunning content,
            and manage brand sponsorships — all from one powerful platform.
          </p>

          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{characters.length} Characters</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border">
              <span className={`w-2 h-2 rounded-full ${activeProvider ? 'bg-success' : 'bg-warning'}`} />
              <span className="text-sm font-medium">
                {activeProvider ? `${activeProvider.name} connected` : 'No AI provider'}
              </span>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={action.href}>
                  <Card className="h-full group cursor-pointer hover:border-primary/30">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      {action.label}
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Platform Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <Card className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
