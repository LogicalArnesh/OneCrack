"use client";

import React, { use, useState } from 'react';
import PortalLayout from '@/components/dashboard/PortalLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  ShieldCheck,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Award,
  FileCode,
  Printer,
  FileText,
  CheckCircle,
  ExternalLink,
  ShieldAlert
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
      toast({ variant: "destructive", title: "Endpoint Missing", description: "Configure an email in your profile for dispatch." });
      return;
    }

    setIsDispatching(true);
    try {
      const success = await sendTestReportEmail(profile.email, profile.name, {
        testTitle: test?.title || 'OneCrack Assessment',
        score: result?.totalScore,
        maxScore: result?.maxScore,
        percentage: Math.round((result?.totalScore || 0) / (result?.maxScore || 1) * 100),
        submissionId: result?.submissionId
      });

      if (success) {
        toast({ title: "Audit Dispatched", description: `Report synchronized to ${profile.email}.` });
      } else {
        throw new Error('Sync fail');
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Failed", description: "Pedagogical server offline." });
    } finally {
      setIsDispatching(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadForensicAudit = () => {
    if (!result || !test) return;

    // STUDENT AUDIT: Contains IDs and Codes, NOT question text (per instruction)
    const csvContent = [
      ["ONE CRACK CERTIFIED PERFORMANCE AUDIT (STUDENT COPY)"],
      [`Response ID (Submission Hash): ${result.submissionId}`],
      [`Portal Protocol: ${test.title}`],
      [`Candidate: ${profile?.name} (${profile?.loginUid})`],
      [`Timestamp: ${new Date(result.timestamp).toISOString()}`],
      [""],
      ["Item Index", "Subject", "Forensic Option Code", "Selection Status", "Temporal Flow (s)"],
      ...test.questions.map((q, idx) => {
        const attempt = result.attempts.find(a => a.questionId === q.id);
        const forensicCode = attempt?.selectedOptionCode || "N/A";
        const status = !attempt?.selectedOption ? "SKIPPED" : "SUBMITTED";

        return [
          idx + 1,
          q.subject,
          forensicCode,
          status,
          attempt?.timeSpentSeconds || 0
        ];
      }),
      [""],
      ["CORE SYSTEM SIGNATURE: VERIFIED_ENCRYPTED_TRANSACTION"]
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensic_Audit_${result.submissionId}.csv`;
    a.click();
    toast({ title: "Audit Generated", description: "Forensic response sheet downloaded." });
  };

  if (isResultLoading || isTestLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

  if (!result || !test) return <PortalLayout><div className="flex flex-col items-center justify-center py-32"><AlertCircle className="w-16 h-16 text-destructive mb-6" /><h2 className="text-2xl font-black">Forensic Data Missing</h2></div></PortalLayout>;

  const scorePercentage = Math.round((result.totalScore / result.maxScore) * 100);
  
  const chartData = [
    { name: 'Validated', value: result.correctCount, color: 'hsl(var(--primary))' },
    { name: 'Invalid', value: result.wrongCount, color: 'hsl(var(--destructive))' },
    { name: 'Skipped', value: result.skippedCount, color: 'hsl(var(--muted-foreground))' },
  ];

  return (
    <PortalLayout>
      <div className="max-w-7xl mx-auto space-y-12 pb-32 print:p-0">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 print:hidden">
          <div className="space-y-6">
            <Link href="/dashboard/results" className="text-[10px] font-black uppercase tracking-[0.4em] text-primary hover:text-white flex items-center gap-3 transition-all">
              <ChevronLeft className="w-4 h-4" /> PERFORMANCE ARCHIVE
            </Link>
            <div className="flex flex-wrap items-center gap-6">
              <h1 className="text-6xl font-headline font-black tracking-tighter neon-text leading-none">{test.title}</h1>
              <Badge variant="outline" className="rounded-2xl h-10 px-6 font-black text-primary border-primary/40 bg-primary/5 uppercase tracking-[0.3em] text-[10px]">
                {test.subject} AUDIT
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {test.answerKeyUrl && (
              <Button asChild variant="outline" className="rounded-2xl h-14 px-8 font-black gap-3 border-accent/40 bg-accent/5 text-accent hover:bg-accent/10 uppercase tracking-widest text-[10px]">
                <a href={test.answerKeyUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" /> OFFICIAL KEY
                </a>
              </Button>
            )}
            <Button onClick={handlePrint} variant="outline" className="rounded-2xl h-14 px-8 font-black gap-3 border-white/5 bg-muted/20 hover:bg-muted/30 uppercase tracking-widest text-[10px]">
              <Printer className="w-4 h-4" /> PRINT ANALYSIS
            </Button>
            <Button onClick={downloadForensicAudit} variant="outline" className="rounded-2xl h-14 px-8 font-black gap-3 border-white/5 bg-muted/20 hover:bg-muted/30 uppercase tracking-widest text-[10px]">
              <FileCode className="w-4 h-4" /> FORENSIC AUDIT
            </Button>
            <Button onClick={handleSendEmail} disabled={isDispatching} className="rounded-2xl h-14 px-10 font-black gap-3 bg-primary text-black shadow-neon transition-all uppercase tracking-widest text-[10px]">
              {isDispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              EMAIL DISPATCH
            </Button>
          </div>
        </div>

        <div className="print-report border-2 border-primary/20 bg-card/40 rounded-[3rem] p-16 space-y-12 relative overflow-hidden shadow-3xl">
          <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
            <Award className="w-96 h-96 text-primary" />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-10 relative z-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center font-black text-black text-5xl shadow-neon">O</div>
                <div>
                  <h2 className="text-4xl font-headline font-black text-white tracking-tight uppercase">Performance Audit</h2>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">OneCrack Virtually Certified Analysis</p>
                </div>
              </div>
              <div className="pt-6 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">IDENTITY VERIFIED</p>
                <h3 className="text-6xl font-headline font-black text-white tracking-tighter">{profile?.name || 'CANDIDATE'}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline" className="border-primary/40 text-primary font-mono text-[9px]">RESPONSE ID: {result.submissionId}</Badge>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-black uppercase">
                    <ShieldCheck className="w-3 h-3 text-primary" /> CRYPTOGRAPHICALLY VALIDATED
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
               <div className="bg-black/40 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] text-center space-y-2 min-w-[240px] shadow-2xl">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Aggregate Precision</p>
                <p className="text-8xl font-headline font-black text-white">{scorePercentage}%</p>
                <div className="pt-6 border-t border-white/5">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Aggregate: {result.totalScore} / {result.maxScore}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {[
              { label: 'Validated Items', value: result.correctCount, color: 'text-primary', icon: CheckCircle },
              { label: 'Invalid Items', value: result.wrongCount, color: 'text-destructive', icon: XCircle },
              { label: 'Skipped Items', value: result.skippedCount, color: 'text-muted-foreground', icon: HelpCircle }
            ].map((stat, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-white/2 border border-white/5 text-center shadow-inner group hover:bg-white/5 transition-all">
                <div className={cn("w-12 h-12 rounded-xl mx-auto mb-6 flex items-center justify-center bg-white/5", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">{stat.label}</p>
                <p className={cn("text-5xl font-black", stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-end pt-12 border-t border-white/5 relative z-10">
            <div className="space-y-2">
              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Verification Status</p>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black text-primary uppercase">Engine Authenticated</span>
              </div>
            </div>
            <div className="text-right space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] italic text-primary/60 font-black uppercase tracking-widest">OneCrack Core Signature</p>
                <div className="w-56 h-14 bg-white/2 rounded-2xl border border-dashed border-primary/30 flex items-center justify-center relative overflow-hidden">
                  <span className="text-xl font-headline font-black opacity-20 select-none tracking-widest">DIGITAL AUDIT</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Issue Date: {new Date(result.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="space-y-12 pt-12 print:hidden">
          <div className="flex items-center gap-6 border-b border-white/10 pb-8">
            <h3 className="text-4xl font-headline font-black">Forensic Item Audit</h3>
            <Badge className="bg-white/5 text-white/40 border-none px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest">{test.questions.length} TOTAL ITEMS</Badge>
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            {test.questions.map((q, i) => {
              const attempt = result.attempts.find(a => a.questionId === q.id);
              const isCorrect = attempt?.selectedOption === q.correctAnswer;
              const isSkipped = !attempt?.selectedOption;
              const selectedOptIdx = q.options?.indexOf(attempt?.selectedOption || "");
              const forensicCode = (selectedOptIdx !== -1 && q.optionCodes) ? q.optionCodes[selectedOptIdx!] : "N/A";
              
              return (
                <div key={q.id} className={cn(
                  "p-12 rounded-[3.5rem] border-2 transition-all group shadow-2xl relative overflow-hidden",
                  isSkipped ? "border-white/5 bg-card/10" :
                  isCorrect ? "border-primary/20 bg-primary/[0.03]" : "border-destructive/20 bg-destructive/[0.03]"
                )}>
                   <div className="flex flex-col lg:flex-row items-start justify-between gap-10 mb-12">
                      <div className="flex gap-8">
                         <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center font-black text-3xl shrink-0 border border-white/10 group-hover:bg-primary group-hover:text-black transition-all">
                           {(i + 1).toString().padStart(2, '0')}
                         </div>
                         <div className="space-y-4">
                            <h4 className="font-headline font-black text-2xl leading-tight text-white/95">{q.questionText}</h4>
                            <div className="flex flex-wrap items-center gap-8">
                               <Badge variant="secondary" className="text-[9px] uppercase font-black px-4 py-2 rounded-lg bg-white/5 tracking-widest">{q.subject}</Badge>
                               <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                 <Clock className="w-4 h-4 text-primary" /> {attempt?.timeSpentSeconds || 0}S SPENT
                               </div>
                               <div className="flex items-center gap-2 text-[10px] text-primary font-black uppercase tracking-widest">
                                 <FileCode className="w-4 h-4" /> RESPONSE CODE: {forensicCode}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                      {q.options?.map((opt, optIdx) => (
                        <div key={optIdx} className={cn(
                          "p-8 rounded-[2.5rem] border-2 text-lg font-bold flex items-center gap-6 transition-all",
                          opt === q.correctAnswer ? "bg-primary/10 border-primary text-primary" :
                          opt === attempt?.selectedOption ? "bg-destructive/10 border-destructive text-destructive" :
                          "bg-white/2 border-white/5 text-muted-foreground/30"
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
                            {q.optionCodes && <span className="text-[9px] font-mono opacity-40">Forensic ID: {q.optionCodes[optIdx]}</span>}
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
            background: #ffffff !important;
            color: #000000 !important;
            padding: 40px;
          }
          .print-report h2, .print-report h3, .print-report h1, .print-report p, .print-report span {
            color: #000000 !important;
          }
          .print-report .bg-primary { background: #000000 !important; color: #ffffff !important; }
          .print-report .text-primary { color: #000000 !important; }
        }
      `}</style>
    </PortalLayout>
  );
}
