
"use client";

import React, { useState } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Test, TestResult, User as PortalUser } from '@/lib/types';
import { ClipboardList, Award, TrendingUp, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
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

  const testsQuery = useMemoFirebase(() => query(collection(db, 'tests'), limit(3)), [db]);
  const { data: featuredTests } = useCollection<Test>(testsQuery);

  const resultsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'users', user.uid, 'testAttempts'), orderBy('timestamp', 'desc'), limit(5));
  }, [db, user]);
  const { data: recentResults } = useCollection<TestResult>(resultsQuery);

  const handleGenerateStudyPlan = async () => {
    if (!recentResults?.length) {
      toast({ title: "History Required", description: "Complete a test first." });
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const enrichedResults = recentResults.map(r => ({
        testTitle: 'Evaluation Attempt',
        subject: 'General',
        score: r.totalScore,
        maxScore: r.maxScore,
      }));

      const plan = await generateStudyPlan({
        studentName: userProfile?.name || 'Student',
        classLevel: userProfile?.classLevel || '12',
        recentResults: enrichedResults,
        goals: `Improve accuracy and focus on weak areas.`
      });

      setStudyPlan(plan);
      toast({ title: "Roadmap Ready", description: "AI has generated your 7-day plan." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not generate plan." });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-bold text-foreground">Welcome Back, {userProfile?.name?.split(' ')[0] || 'Student'}</h1>
            <p className="text-muted-foreground font-medium">Your centralized academic command center.</p>
          </div>
          <Badge variant="secondary" className="px-4 py-1.5 rounded-xl border-primary/20 text-primary font-bold text-sm bg-primary/10">
            Class {userProfile?.classLevel || '-'} • {userProfile?.subjectPreference || 'General'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-[2rem] bg-card border-border shadow-none">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <ClipboardList className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl font-headline">Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-headline font-black text-primary">{(featuredTests?.length || 0).toString().padStart(2, '0')}</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] bg-card border-border shadow-none">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-2">
                <Award className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl font-headline">Avg Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-headline font-black text-accent">88%</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] bg-card border-border shadow-none">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground/70 mb-2">
                <TrendingUp className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl font-headline">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-headline font-black text-foreground">{recentResults?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Malpractice Warning */}
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
          <p className="text-xs font-bold text-destructive">
            ATTENTION: OneCrack maintains a zero-tolerance policy for malpractice. Any use of unfair means will result in immediate termination of the evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="space-y-6">
             <div className="flex items-center justify-between">
               <h3 className="text-2xl font-headline font-bold">Featured Evaluations</h3>
               <Link href="/dashboard/tests" className="text-sm font-bold text-primary hover:underline">View All</Link>
             </div>
             <div className="space-y-4">
               {featuredTests?.map(test => (
                 <div key={test.id} className="p-5 rounded-[2rem] bg-card border border-border flex items-center justify-between group hover:border-primary transition-all">
                   <div>
                     <h4 className="font-bold text-lg">{test.title}</h4>
                     <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{test.subject} • {test.totalTimeMinutes}m</p>
                   </div>
                   <Button asChild size="sm" className="rounded-xl font-bold bg-primary hover:bg-primary/90">
                     <Link href={`/dashboard/tests/${test.id}`}>Engage</Link>
                   </Button>
                 </div>
               ))}
               {(!featuredTests || featuredTests.length === 0) && (
                 <div className="text-center py-10 border border-dashed rounded-[2rem] text-muted-foreground">
                   No tests currently available.
                 </div>
               )}
             </div>
           </div>

           <div className="space-y-6">
             <h3 className="text-2xl font-headline font-bold">AI Performance Roadmap</h3>
             <Card className="rounded-[2rem] border-primary/20 bg-gradient-to-br from-primary/5 to-card overflow-hidden">
                <CardContent className="p-8">
                  {studyPlan ? (
                    <div className="space-y-4">
                      <p className="text-sm italic font-medium">"{studyPlan.motivationalQuote}"</p>
                      <Button variant="outline" className="w-full rounded-xl border-primary/30 text-primary font-bold" onClick={() => setStudyPlan(null)}>
                        Regenerate Roadmap
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold text-lg">Personalized AI Mentorship</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Allow OneCrack AI to analyze your recent attempts and create a high-impact study schedule tailored for your weaknesses.
                        </p>
                      </div>
                      <Button onClick={handleGenerateStudyPlan} disabled={isGeneratingPlan} className="w-full rounded-xl font-bold h-11">
                        {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Generate Insight
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
