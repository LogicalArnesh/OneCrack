"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/store';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
  User as UserIcon, 
  LogOut, 
  Settings, 
  Shield, 
  LayoutDashboard, 
  ClipboardCheck, 
  LifeBuoy, 
  Bell,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const currentUser = store.getCurrentUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    setUser(currentUser);

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [router]);

  const handleLogout = () => {
    store.setCurrentUser(null);
    router.push('/auth/login');
  };

  const notifyAdmin = () => {
    toast({
      title: "Support Request Sent",
      description: "Admin has been notified. You will be contacted soon.",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">O</div>
            <span className="text-xl font-headline font-bold text-foreground hidden md:inline-block">OneCrack <span className="text-primary">Test Portal</span></span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <div className="text-sm font-medium text-foreground">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-primary">
              <Bell className="w-5 h-5" />
            </Button>
            <div className="h-8 w-[1px] bg-border mx-1"></div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 pl-2 pr-4 rounded-xl hover:bg-muted/50 gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold leading-tight">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight uppercase tracking-tighter">UID: {user.uid}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border bg-card p-2 shadow-2xl">
                <DropdownMenuLabel className="font-headline font-bold">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard/profile')} className="rounded-xl gap-2 focus:bg-primary/10 focus:text-primary">
                  <UserIcon className="w-4 h-4" /> Profile Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/profile')} className="rounded-xl gap-2 focus:bg-primary/10 focus:text-primary">
                  <Settings className="w-4 h-4" /> Security Settings
                </DropdownMenuItem>
                {user.isAdmin && (
                  <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-xl gap-2 text-accent focus:bg-accent/10 focus:text-accent">
                    <Shield className="w-4 h-4" /> Admin Console
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="w-4 h-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-20 md:w-64 border-r border-border bg-card/30 flex flex-col py-6">
          <nav className="flex-1 px-4 space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary group">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-semibold hidden md:inline-block">Dashboard</span>
            </Link>
            <Link href="/dashboard/tests" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary transition-colors group">
              <ClipboardCheck className="w-5 h-5" />
              <span className="font-semibold hidden md:inline-block">Available Tests</span>
            </Link>
            <Link href="/dashboard/results" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary group">
              <Clock className="w-5 h-5" />
              <span className="font-semibold hidden md:inline-block">Past Results</span>
            </Link>
          </nav>

          <div className="px-4 mt-auto space-y-2">
            <Button onClick={notifyAdmin} variant="ghost" className="w-full justify-start gap-3 px-4 py-6 rounded-xl text-muted-foreground hover:text-accent hover:bg-accent/5">
              <LifeBuoy className="w-5 h-5" />
              <span className="font-semibold hidden md:inline-block">Support</span>
            </Button>
            
            <div className="pt-4 border-t border-border md:block hidden">
              <div className="px-4 py-3 rounded-2xl bg-muted/30 border border-border/50">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-foreground">Portal Connected</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Profile summary at bottom left as requested */}
      <div className="fixed bottom-6 left-6 z-[60] hidden lg:block">
         <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border shadow-xl hover:border-primary/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">{user.name}</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-1">UID: {user.uid}</p>
            </div>
         </Link>
      </div>
    </div>
  );
}
