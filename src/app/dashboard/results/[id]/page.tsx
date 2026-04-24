
"use client";

import React, { use, useState } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { TestResult, Test } from '@/lib/types';
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
  Share2
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

export default function ResultDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const resultRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'testAttempts', id) : null, [db, user, id]);
  const { data: result, isLoading: isResultLoading } = useDoc<TestResult>(resultRef);

  const testRef = useMemoFirebase(() => result ? doc(db, 'tests', result.testId) : null, [db, result]);
  const { data: test, isLoading: isTestLoading } = useDoc<Test>(testRef);

  const handleSendEmail = () => {
    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      toast({
        title: "Report Sent",
        description: `Detailed analysis has been sent to ${user?.email || 'your registered email'}.`,
      });
    }, 1500);
  };

  if (isResultLoading || isTestLoading) {
    return (
      <PortalLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
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

  const scorePercentage = result.percentageScore;
  
  const chartData = [
    { name: 'Correct', value: result.correctCount, color: 'hsl(var(--primary))' },
    { name: 'Wrong', value: result.wrongCount, color: 'hsl(var(--destructive))' },
    { name: 'Skipped', value: result.skippedCount, color: 'hsl(var(--muted-foreground))' },
  ];

  return (
    <PortalLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Link href="/dashboard/results" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to History
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-headline font-bold">{test.title}</h1>
              <Badge variant="outline" className="rounded-lg h-6 font-bold text-primary border-primary/20 bg-primary/5 uppercase">
                {test.subject}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 bg-muted rounded">ID: {result.submissionId}</span>
              <span>Attempted on {new Date(result.timestamp).toLocaleDateString()}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl h-12 px-6 font-bold gap-2 border-border hover:bg-muted/50">
              <Share2 className="w-5 h-5" /> Share
            </Button>
            <Button onClick={handleSendEmail} disabled={isSendingEmail} className="rounded-xl h-12 px-6 font-bold gap-2 shadow-lg shadow-primary/20">
              {isSendingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              Email PDF Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-2 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-background border-primary/20 flex flex-col items-center justify-center py-10 relative overflow-hidden group">
             <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <TrendingUp className="w-32 h-32 text-primary" />
             </div>
             <p className="text-7xl font-headline font-black text-primary mb-2 drop-shadow-sm">{scorePercentage}%</p>
             <p className="text-xl font-bold uppercase tracking-widest text-primary/80">Accuracy Score</p>
             <div className="flex items-center gap-4 mt-4 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-primary/10">
               <div className="text-center">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase">Marks</p>
                 <p className="text-lg font-black">{result.totalScore} <span className="text-xs text-muted-foreground font-normal">/ {result.maxScore}</span></p>
               </div>
               <div className="w-px h-8 bg-border" />
               <div className="text-center">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase">Rank</p>
                 <p className="text-lg font-black">#--</p>
               </div>
             </div>
          </Card>
          
          <Card className="rounded-3xl border-border bg-card p-8 flex flex-col justify-between hover:border-accent/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Time Efficiency</p>
              <p className="text-3xl font-bold">{Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s</p>
              <p className="text-xs text-muted-foreground">Budget: {test.totalTimeMinutes} mins</p>
            </div>
          </Card>

          <Card className="rounded-3xl border-border bg-card p-8 flex flex-col justify-between hover:border-primary/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Avg. Speed</p>
              <p className="text-3xl font-bold">
                {Math.round(result.timeTakenSeconds / (test.questions.length || 1))}s
              </p>
              <p className="text-xs text-muted-foreground">Seconds / Question</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-3xl border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="font-headline">Attempt Distribution</CardTitle>
              <CardDescription>Breakdown of correct, incorrect, and skipped items</CardDescription>
            </CardHeader>
            <CardContent className="h-96 py-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl border-border bg-secondary/30 p-8 space-y-6">
              <h3 className="font-headline font-bold text-xl">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-sm group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-bold">Correct</span>
                  </div>
                  <span className="font-bold text-primary">{result.correctCount}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <span className="text-sm font-bold">Incorrect</span>
                  </div>
                  <span className="font-bold text-destructive">{result.wrongCount}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-bold">Unattempted</span>
                  </div>
                  <span className="font-bold text-muted-foreground">{result.skippedCount}</span>
                </div>
              </div>
              
              <div className="p-5 rounded-2xl border border-dashed border-primary/30 bg-primary/5 space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="w-5 h-5" />
                  <h4 className="font-bold text-xs uppercase tracking-widest">Signed Report</h4>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Evaluation generated on {new Date(result.timestamp).toLocaleString()}. Verified by OneCrack Digital ID Vault.
                </p>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-6 pt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div className="space-y-1">
              <h3 className="text-3xl font-headline font-bold">Item-Level Review</h3>
              <p className="text-muted-foreground">Deep dive into each question and your thought process</p>
            </div>
            <div className="flex gap-2">
               <Badge className="bg-primary/10 text-primary border-none font-bold">Correct: {result.correctCount}</Badge>
               <Badge className="bg-destructive/10 text-destructive border-none font-bold">Wrong: {result.wrongCount}</Badge>
            </div>
          </div>
          
          <div className="space-y-6">
            {test.questions.map((q, i) => {
              const attempt = result.attempts.find(a => a.questionId === q.id);
              const isCorrect = attempt?.selectedOption === q.correctAnswer;
              
              return (
                <div key={q.id} className={cn(
                  "p-8 rounded-3xl border-2 transition-all duration-300",
                  !attempt?.selectedOption ? "border-border bg-card/50" :
                  isCorrect ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"
                )}>
                   <div className="flex items-start justify-between gap-6 mb-8">
                      <div className="flex gap-4">
                         <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center font-bold text-lg shrink-0 border border-border">
                           {i + 1}
                         </div>
                         <div className="space-y-1">
                            <h4 className="font-bold text-xl leading-snug">{q.questionText}</h4>
                            <div className="flex items-center gap-2">
                               <Badge variant="secondary" className="text-[10px] uppercase font-black py-0 px-2 rounded-md">{q.questionType}</Badge>
                               <span className="text-xs text-muted-foreground">Time Spent: {attempt?.timeSpentSeconds || 0}s</span>
                            </div>
                         </div>
                      </div>
                      <Badge className={cn(
                        "rounded-xl px-4 py-1.5 font-bold uppercase tracking-wider text-xs",
                        !attempt?.selectedOption ? "bg-muted text-muted-foreground" :
                        isCorrect ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20"
                      )}>
                        {!attempt?.selectedOption ? 'Skipped' : isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options?.map((opt, optIdx) => (
                        <div key={optIdx} className={cn(
                          "p-4 rounded-2xl border-2 text-sm font-semibold flex items-center gap-4 transition-all",
                          opt === q.correctAnswer ? "bg-primary/10 border-primary text-primary" :
                          opt === attempt?.selectedOption ? "bg-destructive/10 border-destructive text-destructive" :
                          "bg-muted/10 border-border text-muted-foreground"
                        )}>
                          <div className={cn(
                            "w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs shrink-0 transition-colors",
                            opt === q.correctAnswer ? "bg-primary border-primary text-primary-foreground" :
                            opt === attempt?.selectedOption ? "bg-destructive border-destructive text-destructive-foreground" :
                            "border-border text-muted-foreground"
                          )}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          {opt}
                        </div>
                      ))}
                   </div>
                   
                   {q.explanation && (
                     <div className="mt-8 p-6 rounded-2xl bg-card border border-border flex gap-4 items-start shadow-inner">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Info className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-xs font-black uppercase text-primary tracking-widest mb-2">Performance Insight & Solution</p>
                           <p className="text-sm text-muted-foreground leading-relaxed font-medium">{q.explanation}</p>
                        </div>
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

