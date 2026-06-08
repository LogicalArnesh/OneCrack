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
  ArrowRight
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

  const testsQuery = useMemoFirebase(() => query(collection(db, 'tests'), limit(3)), [db]);
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
                <Wifi className="w-3 h-3 text-primary animate-pulse" /> SIGNAL 100%
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
             <p className="text-4xl font-mono font-black text-white tracking-widest">{currentTime || '--:--:-- --'}</p>
             <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Indian Standard Time (IST)</p>
          </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: ClipboardList, label: 'EVALUATIONS', value: (featuredTests?.length || 0).toString().padStart(2, '0'), color: 'text-primary', bg: 'bg-primary/5' },
            { icon: Award, label: 'AVG PRECISION', value: '86.4%', color: 'text-accent', bg: 'bg-accent/5' },
            { icon: TrendingUp, label: 'COMPLETED', value: (recentResults?.length || 0).toString().padStart(2, '0'), color: 'text-white', bg: 'bg-muted/40' }
          ].map((stat, i) => (
            <Card key={i} className="rounded-[2.5rem] bg-card/40 border-border hover:border-primary/30 transition-all group relative overflow-hidden">
              <div className={cn("absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity", stat.bg)} />
              <CardHeader className="pb-2">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-white/5", stat.bg, stat.color)}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <CardTitle className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn("text-6xl font-headline font-black drop-shadow-2xl", stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Evaluation & AI Grid */}
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

           {/* AI Neural Roadmap */}
           <div className="lg:col-span-5 space-y-8">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20">
                 <Sparkles className="w-5 h-5" />
               </div>
               <h3 className="text-3xl font-headline font-bold">Neural Insights</h3>
             </div>
             <Card className="rounded-[3rem] border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden shadow-3xl">
                <CardContent className="p-12">
                  {studyPlan ? (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                      <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/20 shadow-inner">
                        <p className="text-sm italic font-medium text-white/90 leading-relaxed text-center">"{studyPlan.motivationalQuote}"</p>
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] text-center">Tactical Summary</p>
                        <p className="text-xs text-muted-foreground text-center leading-relaxed font-medium">{studyPlan.summary}</p>
                      </div>
                      <Button variant="outline" className="w-full rounded-[1.5rem] h-14 border-primary/30 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-black transition-all" onClick={() => setStudyPlan(null)}>
                        RE-INITIALIZE ANALYSIS
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-10">
                      <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mx-auto border-2 border-primary/20 shadow-neon-sm">
                        <Sparkles className="w-10 h-10 animate-pulse" />
                      </div>
                      <div className="space-y-4">
                        <p className="font-black text-2xl tracking-tight text-white uppercase tracking-widest">Neural Mentorship</p>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium max-w-xs mx-auto">
                          Our LLM engine analyzes your performance metrics to generate a high-impact, 7-day tactical study roadmap.
                        </p>
                      </div>
                      <Button onClick={handleGenerateStudyPlan} disabled={isGeneratingPlan} className="w-full rounded-[1.5rem] h-16 font-black bg-primary text-black shadow-neon transition-transform active:scale-95 text-[10px] tracking-[0.2em] uppercase">
                        {isGeneratingPlan ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 mr-3" />}
                        INITIALIZE AI MENTOR
                      </Button>
                    </div>
                  )}
                </CardContent>
             </Card>
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
              Strict evaluation monitoring is active for all live assessments. Use of external resources, tab switching, or session manipulation will result in immediate disqualification and permanent identity revocation.
            </p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
