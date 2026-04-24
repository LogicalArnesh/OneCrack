
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useAuth, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { User as PortalUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { 
  User as UserIcon, 
  LogOut, 
  Settings, 
  Shield, 
  LayoutDashboard, 
  ClipboardCheck, 
  LifeBuoy, 
  Bell,
  Clock,
  Loader2
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
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Memoized profile
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc<PortalUser>(profileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth/login');
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

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
            <div className="text-sm font-medium text-foreground">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-primary">
              <Bell className="w-5 h-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 pl-2 pr-4 rounded-xl hover:bg-muted/50 gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold leading-tight">{profile?.name || 'Loading...'}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight uppercase">Student</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border bg-card p-2 shadow-2xl">
                <DropdownMenuLabel className="font-headline font-bold">Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard/profile')} className="rounded-xl gap-2">
                  <Settings className="w-4 h-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl gap-2 text-destructive">
                  <LogOut className="w-4 h-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-20 md:w-64 border-r border-border bg-card/30 flex flex-col py-6">
          <nav className="flex-1 px-4 space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-semibold hidden md:inline-block">Dashboard</span>
            </Link>
            <Link href="/dashboard/tests" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors">
              <ClipboardCheck className="w-5 h-5" />
              <span className="font-semibold hidden md:inline-block">Available Tests</span>
            </Link>
            <Link href="/dashboard/results" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors">
              <Clock className="w-5 h-5" />
              <span className="font-semibold hidden md:inline-block">Past Results</span>
            </Link>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
