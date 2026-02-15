'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Menu, Bell, Search, Sun, Moon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'New helper registered', time: '5 min ago', read: false },
    { id: 2, title: 'KYC documents submitted', time: '15 min ago', read: false },
    { id: 3, title: 'Task completed', time: '1 hour ago', read: true },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search helpers, tasks..."
              className="w-64 pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Mobile search toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Sun className="h-5 w-5 dark:hidden" />
            <Moon className="h-5 w-5 hidden dark:block" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-lg border shadow-lg z-50">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    <button className="text-sm text-primary hover:underline">
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 border-b hover:bg-accent transition-colors cursor-pointer',
                          !notification.read && 'bg-primary/5'
                        )}
                      >
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.time}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2">
                    <button className="w-full btn-ghost text-sm">
                      View all notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User menu (mobile) */}
          <button className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium text-sm">A</span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {showSearch && (
        <div className="md:hidden absolute top-full left-0 right-0 p-4 bg-background border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search helpers, tasks..."
              className="w-full pl-10 pr-10 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <button
              onClick={() => setShowSearch(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
