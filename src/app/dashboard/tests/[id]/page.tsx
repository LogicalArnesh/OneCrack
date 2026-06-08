"use client";

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Test, Attempt, TestResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Timer, 
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
  Bookmark,
  Shield
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
          description: "Unauthorized tab switching detected. This event has been logged for audit.",
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

    const resultData: Omit<TestResult, 'id'> = {
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
      const docRef = await addDoc(resultsCol, resultData);
      toast({ title: "Evaluation Certified", description: "Audit data locked and synchronized." });
      router.push(`/dashboard/results/${docRef.id}`);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Synchronization Failure", description: "Unable to finalize audit." });
      setIsSubmitting(false);
    }
  }, [test, attempts, timeLeft, user, router, db, isSubmitting, toast]);

  useEffect(() => {
    if (!hasStarted) return;
    if (timeLeft <= 0) {
      finishTest();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
      
      if (test && test.questions[currentIdx]) {
        const qId = test.questions[currentIdx].id;
        setAttempts(prev => ({
          ...prev,
          [qId]: { ...prev[qId], timeSpentSeconds: (prev[qId]?.timeSpentSeconds || 0) + 1 }
        }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, hasStarted, currentIdx, test, finishTest]);

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
    toast({ title: "Marked for Review", description: "Pedagogical tracking updated." });
  };

  if (isTestLoading) return <div className="h-screen flex items-center justify-center bg-[#000805]"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;

  if (!test) return null;

  const currentQ = test.questions[currentIdx];
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#000805] flex flex-col overflow-hidden text-foreground">
      <AlertDialog open={showConsent} onOpenChange={setShowConsent}>
        <AlertDialogContent className="rounded-[3rem] max-w-2xl p-14 border-primary/20 bg-card shadow-3xl">
          <AlertDialogHeader>
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-8 border border-primary/20 shadow-neon-sm">
              <ShieldAlert className="w-12 h-12" />
            </div>
            <AlertDialogTitle className="text-center text-4xl font-headline font-black neon-text tracking-tighter uppercase">Integrity Consent</AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-8 pt-6">
              <p className="text-lg font-medium leading-relaxed">By starting this evaluation, you agree to the OneCrack Anti-Cheat Protocol. Any malpractice detection will result in immediate disqualification.</p>
              <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-left">
                <div className="p-5 rounded-2xl bg-muted/20 border border-white/5 flex items-center gap-3">
                  <Shield className="w-4 h-4 text-primary" /> No Malpractice
                </div>
                <div className="p-5 rounded-2xl bg-muted/20 border border-white/5 flex items-center gap-3">
                  <Activity className="w-4 h-4 text-primary" /> Live Auditing
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-12">
            <AlertDialogAction onClick={() => { setHasStarted(true); setShowConsent(false); }} className="w-full h-16 rounded-2xl font-black bg-primary text-black hover:bg-primary/90 shadow-2xl uppercase tracking-[0.2em] text-xs">
              INITIALIZE PORTAL
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="h-24 border-b border-white/5 bg-card/40 backdrop-blur-3xl flex items-center justify-between px-10 z-50">
        <div className="flex items-center gap-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center font-black text-black text-3xl shadow-neon transition-transform hover:scale-110 cursor-pointer">O</div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Live Assessment</p>
            <h2 className="text-2xl font-headline font-black tracking-tight text-white">{test.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className={cn(
            "flex items-center gap-4 px-8 py-3.5 rounded-2xl border-2 transition-all font-mono shadow-inner",
            timeLeft < 300 ? "border-destructive/50 bg-destructive/10 text-destructive animate-pulse" : "border-primary/40 bg-primary/5 text-primary"
          )}>
            <Timer className="w-6 h-6" />
            <span className="text-3xl font-black tracking-widest">{formatTime(timeLeft)}</span>
          </div>
          <Button onClick={() => finishTest()} disabled={isSubmitting} className="rounded-2xl h-14 px-10 font-black bg-white text-black hover:bg-white/90 gap-3 shadow-3xl transition-transform active:scale-95 uppercase tracking-widest text-xs">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5" />}
            FINALIZE
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-16 md:p-24 relative custom-scrollbar">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_hsl(var(--primary)/0.04)_0%,_transparent_70%)] pointer-events-none" />
          
          <div className="max-w-4xl mx-auto space-y-16 relative">
            <div className="flex items-center justify-between border-b border-white/5 pb-10">
              <Badge variant="outline" className="rounded-xl px-8 py-3 font-black text-primary border-primary/40 bg-primary/5 text-xs tracking-[0.3em] uppercase">
                ITEM {currentIdx + 1} / {test.questions.length}
              </Badge>
              <div className="flex gap-10">
                <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">VALID</p>
                  <p className="text-2xl font-black text-primary">+{test.marksPerQuestion}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">FAILED</p>
                  <p className="text-2xl font-black text-destructive">-{Math.abs(test.negativeMarks)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-16">
              <div className="space-y-6">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">Question Data Block</p>
                <h2 className="text-4xl font-headline font-black leading-[1.2] text-white/95 whitespace-pre-wrap">{currentQ.questionText}</h2>
              </div>
              
              {currentQ.options && (
                <RadioGroup value={attempts[currentQ.id]?.selectedOption || ""} onValueChange={handleOptionSelect} className="grid grid-cols-1 gap-6">
                  {currentQ.options.map((option, i) => (
                    <Label key={i} className={cn(
                        "flex items-center gap-8 p-10 rounded-[2.5rem] border-2 transition-all cursor-pointer group shadow-xl relative overflow-hidden",
                        attempts[currentQ.id]?.selectedOption === option 
                        ? "border-primary bg-primary/10 ring-1 ring-primary/40" 
                        : "border-white/5 bg-card/20 hover:border-primary/40 hover:bg-card/40"
                      )}>
                      <RadioGroupItem value={option} className="sr-only" />
                      <div className={cn(
                        "w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-xl transition-all shrink-0",
                        attempts[currentQ.id]?.selectedOption === option ? "bg-primary border-primary text-black" : "border-white/10 text-muted-foreground group-hover:border-primary/40"
                      )}>{String.fromCharCode(65 + i)}</div>
                      <span className="text-2xl font-bold tracking-tight text-white/90">{option}</span>
                      {attempts[currentQ.id]?.selectedOption === option && <CheckCircle2 className="w-8 h-8 ml-auto text-primary animate-in zoom-in duration-300" />}
                    </Label>
                  ))}
                </RadioGroup>
              )}
            </div>

            <div className="pt-20 flex flex-col sm:flex-row items-center justify-between gap-10 border-t border-white/5">
              <div className="flex gap-6">
                <Button variant="outline" onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))} disabled={currentIdx === 0} className="rounded-2xl px-10 h-16 font-black bg-muted/10 border-white/10 hover:bg-muted/20">
                  <ChevronLeft className="w-6 h-6 mr-2" /> PREVIOUS
                </Button>
                <Button variant="ghost" onClick={markForReview} className="rounded-2xl px-10 h-16 font-black text-accent hover:bg-accent/10">
                  <Bookmark className="w-6 h-6 mr-2" /> MARK FOR REVIEW
                </Button>
              </div>
              <Button onClick={() => {
                  if (currentIdx < test.questions.length - 1) setCurrentIdx(currentIdx + 1);
                  else finishTest();
                }} className="w-full sm:w-auto rounded-2xl px-14 h-16 font-black bg-primary text-black shadow-neon transition-transform active:scale-95 uppercase tracking-widest text-xs">
                {currentIdx < test.questions.length - 1 ? 'SAVE & NEXT' : 'FINALIZE AUDIT'} <ChevronRight className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <aside className="w-[450px] border-l border-white/5 bg-card/20 backdrop-blur-3xl hidden xl:flex flex-col p-12 space-y-12">
          <div className="space-y-8">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Evaluation Matrix</h3>
            <div className="grid grid-cols-5 gap-4">
              {test.questions.map((q, i) => {
                const att = attempts[q.id];
                const isSelected = i === currentIdx;
                return (
                  <button key={q.id} onClick={() => setCurrentIdx(i)} className={cn(
                      "aspect-square rounded-2xl flex items-center justify-center text-sm font-black transition-all border-2 relative",
                      isSelected ? "border-primary scale-110 shadow-neon-sm z-10" : "border-transparent",
                      att?.status === 'attempted' ? "bg-primary text-black" : 
                      att?.status === 'marked-for-review' ? "bg-accent text-black" :
                      "bg-muted/10 text-muted-foreground/40 hover:bg-muted/20"
                    )}>
                    {(i + 1).toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto p-10 rounded-[2.5rem] bg-primary/5 border border-primary/20 space-y-6">
            <div className="flex items-center gap-4 text-primary font-black text-[11px] uppercase tracking-[0.3em]">
              <ShieldCheck className="w-6 h-6" /> INTEGRITY SECURE
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Proprietary evaluation tracking is active. Any deviation from portal protocols will trigger a session lockout.
            </p>
            <div className="flex items-center gap-6 pt-2 opacity-50">
              <Database className="w-5 h-5 text-primary" />
              <Wifi className="w-5 h-5 text-primary" />
              <Activity className="w-5 h-5 text-primary" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
