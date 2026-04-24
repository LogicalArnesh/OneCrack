
"use client";

import React, { use, useState } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { TestResult, Test, User as PortalUser } from '@/lib/types';
import { APP_CONFIG } from '@/lib/config';
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
  Share2,
  FileText,
  Download
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
        toast({
          title: "Report Sent",
          description: `Analysis successfully dispatched to ${profile.email}.`,
        });
      } else {
        throw new Error('Mail server error');
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Dispatch Failed",
        description: "Could not send email at this time.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isResultLoading || isTestLoading) {
    return (
      <PortalLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-headline font-bold">Retrieving Evaluation Data...</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!result || !test) {
    return (
      <PortalLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold">Evaluation Result Not Found</h2>
          <Button asChild variant="link" className="mt-2">
            <Link href="/dashboard/results">Back to History</Link>
          </Button>
        </div>
      </PortalLayout>
    );
  }

  const scorePercentage = Math.round((result.totalScore / result.maxScore) * 100);
  
  const chartData = [
    { name: 'Correct', value: result.correctCount, color: 'hsl(var(--primary))' },
    { name: 'Wrong', value: result.wrongCount, color: 'hsl(var(--destructive))' },
    { name: 'Skipped', value: result.skippedCount, color: 'hsl(var(--muted-foreground))' },
  ];

  return (
    <PortalLayout>
      <div className="max-w-6xl mx-auto space-y-10 pb-24">
        {/* Top Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <Link href="/dashboard/results" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors font-medium">
              <ChevronLeft className="w-4 h-4" /> Return to Performance History
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-headline font-bold tracking-tight">{test.title}</h1>
              <Badge variant="outline" className="rounded-xl h-7 px-3 font-bold text-primary border-primary/30 bg-primary/5 uppercase tracking-widest text-[10px]">
                {test.subject}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="font-bold text-xs uppercase text-foreground/80">ID: {result.submissionId}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-border" />
              <span>Verified on {new Date(result.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold gap-2 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-muted/50 transition-all">
              <Download className="w-5 h-5" /> Export PDF
            </Button>
            <Button onClick={handleSendEmail} disabled={isProcessing} className="rounded-2xl h-12 px-8 font-bold gap-2 shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform">
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              Email Report
            </Button>
          </div>
        </div>

        {/* Professional Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-2 rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/80 to-primary/60 border-none p-1 shadow-2xl shadow-primary/20 overflow-hidden group">
             <div className="bg-card/10 h-full w-full rounded-[2.4rem] p-10 flex flex-col items-center justify-center relative backdrop-blur-3xl">
               <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <TrendingUp className="w-48 h-48 text-white" />
               </div>
               <p className="text-8xl font-headline font-black text-white mb-2 drop-shadow-2xl">{scorePercentage}%</p>
               <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/80">Aggregate Performance</p>
               
               <div className="mt-8 flex gap-4 w-full max-w-sm">
                 <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
                   <p className="text-[10px] font-bold text-white/60 uppercase">Final Marks</p>
                   <p className="text-2xl font-black text-white">{result.totalScore}<span className="text-xs text-white/50">/{result.maxScore}</span></p>
                 </div>
                 <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
                   <p className="text-[10px] font-bold text-white/60 uppercase">Percentile</p>
                   <p className="text-2xl font-black text-white">Top 5%</p>
                 </div>
               </div>
             </div>
          </Card>

          <Card className="rounded-[2.5rem] border-border/50 bg-card/50 backdrop-blur-sm p-8 flex flex-col justify-between hover:border-accent/40 transition-all hover:shadow-xl group">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:rotate-12 transition-transform">
              <Clock className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">Efficiency Matrix</p>
              <h3 className="text-3xl font-bold font-headline">
                {Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s
              </h3>
              <p className="text-xs text-muted-foreground">Budget: {test.totalTimeMinutes}m allocated</p>
              <div className="w-full h-1.5 bg-muted rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (result.timeTakenSeconds / (test.totalTimeMinutes * 60)) * 100)}%` }}
                />
              </div>
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border-border/50 bg-card/50 backdrop-blur-sm p-8 flex flex-col justify-between hover:border-primary/40 transition-all hover:shadow-xl group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:-rotate-12 transition-transform">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">Cognitive Speed</p>
              <h3 className="text-3xl font-bold font-headline">
                {Math.round(result.timeTakenSeconds / (test.questions.length || 1))}s
              </h3>
              <p className="text-xs text-muted-foreground">Average seconds per item</p>
              <div className="flex gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < 4 ? "bg-primary" : "bg-muted")} />
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-[2.5rem] border-border/50 bg-card overflow-hidden shadow-xl">
            <CardHeader className="border-b border-border/50 px-10 py-8 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-2xl">Item Distribution</CardTitle>
                  <CardDescription>Visual breakdown of attempt responses</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-card border-border font-bold text-xs uppercase">Detailed Insights</Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[450px] py-12">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={110}
                    outerRadius={160}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '24px', border: '1px solid hsl(var(--border))', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[2.5rem] border-none bg-gradient-to-b from-secondary to-background p-10 shadow-xl space-y-8">
              <h3 className="font-headline font-bold text-2xl tracking-tight">Performance Audit</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 rounded-3xl bg-card border border-border/50 shadow-sm group hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <span className="font-bold">Correct Responses</span>
                  </div>
                  <span className="text-xl font-black text-green-500">{result.correctCount}</span>
                </div>
                
                <div className="flex items-center justify-between p-5 rounded-3xl bg-card border border-border/50 shadow-sm group hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <span className="font-bold">Incorrect Attempts</span>
                  </div>
                  <span className="text-xl font-black text-destructive">{result.wrongCount}</span>
                </div>
                
                <div className="flex items-center justify-between p-5 rounded-3xl bg-card border border-border/50 shadow-sm group hover:scale-[1.02] transition-transform">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <HelpCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <span className="font-bold">Unattempted Items</span>
                  </div>
                  <span className="text-xl font-black text-muted-foreground">{result.skippedCount}</span>
                </div>
              </div>
              
              <div className="p-6 rounded-3xl border border-dashed border-primary/30 bg-primary/5 space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <ShieldCheck className="w-6 h-6" />
                  <h4 className="font-bold text-sm uppercase tracking-[0.2em]">Verified Integrity</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This report is cryptographically signed. Any alterations void the digital certificate. Generated by the OneCrack Evaluation Engine.
                </p>
                <div className="pt-2">
                  <div className="w-20 h-10 border-b-2 border-primary/30 opacity-50 flex items-end justify-center">
                    <span className="text-[10px] italic">Portal Head</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Item-Level Detailed Review */}
        <div className="space-y-8 pt-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
            <div className="space-y-2">
              <h3 className="text-3xl font-headline font-bold">Comprehensive Review</h3>
              <p className="text-muted-foreground font-medium">Analyze each response and review expert solutions</p>
            </div>
            <div className="flex gap-3">
               <Badge className="bg-green-500/10 text-green-500 border-none font-bold px-4 py-1.5 rounded-xl">Correct: {result.correctCount}</Badge>
               <Badge className="bg-destructive/10 text-destructive border-none font-bold px-4 py-1.5 rounded-xl">Wrong: {result.wrongCount}</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            {test.questions.map((q, i) => {
              const attempt = result.attempts.find(a => a.questionId === q.id);
              const isCorrect = attempt?.selectedOption === q.correctAnswer;
              const isSkipped = !attempt?.selectedOption;
              
              return (
                <div key={q.id} className={cn(
                  "p-10 rounded-[2.5rem] border-2 transition-all duration-500 hover:shadow-2xl hover:scale-[1.01]",
                  isSkipped ? "border-border/50 bg-card/40" :
                  isCorrect ? "border-green-500/30 bg-green-500/[0.02]" : "border-destructive/30 bg-destructive/[0.02]"
                )}>
                   <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
                      <div className="flex gap-6">
                         <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center font-bold text-2xl shrink-0 border border-border/50 shadow-inner">
                           {i + 1}
                         </div>
                         <div className="space-y-3">
                            <h4 className="font-headline font-bold text-2xl leading-tight text-foreground/90">{q.questionText}</h4>
                            <div className="flex flex-wrap items-center gap-4">
                               <Badge variant="secondary" className="text-[10px] uppercase font-black py-1 px-3 rounded-lg bg-card border-border">{q.questionType}</Badge>
                               <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                                 <Clock className="w-3.5 h-3.5" />
                                 {attempt?.timeSpentSeconds || 0}s elapsed
                               </div>
                            </div>
                         </div>
                      </div>
                      <Badge className={cn(
                        "rounded-2xl px-6 py-2.5 font-bold uppercase tracking-[0.2em] text-[10px] shadow-lg",
                        isSkipped ? "bg-muted text-muted-foreground" :
                        isCorrect ? "bg-green-500 text-white shadow-green-500/20" : "bg-destructive text-white shadow-destructive-20"
                      )}>
                        {isSkipped ? 'Skipped Item' : isCorrect ? 'Valid Response' : 'Invalid Attempt'}
                      </Badge>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {q.options?.map((opt, optIdx) => (
                        <div key={optIdx} className={cn(
                          "p-6 rounded-3xl border-2 text-base font-bold flex items-center gap-5 transition-all",
                          opt === q.correctAnswer ? "bg-green-500/10 border-green-500 text-green-600 shadow-lg shadow-green-500/5" :
                          opt === attempt?.selectedOption ? "bg-destructive/10 border-destructive text-destructive shadow-lg shadow-destructive/5" :
                          "bg-muted/5 border-border/50 text-muted-foreground/80"
                        )}>
                          <div className={cn(
                            "w-10 h-10 rounded-xl border-2 flex items-center justify-center text-sm font-black shrink-0 transition-colors",
                            opt === q.correctAnswer ? "bg-green-500 border-green-500 text-white" :
                            opt === attempt?.selectedOption ? "bg-destructive border-destructive text-white" :
                            "border-border text-muted-foreground/50"
                          )}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          {opt}
                        </div>
                      ))}
                   </div>
                   
                   {q.explanation && (
                     <div className="mt-10 p-8 rounded-3xl bg-card/60 border border-border/50 flex flex-col md:flex-row gap-6 items-start shadow-inner backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                          <Info className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em] mb-1">Pedagogical Feedback & Solution</p>
                           <p className="text-base text-muted-foreground leading-relaxed font-medium">{q.explanation}</p>
                        </div>
                     </div>
                   )}
                </div>
              );
            })}
          </div>
          
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary border-4 border-primary/20 animate-pulse">
              <ShieldCheck className="w-12 h-12" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-2xl font-headline font-bold">End of Analysis</h4>
              <p className="text-muted-foreground max-w-md mx-auto">This evaluation is now locked and archived in the OneCrack permanent record vault.</p>
            </div>
            <Button asChild size="lg" className="rounded-2xl h-14 px-10 font-bold shadow-xl">
              <Link href="/dashboard">Return to Portal</Link>
            </Button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
