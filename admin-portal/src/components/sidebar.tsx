'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Wrench,
  CreditCard,
  Wallet,
  FileText,
  Shield,
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Helpers', href: '/helpers', icon: Users },
  { name: 'KYC Review', href: '/kyc-review', icon: Shield },
  { name: 'Tasks', href: '/tasks', icon: ClipboardList },
  { name: 'Skills', href: '/skills', icon: Wrench },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Payouts', href: '/payouts', icon: Wallet },
  { name: 'Ledger', href: '/ledger', icon: FileText },
  { name: 'Audit Logs', href: '/audit', icon: FileText },
  { name: 'Disputes', href: '/disputes', icon: MessageSquare },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-300 lg:translate-x-0 lg:static',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold">
              H
            </div>
            <div>
              <h1 className="font-bold text-sm">HelpInMinutes</h1>
              <p className="text-xs text-muted-foreground">Admin Portal</p>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'sidebar-link',
                    isActive && 'sidebar-link-active'
                  )}
                  onClick={onClose}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Secondary Navigation */}
          <div className="px-3 py-4 border-t space-y-1">
            {secondaryNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'sidebar-link',
                    isActive && 'sidebar-link-active'
                  )}
                  onClick={onClose}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="sidebar-link w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>

          {/* User Info */}
          <div className="px-3 py-4 border-t">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin User</p>
                <p className="text-xs text-muted-foreground truncate">admin@helpinminutes.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
