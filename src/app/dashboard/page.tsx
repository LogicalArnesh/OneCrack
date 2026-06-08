"use client";

import React, { useState } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Test, TestResult, User as PortalUser } from '@/lib/types';
import { ClipboardList, Award, TrendingUp, Sparkles, Loader2, AlertTriangle, Activity, Wifi, Database, Search } from 'lucide-react';
import Link from 'next/link';
import { generateStudyPlan, StudyPlanOutput } from '@/ai/flows/generate-study-plan';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const [studyPlan, setStudyPlan] = useState<StudyPlanOutput | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

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
      toast({ title: "History Required", description: "Complete a test attempt first." });
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const enrichedResults = recentResults.map(r => ({
        testTitle: 'Portal Evaluation',
        subject: 'General',
        score: r.totalScore,
        maxScore: r.maxScore,
      }));

      const plan = await generateStudyPlan({
        studentName: userProfile?.name || 'Student',
        classLevel: userProfile?.classLevel || '12',
        recentResults: enrichedResults,
        goals: `Analyze patterns and optimize subject-wise precision.`
      });

      setStudyPlan(plan);
      toast({ title: "Insights Ready", description: "AI Roadmap has been synchronized." });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not sync roadmap." });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-12 pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-headline font-bold text-white tracking-tighter neon-text">
              System Active, {userProfile?.name?.split(' ')[0] || 'Member'}
            </h1>
            <p className="text-muted-foreground font-medium text-lg">Central Command & Evaluation Matrix</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full border border-border">
               <Wifi className="w-4 h-4 text-primary" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white">100% Signal</span>
            </div>
            <Badge variant="secondary" className="px-6 py-2.5 rounded-2xl border-primary/30 text-primary font-black text-xs bg-primary/5 uppercase tracking-widest">
              CLASS {userProfile?.classLevel || '-'} • {userProfile?.subjectPreference || 'GENERAL'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: ClipboardList, label: 'EVALUATIONS', value: (featuredTests?.length || 0).toString().padStart(2, '0'), color: 'text-primary', bg: 'bg-primary/5' },
            { icon: Award, label: 'AVG PRECISION', value: '84.2%', color: 'text-accent', bg: 'bg-accent/5' },
            { icon: TrendingUp, label: 'COMPLETED', value: (recentResults?.length || 0).toString().padStart(2, '0'), color: 'text-white', bg: 'bg-muted/40' }
          ].map((stat, i) => (
            <Card key={i} className="rounded-[2.5rem] bg-card/40 border-border shadow-none hover:border-primary/20 transition-all group overflow-hidden relative">
              <div className={cn("absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity", stat.bg)} />
              <CardHeader className="pb-2">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn("text-6xl font-headline font-black neon-text", stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/30 flex items-center gap-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-destructive/20 flex items-center justify-center text-destructive shrink-0">
            <AlertTriangle className="w-8 h-8 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-destructive uppercase tracking-widest">Integrity Protocol Active</p>
            <p className="text-xs font-medium text-destructive/80 leading-relaxed max-w-2xl">
              Malpractice detection is active for all live evaluations. Use of external resources or tab switching will result in immediate disqualification and permanent account lockout.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-7 space-y-8">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Activity className="w-6 h-6 text-primary" />
                 <h3 className="text-3xl font-headline font-bold">Dynamic Queue</h3>
               </div>
               <Link href="/dashboard/tests" className="text-xs font-black text-primary uppercase tracking-[0.2em] hover:text-white transition-colors">View All Matrix</Link>
             </div>
             <div className="space-y-5">
               {featuredTests?.map(test => (
                 <div key={test.id} className="p-8 rounded-[2.5rem] bg-card/40 border-2 border-border/50 flex items-center justify-between group hover:border-primary/40 hover:bg-card/60 transition-all duration-500 shadow-xl">
                   <div className="space-y-3">
                     <h4 className="font-bold text-2xl tracking-tight text-white/90">{test.title}</h4>
                     <div className="flex items-center gap-4">
                        <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3">
                          {test.subject}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                           <Clock className="w-3 h-3" /> {test.totalTimeMinutes}M DURATION
                        </span>
                     </div>
                   </div>
                   <Button asChild size="lg" className="rounded-2xl font-black bg-primary text-black hover:bg-primary/90 shadow-neon-sm px-8">
                     <Link href={`/dashboard/tests/${test.id}`}>START</Link>
                   </Button>
                 </div>
               ))}
               {(!featuredTests || featuredTests.length === 0) && (
                 <div className="text-center py-24 border-2 border-dashed rounded-[3rem] border-border/50 text-muted-foreground">
                   <Database className="w-16 h-16 mx-auto mb-4 opacity-20" />
                   <p className="font-black uppercase tracking-widest text-xs">Evaluation Queue Empty</p>
                 </div>
               )}
             </div>
           </div>

           <div className="lg:col-span-5 space-y-8">
             <div className="flex items-center gap-3">
               <Sparkles className="w-6 h-6 text-accent" />
               <h3 className="text-3xl font-headline font-bold">AI Roadmap</h3>
             </div>
             <Card className="rounded-[3rem] border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden shadow-3xl">
                <CardContent className="p-12">
                  {studyPlan ? (
                    <div className="space-y-8">
                      <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
                        <p className="text-sm italic font-medium text-white/90 leading-relaxed">"{studyPlan.motivationalQuote}"</p>
                      </div>
                      <Button variant="outline" className="w-full rounded-[1.5rem] h-14 border-primary/30 text-primary font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-black transition-all" onClick={() => setStudyPlan(null)}>
                        REGENERATE INSIGHTS
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-8">
                      <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mx-auto border-2 border-primary/20 shadow-neon-sm">
                        <Sparkles className="w-10 h-10" />
                      </div>
                      <div className="space-y-4">
                        <p className="font-bold text-2xl tracking-tight text-white">Neural Mentorship</p>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                          Our AI analyzes your performance data across subjects to generate a high-impact, 7-day tactical study roadmap.
                        </p>
                      </div>
                      <Button onClick={handleGenerateStudyPlan} disabled={isGeneratingPlan} className="w-full rounded-[1.5rem] h-16 font-black bg-primary text-black shadow-neon transition-transform active:scale-95 text-xs tracking-widest">
                        {isGeneratingPlan ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 mr-2" />}
                        INITIALIZE AI ANALYSIS
                      </Button>
                    </div>
                  )}
                </CardContent>
             </Card>
           </div>
        </div>
      </div>
    </PortalLayout>
  );
}