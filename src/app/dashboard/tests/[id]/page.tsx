"use client";

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, addDoc, collection } from 'firebase/firestore';
import { Test, Attempt, TestResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Timer, 
  AlertCircle,
  SendHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Wifi,
  Database,
  Bookmark
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TestTakingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = use(params);
  const db = useFirestore();
  const { user } = useUser();
  
  const testRef = useMemoFirebase(() => doc(db, 'tests', id), [db, id]);
  const { data: test, isLoading: isTestLoading } = useDoc<Test>(testRef);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showConsent, setShowConsent] = useState(true);

  // Anti-Cheat: Tab Visibility Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasStarted) {
        toast({
          variant: "destructive",
          title: "SECURITY ALERT",
          description: "Tab switching detected. This event has been logged for audit.",
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [hasStarted, toast]);

  useEffect(() => {
    if (test) {
      setTimeLeft(test.totalTimeMinutes * 60);
      const initialAttempts: Record<string, Attempt> = {};
      test.questions.forEach(q => {
        initialAttempts[q.id] = {
          questionId: q.id,
          status: 'not-visited',
          timeSpentSeconds: 0
        };
      });
      setAttempts(initialAttempts);
    }
  }, [test]);

  useEffect(() => {
    if (!hasStarted) return;
    if (timeLeft <= 0) {
      finishTest();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
      // Update time for current question
      if (test) {
        const qId = test.questions[currentIdx].id;
        setAttempts(prev => ({
          ...prev,
          [qId]: { ...prev[qId], timeSpentSeconds: (prev[qId]?.timeSpentSeconds || 0) + 1 }
        }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, hasStarted, currentIdx, test]);

  const handleOptionSelect = (option: string) => {
    if (!test) return;
    const qId = test.questions[currentIdx].id;
    setAttempts(prev => ({
      ...prev,
      [qId]: { ...prev[qId], selectedOption: option, status: 'attempted' }
    }));
  };

  const markForReview = () => {
    if (!test) return;
    const qId = test.questions[currentIdx].id;
    setAttempts(prev => ({
      ...prev,
      [qId]: { ...prev[qId], status: 'marked-for-review' }
    }));
    toast({ title: "Marked for Review", description: "Question pinned for later check." });
  };

  const finishTest = useCallback(async () => {
    if (!test || !user || isSubmitting) return;
    setIsSubmitting(true);

    const submissionId = uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase();
    const finalAttempts = Object.values(attempts);
    
    let totalScore = 0;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    finalAttempts.forEach(att => {
      const q = test.questions.find(quest => quest.id === att.questionId);
      if (!q) return;

      if (!att.selectedOption) {
        skipped++;
        totalScore += (test.skippedMarks || 0);
      } else if (att.selectedOption === q.correctAnswer) {
        correct++;
        totalScore += (test.marksPerQuestion || 4);
      } else {
        wrong++;
        totalScore -= Math.abs(test.negativeMarks || 1);
      }
    });

    const result: Omit<TestResult, 'id'> = {
      testId: test.id,
      userId: user.uid,
      submissionId,
      timestamp: new Date().toISOString(),
      attempts: finalAttempts as any,
      totalScore,
      maxScore: test.questions.length * (test.marksPerQuestion || 4),
      correctCount: correct,
      wrongCount: wrong,
      skippedCount: skipped,
      timeTakenSeconds: (test.totalTimeMinutes * 60) - timeLeft,
      subjectBreakdown: [{
        subject: test.subject,
        score: totalScore,
        maxScore: test.questions.length * (test.marksPerQuestion || 4),
        timeTakenSeconds: (test.totalTimeMinutes * 60) - timeLeft,
        avgTimePerQuestionSeconds: ((test.totalTimeMinutes * 60) - timeLeft) / (test.questions.length || 1)
      }]
    };

    try {
      const resultsCol = collection(db, 'users', user.uid, 'testAttempts');
      const docRef = await addDoc(resultsCol, result);
      toast({ title: "Evaluation Saved", description: "Your results are being processed." });
      router.push(`/dashboard/results/${docRef.id}`);
    } catch (err) {
      toast({ variant: "destructive", title: "Persistence Error", description: "Could not save attempt." });
      setIsSubmitting(false);
    }
  }, [test, attempts, timeLeft, user, router, db, isSubmitting, toast]);

  if (isTestLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  if (!test) return <div className="h-screen flex flex-col items-center justify-center gap-4 text-white"><AlertCircle className="text-destructive w-12 h-12" /><p className="text-xl font-bold">Evaluation Profile Missing</p></div>;

  const currentQ = test.questions[currentIdx];
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden text-foreground">
      <AlertDialog open={showConsent} onOpenChange={setShowConsent}>
        <AlertDialogContent className="rounded-[2.5rem] max-w-2xl p-12 border-primary/20 bg-card shadow-2xl">
          <AlertDialogHeader>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <AlertDialogTitle className="text-center text-3xl font-headline font-bold neon-text">JEE Level Evaluation Protocols</AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-6 pt-4 text-lg">
              <p className="font-medium">By proceeding, you agree to take this test under strict evaluation standards. Our engine monitors active session integrity.</p>
              <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-widest text-left">
                <div className="p-4 rounded-xl bg-muted/30 border border-border">No External Tabs</div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border">Session Recording Active</div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border">100% Signal Required</div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border">Auto-Lock Submission</div>
              </div>
              <p className="text-xs font-black text-primary uppercase tracking-[0.3em] mt-6">OneCrack High-Fidelity Evaluator Active</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-10">
            <AlertDialogAction onClick={() => { setHasStarted(true); setShowConsent(false); }} className="w-full h-14 rounded-2xl font-black bg-primary text-black hover:bg-primary/90 shadow-2xl shadow-primary/20">
              AGREE & COMMENCE EVALUATION
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="h-20 border-b border-border bg-card/90 backdrop-blur-xl flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-black text-black text-2xl shadow-neon transition-transform hover:scale-105 cursor-pointer">O</div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-1">Live Evaluation</h1>
            <h2 className="text-lg font-headline font-bold tracking-tight text-white">{test.title}</h2>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full border border-border">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connected: <span className="text-white">DB/MAIN</span></span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full border border-border">
             <Activity className="w-4 h-4 text-primary" />
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Health: <span className="text-white">100%</span></span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className={cn(
            "flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all font-mono shadow-inner",
            timeLeft < 300 ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse" : "border-primary/40 bg-primary/10 text-primary"
          )}>
            <Timer className="w-6 h-6" />
            <span className="text-2xl font-black">{formatTime(timeLeft)}</span>
          </div>
          <Button onClick={() => finishTest()} disabled={isSubmitting} className="rounded-2xl h-12 px-8 font-black bg-white text-black hover:bg-white/90 gap-2 shadow-2xl transition-transform active:scale-95">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5" />}
            FINALIZE
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-12 md:p-16 relative bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.03)_0%,_transparent_70%)]">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <Badge variant="outline" className="rounded-xl px-6 py-2 font-black text-primary border-primary/30 bg-primary/5 text-xs tracking-widest">
                ITEM {currentIdx + 1} OF {test.questions.length}
              </Badge>
              <div className="flex gap-8">
                <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Correct</p>
                  <p className="text-xl font-black text-primary">+{test.marksPerQuestion}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Wrong</p>
                  <p className="text-xl font-black text-destructive">-{Math.abs(test.negativeMarks)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Question Prompt</p>
                <h2 className="text-3xl font-headline font-bold leading-tight text-white/90">{currentQ.questionText}</h2>
              </div>
              
              {currentQ.options && (
                <RadioGroup value={attempts[currentQ.id]?.selectedOption || ""} onValueChange={handleOptionSelect} className="grid grid-cols-1 gap-5">
                  {currentQ.options.map((option, i) => (
                    <Label key={i} className={cn(
                        "flex items-center gap-6 p-8 rounded-[2rem] border-2 transition-all cursor-pointer group shadow-lg relative overflow-hidden",
                        attempts[currentQ.id]?.selectedOption === option 
                        ? "border-primary bg-primary/10 ring-1 ring-primary/50" 
                        : "border-border bg-card/40 hover:border-primary/30 hover:bg-card/60"
                      )}>
                      <RadioGroupItem value={option} className="sr-only" />
                      <div className={cn(
                        "w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black text-lg transition-all shrink-0",
                        attempts[currentQ.id]?.selectedOption === option ? "bg-primary border-primary text-black" : "border-border text-muted-foreground"
                      )}>{String.fromCharCode(65 + i)}</div>
                      <span className="text-xl font-bold tracking-tight">{option}</span>
                      {attempts[currentQ.id]?.selectedOption === option && <CheckCircle2 className="w-6 h-6 ml-auto text-primary animate-in zoom-in" />}
                    </Label>
                  ))}
                </RadioGroup>
              )}
            </div>

            <div className="pt-16 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-border/50">
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))} disabled={currentIdx === 0} className="rounded-2xl px-8 h-14 font-black bg-muted/20 border-border">
                  <ChevronLeft className="w-5 h-5 mr-2" /> PREVIOUS
                </Button>
                <Button variant="ghost" onClick={markForReview} className="rounded-2xl px-8 h-14 font-black text-accent hover:bg-accent/10">
                  <Bookmark className="w-5 h-5 mr-2" /> MARK FOR REVIEW
                </Button>
              </div>
              <Button onClick={() => {
                  if (currentIdx < test.questions.length - 1) setCurrentIdx(currentIdx + 1);
                  else finishTest();
                }} className="w-full sm:w-auto rounded-2xl px-12 h-14 font-black bg-primary text-black shadow-neon transition-transform active:scale-95">
                {currentIdx < test.questions.length - 1 ? 'SAVE & NEXT' : 'LOCK EVALUATION'} <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <aside className="w-[400px] border-l border-border bg-card/60 backdrop-blur-2xl hidden lg:flex flex-col p-10 space-y-10">
          <div className="space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Question Palette</h3>
            <div className="grid grid-cols-5 gap-3">
              {test.questions.map((q, i) => {
                const att = attempts[q.id];
                const isSelected = i === currentIdx;
                return (
                  <button key={q.id} onClick={() => setCurrentIdx(i)} className={cn(
                      "aspect-square rounded-2xl flex items-center justify-center text-sm font-black transition-all border-2 relative",
                      isSelected ? "border-primary scale-110 shadow-neon-sm z-10" : "border-transparent",
                      att?.status === 'attempted' ? "bg-primary text-black" : 
                      att?.status === 'marked-for-review' ? "bg-accent text-black" :
                      "bg-muted/10 text-muted-foreground hover:bg-muted/20"
                    )}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Evaluation Status</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-card border border-border flex flex-col gap-1">
                 <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Answered</span>
                 <span className="text-xl font-black text-primary">{Object.values(attempts).filter(a => a.status === 'attempted').length}</span>
               </div>
               <div className="p-4 rounded-2xl bg-card border border-border flex flex-col gap-1">
                 <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Marked</span>
                 <span className="text-xl font-black text-accent">{Object.values(attempts).filter(a => a.status === 'marked-for-review').length}</span>
               </div>
            </div>
          </div>

          <div className="mt-auto p-8 rounded-3xl bg-primary/5 border border-primary/20 space-y-4">
            <div className="flex items-center gap-3 text-primary font-black text-[11px] uppercase tracking-widest">
              <ShieldCheck className="w-5 h-5" /> SECURITY ACTIVE
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Proprietary evaluation tracking is active. Any deviation from standard testing protocols will trigger a high-integrity audit.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Database className="w-4 h-4 text-primary opacity-50" />
              <Wifi className="w-4 h-4 text-primary opacity-50" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
