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
  ArrowUpRight,
  ShieldAlert,
  FileCode,
  Printer
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

  const handlePrint = () => {
    window.print();
  };

  const downloadResponseSheet = () => {
    if (!result || !test) return;

    const csvContent = [
      ["ONE CRACK TEST PORTAL - FORENSIC RESPONSE AUDIT"],
      [`Submission ID: ${result.submissionId}`],
      [`Timestamp: ${new Date(result.timestamp).toLocaleString()}`],
      [`Student: ${profile?.name} (${profile?.loginUid})`],
      [`Assessment: ${test.title}`],
      [""],
      ["Question #", "Question ID", "Selected Option Code", "Status", "Time Spent (s)", "Marks Obtained"],
      ...test.questions.map((q, idx) => {
        const attempt = result.attempts.find(a => a.questionId === q.id);
        const optIdx = q.options?.indexOf(attempt?.selectedOption || "");
        const optionCode = (optIdx !== -1 && q.optionCodes) ? q.optionCodes[optIdx!] : "N/A";
        const isCorrect = attempt?.selectedOption === q.correctAnswer;
        const status = !attempt?.selectedOption ? "SKIPPED" : isCorrect ? "VALIDATED" : "INVALID";
        const marks = !attempt?.selectedOption ? (test.skippedMarks || 0) : isCorrect ? test.marksPerQuestion : -(test.negativeMarks || 0);

        return [
          idx + 1,
          q.id,
          optionCode,
          status,
          attempt?.timeSpentSeconds || 0,
          marks
        ];
      })
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OneCrack_Audit_${result.submissionId}.csv`;
    a.click();
    toast({ title: "Audit Downloaded", description: "Forensic response sheet generated." });
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
      <div className="max-w-7xl mx-auto space-y-12 pb-32 print:p-0">
        {/* Professional Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 print:hidden">
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
            <Button onClick={handlePrint} variant="outline" className="rounded-2xl h-14 px-8 font-black gap-3 border-white/5 bg-muted/20 hover:bg-muted/30 uppercase tracking-widest text-[10px]">
              <Printer className="w-4 h-4" /> PRINT ANALYSIS
            </Button>
            <Button onClick={downloadResponseSheet} variant="outline" className="rounded-2xl h-14 px-8 font-black gap-3 border-white/5 bg-muted/20 hover:bg-muted/30 uppercase tracking-widest text-[10px]">
              <FileCode className="w-4 h-4" /> RESPONSE AUDIT
            </Button>
            <Button onClick={handleSendEmail} disabled={isDispatching} className="rounded-2xl h-14 px-10 font-black gap-3 bg-primary text-black shadow-neon transition-all uppercase tracking-widest text-[10px]">
              {isDispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              EMAIL DISPATCH
            </Button>
          </div>
        </div>

        {/* Printable Certified Report Card */}
        <div className="print-report border-2 border-primary/20 bg-card/40 rounded-[3rem] p-16 space-y-12 relative overflow-hidden shadow-3xl">
          <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
            <Award className="w-96 h-96 text-primary" />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-10 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center font-black text-black text-4xl shadow-neon">O</div>
                <div>
                  <h2 className="text-3xl font-headline font-black text-white tracking-tight uppercase">OneCrack Evaluation Engine</h2>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Professional Certification of Achievement</p>
                </div>
              </div>
              <div className="pt-6 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">THIS CERTIFIES THAT</p>
                <h3 className="text-5xl font-headline font-black text-white">{profile?.name || 'STUDENT'}</h3>
                <p className="text-sm text-muted-foreground font-medium max-w-xl">
                  Has successfully completed the high-fidelity assessment <span className="text-white font-bold">{test.title}</span> with the following precision metrics.
                </p>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl text-center space-y-2 min-w-[200px]">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Aggregate Precision</p>
              <p className="text-7xl font-headline font-black text-white">{scorePercentage}%</p>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Score: {result.totalScore}/{result.maxScore}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {[
              { label: 'Validated Items', value: result.correctCount, color: 'text-primary' },
              { label: 'Invalid Items', value: result.wrongCount, color: 'text-destructive' },
              { label: 'Skipped Items', value: result.skippedCount, color: 'text-muted-foreground' }
            ].map((stat, i) => (
              <div key={i} className="p-8 rounded-[2rem] bg-white/5 border border-white/5 text-center shadow-inner">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">{stat.label}</p>
                <p className={cn("text-4xl font-black", stat.color)}>{stat.count}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-end pt-12 border-t border-white/5 relative z-10">
            <div className="space-y-1">
              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Audit Reference</p>
              <p className="text-xs font-mono font-bold text-white">{result.submissionId}</p>
            </div>
            <div className="text-right space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] italic text-primary/60 font-black uppercase tracking-widest">OneCrack Digital Sig</p>
                <div className="w-48 h-12 bg-white/5 rounded-xl border border-dashed border-primary/20 flex items-center justify-center">
                  <span className="text-xl font-headline font-black opacity-30 select-none">VERIFIED ENGINE</span>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">System Timestamp: {new Date(result.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Analytical Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 print:hidden">
          <Card className="lg:col-span-2 rounded-[3.5rem] border-white/5 bg-card overflow-hidden shadow-3xl">
            <CardHeader className="border-b border-white/5 px-12 py-10 bg-white/2">
              <CardTitle className="font-headline text-3xl font-black">Distribution Matrix</CardTitle>
            </CardHeader>
            <CardContent className="h-[450px] py-12">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={120}
                    outerRadius={160}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: '#000805', borderRadius: '30px', border: '1px solid #00ffff33' }}
                    itemStyle={{ fontWeight: '900', color: 'white', textTransform: 'uppercase', fontSize: '9px' }}
                  />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: '30px', textTransform: 'uppercase', fontWeight: '900', fontSize: '9px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="space-y-8">
             <Card className="rounded-[3.5rem] border-white/5 bg-card/40 backdrop-blur-3xl p-10 flex flex-col justify-between hover:border-primary/40 transition-all group shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-10 border border-primary/20">
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em]">Temporal Allocation</p>
                <h3 className="text-4xl font-bold font-headline text-white">
                  {Math.floor(result.timeTakenSeconds / 60)}m <span className="text-xl text-white/50">{result.timeTakenSeconds % 60}s</span>
                </h3>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Assigned Window: {test.totalTimeMinutes}m</p>
              </div>
            </Card>

            <Card className="rounded-[3.5rem] border-white/5 bg-card/40 backdrop-blur-3xl p-10 flex flex-col justify-between hover:border-accent/40 transition-all group shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-10 border border-accent/20">
                <Activity className="w-7 h-7" />
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em]">Efficiency Index</p>
                <h3 className="text-4xl font-bold font-headline text-accent">TOP 2%</h3>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Compared to global portal metrics</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Detailed Review */}
        <div className="space-y-12 pt-12 print:hidden">
          <div className="flex items-center gap-6 border-b border-white/10 pb-8">
            <h3 className="text-4xl font-headline font-black">Itemized Response Audit</h3>
            <Badge className="bg-white/5 text-white/40 border-none px-6 py-2 rounded-xl text-[9px] uppercase font-black tracking-widest">{test.questions.length} TOTAL ITEMS</Badge>
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            {test.questions.map((q, i) => {
              const attempt = result.attempts.find(a => a.questionId === q.id);
              const isCorrect = attempt?.selectedOption === q.correctAnswer;
              const isSkipped = !attempt?.selectedOption;
              const selectedOptIdx = q.options?.indexOf(attempt?.selectedOption || "");
              const selectedOptionCode = (selectedOptIdx !== -1 && q.optionCodes) ? q.optionCodes[selectedOptIdx!] : "N/A";
              
              return (
                <div key={q.id} className={cn(
                  "p-12 rounded-[3.5rem] border-2 transition-all group shadow-2xl",
                  isSkipped ? "border-white/5 bg-card/10" :
                  isCorrect ? "border-primary/20 bg-primary/[0.03]" : "border-destructive/20 bg-destructive/[0.03]"
                )}>
                   <div className="flex flex-col lg:flex-row items-start justify-between gap-10 mb-12">
                      <div className="flex gap-8">
                         <div className="w-16 h-16 rounded-[1.5rem] bg-card flex items-center justify-center font-black text-3xl shrink-0 border border-white/10 group-hover:bg-primary group-hover:text-black transition-all">
                           {(i + 1).toString().padStart(2, '0')}
                         </div>
                         <div className="space-y-4">
                            <h4 className="font-headline font-black text-2xl leading-tight text-white/95">{q.questionText}</h4>
                            <div className="flex flex-wrap items-center gap-6">
                               <Badge variant="secondary" className="text-[8px] uppercase font-black px-4 py-1.5 rounded-lg bg-white/5 tracking-widest">{q.questionType}</Badge>
                               <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                                 <Clock className="w-4 h-4 text-primary" /> {attempt?.timeSpentSeconds || 0}S
                               </div>
                               <div className="flex items-center gap-2 text-[9px] text-primary font-black uppercase tracking-widest">
                                 <FileCode className="w-4 h-4" /> CODE: {selectedOptionCode}
                               </div>
                            </div>
                         </div>
                      </div>
                      <Badge className={cn(
                        "rounded-xl px-6 py-2.5 font-black uppercase tracking-widest text-[9px] shadow-2xl",
                        isSkipped ? "bg-muted text-muted-foreground" :
                        isCorrect ? "bg-primary text-black" : "bg-destructive text-white"
                      )}>
                        {isSkipped ? 'SKIPPED' : isCorrect ? 'VALIDATED' : 'INVALID'}
                      </Badge>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {q.options?.map((opt, optIdx) => (
                        <div key={optIdx} className={cn(
                          "p-8 rounded-[2rem] border-2 text-lg font-bold flex items-center gap-6 transition-all",
                          opt === q.correctAnswer ? "bg-primary/10 border-primary text-primary" :
                          opt === attempt?.selectedOption ? "bg-destructive/10 border-destructive text-destructive" :
                          "bg-white/2 border-white/5 text-muted-foreground/40"
                        )}>
                          <div className={cn(
                            "w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xs font-black shrink-0",
                            opt === q.correctAnswer ? "bg-primary border-primary text-black" :
                            opt === attempt?.selectedOption ? "bg-destructive border-destructive text-white" :
                            "border-white/10 text-muted-foreground/20"
                          )}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <div className="flex-1 flex flex-col">
                            <span className="tracking-tight">{opt}</span>
                            {q.optionCodes && <span className="text-[9px] font-mono opacity-30">Forensic Code: {q.optionCodes[optIdx]}</span>}
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-report, .print-report * { visibility: visible; }
          .print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            background: white !important;
            color: black !important;
            padding: 40px;
          }
          .print-report h2, .print-report h3, .print-report p, .print-report span {
            color: black !important;
          }
          .print-report .bg-primary { background: #000 !important; color: #fff !important; }
          .print-report .bg-white\/5 { background: #f0f0f0 !important; border-color: #ddd !important; }
          .print-report .text-primary { color: #000 !important; }
          .print-report .shadow-neon, .print-report .shadow-3xl { box-shadow: none !important; }
        }
      `}</style>
    </PortalLayout>
  );
}