'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';

export default function PayoutsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
