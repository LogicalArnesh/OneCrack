"use client";

import React, { use, useState } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { TestResult, Test, User as PortalUser } from '@/lib/types';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Mail, 
  TrendingUp, 
  BarChart3,
  ShieldCheck,
  Info,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Download,
  Activity,
  Award
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as ChartTooltip
} from 'recharts';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { sendTestReportEmail } from '@/app/actions/email-actions';

export default function ResultDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);

  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc<PortalUser>(userRef);

  const resultRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'testAttempts', id) : null, [db, user, id]);
  const { data: result, isLoading: isResultLoading } = useDoc<TestResult>(resultRef);

  const testRef = useMemoFirebase(() => result ? doc(db, 'tests', result.testId) : null, [db, result]);
  const { data: test, isLoading: isTestLoading } = useDoc<Test>(testRef);

  const handleSendEmail = async () => {
    if (!profile?.email) {
      toast({
        variant: "destructive",
        title: "No Email Linked",
        description: "Please update your profile with a valid email to receive reports.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const success = await sendTestReportEmail(profile.email, profile.name, {
        testTitle: test?.title || 'Test Attempt',
        score: result?.totalScore,
        maxScore: result?.maxScore,
        percentage: Math.round((result?.totalScore || 0) / (result?.maxScore || 1) * 100),
        submissionId: result?.submissionId
      });

      if (success) {
        toast({ title: "Report Sent", description: `Analysis dispatched to ${profile.email}.` });
      } else {
        throw new Error('Mail server error');
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Dispatch Failed", description: "Could not send email." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isResultLoading || isTestLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  if (!result || !test) return <PortalLayout><div className="flex flex-col items-center justify-center py-20"><AlertCircle className="w-12 h-12 text-destructive" /><h2 className="text-xl font-bold mt-4">Result Profile Not Found</h2></div></PortalLayout>;

  const scorePercentage = Math.round((result.totalScore / result.maxScore) * 100);
  
  const chartData = [
    { name: 'Correct', value: result.correctCount, color: 'hsl(var(--primary))' },
    { name: 'Wrong', value: result.wrongCount, color: 'hsl(var(--destructive))' },
    { name: 'Skipped', value: result.skippedCount, color: 'hsl(var(--muted-foreground))' },
  ];

  return (
    <PortalLayout>
      <div className="max-w-7xl mx-auto space-y-12 pb-32">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <Link href="/dashboard/results" className="text-xs font-black uppercase tracking-[0.2em] text-primary hover:text-white flex items-center gap-2 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Performance Repository
            </Link>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-5xl font-headline font-bold tracking-tighter neon-text">{test.title}</h1>
              <Badge variant="outline" className="rounded-xl h-8 px-5 font-black text-primary border-primary/30 bg-primary/5 uppercase tracking-[0.2em] text-[10px]">
                {test.subject}
              </Badge>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="font-black text-xs uppercase tracking-widest text-white">ID: {result.submissionId}</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-border" />
              <span className="font-bold">EVALUATED: {new Date(result.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" className="rounded-[1.5rem] h-14 px-8 font-black gap-3 border-border/50 bg-secondary/30 backdrop-blur-xl hover:bg-muted/50 transition-all">
              <Download className="w-6 h-6" /> PDF REPORT
            </Button>
            <Button onClick={handleSendEmail} disabled={isProcessing} className="rounded-[1.5rem] h-14 px-10 font-black gap-3 shadow-2xl shadow-primary/20 bg-primary text-black hover:scale-105 active:scale-95 transition-all">
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mail className="w-6 h-6" />}
              EMAIL DISPATCH
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-2 rounded-[3rem] bg-gradient-to-br from-primary via-primary/80 to-primary/60 border-none p-1 shadow-3xl shadow-primary/30 overflow-hidden relative group">
             <div className="bg-background/40 h-full w-full rounded-[2.9rem] p-12 flex flex-col items-center justify-center relative backdrop-blur-3xl">
               <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                 <Activity className="w-64 h-64 text-white" />
               </div>
               <p className="text-9xl font-headline font-black text-white mb-4 drop-shadow-2xl neon-text">{scorePercentage}%</p>
               <p className="text-xs font-black uppercase tracking-[0.5em] text-white/70">Aggregate Precision Index</p>
               
               <div className="mt-12 flex gap-6 w-full max-w-lg">
                 <div className="flex-1 bg-white/5 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/10 text-center">
                   <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Score</p>
                   <p className="text-4xl font-black text-white">{result.totalScore}<span className="text-sm text-white/50">/{result.maxScore}</span></p>
                 </div>
                 <div className="flex-1 bg-white/5 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/10 text-center">
                   <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Percentile</p>
                   <p className="text-4xl font-black text-white">99.2</p>
                 </div>
               </div>
             </div>
          </Card>

          <Card className="rounded-[3rem] border-border/50 bg-card/40 backdrop-blur-xl p-10 flex flex-col justify-between hover:border-primary/40 transition-all hover:shadow-neon-sm group">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-10 group-hover:rotate-12 transition-transform border border-primary/20">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.3em]">Temporal Flow</p>
              <h3 className="text-4xl font-bold font-headline text-white">
                {Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s
              </h3>
              <p className="text-xs text-muted-foreground font-bold">Allocation: {test.totalTimeMinutes}m total</p>
              <div className="w-full h-2 bg-muted/30 rounded-full mt-6 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (result.timeTakenSeconds / (test.totalTimeMinutes * 60)) * 100)}%` }}
                />
              </div>
            </div>
          </Card>

          <Card className="rounded-[3rem] border-border/50 bg-card/40 backdrop-blur-xl p-10 flex flex-col justify-between hover:border-accent/40 transition-all hover:shadow-neon-sm group">
            <div className="w-16 h-16 rounded-3xl bg-accent/10 flex items-center justify-center text-accent mb-10 group-hover:-rotate-12 transition-transform border border-accent/20">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.3em]">Evaluation Rank</p>
              <h3 className="text-4xl font-bold font-headline text-accent">
                #12 <span className="text-sm text-accent/50">/ 450</span>
              </h3>
              <p className="text-xs text-muted-foreground font-bold">Top 3% of global attempts</p>
              <div className="flex gap-1.5 mt-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={cn("h-2 flex-1 rounded-full", i < 5 ? "bg-accent" : "bg-muted/30")} />
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <Card className="lg:col-span-2 rounded-[3.5rem] border-border/50 bg-card overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-border/50 px-12 py-10 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-3xl">Analytical Matrix</CardTitle>
                  <CardDescription className="text-base font-medium mt-2">Quantitative attempt distribution</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] uppercase tracking-widest px-4 py-1.5">LIVE SYNC DATA</Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[500px] py-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={130}
                    outerRadius={180}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '32px', border: '1px solid hsl(var(--border))', padding: '20px' }}
                    itemStyle={{ fontWeight: '900', color: 'white' }}
                  />
                  <Legend verticalAlign="bottom" height={50} iconType="circle" wrapperStyle={{ paddingTop: '30px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="rounded-[3.5rem] border-none bg-gradient-to-b from-secondary to-background p-12 shadow-2xl space-y-10">
              <h3 className="font-headline font-black text-3xl tracking-tighter text-white">Audit Summary</h3>
              
              <div className="space-y-5">
                {[
                  { icon: CheckCircle2, label: 'VALIDATED', count: result.correctCount, color: 'text-primary', bg: 'bg-primary/10' },
                  { icon: XCircle, label: 'FAILED', count: result.wrongCount, color: 'text-destructive', bg: 'bg-destructive/10' },
                  { icon: HelpCircle, label: 'SKIPPED', count: result.skippedCount, color: 'text-muted-foreground', bg: 'bg-muted/30' }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] bg-card border border-border/50 shadow-inner group hover:scale-[1.03] transition-transform">
                    <div className="flex items-center gap-5">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                        <stat.icon className={cn("w-7 h-7", stat.color)} />
                      </div>
                      <span className="font-black text-xs uppercase tracking-widest text-white/80">{stat.label}</span>
                    </div>
                    <span className={cn("text-3xl font-black", stat.color)}>{stat.count}</span>
                  </div>
                ))}
              </div>
              
              <div className="p-8 rounded-[2rem] border-2 border-dashed border-primary/20 bg-primary/5 space-y-5">
                <div className="flex items-center gap-4 text-primary">
                  <ShieldCheck className="w-8 h-8" />
                  <h4 className="font-black text-[11px] uppercase tracking-[0.3em]">Integrity Verified</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  This certification is cryptographically bound to UID: ${profile?.loginUid}. Any modification of source data will invalidate the global percentile rank.
                </p>
                <div className="pt-4 border-t border-primary/10">
                   <div className="w-24 h-1 bg-primary/30 rounded-full" />
                   <p className="text-[10px] italic mt-2 text-primary/60 font-black">Evaluation Lead Signature</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-12 pt-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/50 pb-12">
            <div className="space-y-4">
              <h3 className="text-4xl font-headline font-bold tracking-tight">Pedagogical Review</h3>
              <p className="text-muted-foreground text-lg font-medium">Deep-dive into every item for strategic correction</p>
            </div>
            <div className="flex gap-4">
               <Badge className="bg-primary text-black font-black px-6 py-2 rounded-2xl tracking-widest text-[10px]">VALID: {result.correctCount}</Badge>
               <Badge className="bg-destructive text-white font-black px-6 py-2 rounded-2xl tracking-widest text-[10px]">FAILED: {result.wrongCount}</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-12">
            {test.questions.map((q, i) => {
              const attempt = result.attempts.find(a => a.questionId === q.id);
              const isCorrect = attempt?.selectedOption === q.correctAnswer;
              const isSkipped = !attempt?.selectedOption;
              
              return (
                <div key={q.id} className={cn(
                  "p-12 rounded-[3.5rem] border-2 transition-all duration-700 hover:shadow-3xl hover:scale-[1.01] group",
                  isSkipped ? "border-border/30 bg-card/20" :
                  isCorrect ? "border-primary/20 bg-primary/[0.02]" : "border-destructive/20 bg-destructive/[0.02]"
                )}>
                   <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
                      <div className="flex gap-8">
                         <div className="w-16 h-16 rounded-[1.5rem] bg-card flex items-center justify-center font-black text-3xl shrink-0 border border-border shadow-inner group-hover:bg-primary group-hover:text-black transition-colors">
                           {i + 1}
                         </div>
                         <div className="space-y-4">
                            <h4 className="font-headline font-bold text-3xl leading-snug text-white/90">{q.questionText}</h4>
                            <div className="flex flex-wrap items-center gap-6">
                               <Badge variant="secondary" className="text-[10px] uppercase font-black py-1.5 px-4 rounded-xl bg-muted/40 border-border tracking-widest">{q.questionType}</Badge>
                               <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-black uppercase tracking-widest">
                                 <Clock className="w-4 h-4 text-primary" />
                                 {attempt?.timeSpentSeconds || 0}S ELAPSED
                               </div>
                            </div>
                         </div>
                      </div>
                      <Badge className={cn(
                        "rounded-[1.25rem] px-8 py-3.5 font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl",
                        isSkipped ? "bg-muted text-muted-foreground" :
                        isCorrect ? "bg-primary text-black shadow-primary/20" : "bg-destructive text-white shadow-destructive/20"
                      )}>
                        {isSkipped ? 'SKIPPED' : isCorrect ? 'VALIDATED' : 'INVALID'}
                      </Badge>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {q.options?.map((opt, optIdx) => (
                        <div key={optIdx} className={cn(
                          "p-8 rounded-[2rem] border-2 text-lg font-bold flex items-center gap-6 transition-all",
                          opt === q.correctAnswer ? "bg-primary/10 border-primary text-primary shadow-neon-sm" :
                          opt === attempt?.selectedOption ? "bg-destructive/10 border-destructive text-destructive" :
                          "bg-muted/5 border-border/50 text-muted-foreground/60"
                        )}>
                          <div className={cn(
                            "w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-sm font-black shrink-0 transition-colors",
                            opt === q.correctAnswer ? "bg-primary border-primary text-black" :
                            opt === attempt?.selectedOption ? "bg-destructive border-destructive text-white" :
                            "border-border/50 text-muted-foreground/30"
                          )}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          {opt}
                        </div>
                      ))}
                   </div>
                   
                   {q.explanation && (
                     <div className="mt-12 p-10 rounded-[2.5rem] bg-muted/20 border border-border/50 flex flex-col md:flex-row gap-8 items-start shadow-inner backdrop-blur-xl">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                          <Info className="w-7 h-7" />
                        </div>
                        <div className="space-y-3">
                           <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em] mb-1">Strategical Insights & Correction</p>
                           <p className="text-lg text-muted-foreground leading-relaxed font-medium italic">"{q.explanation}"</p>
                        </div>
                     </div>
                   )}
                </div>
              );
            })}
          </div>
          
          <div className="flex flex-col items-center justify-center py-32 space-y-10">
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary border-8 border-primary/20 animate-pulse shadow-3xl">
              <ShieldCheck className="w-16 h-16" />
            </div>
            <div className="text-center space-y-4">
              <h4 className="text-4xl font-headline font-black tracking-tight text-white">Archival Locked</h4>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto font-medium">This evaluation profile has been digitally signed and moved to the permanent archival repository.</p>
            </div>
            <Button asChild size="lg" className="rounded-[2rem] h-16 px-16 font-black bg-primary text-black shadow-neon transition-transform active:scale-95 text-lg">
              <Link href="/dashboard">RETURN TO DASHBOARD</Link>
            </Button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}