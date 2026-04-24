
"use client";

import React, { use } from 'react';
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
  Download, 
  TrendingUp, 
  BarChart3,
  ShieldCheck,
  Info,
  Loader2,
  AlertCircle
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

export default function ResultDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const { user } = useUser();

  const resultRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'testAttempts', id) : null, [db, user, id]);
  const { data: result, isLoading: isResultLoading } = useDoc<TestResult>(resultRef);

  const testRef = useMemoFirebase(() => result ? doc(db, 'tests', result.testId) : null, [db, result]);
  const { data: test, isLoading: isTestLoading } = useDoc<Test>(testRef);

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
        </div>
      </PortalLayout>
    );
  }

  const scorePercentage = Math.round((result.totalScore / result.maxScore) * 100);
  
  const chartData = [
    { name: 'Correct', value: result.correctCount, color: '#10b981' },
    { name: 'Wrong', value: result.wrongCount, color: '#ef4444' },
    { name: 'Skipped', value: result.skippedCount, color: '#94a3b8' },
  ];

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-lg h-6 font-bold text-accent border-accent/20">Evaluation Analysis</Badge>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">ID: {result.submissionId}</span>
            </div>
            <h1 className="text-4xl font-headline font-bold">{test.title}</h1>
            <p className="text-muted-foreground">Comprehensive performance report for {test.subject}</p>
          </div>
          <Button className="rounded-xl h-12 px-6 font-bold gap-2 shadow-lg shadow-primary/20">
            <Download className="w-5 h-5" /> Download Report PDF
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-2 rounded-3xl bg-primary/5 border-primary/20 flex flex-col items-center justify-center py-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
               <TrendingUp className="w-12 h-12 text-primary/10" />
             </div>
             <p className="text-6xl font-headline font-black text-primary mb-2">{scorePercentage}%</p>
             <p className="text-lg font-bold">Overall Accuracy</p>
             <p className="text-sm text-muted-foreground mt-2">Score: <span className="font-bold text-foreground">{result.totalScore}</span> / {result.maxScore}</p>
          </Card>
          
          <Card className="rounded-3xl border-border bg-card p-6 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Time Taken</p>
              <p className="text-2xl font-bold">{Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s</p>
              <p className="text-xs text-muted-foreground">Limit: {test.totalTimeMinutes} mins</p>
            </div>
          </Card>

          <Card className="rounded-3xl border-border bg-card p-6 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Avg. Speed</p>
              <p className="text-2xl font-bold">
                {Math.round(result.timeTakenSeconds / (test.questions.length || 1))}s
              </p>
              <p className="text-xs text-muted-foreground">Per Question</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-3xl border-border bg-card">
            <CardHeader>
              <CardTitle className="font-headline">Question Breakdown</CardTitle>
              <CardDescription>Visualizing your attempt distribution</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-secondary border border-border space-y-4">
              <h3 className="font-headline font-bold text-lg">Detailed Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-bold">Correct</span>
                  </div>
                  <span className="font-bold">{result.correctCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-bold">Wrong</span>
                  </div>
                  <span className="font-bold">{result.wrongCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-bold">Left</span>
                  </div>
                  <span className="font-bold">{result.skippedCount}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-dashed border-border bg-muted/10 space-y-2">
               <div className="flex items-center gap-2 text-primary">
                 <ShieldCheck className="w-5 h-5" />
                 <h4 className="font-bold text-sm uppercase">Secure Verification</h4>
               </div>
               <p className="text-[10px] text-muted-foreground leading-relaxed">
                 Digitally signed evaluation result generated on {new Date(result.timestamp).toLocaleString()}. Verified by OneCrack Secure Vault.
               </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-12">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-headline font-bold">Review Questions</h3>
            <p className="text-sm text-muted-foreground">Examine each item and your responses</p>
          </div>
          
          <div className="space-y-4">
            {test.questions.map((q, i) => {
              const attempt = result.attempts.find(a => a.questionId === q.id);
              const isCorrect = attempt?.selectedOption === q.correctAnswer;
              
              return (
                <div key={q.id} className={cn(
                  "p-6 rounded-3xl border-2 transition-all",
                  !attempt?.selectedOption ? "border-border bg-card/50" :
                  isCorrect ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                )}>
                   <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center font-bold text-sm">
                           {i + 1}
                         </div>
                         <h4 className="font-bold text-lg leading-snug">{q.questionText}</h4>
                      </div>
                      <Badge className={cn(
                        "rounded-lg px-3 py-1 font-bold",
                        !attempt?.selectedOption ? "bg-muted text-muted-foreground" :
                        isCorrect ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      )}>
                        {!attempt?.selectedOption ? 'Skipped' : isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {q.options?.map((opt, optIdx) => (
                        <div key={optIdx} className={cn(
                          "p-3 rounded-xl border text-sm font-medium flex items-center gap-3",
                          opt === q.correctAnswer ? "bg-green-500/10 border-green-500 text-green-500" :
                          opt === attempt?.selectedOption ? "bg-red-500/10 border-red-500 text-red-500" :
                          "bg-muted/30 border-border text-muted-foreground"
                        )}>
                          <div className="w-6 h-6 rounded-md border border-current flex items-center justify-center text-[10px] shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          {opt}
                        </div>
                      ))}
                   </div>
                   
                   {q.explanation && (
                     <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3">
                        <Info className="w-5 h-5 text-primary shrink-0" />
                        <div>
                           <p className="text-[10px] font-bold uppercase text-primary tracking-widest mb-1">Explanation</p>
                           <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
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
