"use client";

import React, { useState, useEffect } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Test, TestResult, User as PortalUser } from '@/lib/types';
import { 
  ClipboardList, 
  Award, 
  TrendingUp, 
  Sparkles, 
  Loader2, 
  AlertTriangle, 
  Activity, 
  Wifi, 
  Database, 
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { generateStudyPlan, StudyPlanOutput } from '@/ai/flows/generate-study-plan';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const [studyPlan, setStudyPlan] = useState<StudyPlanOutput | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
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

  const testsQuery = useMemoFirebase(() => query(collection(db, 'tests'), limit(5)), [db]);
  const { data: featuredTests } = useCollection<Test>(testsQuery);

  const resultsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'users', user.uid, 'testAttempts'), orderBy('timestamp', 'desc'), limit(5));
  }, [db, user]);
  const { data: recentResults } = useCollection<TestResult>(resultsQuery);

  const handleGenerateStudyPlan = async () => {
    if (!recentResults?.length) {
      toast({ title: "Evaluation Required", description: "Complete a test attempt to initialize AI roadmap." });
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const enrichedResults = recentResults.map(r => ({
        testTitle: 'Portal Assessment',
        subject: 'General',
        score: r.totalScore,
        maxScore: r.maxScore,
      }));

      const plan = await generateStudyPlan({
        studentName: userProfile?.name || 'Student',
        classLevel: userProfile?.classLevel || '12',
        recentResults: enrichedResults,
        goals: `Analyze patterns and optimize precision.`
      });

      setStudyPlan(plan);
      toast({ title: "Insights Ready", description: "AI Neural Roadmap has been synchronized." });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Sync Failed", description: "Pedagogical engine timeout." });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-12 pb-24 max-w-7xl mx-auto">
        {/* Professional Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 bg-card/20 p-10 rounded-[3rem] border border-border shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
            <Activity className="w-64 h-64 text-primary" />
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-4 py-1.5 rounded-xl border-primary/40 bg-primary/5 text-primary text-[10px] font-black tracking-widest uppercase">
                SYSTEM ACTIVE • {userProfile?.classLevel ? `CLASS ${userProfile.classLevel}` : 'AUTHENTICATING'}
              </Badge>
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="flex items-end gap-1 h-3">
                   <div className="w-1 bg-primary rounded-t-sm animate-signal h-1.5" />
                   <div className="w-1 bg-primary rounded-t-sm animate-signal-delayed h-2.5" />
                   <div className="w-1 bg-primary rounded-t-sm animate-signal-more-delayed h-3.5" />
                </div> SIGNAL ACTIVE
              </div>
            </div>
            <h1 className="text-6xl font-headline font-black text-white tracking-tighter neon-text leading-none">
              Welcome, <span className="text-primary">{userProfile?.name?.split(' ')[0] || 'Member'}</span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg max-w-md">Your High-Fidelity Evaluation Command Center is fully operational.</p>
          </div>
          <div className="relative z-10 bg-black/40 backdrop-blur-3xl px-8 py-6 rounded-[2rem] border border-white/10 shadow-2xl">
             <div className="flex items-center gap-3 mb-1">
               <Clock className="w-5 h-5 text-primary" />
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Neural Time Sync</p>
             </div>
             <p className="text-4xl font-mono font-black text-white tracking-widest">{currentTime || '--:--:--'}</p>
             <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Indian Standard Time (IST)</p>
          </div>
        </div>

        {/* Evaluations View Only */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Active Tests Queue */}
           <div className="lg:col-span-7 space-y-8">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                   <Activity className="w-5 h-5" />
                 </div>
                 <h3 className="text-3xl font-headline font-bold">Dynamic Queue</h3>
               </div>
               <Button asChild variant="link" className="text-xs font-black text-primary uppercase tracking-widest">
                 <Link href="/dashboard/tests">ALL ASSESSMENTS <ArrowRight className="w-4 h-4 ml-2" /></Link>
               </Button>
             </div>
             <div className="space-y-5">
               {featuredTests?.map(test => (
                 <div key={test.id} className="p-8 rounded-[2.5rem] bg-card/40 border border-border flex items-center justify-between group hover:border-primary/40 hover:bg-card/60 transition-all duration-500 shadow-xl">
                   <div className="space-y-3">
                     <h4 className="font-bold text-2xl tracking-tight text-white/90">{test.title}</h4>
                     <div className="flex items-center gap-4">
                        <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3">
                          {test.subject}
                        </Badge>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                           <Clock className="w-3 h-3" /> {test.totalTimeMinutes}M DURATION
                        </div>
                     </div>
                   </div>
                   <Button asChild size="lg" className="rounded-2xl font-black bg-primary text-black hover:bg-primary/90 shadow-neon-sm px-8">
                     <Link href={`/dashboard/tests/${test.id}`}>START</Link>
                   </Button>
                 </div>
               ))}
               {(!featuredTests || featuredTests.length === 0) && (
                 <div className="text-center py-24 border-2 border-dashed rounded-[3rem] border-border/50 text-muted-foreground">
                   <Database className="w-16 h-16 mx-auto mb-4 opacity-10" />
                   <p className="font-black uppercase tracking-widest text-[10px]">Evaluation Queue Empty</p>
                 </div>
               )}
             </div>
           </div>

           {/* Attempted/Stats */}
           <div className="lg:col-span-5 space-y-8">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                 <TrendingUp className="w-5 h-5" />
               </div>
               <h3 className="text-3xl font-headline font-bold">Activity Stats</h3>
             </div>
             <div className="grid grid-cols-1 gap-4">
                <Card className="rounded-[2.5rem] bg-card/40 border-border p-8">
                   <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-6">Attempts Completed</p>
                   <p className="text-7xl font-headline font-black text-primary">{(recentResults?.length || 0).toString().padStart(2, '0')}</p>
                </Card>
                <Card className="rounded-[2.5rem] bg-card/40 border-border p-8">
                   <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-6">Avg Precision</p>
                   <p className="text-7xl font-headline font-black text-accent">86.4%</p>
                </Card>
             </div>
           </div>
        </div>

        {/* Security Alert Footer */}
        <div className="p-10 rounded-[2.5rem] bg-destructive/10 border border-destructive/30 flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="w-20 h-20 rounded-[2rem] bg-destructive/20 flex items-center justify-center text-destructive shrink-0 shadow-2xl animate-pulse">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <p className="text-lg font-black text-destructive uppercase tracking-[0.2em]">High-Integrity Protocol Active</p>
            <p className="text-sm font-medium text-destructive/80 leading-relaxed max-w-4xl">
              Strict evaluation monitoring is active for all live assessments. Any forensic anomalies detected in response codes will be flagged for investigation.
            </p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
