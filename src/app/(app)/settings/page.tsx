'use client';

import { ProviderSetup } from '@/components/features/provider-setup';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">AI Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your AI providers and API keys. All keys are stored locally in your browser.
        </p>
      </div>
      <ProviderSetup />
    </div>
  );
}
