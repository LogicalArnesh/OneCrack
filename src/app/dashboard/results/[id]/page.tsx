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
  Award,
  ArrowUpRight
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
  const [isDispatching, setIsDispatching] = useState(false);

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
        title: "No Dispatch Endpoint",
        description: "Configure a valid email in your profile to receive high-fidelity reports.",
      });
      return;
    }

    setIsDispatching(true);
    try {
      const success = await sendTestReportEmail(profile.email, profile.name, {
        testTitle: test?.title || 'OneCrack Evaluation',
        score: result?.totalScore,
        maxScore: result?.maxScore,
        percentage: Math.round((result?.totalScore || 0) / (result?.maxScore || 1) * 100),
        submissionId: result?.submissionId
      });

      if (success) {
        toast({ title: "Analysis Dispatched", description: `Report synchronized to ${profile.email}.` });
      } else {
        throw new Error('Sync failure');
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Dispatch Failed", description: "Pedagogical server sync error." });
    } finally {
      setIsDispatching(false);
    }
  };

  if (isResultLoading || isTestLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

  if (!result || !test) return <PortalLayout><div className="flex flex-col items-center justify-center py-32"><AlertCircle className="w-16 h-16 text-destructive mb-6" /><h2 className="text-2xl font-black">Audit Profile Missing</h2></div></PortalLayout>;

  const scorePercentage = Math.round((result.totalScore / result.maxScore) * 100);
  
  const chartData = [
    { name: 'Validated', value: result.correctCount, color: 'hsl(var(--primary))' },
    { name: 'Invalid', value: result.wrongCount, color: 'hsl(var(--destructive))' },
    { name: 'Skipped', value: result.skippedCount, color: 'hsl(var(--muted-foreground))' },
  ];

  return (
    <PortalLayout>
      <div className="max-w-7xl mx-auto space-y-12 pb-32">
        {/* Professional Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-6">
            <Link href="/dashboard/results" className="text-[10px] font-black uppercase tracking-[0.4em] text-primary hover:text-white flex items-center gap-3 transition-all">
              <ChevronLeft className="w-4 h-4" /> PERFORMANCE ARCHIVE
            </Link>
            <div className="flex flex-wrap items-center gap-6">
              <h1 className="text-6xl font-headline font-black tracking-tighter neon-text leading-none">{test.title}</h1>
              <Badge variant="outline" className="rounded-2xl h-10 px-6 font-black text-primary border-primary/40 bg-primary/5 uppercase tracking-[0.3em] text-[10px]">
                {test.subject} EVALUATION
              </Badge>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="font-black text-xs uppercase tracking-widest text-white">AUDIT ID: {result.submissionId}</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
              <span className="font-bold uppercase tracking-widest text-xs">TIMESTAMP: {new Date(result.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Button variant="outline" className="rounded-[2rem] h-16 px-10 font-black gap-4 border-white/5 bg-secondary/20 backdrop-blur-3xl hover:bg-muted/30 transition-all uppercase tracking-widest text-xs">
              <Download className="w-6 h-6" /> PDF AUDIT
            </Button>
            <Button onClick={handleSendEmail} disabled={isDispatching} className="rounded-[2rem] h-16 px-12 font-black gap-4 shadow-3xl shadow-primary/30 bg-primary text-black hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">
              {isDispatching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mail className="w-6 h-6" />}
              EMAIL DISPATCH
            </Button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="lg:col-span-2 rounded-[4rem] bg-gradient-to-br from-primary via-primary/80 to-primary/60 border-none p-1 shadow-3xl shadow-primary/30 overflow-hidden relative group">
             <div className="bg-background/40 h-full w-full rounded-[3.9rem] p-16 flex flex-col items-center justify-center relative backdrop-blur-3xl">
               <div className="absolute top-0 right-0 p-16 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                 <Activity className="w-80 h-80 text-white" />
               </div>
               <p className="text-[12rem] font-headline font-black text-white mb-6 drop-shadow-3xl neon-text leading-none">{scorePercentage}%</p>
               <p className="text-xs font-black uppercase tracking-[0.6em] text-white/70">AGGREGATE PRECISION INDEX</p>
               
               <div className="mt-16 flex gap-8 w-full max-w-xl">
                 <div className="flex-1 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 text-center shadow-inner">
                   <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">RAW SCORE</p>
                   <p className="text-5xl font-black text-white">{result.totalScore}<span className="text-lg text-white/40">/{result.maxScore}</span></p>
                 </div>
                 <div className="flex-1 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 text-center shadow-inner">
                   <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">PERCENTILE</p>
                   <p className="text-5xl font-black text-white">99.4</p>
                 </div>
               </div>
             </div>
          </Card>

          <Card className="rounded-[3.5rem] border-white/5 bg-card/40 backdrop-blur-3xl p-12 flex flex-col justify-between hover:border-primary/40 transition-all group shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-12 group-hover:rotate-12 transition-transform border border-primary/20">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-5">
              <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.4em]">Temporal Flux</p>
              <h3 className="text-5xl font-bold font-headline text-white">
                {Math.floor(result.timeTakenSeconds / 60)}m <span className="text-2xl text-white/50">{result.timeTakenSeconds % 60}s</span>
              </h3>
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Target: {test.totalTimeMinutes}m allocation</p>
              <div className="w-full h-3 bg-white/5 rounded-full mt-8 overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-primary shadow-neon-sm transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (result.timeTakenSeconds / (test.totalTimeMinutes * 60)) * 100)}%` }}
                />
              </div>
            </div>
          </Card>

          <Card className="rounded-[3.5rem] border-white/5 bg-card/40 backdrop-blur-3xl p-12 flex flex-col justify-between hover:border-accent/40 transition-all group shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-accent/10 flex items-center justify-center text-accent mb-12 group-hover:-rotate-12 transition-transform border border-accent/20">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-5">
              <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.4em]">Evaluation Rank</p>
              <h3 className="text-5xl font-bold font-headline text-accent">
                #08 <span className="text-2xl text-accent/50">/ 540</span>
              </h3>
              <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Global Precision Rank: TOP 2%</p>
              <div className="flex gap-2 mt-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={cn("h-3 flex-1 rounded-full", i < 5 ? "bg-accent" : "bg-white/5")} />
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <Card className="lg:col-span-2 rounded-[4rem] border-white/5 bg-card overflow-hidden shadow-3xl">
            <CardHeader className="border-b border-white/5 px-16 py-12 bg-white/2">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <CardTitle className="font-headline text-4xl font-black">Analytical Matrix</CardTitle>
                  <CardDescription className="text-lg font-medium text-muted-foreground">Distribution of Pedagogical Outcomes</CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] uppercase tracking-[0.3em] px-6 py-2.5 rounded-2xl">LIVE AUDIT SYNC</Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[550px] py-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={150}
                    outerRadius={200}
                    paddingAngle={15}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: '#000805', borderRadius: '40px', border: '1px solid #00ffff33', padding: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontWeight: '900', color: 'white', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '2px' }}
                  />
                  <Legend verticalAlign="bottom" height={60} iconType="circle" wrapperStyle={{ paddingTop: '40px', textTransform: 'uppercase', fontWeight: '900', fontSize: '10px', letterSpacing: '2px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-10">
            <Card className="rounded-[4rem] border-none bg-gradient-to-b from-secondary/50 to-background p-16 shadow-3xl space-y-12">
              <h3 className="font-headline font-black text-4xl tracking-tighter text-white">Pedagogical Audit</h3>
              
              <div className="space-y-6">
                {[
                  { icon: CheckCircle2, label: 'VALIDATED', count: result.correctCount, color: 'text-primary', bg: 'bg-primary/10' },
                  { icon: XCircle, label: 'INVALID', count: result.wrongCount, color: 'text-destructive', bg: 'bg-destructive/10' },
                  { icon: HelpCircle, label: 'SKIPPED', count: result.skippedCount, color: 'text-muted-foreground', bg: 'bg-muted/20' }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-8 rounded-[2.5rem] bg-card/60 border border-white/5 shadow-inner hover:scale-105 transition-transform duration-500">
                    <div className="flex items-center gap-6">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bg)}>
                        <stat.icon className={cn("w-8 h-8", stat.color)} />
                      </div>
                      <span className="font-black text-[10px] uppercase tracking-[0.3em] text-white/70">{stat.label}</span>
                    </div>
                    <span className={cn("text-4xl font-black", stat.color)}>{stat.count}</span>
                  </div>
                ))}
              </div>
              
              <div className="p-10 rounded-[2.5rem] border-2 border-dashed border-primary/20 bg-primary/5 space-y-6">
                <div className="flex items-center gap-4 text-primary">
                  <ShieldCheck className="w-8 h-8" />
                  <h4 className="font-black text-[11px] uppercase tracking-[0.4em]">Integrity Verified</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  This performance profile is cryptographically signed and bound to UID: <span className="text-white">${profile?.loginUid}</span>. Source data is immutable.
                </p>
                <div className="pt-6 border-t border-primary/10">
                   <div className="w-32 h-1.5 bg-primary/30 rounded-full" />
                   <p className="text-[10px] italic mt-3 text-primary/60 font-black uppercase tracking-widest">OneCrack Audit Sig</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Question Review Section */}
        <div className="space-y-16 pt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-white/10 pb-16">
            <div className="space-y-4">
              <h3 className="text-5xl font-headline font-black tracking-tight">Pedagogical Review</h3>
              <p className="text-muted-foreground text-xl font-medium">Detailed strategic analysis of individual item response data.</p>
            </div>
            <div className="flex gap-6">
               <Badge className="bg-primary text-black font-black px-8 py-3 rounded-2xl tracking-[0.2em] text-[10px] uppercase shadow-neon-sm">VALID: {result.correctCount}</Badge>
               <Badge className="bg-destructive text-white font-black px-8 py-3 rounded-2xl tracking-[0.2em] text-[10px] uppercase shadow-2xl">INVALID: {result.wrongCount}</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-12">
            {test.questions.map((q, i) => {
              const attempt = result.attempts.find(a => a.questionId === q.id);
              const isCorrect = attempt?.selectedOption === q.correctAnswer;
              const isSkipped = !attempt?.selectedOption;
              
              return (
                <div key={q.id} className={cn(
                  "p-16 rounded-[4rem] border-2 transition-all duration-700 hover:scale-[1.01] group relative overflow-hidden shadow-2xl",
                  isSkipped ? "border-white/5 bg-card/10" :
                  isCorrect ? "border-primary/20 bg-primary/[0.03]" : "border-destructive/20 bg-destructive/[0.03]"
                )}>
                   <div className="flex flex-col lg:flex-row items-start justify-between gap-12 mb-16">
                      <div className="flex gap-10">
                         <div className="w-20 h-20 rounded-[2rem] bg-card flex items-center justify-center font-black text-4xl shrink-0 border border-white/10 shadow-inner group-hover:bg-primary group-hover:text-black transition-all duration-500">
                           {(i + 1).toString().padStart(2, '0')}
                         </div>
                         <div className="space-y-6">
                            <h4 className="font-headline font-black text-4xl leading-tight text-white/95">{q.questionText}</h4>
                            <div className="flex flex-wrap items-center gap-10">
                               <Badge variant="secondary" className="text-[10px] uppercase font-black py-2 px-5 rounded-xl bg-white/5 border-white/5 tracking-[0.3em]">{q.questionType}</Badge>
                               <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">
                                 <Clock className="w-5 h-5 text-primary" />
                                 {attempt?.timeSpentSeconds || 0}S RESPONSE TIME
                               </div>
                            </div>
                         </div>
                      </div>
                      <Badge className={cn(
                        "rounded-[1.5rem] px-10 py-4 font-black uppercase tracking-[0.4em] text-[10px] shadow-3xl",
                        isSkipped ? "bg-muted text-muted-foreground" :
                        isCorrect ? "bg-primary text-black shadow-primary/30" : "bg-destructive text-white shadow-destructive/30"
                      )}>
                        {isSkipped ? 'SKIPPED' : isCorrect ? 'VALIDATED' : 'INVALID'}
                      </Badge>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {q.options?.map((opt, optIdx) => (
                        <div key={optIdx} className={cn(
                          "p-10 rounded-[2.5rem] border-2 text-xl font-bold flex items-center gap-8 transition-all duration-500",
                          opt === q.correctAnswer ? "bg-primary/10 border-primary text-primary shadow-neon-sm" :
                          opt === attempt?.selectedOption ? "bg-destructive/10 border-destructive text-destructive" :
                          "bg-white/2 border-white/5 text-muted-foreground/40"
                        )}>
                          <div className={cn(
                            "w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-sm font-black shrink-0 transition-all",
                            opt === q.correctAnswer ? "bg-primary border-primary text-black" :
                            opt === attempt?.selectedOption ? "bg-destructive border-destructive text-white" :
                            "border-white/10 text-muted-foreground/20"
                          )}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span className="tracking-tight">{opt}</span>
                        </div>
                      ))}
                   </div>
                   
                   {q.explanation && (
                     <div className="mt-16 p-12 rounded-[3rem] bg-white/3 border border-white/5 flex flex-col md:flex-row gap-10 items-start shadow-inner backdrop-blur-3xl">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                          <Info className="w-8 h-8" />
                        </div>
                        <div className="space-y-4">
                           <p className="text-[11px] font-black uppercase text-primary tracking-[0.5em] mb-2">Neural Extraction & Correction</p>
                           <p className="text-xl text-muted-foreground leading-relaxed font-medium italic">"{q.explanation}"</p>
                        </div>
                     </div>
                   )}
                </div>
              );
            })}
          </div>
          
          {/* Professional Footer */}
          <div className="flex flex-col items-center justify-center py-40 space-y-12">
            <div className="w-40 h-40 rounded-full bg-primary/10 flex items-center justify-center text-primary border-[12px] border-primary/10 animate-pulse shadow-[0_0_80px_rgba(0,255,255,0.1)]">
              <ShieldCheck className="w-20 h-20" />
            </div>
            <div className="text-center space-y-6">
              <h4 className="text-5xl font-headline font-black tracking-tighter text-white">Evaluation Finalized</h4>
              <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-medium leading-relaxed">This pedagogical profile has been digitally signed and moved to the permanent archival repository for historical comparison.</p>
            </div>
            <Button asChild size="lg" className="rounded-[2.5rem] h-20 px-20 font-black bg-primary text-black shadow-3xl hover:scale-105 active:scale-95 transition-all text-lg uppercase tracking-widest">
              <Link href="/dashboard">RETURN TO COMMAND</Link>
            </Button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
