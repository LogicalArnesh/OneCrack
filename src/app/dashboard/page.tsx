"use client";

import React, { useState, useEffect } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, limit, doc } from 'firebase/firestore';
import { Test, User as PortalUser } from '@/lib/types';
import { 
  Activity, 
  Clock,
  ShieldCheck,
  Zap,
  Cpu,
  Wifi,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const istTime = new Date().toLocaleTimeString('en-IN', { 
        timeZone: 'Asia/Kolkata', 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(istTime);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const userProfileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc<PortalUser>(userProfileRef);

  const testsQuery = useMemoFirebase(() => query(collection(db, 'tests'), limit(10)), [db]);
  const { data: featuredTests } = useCollection<Test>(testsQuery);

  const isAdmin = userProfile?.isAdmin || userProfile?.loginUid === 'admin' || user?.email?.includes('admin');

  return (
    <PortalLayout>
      <div className="space-y-12 pb-24 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex flex-col md:flex-row md:items-end justify-between gap-8 bg-card/20 p-10 rounded-[3rem] border border-border shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
              <Activity className="w-64 h-64 text-primary" />
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-4 py-1.5 rounded-xl border-primary/40 bg-primary/5 text-primary text-[10px] font-black tracking-widest uppercase">
                  {isAdmin ? 'SYSTEM ADMINISTRATOR' : 'ACTIVE CANDIDATE'} • ONLINE
                </Badge>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <div className="flex items-end gap-1.5 h-4">
                     <div className="w-1.5 bg-primary rounded-t-sm animate-signal h-2" />
                     <div className="w-1.5 bg-primary rounded-t-sm animate-signal-delayed h-3" />
                     <div className="w-1.5 bg-primary rounded-t-sm animate-signal-more-delayed h-4" />
                  </div> PORTAL SYNCED
                </div>
              </div>
              <h1 className="text-6xl font-headline font-black text-white tracking-tighter neon-text leading-none">
                {isAdmin ? 'ADMIN' : (userProfile?.name?.split(' ')[0] || 'Member')} <span className="text-primary font-headline">Sector</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg max-w-sm">Evaluations are live. Integrity monitoring is active across all sectors.</p>
            </div>
            <div className="relative z-10 bg-black/40 backdrop-blur-3xl px-8 py-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
               <div className="flex items-center gap-3 mb-1">
                 <Wifi className="w-5 h-5 text-primary animate-pulse" />
                 <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">NEURAL TIME SYNC</p>
               </div>
               <p className="text-4xl font-mono font-black text-white tracking-widest">{currentTime || '--:--:--'}</p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="lg:w-80 flex flex-col gap-4">
              <Card className="flex-1 rounded-[3rem] bg-primary/10 border-primary/30 border-dashed hover:bg-primary/20 transition-all p-8 flex flex-col items-center justify-center text-center group" asChild>
                <Link href="/admin">
                  <Zap className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Matrix: System Forge</p>
                  <p className="text-xl font-headline font-black text-white uppercase">Initialize Forge</p>
                  <ChevronRight className="w-5 h-5 mt-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h3 className="text-3xl font-headline font-bold">Active Evaluations</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredTests?.map(test => (
              <div key={test.id} className="p-8 rounded-[3rem] bg-card/40 border border-border flex flex-col justify-between group hover:border-primary/40 hover:bg-card/60 transition-all duration-500 shadow-xl min-h-[220px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3">
                      {test.examStream} • {test.subject}
                    </Badge>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                       <Clock className="w-3 h-3" /> {test.totalTimeMinutes}M
                    </div>
                  </div>
                  <h4 className="font-bold text-3xl tracking-tight text-white/90">{test.title}</h4>
                </div>
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">High Integrity</span>
                  </div>
                  <Button asChild className="rounded-2xl font-black bg-primary text-black hover:bg-primary/90 shadow-neon-sm px-10 h-12">
                    <Link href={`/dashboard/tests/${test.id}`}>INITIALIZE</Link>
                  </Button>
                </div>
              </div>
            ))}
            {(!featuredTests || featuredTests.length === 0) && (
              <div className="col-span-full py-32 text-center border-2 border-dashed rounded-[3rem] border-white/10 text-muted-foreground">
                <Cpu className="w-16 h-16 mx-auto mb-4 opacity-10" />
                <p className="font-black uppercase tracking-widest text-[10px]">No active evaluations detected in your sector.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}